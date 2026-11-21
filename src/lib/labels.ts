import type {
  AppointmentStatus,
  DiscountType,
  Permission,
  PhraseChannel,
  PhraseKind,
} from "./types";

export const CLINIC_NAME = "MC-32";

export const PERMISSIONS: { id: Permission; label: string; hint: string }[] = [
  {
    id: "view",
    label: "Просмотр",
    hint: "Видит разделы, карточки и прайс",
  },
  {
    id: "edit",
    label: "Редактирование",
    hint: "Создаёт и изменяет записи",
  },
  {
    id: "delete",
    label: "Удаление",
    hint: "Удаляет записи",
  },
];

export const SERVICE_CATEGORIES = [
  "Консультации",
  "Диагностика",
  "Процедуры",
  "Стоматология",
];

export const DOCTOR_COLORS = [
  "#0f766e",
  "#0369a1",
  "#7c3aed",
  "#be123c",
  "#b45309",
  "#15803d",
  "#4338ca",
  "#0f172a",
];

export const APPOINTMENT_STATUSES: { id: AppointmentStatus; label: string }[] = [
  { id: "planned", label: "Запланирована" },
  { id: "confirmed", label: "Подтверждена" },
  { id: "done", label: "Завершена" },
  { id: "cancelled", label: "Отменена" },
];

export const PHRASE_KINDS: { id: PhraseKind; label: string }[] = [
  { id: "birthday", label: "День рождения" },
  { id: "reminder", label: "Напоминание о визите" },
  { id: "confirmation", label: "Подтверждение записи" },
  { id: "thanks", label: "После визита" },
  { id: "promo", label: "Акция" },
  { id: "custom", label: "Другое оповещение" },
];

export const PHRASE_CHANNELS: { id: PhraseChannel; label: string }[] = [
  { id: "sms", label: "СМС" },
  { id: "messenger", label: "Мессенджер" },
  { id: "email", label: "Почта" },
];

export const PHRASE_TOKENS = [
  "{имя}",
  "{дата}",
  "{время}",
  "{врач}",
  "{услуга}",
  "{клиника}",
  "{скидка}",
];

export const STATUS_COLOR: Record<
  AppointmentStatus,
  "accent" | "success" | "default" | "danger" | "warning"
> = {
  planned: "accent",
  confirmed: "success",
  done: "default",
  cancelled: "danger",
};

export function permissionLabel(id: Permission) {
  return PERMISSIONS.find((item) => item.id === id)?.label ?? id;
}

export function statusLabel(id: AppointmentStatus) {
  return APPOINTMENT_STATUSES.find((item) => item.id === id)?.label ?? id;
}

export function phraseKindLabel(id: PhraseKind) {
  return PHRASE_KINDS.find((item) => item.id === id)?.label ?? id;
}

export function phraseChannelLabel(id: PhraseChannel) {
  return PHRASE_CHANNELS.find((item) => item.id === id)?.label ?? id;
}

export function discountLabel(type: DiscountType, value: number) {
  return type === "percent" ? `${value}%` : `${value.toLocaleString("ru-RU")} ₽`;
}
