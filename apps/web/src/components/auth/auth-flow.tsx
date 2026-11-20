"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/stores/auth-store";
import { usePlatformBranding } from "@/components/providers/platform-branding-provider";
import { resolveBrandingLogo } from "@/lib/platform-branding";
import api from "@/lib/api";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type Product = "shop" | "food";

/** Los dos productos de la plataforma: se elige uno al crear la cuenta. */
export const PRODUCTS: Array<{
  id: Product;
  name: string;
  title: string;
  description: string;
  points: string[];
  example: string;
}> = [
  {
    id: "shop",
    name: "Jeaz Shop",
    title: "Tu sitio web o tienda online",
    description: "Para negocios, marcas y profesionales que quieren una web propia para mostrarse y vender.",
    points: [
      "Plantillas profesionales y editor visual",
      "Tienda con carrito, pagos en línea y cupones",
      "Dominio propio, SEO, blog, reservas y leads",
    ],
    example: "Tiendas, empresas, servicios, portafolios",
  },
  {
    id: "food",
    name: "Jeaz Food",
    title: "Menú digital con pedidos",
    description: "Para restaurantes y negocios de comida que quieren recibir pedidos desde un menú en línea.",
    points: [
      "Menú con fotos, categorías, extras y combos",
      "Pedidos por delivery, retiro o en mesa, directo a tu WhatsApp",
      "Panel de pedidos en vivo y ventas del día",
    ],
    example: "Restaurantes, hamburgueserías, cafeterías, food trucks",
  },
];

export function ProductIcon({ id, className = "" }: { id: Product; className?: string }) {
  return id === "food" ? (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M4 3v7a3 3 0 003 3v8M7 3v6M10 3v7a3 3 0 01-3 3M17 21V3c-2.2 0-4 2.7-4 6v4h4" />
    </svg>
  ) : (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M3 9l1.5-5h15L21 9M3 9h18M3 9a3 3 0 006 0m0 0a3 3 0 006 0m0 0a3 3 0 006 0M5 12v8h14v-8M10 20v-5h4v5" />
    </svg>
  );
}

export function BrandMark({ className = "" }: { className?: string }) {
  const { branding } = usePlatformBranding();
  const logo = resolveBrandingLogo(branding.logoUrl);

  return (
    <Link href="/" className={`flex items-center gap-2 text-white ${className}`}>
      {logo ? (
        <img
          src={logo}
          alt="Logo de la plataforma"
          className="h-12 w-auto max-w-[220px] object-contain"
        />
      ) : (
        <>
          <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-[var(--color-secondary)] text-lg font-black text-[var(--color-on-secondary)]">
            P
          </span>
          <span className="text-xl font-semibold tracking-tight">Plataforma</span>
        </>
      )}
    </Link>
  );
}

/**
 * Igual que Shopify:
 * - Iniciar sesión: correo -> contraseña (sin códigos).
 * - Crear cuenta: correo -> código de 6 dígitos -> crear contraseña.
 * El código solo se usa para registrarse (y la recuperación de contraseña va aparte).
 */
