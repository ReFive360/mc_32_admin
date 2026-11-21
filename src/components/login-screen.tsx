"use client";

import { Button, Chip, TextField, Input, Label } from "@heroui/react";
import { CLINIC_NAME } from "@/lib/labels";
import { useStore } from "@/lib/store";
import { useState } from "react";

const DEMOS = [
  { email: "admin@mc32.local", password: "admin", role: "Все роли" },
  { email: "reception@mc32.local", password: "reception", role: "Просмотр и редактирование" },
  { email: "viewer@mc32.local", password: "viewer", role: "Только просмотр" },
];

export function LoginScreen() {
  const { login } = useStore();
  const [email, setEmail] = useState(DEMOS[0].email);
  const [password, setPassword] = useState(DEMOS[0].password);
  const [error, setError] = useState<string | null>(null);

  function submit() {
    setError(login(email, password));
  }

  return (
    <div className="grid min-h-screen lg:grid-cols-[1.1fr_0.9fr]">
      <section className="relative hidden overflow-hidden bg-[#10211f] text-white lg:flex lg:flex-col lg:justify-between lg:p-12">
        <div className="absolute -left-24 top-16 size-72 rounded-full bg-teal-400/20 blur-3xl" />
        <div className="absolute bottom-0 right-0 size-80 rounded-full bg-cyan-300/10 blur-3xl" />
        <div className="relative">
          <p className="text-sm font-semibold tracking-[0.2em] text-teal-100/80">{CLINIC_NAME}</p>
          <h1 className="mt-6 max-w-md text-5xl font-semibold leading-tight tracking-tight">
            Расписание, врачи и прайс в одной панели
          </h1>
          <p className="mt-5 max-w-md text-base leading-7 text-teal-50/75">
            Администраторы видят только то, что разрешено ролью: просмотр, редактирование или удаление.
          </p>
        </div>
        <p className="relative text-sm text-teal-50/60">Демо без сервера: данные остаются в этом браузере.</p>
      </section>
      <section className="flex items-center justify-center bg-background px-5 py-12">
        <div className="w-full max-w-md">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-accent lg:hidden">{CLINIC_NAME}</p>
          <h2 className="mt-2 text-3xl font-semibold tracking-tight">Вход для администратора</h2>
          <p className="mt-2 text-sm leading-6 text-muted">Выберите демо-роль или введите свою учётную запись.</p>
          <div className="mt-6 flex flex-col gap-2">
            {DEMOS.map((demo) => (
              <button
                key={demo.email}
                className="flex items-center justify-between rounded-xl border border-border bg-surface px-3 py-2 text-left transition hover:bg-surface-secondary"
                type="button"
                onClick={() => {
                  setEmail(demo.email);
                  setPassword(demo.password);
                  setError(null);
                }}
              >
                <span>
                  <span className="block text-sm font-medium">{demo.email}</span>
                  <span className="block text-xs text-muted">{demo.role}</span>
                </span>
                <Chip size="sm" variant="soft">
                  {demo.password}
                </Chip>
              </button>
            ))}
          </div>
          <div className="mt-6 flex flex-col gap-4">
            <TextField fullWidth type="email" value={email} onChange={setEmail}>
              <Label>Email</Label>
              <Input />
            </TextField>
            <TextField fullWidth type="password" value={password} onChange={setPassword}>
              <Label>Пароль</Label>
              <Input />
            </TextField>
            {error ? <p className="text-sm text-danger">{error}</p> : null}
            <Button fullWidth variant="primary" onPress={submit}>
              Войти
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
