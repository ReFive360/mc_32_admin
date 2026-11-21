"use client";

import { Button, Chip } from "@heroui/react";
import { CLINIC_NAME, permissionLabel } from "@/lib/labels";
import { useStore } from "@/lib/store";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { ConfirmDialog } from "./ui";

const NAV = [
  { href: "/", label: "Обзор", icon: "home" },
  { href: "/schedule", label: "Расписание", icon: "calendar" },
  { href: "/doctors", label: "Врачи", icon: "users" },
  { href: "/services", label: "Услуги и прайс", icon: "price" },
  { href: "/promotions", label: "Акции и скидки", icon: "tag" },
  { href: "/phrases", label: "Фразы", icon: "message" },
  { href: "/admins", label: "Администраторы", icon: "key" },
];

function NavIcon({ name }: { name: string }) {
  const paths: Record<string, string> = {
    home: "M4 10.5 12 4l8 6.5V20a1 1 0 0 1-1 1h-5v-6H10v6H5a1 1 0 0 1-1-1z",
    calendar: "M7 3v3M17 3v3M4 8h16M6 5h12a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2z",
    users: "M16 19v-1a3 3 0 0 0-3-3H7a3 3 0 0 0-3 3v1M10 12a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM20 19v-1a3 3 0 0 0-2.2-2.9M16 6.1a3 3 0 0 1 0 5.8",
    price: "M12 3v18M16.5 7.5c0-1.5-1.8-2.5-4.5-2.5S7.5 6 7.5 7.5 9.3 10 12 10s4.5 1 4.5 2.5S14.7 15 12 15s-4.5-1-4.5-2.5",
    tag: "M20 13.5 13.5 20 4 10.5V4h6.5zM7.5 7.5h.01",
    message: "M5 6h14a1 1 0 0 1 1 1v8a1 1 0 0 1-1 1H9l-4 3v-3H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1z",
    key: "M14 7a4 4 0 1 1-3.5 5.9L4 19.4 5.6 21l1.2-1.2 1.6 1.2 1.4-1.4-1.2-1.6 1.7-1.7A4 4 0 0 1 14 7z",
  };
  return (
    <svg aria-hidden className="size-4 shrink-0" fill="none" stroke="currentColor" strokeWidth="1.7" viewBox="0 0 24 24">
      <path d={paths[name]} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function AppFrame({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { admin, logout, reset } = useStore();
  const [menuOpen, setMenuOpen] = useState(false);
  const [resetOpen, setResetOpen] = useState(false);

  if (!admin) return null;

  return (
    <div className="min-h-screen bg-background lg:grid lg:grid-cols-[17.5rem_minmax(0,1fr)]">
      {menuOpen ? (
        <button
          aria-label="Закрыть меню"
          className="fixed inset-0 z-30 bg-black/40 lg:hidden"
          type="button"
          onClick={() => setMenuOpen(false)}
        />
      ) : null}
      <aside
        className={`${menuOpen ? "translate-x-0" : "-translate-x-full"} fixed inset-y-0 left-0 z-40 flex w-72 flex-col bg-[#10211f] text-white transition lg:static lg:w-auto lg:translate-x-0`}
      >
        <div className="px-5 pb-4 pt-6">
          <p className="text-xs font-semibold tracking-[0.18em] text-teal-100/70">КЛИНИКА</p>
          <p className="mt-1 text-2xl font-semibold tracking-tight">{CLINIC_NAME}</p>
        </div>
        <nav className="flex flex-1 flex-col gap-1 px-3">
          {NAV.map((item) => {
            const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition ${
                  active ? "bg-white text-[#10211f]" : "text-teal-50/80 hover:bg-white/10 hover:text-white"
                }`}
                href={item.href}
                onClick={() => setMenuOpen(false)}
              >
                <NavIcon name={item.icon} />
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="m-3 rounded-2xl bg-white/10 p-3">
          <p className="text-sm font-medium">{admin.name}</p>
          <p className="mt-0.5 truncate text-xs text-teal-50/60">{admin.email}</p>
          <div className="mt-3 flex flex-wrap gap-1">
            {admin.permissions.map((permission) => (
              <Chip key={permission} className="bg-white/10 text-white" size="sm" variant="tertiary">
                {permissionLabel(permission)}
              </Chip>
            ))}
          </div>
          <div className="mt-3 flex gap-2">
            <Button className="bg-white text-[#10211f]" size="sm" variant="primary" onPress={logout}>
              Выйти
            </Button>
            <Button className="text-white" size="sm" variant="ghost" onPress={() => setResetOpen(true)}>
              Сбросить демо
            </Button>
          </div>
        </div>
      </aside>
      <div className="min-w-0">
        <header className="sticky top-0 z-20 flex items-center justify-between border-b border-border bg-background/90 px-4 py-3 backdrop-blur lg:hidden">
          <button className="text-sm font-medium" type="button" onClick={() => setMenuOpen(true)}>
            Меню
          </button>
          <span className="text-sm font-semibold">{CLINIC_NAME}</span>
        </header>
        <main className="px-4 py-6 sm:px-8 sm:py-8">{children}</main>
      </div>
      <ConfirmDialog
        description="Локальные изменения удалятся, и снова появятся демо-врачи, прайс, записи и фразы."
        open={resetOpen}
        title="Сбросить демо-данные?"
        onClose={() => setResetOpen(false)}
        confirmLabel="Сбросить"
        onConfirm={() => {
          reset();
          setResetOpen(false);
        }}
      />
    </div>
  );
}
