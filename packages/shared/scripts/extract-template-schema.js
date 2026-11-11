#!/usr/bin/env node
/**
 * Genera src/templates/template-schema.generated.ts: para cada plantilla y tipo de sección,
 * todos los campos de contenido que usa el HTML y sus valores por defecto.
 *
 * Analiza el código de las plantillas con el compilador de TypeScript:
 *   c.title || "Hola"                → campo "title", por defecto "Hola"
 *   c.items || [{ title: "A" }]      → lista "items" con sus elementos por defecto
 *   (c.items || []).map((item) => item.title || "X")  → campos de cada elemento
 *   const C = { heroTitle: c.title || "…" } … C.heroTitle  → alias dentro de cada sección
 *
 * El editor arma con esto un formulario completo: todo lo que se ve se puede editar.
 * Ejecutar tras cambiar una plantilla:  npm run schema -w packages/shared
 * Con --check falla si el archivo generado está desactualizado (CI).
 */
const fs = require("fs");
const path = require("path");
const ts = require("typescript");

const DIR = path.resolve(__dirname, "../src/templates");
const OUT = path.join(DIR, "template-schema.generated.ts");
const SOURCES = {
  prestige: "prestige-variants.ts",
  "art-culinaire": "art-culinaire-variants.ts",
  rodriplast: "rodriplast-variants.ts",
  indigo: "indigo-variants.ts",
  dishora: "dishora-variants.ts",
  graduate: "graduate-variants.ts",
  "urban-noir": "urban-noir-variants.ts",
  generic: "generic-blocks.ts",
};
const IGNORED_KEYS = new Set(["variant", "anchor", "html", "linktree", "sorteo", "tenantId", "siteId", "payment", "checkoutBase"]);
const LIST_METHODS = new Set(["map", "forEach", "filter", "slice", "some", "every", "find", "flatMap"]);

const NO_DEFAULT = Symbol("sin-valor");
/** Constantes de texto del archivo (const B = "#fdcb0c"): se resuelven dentro de los valores por defecto. */
let CONSTANTS = new Map();

/** Valor estático de un literal (texto, número, booleano, lista u objeto de literales). */
function literal(node) {
  if (!node) return NO_DEFAULT;
  if (ts.isParenthesizedExpression(node) || ts.isAsExpression(node)) return literal(node.expression);
  if (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) return node.text;
  if (ts.isIdentifier(node) && CONSTANTS.has(node.text)) return CONSTANTS.get(node.text);
  // "NUESTRA <span style='color:" + B + "'>VISIÓN</span>"
  if (ts.isBinaryExpression(node) && node.operatorToken.kind === ts.SyntaxKind.PlusToken) {
    const l = literal(node.left);
    const r = literal(node.right);
    return typeof l === "string" && (typeof r === "string" || typeof r === "number") ? l + r : NO_DEFAULT;
  }
  if (ts.isTemplateExpression(node)) {
    let out = node.head.text;
    for (const span of node.templateSpans) {
      const v = literal(span.expression);
      if (typeof v !== "string" && typeof v !== "number") return NO_DEFAULT;
      out += v + span.literal.text;
    }
    return out;
  }
  if (ts.isNumericLiteral(node)) return Number(node.text);
  if (node.kind === ts.SyntaxKind.TrueKeyword) return true;
  if (node.kind === ts.SyntaxKind.FalseKeyword) return false;
  if (ts.isPrefixUnaryExpression(node) && node.operator === ts.SyntaxKind.MinusToken && ts.isNumericLiteral(node.operand)) return -Number(node.operand.text);
  if (ts.isArrayLiteralExpression(node)) {
    const out = [];
    for (const el of node.elements) {
      const v = literal(el);
      if (v === NO_DEFAULT) return NO_DEFAULT;
      out.push(v);
    }
    return out;
  }
  if (ts.isObjectLiteralExpression(node)) {
    const out = {};
    for (const p of node.properties) {
      if (!ts.isPropertyAssignment(p)) return NO_DEFAULT;
      const name = p.name && (ts.isIdentifier(p.name) || ts.isStringLiteral(p.name)) ? p.name.text : null;
      if (!name) return NO_DEFAULT;
      const v = literal(p.initializer);
      if (v === NO_DEFAULT) return NO_DEFAULT;
      out[name] = v;
    }
    return out;
  }
  return NO_DEFAULT;
}

const unwrap = (n) => {
  while (n && (ts.isParenthesizedExpression(n) || ts.isAsExpression(n) || ts.isNonNullExpression(n))) n = n.expression;
  return n;
};

