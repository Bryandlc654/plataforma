"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAuthStore } from "@/stores/auth-store";
import api from "@/lib/api";

const schema = z.object({
  name: z.string().min(1, "El nombre es requerido").max(100),
  slug: z.string().optional(),
  subdomain: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

export default function NewTenantPage() {
  const router = useRouter();
  const { selectTenant } = useAuthStore();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    setError(null);
    try {
      const res: any = await api.post("/tenants", data);
      const tenant = res.data || res;

      selectTenant({
        id: tenant.id,
        name: tenant.name,
        slug: tenant.slug,
        isOwner: true,
      });
      router.push("/dashboard");
    } catch (err: any) {
      setError(
        err.response?.data?.message || "Error al crear el negocio"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
      <main className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-slate-900">
              Crear nuevo negocio
            </h1>
            <p className="mt-2 text-sm text-slate-600">
              Crea un espacio para tu negocio, empresa o proyecto
            </p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {error && (
              <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700 border border-red-200">
                {error}
              </div>
            )}

            <div>
              <label className="label" htmlFor="name">
                Nombre del negocio
              </label>
              <input
                id="name"
                type="text"
                className="input-field"
                placeholder="Mi Empresa"
                {...register("name")}
              />
              {errors.name && (
                <p className="mt-1 text-xs text-red-600">{errors.name.message}</p>
              )}
            </div>

            <div>
              <label className="label" htmlFor="slug">
                Slug (opcional)
              </label>
              <input
                id="slug"
                type="text"
                className="input-field"
                placeholder="mi-empresa"
                {...register("slug")}
              />
              <p className="mt-1 text-xs text-slate-400">Se genera automáticamente si se deja vacío</p>
            </div>

            <div>
              <label className="label" htmlFor="subdomain">
                Subdominio (opcional)
              </label>
              <input
                id="subdomain"
                type="text"
                className="input-field"
                placeholder="mi-negocio"
                {...register("subdomain")}
              />
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => router.push("/dashboard")}
                className="btn-secondary flex-1"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={loading}
                className="btn-primary flex-1"
              >
                {loading ? "Creando..." : "Crear negocio"}
              </button>
            </div>
          </form>
        </div>
      </main>
    );
}
