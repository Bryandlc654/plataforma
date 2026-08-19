"use client";

import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAuthStore } from "@/stores/auth-store";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

const registerSchema = z
  .object({
    firstName: z.string().min(1, "Requerido"),
    lastName: z.string().min(1, "Requerido"),
    email: z.string().email("Correo inválido"),
    password: z.string().min(8, "Mínimo 8 caracteres"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Las contraseñas no coinciden",
    path: ["confirmPassword"],
  });

type RegisterFormData = z.infer<typeof registerSchema>;

export default function RegisterPage() {
  const router = useRouter();
  const { register: registerUser, isLoading, ensureSession } = useAuthStore();
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
  });

  useEffect(() => {
    (async () => {
      const ok = await ensureSession();
      if (ok) router.replace("/dashboard");
    })();
  }, [ensureSession, router]);

  const onSubmit = async (data: RegisterFormData) => {
    try {
      setError(null);
      await registerUser({
        email: data.email,
        password: data.password,
        firstName: data.firstName,
        lastName: data.lastName,
      });
      router.push("/dashboard");
    } catch (err: any) {
      setError(
        err.response?.data?.message || "Error al crear la cuenta"
      );
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-slate-900">
            Crear cuenta
          </h1>
          <p className="mt-2 text-sm text-slate-600">
            Comienza a construir tu presencia digital
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {error && (
            <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700 border border-red-200">
              {error}
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label" htmlFor="firstName">
                Nombre
              </label>
              <input
                id="firstName"
                type="text"
                className="input-field"
                placeholder="Juan"
                {...register("firstName")}
              />
              {errors.firstName && (
                <p className="mt-1 text-xs text-red-600">
                  {errors.firstName.message}
                </p>
              )}
            </div>

            <div>
              <label className="label" htmlFor="lastName">
                Apellido
              </label>
              <input
                id="lastName"
                type="text"
                className="input-field"
                placeholder="Pérez"
                {...register("lastName")}
              />
              {errors.lastName && (
                <p className="mt-1 text-xs text-red-600">
                  {errors.lastName.message}
                </p>
              )}
            </div>
          </div>

          <div>
            <label className="label" htmlFor="email">
              Correo electrónico
            </label>
            <input
              id="email"
              type="email"
              className="input-field"
              placeholder="tu@correo.com"
              {...register("email")}
            />
            {errors.email && (
              <p className="mt-1 text-xs text-red-600">
                {errors.email.message}
              </p>
            )}
          </div>

          <div>
            <label className="label" htmlFor="password">
              Contraseña
            </label>
            <input
              id="password"
              type="password"
              className="input-field"
              placeholder="Mínimo 8 caracteres"
              {...register("password")}
            />
            {errors.password && (
              <p className="mt-1 text-xs text-red-600">
                {errors.password.message}
              </p>
            )}
          </div>

          <div>
            <label className="label" htmlFor="confirmPassword">
              Confirmar contraseña
            </label>
            <input
              id="confirmPassword"
              type="password"
              className="input-field"
              placeholder="Repite tu contraseña"
              {...register("confirmPassword")}
            />
            {errors.confirmPassword && (
              <p className="mt-1 text-xs text-red-600">
                {errors.confirmPassword.message}
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="btn-primary w-full"
          >
            {isLoading ? "Creando cuenta..." : "Crear cuenta"}
          </button>
        </form>

        <div className="mt-6 text-center text-sm text-slate-600">
          ¿Ya tienes cuenta?{" "}
          <Link href="/login" className="font-medium text-primary-600 hover:text-primary-500">
            Iniciar sesión
          </Link>
        </div>
      </div>
    </div>
  );
}
