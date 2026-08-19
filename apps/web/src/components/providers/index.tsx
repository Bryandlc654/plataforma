"use client";

import { ConfirmProvider } from "./confirm-provider";
import { ReactNode } from "react";

export function Providers({ children }: { children: ReactNode }) {
  return (
    <ConfirmProvider>
      {children}
    </ConfirmProvider>
  );
}
