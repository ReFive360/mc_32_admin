"use client";

import { LoginScreen } from "@/components/login-screen";
import { AppFrame } from "@/components/shell";
import { StoreProvider, useStore } from "@/lib/store";

function Gate({ children }: { children: React.ReactNode }) {
  const { ready, admin } = useStore();

  if (!ready) {
    return (
      <div className="grid min-h-screen place-items-center bg-background text-sm text-muted">Загрузка панели…</div>
    );
  }

  if (!admin) return <LoginScreen />;
  return <AppFrame>{children}</AppFrame>;
}

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <StoreProvider>
      <Gate>{children}</Gate>
    </StoreProvider>
  );
}