/** `c.K` → "K" (también c["K"]). */
function contentKey(node, root = "c") {
  node = unwrap(node);
  if (ts.isPropertyAccessExpression(node) && ts.isIdentifier(node.expression) && node.expression.text === root) return node.name.text;
  if (ts.isElementAccessExpression(node) && ts.isIdentifier(node.expression) && node.expression.text === root && ts.isStringLiteral(node.argumentExpression)) return node.argumentExpression.text;
  return null;
}

const isOr = (n) => n && ts.isBinaryExpression(n) && (n.operatorToken.kind === ts.SyntaxKind.BarBarToken || n.operatorToken.kind === ts.SyntaxKind.QuestionQuestionToken);

/** Operandos de una cadena `a || b || c` (que se interpreta como `(a || b) || c`). */
function orOperands(node) {
  node = unwrap(node);
  return isOr(node) ? [...orOperands(node.left), ...orOperands(node.right)] : [node];
}

/** Último valor literal de una lista de alternativas (el que se ve si no hay contenido). */
function lastLiteral(ops) {
  for (let i = ops.length - 1; i >= 0; i--) {
    const v = literal(ops[i]);
    if (v !== NO_DEFAULT) return v;
  }
  return NO_DEFAULT;
}

/** `X || Y || D` → [X, D] (D = último literal de la cadena). */
function splitDefault(node) {
  const ops = orOperands(node);
  return [ops[0], ops.length > 1 ? ops.slice(1) : null];
}

function mergeDefault(field, value) {
  if (value === NO_DEFAULT || value === undefined) return;
  if (field.default === undefined) field.default = value;
}

