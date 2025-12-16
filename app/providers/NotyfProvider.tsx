"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { Notyf } from "notyf";
import "notyf/notyf.min.css";

type NotyfContextType = {
  notyf: Notyf | null;
};

const NotyfContext = createContext<NotyfContextType>({ notyf: null });

export function NotyfProvider({ children }: { children: React.ReactNode }) {
  const [notyf, setNotyf] = useState<Notyf | null>(null);

  useEffect(() => {
    // Configuración más simple que incluye los iconos por defecto
    const notyfInstance = new Notyf({
      duration: 3000,
      position: {
        x: "right",
        y: "top",
      },
      dismissible: true, // Permite cerrar con click
    });

    setNotyf(notyfInstance);
  }, []);

  return (
    <NotyfContext.Provider value={{ notyf }}>{children}</NotyfContext.Provider>
  );
}

export function useNotyf() {
  const context = useContext(NotyfContext);
  if (!context) {
    throw new Error("useNotyf debe usarse dentro de NotyfProvider");
  }
  return context.notyf;
}