export function AuthFlow({ mode }: { mode: "login" | "register" }) {
  const router = useRouter();
  const { startWithEmail, verifyEmail, resendVerification, login, isLoading, ensureSession, hasHydrated } =
    useAuthStore();
  const [step, setStep] = useState<"product" | "email" | "code" | "password">(mode === "register" ? "product" : "email");
  const [product, setProduct] = useState<Product | null>(null);
  const chosen = PRODUCTS.find((p) => p.id === product);
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [saving, setSaving] = useState(false);
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [cooldown, setCooldown] = useState(0);
  const [signingIn, setSigningIn] = useState(false);
  const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const codeRef = useRef<HTMLInputElement>(null);
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    };
  }, []);

  const showToast = (type: "success" | "error", message: string) => {
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    setToast({ type, message });
    if (type === "error") {
      toastTimerRef.current = setTimeout(() => setToast(null), 4500);
    }
  };

  useEffect(() => {
    if (!hasHydrated) return;
    (async () => {
      if (await ensureSession()) router.replace("/dashboard");
    })();
  }, [ensureSession, hasHydrated, router]);

  // /register?product=food (o shop) llega con el producto ya elegido.
  useEffect(() => {
    if (mode !== "register") return;
    const p = new URLSearchParams(window.location.search).get("product");
    if (p === "shop" || p === "food") {
      setProduct(p);
      setStep("email");
    }
  }, [mode]);

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  useEffect(() => {
    if (step === "code") codeRef.current?.focus();
  }, [step]);

  const submitEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    const value = email.trim().toLowerCase();
    if (!EMAIL_RE.test(value)) {
      setError("Ingresa un correo electrónico válido");
      return;
    }
    if (mode === "login") {
      setError(null);
      setEmail(value);
      setStep("password");
      return;
    }
    try {
      setError(null);
      const res = await startWithEmail(value, product || "shop");
      setEmail(res.email);
      setCooldown(30);
      setStep("code");
    } catch (err: any) {
      setError(err.response?.data?.message || "No pudimos enviar el código. Inténtalo de nuevo.");
    }
  };

  const submitCode = async (value: string) => {
    if (value.length !== 6 || isLoading) return;
    try {
      setError(null);
      await verifyEmail(email, value);
      setError(null);
      setStep("password");
    } catch (err: any) {
      setCode("");
      setError(err.response?.data?.message || "Código incorrecto");
      codeRef.current?.focus();
    }
  };

  const submitPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (mode === "login") {
      if (!password) return;
      setSigningIn(true);
      setError(null);
      try {
        await login(email, password);
        showToast("success", "Sesión iniciada");
        await new Promise((resolve) => setTimeout(resolve, 900));
        router.replace("/dashboard");
      } catch (err: any) {
        setSigningIn(false);
        const status = err.response?.status;
        const message =
          status === 401
            ? "Contraseña incorrecta"
            : err.response?.data?.message ||
              (!err.response
                ? "No se pudo conectar con el servidor. Inténtalo de nuevo."
                : "No pudimos iniciar sesión. Inténtalo de nuevo.");
        showToast("error", message);
      }
      return;
    }
    if (password.length < 8) {
      setError("La contraseña debe tener al menos 8 caracteres");
      return;
    }
    try {
      setSaving(true);
      setError(null);
      await api.post("/auth/set-password", { password });
      router.replace(product === "food" ? "/welcome?product=food" : "/welcome");
    } catch (err: any) {
      setError(err.response?.data?.message || "No pudimos guardar la contraseña. Inténtalo de nuevo.");
    } finally {
      setSaving(false);
    }
  };

  const resend = async () => {
    if (cooldown > 0) return;
    try {
      setError(null);
      setInfo(await resendVerification(email));
      setCooldown(30);
    } catch (err: any) {
      setError(err.response?.data?.message || "No se pudo reenviar el código");
    }
  };

  const toastNode = toast ? (
    <div
      role={toast.type === "error" ? "alert" : "status"}
      aria-live={toast.type === "error" ? "assertive" : "polite"}
      className="auth-toast flex max-w-[300px] items-center gap-2 rounded-xl border border-white/80 bg-white/95 px-3 py-2.5 shadow-lg backdrop-blur-sm"
    >
      <span
        className={`flex h-5 w-5 flex-shrink-0 items-center justify-center ${
          toast.type === "success" ? "text-emerald-600" : "text-red-600"
        }`}
      >
        {toast.type === "success" ? (
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
          </svg>
        ) : (
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
          </svg>
        )}
      </span>
      <p className="text-[13px] font-medium leading-tight text-[#303030]">{toast.message}</p>
    </div>
  ) : null;

  return (
    <div className="sp-dark-screen flex flex-col">
      <header className="px-8 py-6">
        <BrandMark />
      </header>

      <main className="flex flex-1 flex-col items-center px-4 pb-16 pt-8 sm:pt-14">
        {step === "product" ? (
          <>
            <h1 className="text-center text-[34px] font-medium leading-tight tracking-tight">¿Qué quieres crear?</h1>
            <p className="mt-2 max-w-[560px] text-center text-lg text-white/60">
              Elige el producto para tu negocio. Empiezas con 3 días gratis, sin tarjeta.
            </p>
            <div className="mt-10 grid w-full max-w-[860px] gap-4 md:grid-cols-2">
              {PRODUCTS.map((p) => {
                const on = product === p.id;
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setProduct(p.id)}
                    aria-pressed={on}
                    className={`group flex flex-col rounded-[24px] border p-6 text-left transition ${
                      on
                        ? "border-white bg-white text-[#303030] shadow-[0_12px_40px_rgba(0,0,0,0.35)]"
                        : "border-white/15 bg-white/[0.04] text-white hover:border-white/40 hover:bg-white/[0.07]"
                    }`}
                  >
                    <span className="flex items-center justify-between">
                      <span
                        className={`flex h-11 w-11 items-center justify-center rounded-xl ${
                          on ? "bg-[var(--color-secondary)] text-[var(--color-on-secondary)]" : "bg-white/10 text-white"
                        }`}
                      >
                        <ProductIcon id={p.id} className="h-6 w-6" />
                      </span>
                      <span
                        className={`flex h-6 w-6 items-center justify-center rounded-full border-2 ${
                          on ? "border-[#303030] bg-[#303030] text-white" : "border-white/40"
                        }`}
                        aria-hidden
                      >
                        {on && (
                          <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </span>
                    </span>
                    <span className="mt-5 text-[13px] font-semibold uppercase tracking-wider opacity-60">{p.name}</span>
                    <span className="mt-1 text-[22px] font-semibold leading-tight">{p.title}</span>
                    <span className={`mt-2 text-[15px] leading-snug ${on ? "text-[#616161]" : "text-white/60"}`}>{p.description}</span>
                    <ul className="mt-5 space-y-2 text-[14px]">
                      {p.points.map((pt) => (
                        <li key={pt} className="flex items-start gap-2">
                          <span className={on ? "text-emerald-600" : "text-white/70"} aria-hidden>✓</span>
                          {pt}
                        </li>
                      ))}
                    </ul>
                    <span className="mt-auto block pt-5">
                      <span className={`block border-t pt-4 text-[13px] ${on ? "border-[#ebebeb] text-[#616161]" : "border-white/10 text-white/50"}`}>
                        Ideal para: {p.example}
                      </span>
                    </span>
                  </button>
                );
              })}
            </div>
            <button
              type="button"
              disabled={!product}
              onClick={() => setStep("email")}
              className="sp-btn mt-8 !h-12 w-full max-w-[376px] !rounded-xl disabled:opacity-50"
            >
              {chosen ? `Continuar con ${chosen.name}` : "Elige una opción"}
            </button>
            <p className="mt-4 text-center text-sm text-white/60">
              ¿Ya tienes una cuenta?{" "}
              <Link href="/login" className="font-medium text-white underline">
                Iniciar sesión
              </Link>
            </p>
          </>
        ) : step === "email" ? (
          <>
            {mode === "register" && chosen && (
              <button
                type="button"
                onClick={() => setStep("product")}
                className="mb-5 flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.06] py-1.5 pl-2 pr-3 text-[13px] text-white/80 hover:bg-white/10"
              >
                <ProductIcon id={chosen.id} className="h-4 w-4" />
                <span className="font-semibold text-white">{chosen.name}</span>
                <span className="text-white/50">· Cambiar</span>
              </button>
            )}
            <h1 className="text-center text-[34px] font-medium leading-tight tracking-tight">
              {mode === "register" ? "Empieza tu prueba gratis" : "Inicia sesión"}
            </h1>
            <p className="mt-2 text-center text-lg text-white/60">
              {mode === "register"
                ? product === "food"
                  ? "3 días gratis para crear el menú digital de tu restaurante, sin tarjeta"
                  : "3 días gratis para crear tu sitio web, sin tarjeta"
                : "Ingresa tu correo para continuar"}
            </p>

            <form onSubmit={submitEmail} className="sp-card mt-10 w-full max-w-[376px] space-y-2">
              <input
                type="email"
                autoComplete="email"
                inputMode="email"
                autoFocus
                className="sp-input"
                placeholder="Correo electrónico"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              {error && <p className="px-1 pt-1 text-sm text-red-600">{error}</p>}
              <button type="submit" disabled={isLoading || !email.trim()} className="sp-btn">
                {isLoading ? "Enviando código..." : "Continuar con correo electrónico"}
              </button>
              <p className="pt-3 text-center text-sm text-[#616161]">
                {mode === "register" ? (
                  <>
                    ¿Ya tienes una cuenta?{" "}
                    <Link href="/login" className="font-medium text-[#303030] underline">
                      Iniciar sesión
                    </Link>
                  </>
                ) : (
                  <>
                    ¿Eres nuevo?{" "}
                    <Link href="/register" className="font-medium text-[#303030] underline">
                      Empieza gratis
                    </Link>
                  </>
                )}
              </p>
            </form>
          </>
        ) : step === "password" ? (
          <>
            {toastNode && (
              <div className="mt-16 flex w-full max-w-[440px] justify-center">
                {toastNode}
              </div>
            )}
            <form onSubmit={submitPassword} className={`sp-card w-full max-w-[440px] !p-8 ${toast ? "mt-3" : "mt-16"}`}>
            <h1 className="text-[26px] font-bold leading-tight tracking-tight">
              {mode === "login" ? "Ingresa tu contraseña" : "Crea tu contraseña"}
            </h1>
            <p className="mt-2 text-[15px] leading-snug text-[#616161]">
              {mode === "login" ? "Cuenta: " : "Con ella iniciarás sesión en "}
              <span className="font-semibold text-[#303030]">{email}</span>
              {mode === "login" ? "" : ". Mínimo 8 caracteres."}
            </p>
            <div className="relative mt-6">
              <input
                type={showPassword ? "text" : "password"}
                autoComplete={mode === "login" ? "current-password" : "new-password"}
                autoFocus
                className="sp-input !pr-16"
                placeholder="Contraseña"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-medium text-[#616161] hover:text-[#303030]"
                tabIndex={-1}
              >
                {showPassword ? "Ocultar" : "Ver"}
              </button>
            </div>
            {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
            {mode === "login" && (
              <Link href="/forgot-password" className="sp-link mt-3 block">
                ¿Olvidaste tu contraseña?
              </Link>
            )}
            <button type="submit" disabled={!password || isLoading || saving || signingIn} className="sp-btn mt-5 !h-12 !rounded-xl">
              {signingIn
                ? "Entrando..."
                : isLoading || saving
                  ? "Un momento..."
                  : mode === "login"
                    ? "Iniciar sesión"
                    : "Crear cuenta y continuar"}
            </button>
            {mode === "login" && (
              <button
                type="button"
                onClick={() => {
                  setStep("email");
                  setPassword("");
                  setError(null);
                }}
                className="sp-link mt-4 block"
              >
                Usar otro correo
              </button>
            )}
          </form>
          </>
        ) : (
          <div className="sp-card mt-16 w-full max-w-[440px] !p-8">
            <h1 className="text-[26px] font-bold leading-tight tracking-tight">Revisa tu correo</h1>
            <p className="mt-2 text-[15px] leading-snug text-[#616161]">
              Introduce el código de 6 dígitos que enviamos a{" "}
              <span className="font-semibold text-[#303030]">{email}</span>.
            </p>

            <input
              ref={codeRef}
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={6}
              className="sp-input mt-6 !h-12 text-center text-xl tracking-[0.4em]"
              placeholder="000000"
              value={code}
              onChange={(e) => {
                const v = e.target.value.replace(/\D/g, "").slice(0, 6);
                setCode(v);
                if (v.length === 6) submitCode(v);
              }}
            />
            {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
            {info && !error && <p className="mt-2 text-sm text-[#616161]">{info}</p>}

            <button
              type="button"
              onClick={resend}
              disabled={cooldown > 0}
              className="sp-link mt-3 block disabled:cursor-default disabled:text-[#8a8a8a] disabled:no-underline"
            >
              {cooldown > 0 ? `Reenviar código (${cooldown}s)` : "Reenviar código"}
            </button>

            <button
              type="button"
              onClick={() => submitCode(code)}
              disabled={code.length !== 6 || isLoading}
              className="sp-btn mt-5 !h-12 !rounded-xl"
            >
              {isLoading ? "Verificando..." : "Continuar"}
            </button>

            <button
              type="button"
              onClick={() => {
                setStep("email");
                setCode("");
                setError(null);
                setInfo(null);
              }}
              className="sp-link mt-4 block"
            >
              Usar otro correo
            </button>
          </div>
        )}
      </main>

      <footer className="px-4 pb-8 text-center text-xs text-white/50">
        Si continúas, aceptas los <span className="font-semibold text-white/80">Términos</span> y la{" "}
        <span className="font-semibold text-white/80">Política de privacidad</span>. Puedes cancelar en cualquier
        momento.
      </footer>
    </div>
  );
}
