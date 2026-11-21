export function formatISODate(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function todayISO() {
  return formatISODate(new Date());
}

export function parseISODate(iso: string) {
  const [year, month, day] = iso.split("-").map(Number);
  return new Date(year, (month || 1) - 1, day || 1);
}

export function addDays(iso: string, days: number) {
  const date = parseISODate(iso);
  date.setDate(date.getDate() + days);
  return formatISODate(date);
}

export function startOfWeek(iso: string) {
  const date = parseISODate(iso);
  const day = date.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  date.setDate(date.getDate() + diff);
  return formatISODate(date);
}

export function weekDays(iso: string) {
  const start = startOfWeek(iso);
  return Array.from({ length: 7 }, (_, index) => addDays(start, index));
}

export function money(value: number) {
  return new Intl.NumberFormat("ru-RU", {
    style: "currency",
    currency: "RUB",
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatDate(iso: string) {
  if (!iso) return "—";
  return new Intl.DateTimeFormat("ru-RU", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(parseISODate(iso));
}

export function formatDay(iso: string) {
  return new Intl.DateTimeFormat("ru-RU", {
    day: "numeric",
    month: "short",
  }).format(parseISODate(iso));
}

export function weekdayShort(iso: string) {
  return new Intl.DateTimeFormat("ru-RU", { weekday: "short" }).format(parseISODate(iso));
}

export function weekdayLong(iso: string) {
  return new Intl.DateTimeFormat("ru-RU", { weekday: "long" }).format(parseISODate(iso));
}

export function addMinutes(time: string, minutes: number) {
  const [hours = 0, mins = 0] = time.split(":").map(Number);
  const total = (hours * 60 + mins + minutes + 24 * 60) % (24 * 60);
  const nextHours = Math.floor(total / 60);
  const nextMinutes = total % 60;
  return `${String(nextHours).padStart(2, "0")}:${String(nextMinutes).padStart(2, "0")}`;
}

export function minutesBetween(start: string, end: string) {
  const [startH = 0, startM = 0] = start.split(":").map(Number);
  const [endH = 0, endM = 0] = end.split(":").map(Number);
  return endH * 60 + endM - (startH * 60 + startM);
}

export function greeting(date = new Date()) {
  const hour = date.getHours();
  if (hour < 12) return "Доброе утро";
  if (hour < 18) return "Добрый день";
  return "Добрый вечер";
}

export function shortName(fullName: string) {
  const [last = "", first = "", middle = ""] = fullName.split(" ");
  const initials = [first, middle]
    .filter(Boolean)
    .map((part) => `${part[0]}.`)
    .join("");
  return initials ? `${last} ${initials}` : last;
}

export function nextBirthday(birthDate: string, from = new Date()) {
  if (!birthDate) return null;
  const [, month, day] = birthDate.split("-").map(Number);
  if (!month || !day) return null;
  const today = new Date(from.getFullYear(), from.getMonth(), from.getDate());
  let next = new Date(today.getFullYear(), month - 1, day);
  if (next < today) next = new Date(today.getFullYear() + 1, month - 1, day);
  const days = Math.round((next.getTime() - today.getTime()) / 86_400_000);
  return { date: formatISODate(next), days };
}

export function renderPhrase(body: string, values: Record<string, string>) {
  return body.replace(/\{[^{}]+\}/g, (token) => values[token] ?? token);
}

export function createId() {
  return crypto.randomUUID();
}
