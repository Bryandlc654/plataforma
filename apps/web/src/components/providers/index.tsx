"use client";

import { ConfirmProvider } from "./confirm-provider";
import { PlatformBrandingProvider } from "./platform-branding-provider";
import { ReactNode } from "react";
import type { PlatformBranding } from "@/lib/platform-branding";

export function Providers({
  children,
  initialBranding,
}: {
  children: ReactNode;
  initialBranding: PlatformBranding;
}) {
  return (
    <PlatformBrandingProvider initialBranding={initialBranding}>
      <ConfirmProvider>{children}</ConfirmProvider>
    </PlatformBrandingProvider>
  );
}
