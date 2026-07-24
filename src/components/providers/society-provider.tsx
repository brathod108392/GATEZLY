"use client";

import React, { createContext, useContext } from "react";

interface SocietyContextType {
  society: Record<string, unknown>;
  role?: string;
}

const SocietyContext = createContext<SocietyContextType | undefined>(undefined);

export function SocietyProvider({
  children,
  society,
  role,
}: {
  children: React.ReactNode;
  society: Record<string, unknown>;
  role?: string;
}) {
  return (
    <SocietyContext.Provider value={{ society, role }}>
      {children}
    </SocietyContext.Provider>
  );
}

export function useSociety() {
  const context = useContext(SocietyContext);
  if (context === undefined) {
    throw new Error("useSociety must be used within a SocietyProvider");
  }
  return context;
}
