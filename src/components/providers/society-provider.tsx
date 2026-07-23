"use client";

import React, { createContext, useContext } from "react";

interface SocietyContextType {
  society: any;
}

const SocietyContext = createContext<SocietyContextType | undefined>(undefined);

export function SocietyProvider({
  children,
  society,
}: {
  children: React.ReactNode;
  society: any;
}) {
  return (
    <SocietyContext.Provider value={{ society }}>
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
