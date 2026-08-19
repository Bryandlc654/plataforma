"use client";

import React, { createContext, useContext, useState, ReactNode } from "react";

type ConfirmOptions = {
  title?: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  matchText?: string;
  matchLabel?: string;
};

type ConfirmContextType = {
  confirm: (options: ConfirmOptions | string) => Promise<boolean>;
};

const ConfirmContext = createContext<ConfirmContextType | undefined>(undefined);

export const useConfirm = () => {
  const context = useContext(ConfirmContext);
  if (!context) {
    throw new Error("useConfirm debe ser usado dentro de un ConfirmProvider");
  }
  return context;
};

export const ConfirmProvider = ({ children }: { children: ReactNode }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [options, setOptions] = useState<ConfirmOptions>({ message: "" });
  const [typed, setTyped] = useState("");
  const [resolver, setResolver] = useState<{ resolve: (value: boolean) => void } | null>(null);

  const confirm = (opts: ConfirmOptions | string): Promise<boolean> => {
    if (typeof opts === "string") {
      setOptions({ message: opts });
    } else {
      setOptions(opts);
    }
    setTyped("");
    setIsOpen(true);
    return new Promise((resolve) => {
      setResolver({ resolve });
    });
  };

  const handleConfirm = () => {
    resolver?.resolve(true);
    setIsOpen(false);
  };

  const handleCancel = () => {
    resolver?.resolve(false);
    setIsOpen(false);
  };

  const matchRequired = !!options.matchText;
  const matchOk = !matchRequired || typed.trim() === options.matchText;

  return (
    <ConfirmContext.Provider value={{ confirm }}>
      {children}
      {isOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40 backdrop-blur-sm transition-all duration-300">
          <div className="bg-surface-container-lowest rounded-2xl p-6 shadow-2xl w-full max-w-sm mx-4 animate-in fade-in zoom-in-95 duration-200 border border-outline-variant/30">
            <div className="flex items-center gap-3 mb-4 text-error">
              <span className="material-symbols-outlined text-3xl">warning</span>
              <h3 className="text-xl font-bold text-on-surface">
                {options.title || "Confirmar Acción"}
              </h3>
            </div>
            <p className="text-on-surface-variant mb-6 leading-relaxed">
              {options.message}
            </p>
            {matchRequired && (
              <div className="mb-6">
                <label className="block text-sm font-medium text-on-surface-variant mb-1.5">
                  {options.matchLabel || "Escribe el nombre para confirmar"}
                </label>
                <input
                  type="text"
                  autoFocus
                  value={typed}
                  onChange={(e) => setTyped(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter" && matchOk) handleConfirm(); }}
                  className="w-full rounded-xl border border-outline-variant bg-surface-container-lowest px-3.5 py-2.5 text-sm text-on-surface outline-none focus:border-error focus:ring-2 focus:ring-error/30"
                  placeholder={options.matchText}
                />
              </div>
            )}
            <div className="flex items-center justify-end gap-3">
              <button
                onClick={handleCancel}
                className="px-5 py-2.5 text-sm font-semibold text-on-surface-variant hover:bg-surface-container-high rounded-full transition-colors"
              >
                {options.cancelText || "Cancelar"}
              </button>
              <button
                onClick={handleConfirm}
                disabled={!matchOk}
                className="px-5 py-2.5 text-sm font-semibold bg-error text-on-error shadow hover:bg-error/90 hover:shadow-md rounded-full transition-all disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {options.confirmText || "Confirmar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </ConfirmContext.Provider>
  );
};
