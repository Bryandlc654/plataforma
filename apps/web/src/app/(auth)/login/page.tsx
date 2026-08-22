"use client";

import Link from "next/link";
import Image from "next/image";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAuthStore } from "@/stores/auth-store";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";

const loginSchema = z.object({
  email: z.string().email("Correo electrónico inválido"),
  password: z.string().min(1, "La contraseña es requerida"),
});

type LoginFormData = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const router = useRouter();
  const { login, isLoading, ensureSession } = useAuthStore();
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [focused, setFocused] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  useEffect(() => {
    (async () => {
      const ok = await ensureSession();
      if (ok) router.replace("/dashboard");
    })();
  }, [ensureSession, router]);

  const onSubmit = async (data: LoginFormData) => {
    try {
      setError(null);
      await login(data.email, data.password);
      router.push("/dashboard");
    } catch (err: any) {
      setError(
        err.response?.data?.message || "Credenciales incorrectas. Intenta de nuevo."
      );
    }
  };

  return (
    <div className="flex min-h-screen">
      {/* Left - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-[#201b51] relative overflow-hidden">
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-20 left-10 w-72 h-72 bg-white rounded-full blur-3xl" />
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-[#f29200] rounded-full blur-[120px]" />
        </div>
        <div className="relative flex flex-col justify-center px-16 text-white">
          <div className="mb-4">
            <div className="flex items-center gap-3 mb-12">
              <Image src="/logo.png" alt="Build Iceberg Agency" width={280} height={90} className="h-16 w-auto object-contain brightness-0 invert" />
            </div>
          </div>
          <h1 className="text-4xl font-bold leading-tight mb-6">
            Tu presencia digital,{" "}
            <span className="text-secondary">simplificada.</span>
          </h1>
          <p className="text-lg text-slate-300 leading-relaxed max-w-md">
            Crea sitios web profesionales, captura leads, monitorea métricas
            y administra tu negocio desde un solo lugar. Sin código.
          </p>
          <div className="mt-16 flex gap-8">
            <div>
              <p className="text-3xl font-bold text-secondary">100+</p>
              <p className="text-sm text-slate-300">Negocios activos</p>
            </div>
            <div>
              <p className="text-3xl font-bold text-secondary">99.9%</p>
              <p className="text-sm text-slate-300">Uptime garantizado</p>
            </div>
            <div>
              <p className="text-3xl font-bold text-secondary">24/7</p>
              <p className="text-sm text-slate-300">Soporte técnico</p>
            </div>
          </div>
        </div>
      </div>

      {/* Right - Form */}
      <div className="flex-1 flex items-center justify-center px-6 py-12 bg-white">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-3 mb-12 justify-center">
            <Image src="/logo.png" alt="Build Iceberg Agency" width={260} height={80} className="h-14 w-auto object-contain" />
          </div>

          <div className="mb-10">
            <h2 className="text-2xl font-bold text-slate-900">Iniciar sesión</h2>
            <p className="mt-2 text-slate-500">
              Ingresa tus credenciales para acceder al panel
            </p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            {/* Error toast */}
            <div
              className={`overflow-hidden transition-all duration-300 ${
                error ? "max-h-20 opacity-100" : "max-h-0 opacity-0"
              }`}
            >
              <div className="flex items-start gap-3 rounded-xl bg-red-50 border border-red-100 px-4 py-3 text-sm text-red-700">
                <svg className="h-5 w-5 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p>{error}</p>
              </div>
            </div>

            {/* Email */}
            <div>
              <label
                htmlFor="email"
                className={`block text-sm font-medium mb-2 transition-colors ${
                  focused === "email" ? "text-primary" : "text-slate-700"
                }`}
              >
                Correo electrónico
              </label>
              <div
                className={`relative rounded-xl border-2 transition-all duration-200 ${
                  errors.email
                    ? "border-red-300 bg-red-50/30"
                    : focused === "email"
                    ? "border-primary ring-4 ring-primary/10"
                    : "border-slate-200 hover:border-slate-300"
                }`}
              >
                <input
                  id="email"
                  type="email"
                  className="w-full bg-transparent px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none"
                  placeholder="tu@correo.com"
                  {...register("email")}
                  onFocus={() => setFocused("email")}
                  onBlur={() => setFocused(null)}
                />
              </div>
              {errors.email && (
                <p className="mt-1.5 text-xs text-red-600 flex items-center gap-1">
                  <span>•</span> {errors.email.message}
                </p>
              )}
            </div>

            {/* Password */}
            <div>
              <label
                htmlFor="password"
                className={`block text-sm font-medium mb-2 transition-colors ${
                  focused === "password" ? "text-primary" : "text-slate-700"
                }`}
              >
                Contraseña
              </label>
              <div
                className={`relative rounded-xl border-2 transition-all duration-200 ${
                  errors.password
                    ? "border-red-300 bg-red-50/30"
                    : focused === "password"
                    ? "border-primary ring-4 ring-primary/10"
                    : "border-slate-200 hover:border-slate-300"
                }`}
              >
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  className="w-full bg-transparent px-4 py-3 pr-12 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none"
                  placeholder="••••••••"
                  {...register("password")}
                  onFocus={() => setFocused("password")}
                  onBlur={() => setFocused(null)}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                >
                  {showPassword ? (
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                    </svg>
                  ) : (
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
              {errors.password && (
                <p className="mt-1.5 text-xs text-red-600 flex items-center gap-1">
                  <span>•</span> {errors.password.message}
                </p>
              )}
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full relative rounded-xl bg-secondary px-4 py-3 text-sm font-semibold text-white hover:bg-orange-500 shadow-lg shadow-secondary/30 focus:outline-none focus:ring-4 focus:ring-secondary/30 transition-all duration-200 disabled:opacity-70 disabled:cursor-not-allowed overflow-hidden group"
            >
              <span className={`inline-flex items-center gap-2 transition-opacity ${isLoading ? "opacity-0" : "opacity-100"}`}>
                Iniciar sesión
                <svg className="h-4 w-4 transition-transform group-hover:translate-x-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </span>
              {isLoading && (
                <span className="absolute inset-0 flex items-center justify-center">
                  <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                </span>
              )}
            </button>
          </form>

          <div className="mt-8 text-center">
            <p className="text-sm text-slate-500">
              ¿No tienes cuenta?{" "}
              <Link
                href="/register"
                className="font-semibold text-primary hover:text-primary-700 transition-colors"
              >
                Crear cuenta gratis
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
