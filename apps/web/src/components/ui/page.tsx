import Link from "next/link";
import type { ReactNode } from "react";

/**
 * Estructura de página del panel, como en el admin de Shopify: título a la izquierda,
 * acciones a la derecha y contenido en un ancho cómodo de lectura.
 */
export function Page({
  title,
  subtitle,
  backHref,
  primaryAction,
  secondaryActions,
  wide = false,
  children,
}: {
  title: ReactNode;
  subtitle?: ReactNode;
  backHref?: string;
  primaryAction?: ReactNode;
  secondaryActions?: ReactNode;
  /** Páginas con tablas anchas (p. ej. pedidos): más ancho máximo. */
  wide?: boolean;
  children: ReactNode;
}) {
  return (
    <div className={`mx-auto w-full px-4 py-5 sm:px-6 sm:py-6 ${wide ? "max-w-[1200px]" : "max-w-[1000px]"}`}>
      <div className="mb-4 flex flex-wrap items-center gap-3">
        {backHref && (
          <Link href={backHref} className="flex h-8 w-8 items-center justify-center rounded-lg text-[#4a4a4a] hover:bg-[rgba(0,0,0,0.06)]" aria-label="Volver">
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
          </Link>
        )}
        <div className="min-w-0 flex-1">
          <h1 className="page-title">{title}</h1>
          {subtitle && <p className="page-subtitle">{subtitle}</p>}
        </div>
        {(secondaryActions || primaryAction) && (
          <div className="flex flex-wrap items-center gap-2">
            {secondaryActions}
            {primaryAction}
          </div>
        )}
      </div>
      <div className="space-y-4">{children}</div>
    </div>
  );
}

/** Estado vacío dentro de una tarjeta: ilustración simple, texto y acción. */
export function EmptyState({ icon, title, description, action }: { icon?: ReactNode; title: string; description?: string; action?: ReactNode }) {
  return (
    <div className="card flex flex-col items-center px-6 py-14 text-center">
      {icon && <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#f1f1f1] text-[#8a8a8a]">{icon}</div>}
      <h2 className="text-[16px] font-semibold text-[#303030]">{title}</h2>
      {description && <p className="mt-1 max-w-sm text-[13px] text-[#616161]">{description}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
