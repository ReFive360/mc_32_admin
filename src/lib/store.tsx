"use client";

import { createContext, useContext, useMemo, useSyncExternalStore } from "react";
import { seedDatabase } from "./seed";
import type {
  Admin,
  Appointment,
  Database,
  Doctor,
  Permission,
  Phrase,
  Promotion,
  Service,
} from "./types";

const DATA_KEY = "mc32.db.v1";
const SESSION_KEY = "mc32.session.v1";

const emptyDatabase: Database = {
  doctors: [],
  services: [],
  appointments: [],
  promotions: [],
  phrases: [],
  admins: [],
};

type StoreValue = {
  ready: boolean;
  db: Database;
  admin: Admin | null;
  login: (email: string, password: string) => string | null;
  logout: () => void;
  can: (permission: Permission) => boolean;
  reset: () => void;
  saveDoctor: (doctor: Doctor) => void;
  removeDoctor: (id: string) => string | null;
  saveService: (service: Service) => void;
  removeService: (id: string) => string | null;
  saveAppointment: (appointment: Appointment) => string | null;
  removeAppointment: (id: string) => void;
  savePromotion: (promotion: Promotion) => string | null;
  removePromotion: (id: string) => void;
  savePhrase: (phrase: Phrase) => string | null;
  removePhrase: (id: string) => void;
  saveAdmin: (account: Admin, isNew: boolean) => string | null;
  removeAdmin: (id: string) => string | null;
};

const StoreContext = createContext<StoreValue | null>(null);
const listeners = new Set<() => void>();
let memoryDb: Database | null = null;
let memoryAdminId: string | null | undefined;

