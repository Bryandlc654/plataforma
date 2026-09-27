import { Fragment, ReactNode, ElementType } from "react";

const INLINE_RE =
  /(\*\*([^*]+)\*\*)|(\*([^*]+)\*)|(`([^`]+)`)|(\[([^\]]+)\]\(([^)\s]+)\)|(\n))/g;

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function renderInline(source: string, keyBase: string): ReactNode[] {
  const nodes: ReactNode[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  let key = 0;

  const pushText = (text: string) => {
    if (!text) return;
    const escaped = escapeHtml(text).replace(/\n/g, "<br/>");
    nodes.push(
      <Fragment key={`${keyBase}-t${key}`}>
        <span dangerouslySetInnerHTML={{ __html: escaped }} />
      </Fragment>
    );
    key += 1;
  };

  while ((match = INLINE_RE.exec(source)) !== null) {
    if (match.index > lastIndex) pushText(source.slice(lastIndex, match.index));

    const [full] = match;
    const bold = match[2];
    const italic = match[4];
    const code = match[6];
    const linkText = match[8];
    const linkUrl = match[9];
    const newline = match[10];

    if (bold !== undefined) {
      nodes.push(<strong key={`${keyBase}-b${key}`}>{renderInline(bold, `${keyBase}-b${key}`)}</strong>);
    } else if (italic !== undefined) {
      nodes.push(<em key={`${keyBase}-i${key}`}>{renderInline(italic, `${keyBase}-i${key}`)}</em>);
    } else if (code !== undefined) {
      nodes.push(
        <code
          key={`${keyBase}-c${key}`}
          className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-[0.85em] text-rose-600"
        >
          {escapeHtml(code)}
        </code>
      );
    } else if (linkText !== undefined && linkUrl !== undefined) {
      const safe = linkUrl.startsWith("http") || linkUrl.startsWith("mailto:");
      if (safe) {
        nodes.push(
          <a
            key={`${keyBase}-l${key}`}
            href={linkUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary-700 underline hover:text-primary-800"
          >
            {linkText}
          </a>
        );
      } else {
        pushText(full);
      }
    } else if (newline !== undefined) {
      nodes.push(<br key={`${keyBase}-n${key}`} />);
    }

    key += 1;
    lastIndex = match.index + full.length;
    INLINE_RE.lastIndex = lastIndex;
  }

  if (lastIndex < source.length) pushText(source.slice(lastIndex));
  return nodes;
}

const headingClass: Record<number, string> = {
  1: "mt-6 mb-3 text-2xl font-bold text-slate-900",
  2: "mt-6 mb-3 text-xl font-bold text-slate-900",
  3: "mt-5 mb-2 text-lg font-semibold text-slate-900",
  4: "mt-4 mb-2 text-base font-semibold text-slate-900",
  5: "mt-4 mb-1 text-sm font-semibold text-slate-900",
  6: "mt-3 mb-1 text-sm font-semibold text-slate-600",
};

const headingTag = (level: number): ElementType => {
  const tags = ["", "h1", "h2", "h3", "h4", "h5", "h6"] as const;
  return tags[level] || ("h3" as const);
};

export default function Markdown({ children }: { children: string }) {
  const lines = String(children || "").split(/\r?\n/);
  const blocks: ReactNode[] = [];
  let key = 0;

  const finishParagraph = (buffer: string[]) => {
    if (buffer.length === 0) return;
    const text = buffer.join(" ");
    blocks.push(
      <p key={`${key++}-p`} className="my-3 leading-relaxed text-slate-700">
        {renderInline(text, `${key}-p`)}
      </p>
    );
    buffer.length = 0;
  };

  const buffer: string[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Code fence
    if (/^```/.test(line)) {
      finishParagraph(buffer);
      const lang = line.replace(/^```/, "").trim();
      const codeLines: string[] = [];
      i++;
      while (i < lines.length && !/^```/.test(lines[i])) {
        codeLines.push(lines[i]);
        i++;
      }
      blocks.push(
        <pre key={`${key++}-code`} className="my-4 overflow-x-auto rounded-lg bg-slate-900 p-4 text-sm text-slate-100">
          <code className={lang ? `language-${lang}` : ""}>{escapeHtml(codeLines.join("\n"))}</code>
        </pre>
      );
      continue;
    }

    // Blank line => flush paragraph
    if (/^\s*$/.test(line)) {
      finishParagraph(buffer);
      continue;
    }

    // Heading
    const heading = /^(#{1,6})\s+(.*)$/.exec(line);
    if (heading) {
      finishParagraph(buffer);
      const level = heading[1].length;
      const Tag = headingTag(level);
      blocks.push(
        <Tag key={`${key++}-h`} className={headingClass[level] || headingClass[3]}>
          {renderInline(heading[2], `${key}-h`)}
        </Tag>
      );
      continue;
    }

    // Horizontal rule
    if (/^\s*([-*_])\1{2,}\s*$/.test(line)) {
      finishParagraph(buffer);
      blocks.push(<hr key={`${key++}-hr`} className="my-6 border-slate-200" />);
      continue;
    }

    // List item (bulleted or ordered)
    const ulItem = /^\s*[-*+]\s+(.*)$/.exec(line);
    const olItem = /^\s*\d+[.)]\s+(.*)$/.exec(line);
    if (ulItem || olItem) {
      finishParagraph(buffer);
      const items: ReactNode[] = [];

      if (ulItem) {
        items.push(
          <li key={`${key++}-li`} className="my-1 flex gap-2">
            <span className="mt-0.5 flex-shrink-0 text-slate-400">•</span>
            <span>{renderInline(ulItem[1], `${key}-li`)}</span>
          </li>
        );
        while (i + 1 < lines.length) {
          const next = /^\s*[-*+]\s+(.*)$/.exec(lines[i + 1]);
          if (!next) break;
          i++;
          items.push(
            <li key={`${key++}-li`} className="my-1 flex gap-2">
              <span className="mt-0.5 flex-shrink-0 text-slate-400">•</span>
              <span>{renderInline(next[1], `${key}-li`)}</span>
            </li>
          );
        }
        blocks.push(
          <ul key={`${key++}-ul`} className="my-3 space-y-1">
            {items}
          </ul>
        );
      } else {
        let counter = parseInt(olItem![1] ? (line.match(/^\s*(\d+)/)?.[1] || "1") : "1", 10);
        items.push(
          <li key={`${key++}-li`} className="my-1 flex gap-2">
            <span className="mt-0.5 flex-shrink-0 font-medium text-slate-400">{counter}.</span>
            <span>{renderInline(olItem![1], `${key}-li`)}</span>
          </li>
        );
        while (i + 1 < lines.length) {
          const next = /^\s*\d+[.)]\s+(.*)$/.exec(lines[i + 1]);
          if (!next) break;
          i++;
          counter++;
          items.push(
            <li key={`${key++}-li`} className="my-1 flex gap-2">
              <span className="mt-0.5 flex-shrink-0 font-medium text-slate-400">{counter}.</span>
              <span>{renderInline(next[1], `${key}-li`)}</span>
            </li>
          );
        }
        blocks.push(
          <ol key={`${key++}-ol`} className="my-3 space-y-1">
            {items}
          </ol>
        );
      }
      continue;
    }

    // Blockquote
    if (/^\s*>\s?/.test(line)) {
      finishParagraph(buffer);
      const quoteLines: string[] = [];
      while (i < lines.length && /^\s*>\s?/.test(lines[i])) {
        quoteLines.push(lines[i].replace(/^\s*>\s?/, ""));
        i++;
      }
      i--;
      blocks.push(
        <blockquote key={`${key++}-q`} className="my-4 border-l-4 border-primary-200 bg-primary-50/40 px-4 py-2 text-slate-600">
          <p>{renderInline(quoteLines.join(" "), `${key}-q`)}</p>
        </blockquote>
      );
      continue;
    }

    // Paragraph accumulation
    buffer.push(line);
  }

  finishParagraph(buffer);

  return <div className="text-sm">{blocks}</div>;
}