function analyzeFile(variant, file) {
  const source = ts.createSourceFile(file, fs.readFileSync(path.join(DIR, file), "utf8"), ts.ScriptTarget.ES2020, true);
  CONSTANTS = new Map();
  const visitConst = (node) => {
    if (ts.isVariableDeclaration(node) && ts.isIdentifier(node.name) && node.initializer && (ts.isStringLiteral(node.initializer) || ts.isNoSubstitutionTemplateLiteral(node.initializer))) {
      CONSTANTS.set(node.name.text, node.initializer.text);
    }
    ts.forEachChild(node, visitConst);
  };
  visitConst(source);

  // 1) Alias: propiedades de objetos armados con c.K (p. ej. const C = { heroTitle: c.title || "…" }).
  const alias = new Map();
  const visitAlias = (node) => {
    if (ts.isPropertyAssignment(node) && (ts.isIdentifier(node.name) || ts.isStringLiteral(node.name))) {
      const [left, right] = splitDefault(node.initializer);
      const key = contentKey(left);
      // Dueño del alias: la variable que guarda el objeto (const C = { … } → "C").
      const obj = node.parent;
      const owner = obj && ts.isObjectLiteralExpression(obj) && obj.parent && ts.isVariableDeclaration(obj.parent) && ts.isIdentifier(obj.parent.name) ? obj.parent.name.text : null;
      if (key && owner && !IGNORED_KEYS.has(key)) {
        const prev = alias.get(node.name.text);
        const owners = new Set(prev ? prev.owners : []);
        owners.add(owner);
        alias.set(node.name.text, { key, def: right ? lastLiteral(right) : NO_DEFAULT, owners });
      }
    }
    ts.forEachChild(node, visitAlias);
  };
  visitAlias(source);

  // 2) Secciones: cláusulas del switch (type) dentro de la función principal.
  const types = {};
  const fieldOf = (type, key) => {
    types[type] = types[type] || {};
    return (types[type][key] = types[type][key] || {});
  };

  const collectCase = (labels, statements) => {
    const listVars = new Map(); // variable local → clave de lista ("links" o "links.children")

    // Funciones flecha con nombre (const desktopLink = (l) => …) usadas como links.map(desktopLink).
    const arrowFns = new Map();
    const findArrows = (node) => {
      if (ts.isVariableDeclaration(node) && ts.isIdentifier(node.name) && node.initializer && (ts.isArrowFunction(node.initializer) || ts.isFunctionExpression(node.initializer))) {
        arrowFns.set(node.name.text, node.initializer);
      }
      ts.forEachChild(node, findArrows);
    };
    statements.forEach(findArrows);

    /** Esquema de una lista: "links" (de la sección) o "links.children" (lista dentro de cada enlace). */
    const listTarget = (t, listKey) => {
      const [top, ...nested] = String(listKey).split(".");
      let f = fieldOf(t, top);
      for (const part of nested) {
        f.items = f.items || {};
        f = f.items[part] = f.items[part] || {};
        f.list = true;
        f.used = true;
      }
      return f;
    };

    const listKeyOf = (expr, itemParams = new Map()) => {
      expr = unwrap(expr);
      if (!expr) return null;
      const [left, right] = splitDefault(expr);
      const direct = contentKey(left);
      if (direct) return { key: direct, def: right ? lastLiteral(right) : NO_DEFAULT };
      // l.children dentro de links.map((l) => …) → lista anidada "links.children"
      for (const [param, parentKey] of itemParams) {
        const nk = contentKey(left, param);
        if (nk) return { key: `${parentKey}.${nk}`, def: right ? lastLiteral(right) : NO_DEFAULT };
      }
      if (ts.isPropertyAccessExpression(left) && alias.has(left.name.text) && ts.isIdentifier(left.expression) && alias.get(left.name.text).owners.has(left.expression.text)) {
        const a = alias.get(left.name.text);
        return { key: a.key, def: a.def };
      }
      if (ts.isIdentifier(left) && listVars.has(left.text)) return { key: listVars.get(left.text), def: NO_DEFAULT };
      // c.links && c.links.length ? c.links : [ …por defecto… ]
      if (ts.isConditionalExpression(left)) {
        const t = listKeyOf(left.whenTrue, itemParams);
        if (t) return { key: t.key, def: t.def !== NO_DEFAULT ? t.def : literal(left.whenFalse) };
        return listKeyOf(left.whenFalse, itemParams);
      }
      // c.items.slice(0, 3) / l.children.filter(…) → la lista original
      if (ts.isCallExpression(left) && ts.isPropertyAccessExpression(left.expression) && LIST_METHODS.has(left.expression.name.text)) return listKeyOf(left.expression.expression, itemParams);
      if (ts.isPropertyAccessExpression(left) && left.name.text === "length") return null;
      return null;
    };

    // `used`: el campo se usa por sí mismo (no solo como alternativa de otro). Un campo usado
    // nunca se oculta como "alternativo" (c.imageAlt || c.title no esconde el título).
    const addField = (key, def) => {
      if (IGNORED_KEYS.has(key)) return;
      for (const t of labels) {
        const f = fieldOf(t, key);
        f.used = true;
        mergeDefault(f, def);
      }
    };
    const addItemField = (listKey, itemKey, def) => {
      if (IGNORED_KEYS.has(itemKey)) return;
      for (const t of labels) {
        const f = listTarget(t, listKey);
        f.items = f.items || {};
        f.items[itemKey] = f.items[itemKey] || {};
        f.items[itemKey].used = true;
        mergeDefault(f.items[itemKey], def);
      }
    };
    const addListDefault = (listKey, def) => {
      for (const t of labels) {
        const f = listTarget(t, listKey);
        f.used = true;
        f.list = true;
        mergeDefault(f, def);
        if (Array.isArray(def)) {
          for (const item of def) {
            if (item && typeof item === "object" && !Array.isArray(item)) {
              f.items = f.items || {};
              for (const k of Object.keys(item)) {
                f.items[k] = f.items[k] || {};
                mergeDefault(f.items[k], item[k]);
              }
            }
          }
        }
      }
    };

    const visit = (node, itemParams) => {
      // const navLinks = C.links.length ? C.links : [...]
      if (ts.isVariableDeclaration(node) && ts.isIdentifier(node.name) && node.initializer) {
        const lk = listKeyOf(node.initializer, itemParams);
        if (lk) {
          listVars.set(node.name.text, lk.key);
          if (Array.isArray(lk.def)) addListDefault(lk.key, lk.def);
        }
      }
      // X.map((item) => …) sobre una lista del contenido
      if (ts.isCallExpression(node) && ts.isPropertyAccessExpression(node.expression) && LIST_METHODS.has(node.expression.name.text)) {
        const lk = listKeyOf(node.expression.expression, itemParams);
        let cb = node.arguments[0];
        if (cb && ts.isIdentifier(cb) && arrowFns.has(cb.text)) cb = arrowFns.get(cb.text);
        if (lk && cb && (ts.isArrowFunction(cb) || ts.isFunctionExpression(cb)) && cb.parameters[0] && ts.isIdentifier(cb.parameters[0].name)) {
          addListDefault(lk.key, lk.def);
          const next = new Map(itemParams);
          next.set(cb.parameters[0].name.text, lk.key);
          visit(node.expression, itemParams);
          node.arguments.slice(1).forEach((a) => visit(a, itemParams));
          visit(cb.body, next);
          return;
        }
      }
      // cond ? c.K : [ …por defecto… ] fuera de un .map
      if (ts.isConditionalExpression(node)) {
        const t = listKeyOf(node.whenTrue, itemParams);
        const def = literal(node.whenFalse);
        if (t && Array.isArray(def)) addListDefault(t.key, def);
      }
      // Campo con valor por defecto: c.K || D, item.K || D, C.alias
      if (isOr(node)) {
        const ops = orOperands(node);
        const first = ops[0];
        const rest = ops.slice(1);
        const def = lastLiteral(rest);
        const visitRest = () => rest.forEach((op) => {
          if (!contentKey(op) && ![...itemParams.keys()].some((p) => contentKey(op, p))) visit(op, itemParams);
        });
        // El primer campo es el principal; los siguientes de la cadena son nombres alternativos
        // (c.desc || c.description → "description" se muestra solo si tiene valor).
        const markAliases = (root, primary, listKey) => {
          for (const op of rest) {
            const rk = contentKey(op, root);
            if (!rk || rk === primary || IGNORED_KEYS.has(rk)) continue;
            for (const t of labels) {
              let target;
              if (listKey) {
                const f = listTarget(t, listKey);
                target = f.items = f.items || {};
              } else {
                types[t] = types[t] || {};
                target = types[t];
              }
              target[rk] = target[rk] || {};
              target[rk].aliasOf = primary;
            }
          }
        };
        const key = contentKey(first);
        if (key) {
          markAliases("c", key, null);
          if (Array.isArray(def)) addListDefault(key, def);
          else addField(key, def);
          visitRest();
          return;
        }
        for (const [param, listKey] of itemParams) {
          const ik = contentKey(first, param);
          if (ik) { markAliases(param, ik, listKey); addItemField(listKey, ik, def); visitRest(); return; }
        }
      }
      const key = contentKey(node);
      if (key) addField(key, NO_DEFAULT);
      for (const [param, listKey] of itemParams) {
        const ik = contentKey(node, param);
        if (ik) addItemField(listKey, ik, NO_DEFAULT);
      }
      if (ts.isPropertyAccessExpression(node) && alias.has(node.name.text) && ts.isIdentifier(node.expression) && alias.get(node.name.text).owners.has(node.expression.text)) {
        const a = alias.get(node.name.text);
        if (Array.isArray(a.def)) addListDefault(a.key, a.def);
        else addField(a.key, a.def);
      }
      ts.forEachChild(node, (child) => visit(child, itemParams));
    };
    statements.forEach((s) => visit(s, new Map()));
  };

  const visitSwitch = (node) => {
    if (ts.isSwitchStatement(node) && ts.isIdentifier(node.expression) && node.expression.text === "type") {
      let pending = [];
      for (const clause of node.caseBlock.clauses) {
        if (ts.isDefaultClause(clause)) { pending = []; continue; }
        if (!ts.isStringLiteral(clause.expression)) continue;
        pending.push(clause.expression.text);
        if (clause.statements.length === 0) continue; // case "a": case "b": … (comparten cuerpo)
        collectCase(pending, clause.statements);
        pending = [];
      }
      return;
    }
    ts.forEachChild(node, visitSwitch);
  };
  visitSwitch(source);

  // Limpia: valores sin default y "alternativos" que en realidad se usan por sí mismos.
  const tidy = (f) => {
    if (f.used && f.aliasOf) delete f.aliasOf;
    delete f.used;
  };
  const tidyItems = (items) => {
    for (const it of Object.values(items)) {
      tidy(it);
      if (it.default === undefined) delete it.default;
      if (it.items) tidyItems(it.items);
    }
  };
  for (const type of Object.keys(types)) {
    for (const f of Object.values(types[type])) {
      tidy(f);
      if (f.items) tidyItems(f.items);
    }
  }
  return types;
}

