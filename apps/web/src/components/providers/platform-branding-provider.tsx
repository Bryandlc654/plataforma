"use client";

import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import api from "@/lib/api";
import {
  brandingCssVars,
  DEFAULT_BRANDING,
  normalizeBranding,
  type PlatformBranding,
} from "@/lib/platform-branding";

interface PlatformBrandingContextValue {
  branding: PlatformBranding;
  applyBranding: (branding: Partial<PlatformBranding>) => void;
  refreshBranding: () => Promise<void>;
}

const PlatformBrandingContext = createContext<PlatformBrandingContextValue>({
  branding: DEFAULT_BRANDING,
  applyBranding: () => {},
  refreshBranding: async () => {},
});

function applyVars(branding: PlatformBranding) {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  for (const [key, value] of Object.entries(brandingCssVars(branding))) {
    root.style.setProperty(key, value);
  }
}

export function PlatformBrandingProvider({
  initialBranding,
  children,
}: {
  initialBranding: PlatformBranding;
  children: ReactNode;
}) {
  const [branding, setBranding] = useState<PlatformBranding>(() => normalizeBranding(initialBranding));

  useEffect(() => {
    applyVars(branding);
  }, [branding]);

  const applyBranding = useCallback((next: Partial<PlatformBranding>) => {
    setBranding((current) => normalizeBranding({ ...current, ...next }));
  }, []);

  const refreshBranding = useCallback(async () => {
    try {
      const res: any = await api.get("/platform/branding");
      const payload = res?.data || res;
      setBranding(normalizeBranding(payload));
    } catch {}
  }, []);

  return (
    <PlatformBrandingContext.Provider value={{ branding, applyBranding, refreshBranding }}>
      {children}
    </PlatformBrandingContext.Provider>
  );
}

export function usePlatformBranding() {
  return useContext(PlatformBrandingContext);
}