function emit() {
  for (const listener of listeners) listener();
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function subscribeMounted() {
  return () => {};
}

function readDb() {
  if (memoryDb) return memoryDb;
  const raw = localStorage.getItem(DATA_KEY);
  if (!raw) {
    memoryDb = seedDatabase();
    localStorage.setItem(DATA_KEY, JSON.stringify(memoryDb));
    return memoryDb;
  }
  let parsed: unknown = null;
  try {
    parsed = JSON.parse(raw);
  } catch {
    parsed = null;
  }
  memoryDb = isDatabase(parsed) ? parsed : seedDatabase();
  if (!isDatabase(parsed)) localStorage.setItem(DATA_KEY, JSON.stringify(memoryDb));
  return memoryDb;
}

function updateDb(recipe: (current: Database) => Database) {
  writeDb(recipe(memoryDb ?? readDb()));
}

function readAdminId() {
  if (memoryAdminId !== undefined) return memoryAdminId;
  memoryAdminId = localStorage.getItem(SESSION_KEY);
  return memoryAdminId;
}

function writeDb(next: Database) {
  memoryDb = next;
  localStorage.setItem(DATA_KEY, JSON.stringify(next));
  emit();
}

function writeAdminId(next: string | null) {
  memoryAdminId = next;
  if (next) localStorage.setItem(SESSION_KEY, next);
  else localStorage.removeItem(SESSION_KEY);
  emit();
}

function isDatabase(value: unknown): value is Database {
  if (!value || typeof value !== "object") return false;
  const record = value as Database;
  return (
    Array.isArray(record.doctors) &&
    Array.isArray(record.services) &&
    Array.isArray(record.appointments) &&
    Array.isArray(record.promotions) &&
    Array.isArray(record.phrases) &&
    Array.isArray(record.admins)
  );
}

function upsert<T extends { id: string }>(list: T[], item: T) {
  const exists = list.some((entry) => entry.id === item.id);
  if (!exists) return [item, ...list];
  return list.map((entry) => (entry.id === item.id ? item : entry));
}

function overlaps(left: Appointment, right: Appointment) {
  if (left.id === right.id || left.doctorId !== right.doctorId || left.date !== right.date) {
    return false;
  }
  if (left.status === "cancelled" || right.status === "cancelled") return false;
  return left.start < right.end && right.start < left.end;
}

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const ready = useSyncExternalStore(subscribeMounted, () => true, () => false);
  const db = useSyncExternalStore(subscribe, readDb, () => emptyDatabase);
  const adminId = useSyncExternalStore(subscribe, readAdminId, () => null);

  const admin = useMemo(
    () => db.admins.find((item) => item.id === adminId && item.active) ?? null,
    [adminId, db.admins],
  );

  const value = useMemo<StoreValue>(() => {
    return {
      ready,
      db,
      admin,
      can(permission) {
        return Boolean(admin?.permissions.includes(permission));
      },
      login(email, password) {
        const found = db.admins.find(
          (item) => item.email.toLowerCase() === email.trim().toLowerCase() && item.password === password,
        );
        if (!found) return "Неверный email или пароль";
        if (!found.active) return "Учётная запись отключена";
        writeAdminId(found.id);
        return null;
      },
      logout() {
        writeAdminId(null);
      },
      reset() {
        const next = seedDatabase();
        const current = memoryAdminId ?? null;
        writeDb(next);
        writeAdminId(current && next.admins.some((item) => item.id === current) ? current : null);
      },
      saveDoctor(doctor) {
        updateDb((current) => ({ ...current, doctors: upsert(current.doctors, doctor) }));
      },
      removeDoctor(id) {
        if (db.appointments.some((item) => item.doctorId === id)) {
          return "У врача есть записи в расписании. Сначала перенесите или удалите их.";
        }
        updateDb((current) => ({ ...current, doctors: current.doctors.filter((item) => item.id !== id) }));
        return null;
      },
      saveService(service) {
        updateDb((current) => ({ ...current, services: upsert(current.services, service) }));
      },
      removeService(id) {
        if (db.appointments.some((item) => item.serviceId === id)) {
          return "Услуга используется в расписании. Сначала измените эти записи.";
        }
        updateDb((current) => ({
          ...current,
          services: current.services.filter((item) => item.id !== id),
          promotions: current.promotions.map((item) => ({
            ...item,
            serviceIds: item.serviceIds.filter((serviceId) => serviceId !== id),
          })),
        }));
        return null;
      },
      saveAppointment(appointment) {
        if (!appointment.doctorId || !appointment.serviceId || !appointment.date) {
          return "Укажите врача, услугу и дату.";
        }
        if (!appointment.patientName.trim()) return "Укажите имя пациента.";
        if (!appointment.start || !appointment.end || appointment.end <= appointment.start) {
          return "Время окончания должно быть позже начала.";
        }
        const clash = db.appointments.find((item) => overlaps(item, appointment));
        if (clash) {
          const doctor = db.doctors.find((item) => item.id === appointment.doctorId);
          return `${doctor?.fullName ?? "Врач"} уже занят ${clash.start}–${clash.end}.`;
        }
        updateDb((current) => ({ ...current, appointments: upsert(current.appointments, appointment) }));
        return null;
      },
      removeAppointment(id) {
        updateDb((current) => ({
          ...current,
          appointments: current.appointments.filter((item) => item.id !== id),
        }));
      },
      savePromotion(promotion) {
        if (!promotion.title.trim()) return "Укажите название акции.";
        if (!promotion.startsOn || !promotion.endsOn || promotion.endsOn < promotion.startsOn) {
          return "Дата окончания не может быть раньше начала.";
        }
        if (!Number.isFinite(promotion.discountValue) || promotion.discountValue <= 0) {
          return "Скидка должна быть больше нуля.";
        }
        if (promotion.discountType === "percent" && promotion.discountValue > 100) {
          return "Процент скидки не может быть больше 100.";
        }
        updateDb((current) => ({ ...current, promotions: upsert(current.promotions, promotion) }));
        return null;
      },
      removePromotion(id) {
        updateDb((current) => ({
          ...current,
          promotions: current.promotions.filter((item) => item.id !== id),
        }));
      },
      savePhrase(phrase) {
        if (!phrase.title.trim() || !phrase.body.trim()) return "Заполните название и текст фразы.";
        updateDb((current) => ({ ...current, phrases: upsert(current.phrases, phrase) }));
        return null;
      },
      removePhrase(id) {
        updateDb((current) => ({ ...current, phrases: current.phrases.filter((item) => item.id !== id) }));
      },
      saveAdmin(account, isNew) {
        const email = account.email.trim().toLowerCase();
        if (!account.name.trim()) return "Укажите имя.";
        if (!email.includes("@")) return "Укажите корректный email.";
        if (account.permissions.length === 0) return "Выберите хотя бы одну роль.";
        if (isNew && account.password.trim().length < 4) return "Пароль должен быть не короче 4 символов.";
        if (!isNew && account.password.trim().length > 0 && account.password.trim().length < 4) {
          return "Новый пароль должен быть не короче 4 символов.";
        }
        if (db.admins.some((item) => item.email.toLowerCase() === email && item.id !== account.id)) {
          return "Администратор с таким email уже есть.";
        }
        if (admin && account.id === admin.id && !account.active) {
          return "Нельзя отключить свою учётную запись.";
        }
        if (admin && account.id === admin.id && !account.permissions.includes("edit")) {
          return "Нельзя снять с себя право редактирования.";
        }
        const nextAccount: Admin = {
          ...account,
          email,
          password: account.password.trim() || db.admins.find((item) => item.id === account.id)?.password || "",
        };
        if (!nextAccount.password) return "Укажите пароль.";
        updateDb((current) => ({ ...current, admins: upsert(current.admins, nextAccount) }));
        return null;
      },
      removeAdmin(id) {
        if (admin && id === admin.id) return "Нельзя удалить свою учётную запись.";
        const remaining = db.admins.filter((item) => item.id !== id);
        const hasEditor = remaining.some(
          (item) => item.active && item.permissions.includes("view") && item.permissions.includes("edit"),
        );
        if (!hasEditor) return "Должен остаться хотя бы один активный администратор с правом редактирования.";
        updateDb((current) => ({ ...current, admins: current.admins.filter((item) => item.id !== id) }));
        return null;
      },
    };
  }, [admin, db, ready]);

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore() {
  const value = useContext(StoreContext);
  if (!value) throw new Error("useStore должен использоваться внутри StoreProvider");
  return value;
}