const schema = {};
for (const [variant, file] of Object.entries(SOURCES)) schema[variant] = analyzeFile(variant, file);

const body = `// ARCHIVO GENERADO por scripts/extract-template-schema.js — no editar a mano.\n` +
  `// Campos de contenido y valores por defecto de cada plantilla y tipo de sección.\n\n` +
  `export interface TemplateFieldSchema {\n  default?: unknown;\n  list?: boolean;\n  /** Nombre alternativo de otro campo (p. ej. description → desc): se oculta salvo que tenga valor. */\n  aliasOf?: string;\n  /** Campos de cada elemento (si es una lista). Pueden ser a su vez listas (submenús). */\n  items?: Record<string, TemplateFieldSchema>;\n}\n\n` +
  `export const TEMPLATE_SCHEMA: Record<string, Record<string, Record<string, TemplateFieldSchema>>> = ${JSON.stringify(schema, null, 2)};\n`;

if (process.argv.includes("--check")) {
  const current = fs.existsSync(OUT) ? fs.readFileSync(OUT, "utf8").replace(/\r\n/g, "\n") : "";
  if (current !== body) {
    console.error("[template-schema] Desactualizado. Ejecuta: npm run schema -w packages/shared");
    process.exit(1);
  }
  console.log("[template-schema] OK");
} else {
  fs.writeFileSync(OUT, body);
  const count = Object.values(schema).reduce((n, v) => n + Object.values(v).reduce((m, t) => m + Object.keys(t).length, 0), 0);
  console.log(`[template-schema] ${count} campos en ${Object.keys(schema).length} plantillas`);
}
