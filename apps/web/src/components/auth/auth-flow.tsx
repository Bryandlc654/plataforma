"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/stores/auth-store";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function BrandMark({ className = "" }: { className?: string }) {
  return (
    <Link href="/" className={`flex items-center gap-2 text-white ${className}`}>
      <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-white text-[15px] font-black text-[#201b51]">
        P
      </span>
      <span className="text-lg font-semibold tracking-tight">Plataforma</span>
    </Link>
  );
}

/**
 * Acceso en dos pasos, igual que Shopify: correo -> código de 6 dígitos.
 * Sirve para crear cuenta y para volver a entrar (el backend decide).
 */
export function AuthFlow({ mode }: { mode: "login" | "register" }) {
  const router = useRouter();
  const { startWithEmail, verifyEmail, resendVerification, isLoading, ensureSession, hasHydrated } =
    useAuthStore();
  const [step, setStep] = useState<"email" | "code">("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [cooldown, setCooldown] = useState(0);
  const codeRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!hasHydrated) return;
    (async () => {
      if (await ensureSession()) router.replace("/dashboard");
    })();
  }, [ensureSession, hasHydrated, router]);

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
    try {
      setError(null);
      const res = await startWithEmail(value);
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
      router.replace("/dashboard");
    } catch (err: any) {
      setCode("");
      setError(err.response?.data?.message || "Código incorrecto");
      codeRef.current?.focus();
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

  return (
    <div className="sp-dark-screen flex flex-col">
      <header className="px-8 py-6">
        <BrandMark />
      </header>

      <main className="flex flex-1 flex-col items-center px-4 pb-16 pt-8 sm:pt-14">
        {step === "email" ? (
          <>
            <h1 className="text-center text-[34px] font-medium leading-tight tracking-tight">
              {mode === "register" ? "Empieza tu prueba gratis" : "Inicia sesión"}
            </h1>
            <p className="mt-2 text-center text-lg text-white/60">
              {mode === "register"
                ? "3 días gratis para crear tu sitio web, sin tarjeta"
                : "Te enviaremos un código a tu correo"}
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
              <p className="text-center text-xs text-[#8a8a8a]">
                <Link href="/login/password" className="hover:underline">
                  Usar contraseña
                </Link>
              </p>
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
