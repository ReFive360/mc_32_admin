"use client";

import { Button, Chip } from "@heroui/react";
import {
  AreaField,
  ConfirmDialog,
  Field,
  FormDialog,
  NoAccess,
  PageHeader,
  SearchBox,
  SelectField,
} from "@/components/ui";
import { addMinutes, createId, shortName, todayISO, weekdayShort, weekDays, addDays, startOfWeek, formatDay } from "@/lib/format";
import { APPOINTMENT_STATUSES, statusLabel, STATUS_COLOR } from "@/lib/labels";
import { useStore } from "@/lib/store";
import type { Appointment, AppointmentStatus } from "@/lib/types";
import { useMemo, useState } from "react";

type Draft = {
  id: string;
  doctorId: string;
  serviceId: string;
  date: string;
  start: string;
  end: string;
  patientName: string;
  patientPhone: string;
  patientBirthDate: string;
  status: AppointmentStatus;
  notes: string;
  isNew: boolean;
};

function emptyDraft(date = todayISO(), doctorId = ""): Draft {
  return {
    id: createId(),
    doctorId,
    serviceId: "",
    date,
    start: "09:00",
    end: "09:30",
    patientName: "",
    patientPhone: "",
    patientBirthDate: "",
    status: "planned",
    notes: "",
    isNew: true,
  };
}

export default function SchedulePage() {
  const { db, can, saveAppointment, removeAppointment } = useStore();
  const [cursor, setCursor] = useState(todayISO());
  const [doctorId, setDoctorId] = useState("all");
  const [query, setQuery] = useState("");
  const [draft, setDraft] = useState<Draft | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pendingDelete, setPendingDelete] = useState<Appointment | null>(null);
  const days = weekDays(cursor);
  const readOnly = !can("edit");
  const allowed = can("view") || can("edit") || can("delete");

  const visible = useMemo(() => {
    const from = days[0];
    const to = days[6];
    return db.appointments
      .filter((item) => item.date >= from && item.date <= to)
      .filter((item) => doctorId === "all" || item.doctorId === doctorId)
      .filter((item) => {
        const haystack = `${item.patientName} ${item.patientPhone} ${item.notes}`.toLowerCase();
        return haystack.includes(query.trim().toLowerCase());
      })
      .sort((a, b) => `${a.date}${a.start}`.localeCompare(`${b.date}${b.start}`));
  }, [days, db.appointments, doctorId, query]);

  function openExisting(appointment: Appointment) {
    setError(null);
    setDraft({ ...appointment, isNew: false });
  }

  function updateDraft(patch: Partial<Draft>) {
    setDraft((current) => (current ? { ...current, ...patch } : current));
  }

  function onServiceChange(serviceId: string) {
    const service = db.services.find((item) => item.id === serviceId);
    setDraft((current) => {
      if (!current) return current;
      return {
        ...current,
        serviceId,
        end: service ? addMinutes(current.start, service.duration) : current.end,
      };
    });
  }

  function save() {
    if (!draft) return;
    const message = saveAppointment({
      id: draft.id,
      doctorId: draft.doctorId,
      serviceId: draft.serviceId,
      date: draft.date,
      start: draft.start,
      end: draft.end,
      patientName: draft.patientName.trim(),
      patientPhone: draft.patientPhone.trim(),
      patientBirthDate: draft.patientBirthDate,
      status: draft.status,
      notes: draft.notes.trim(),
    });
    setError(message);
    if (!message) setDraft(null);
  }

  if (!allowed) return <NoAccess />;

  return (
    <div>
      <PageHeader
        action={
          can("edit") ? (
            <Button variant="primary" onPress={() => { setError(null); setDraft(emptyDraft(cursor, doctorId === "all" ? "" : doctorId)); }}>
              Новая запись
            </Button>
          ) : null
        }
        description="Недельная доска приёмов. Отменённые записи не занимают время врача."
        eyebrow="Расписание"
        title="Записи на неделю"
      />

      <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          <Button size="sm" variant="secondary" onPress={() => setCursor(addDays(startOfWeek(cursor), -7))}>
            Назад
          </Button>
          <Button size="sm" variant="tertiary" onPress={() => setCursor(todayISO())}>
            Сегодня
          </Button>
          <Button size="sm" variant="secondary" onPress={() => setCursor(addDays(startOfWeek(cursor), 7))}>
            Дальше
          </Button>
          <p className="px-1 text-sm text-muted">
            {formatDay(days[0])} — {formatDay(days[6])}
          </p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row">
          <div className="sm:w-64">
            <SelectField
              label="Врач"
              options={[{ id: "all", label: "Все врачи" }, ...db.doctors.map((doctor) => ({ id: doctor.id, label: shortName(doctor.fullName) }))]}
              value={doctorId}
              onChange={setDoctorId}
            />
          </div>
          <SearchBox placeholder="Пациент или телефон" value={query} onChange={setQuery} />
        </div>
      </div>

      <div className="overflow-x-auto pb-2">
        <div className="grid min-w-[980px] grid-cols-7 gap-3">
          {days.map((day) => {
            const items = visible.filter((item) => item.date === day);
            const isToday = day === todayISO();
            return (
              <section
                key={day}
                className={`flex min-h-[28rem] flex-col rounded-2xl border bg-surface p-3 ${isToday ? "border-accent" : "border-border"}`}
              >
                <div className="mb-3 flex items-start justify-between gap-2">
                  <div>
                    <p className="text-xs uppercase tracking-wide text-muted">{weekdayShort(day)}</p>
                    <p className="text-lg font-semibold">{formatDay(day)}</p>
                  </div>
                  {can("edit") ? (
                    <Button isIconOnly aria-label="Добавить запись" size="sm" variant="ghost" onPress={() => { setError(null); setDraft(emptyDraft(day, doctorId === "all" ? "" : doctorId)); }}>
                      +
                    </Button>
                  ) : null}
                </div>
                <div className="flex flex-1 flex-col gap-2">
                  {items.length === 0 ? <p className="text-xs text-muted">Нет записей</p> : null}
                  {items.map((item) => {
                    const doctor = db.doctors.find((entry) => entry.id === item.doctorId);
                    const service = db.services.find((entry) => entry.id === item.serviceId);
                    return (
                      <button
                        key={item.id}
                        className="rounded-xl border border-border bg-background p-2 text-left transition hover:border-accent"
                        style={{ borderLeftColor: doctor?.color ?? "transparent", borderLeftWidth: 3 }}
                        type="button"
                        onClick={() => openExisting(item)}
                      >
                        <p className="text-xs font-medium">
                          {item.start}–{item.end}
                        </p>
                        <p className="mt-1 text-sm font-medium leading-5">{item.patientName}</p>
                        <p className="mt-1 text-xs text-muted">{service?.name ?? "Услуга удалена"}</p>
                        <p className="text-xs text-muted">{doctor ? shortName(doctor.fullName) : "—"}</p>
                        <Chip className="mt-2" color={STATUS_COLOR[item.status]} size="sm" variant="soft">
                          {statusLabel(item.status)}
                        </Chip>
                      </button>
                    );
                  })}
                </div>
              </section>
            );
          })}
        </div>
      </div>

      <FormDialog
        description={readOnly ? "У вас нет права редактирования. Запись открыта только для просмотра." : "Проверьте, что у врача нет другой записи на это время."}
        error={error}
        open={draft !== null}
        readOnly={readOnly}
        title={draft?.isNew ? "Новая запись" : "Запись пациента"}
        onClose={() => setDraft(null)}
        onSubmit={save}
      >
        <SelectField
          disabled={readOnly}
          label="Врач"
          options={db.doctors.filter((doctor) => doctor.active || doctor.id === draft?.doctorId).map((doctor) => ({ id: doctor.id, label: `${doctor.fullName} · ${doctor.specialty}` }))}
          value={draft?.doctorId ?? ""}
          onChange={(value) => updateDraft({ doctorId: value })}
        />
        <SelectField
          disabled={readOnly}
          label="Услуга"
          options={db.services.filter((service) => service.active || service.id === draft?.serviceId).map((service) => ({ id: service.id, label: `${service.name} · ${service.duration} мин` }))}
          value={draft?.serviceId ?? ""}
          onChange={onServiceChange}
        />
        <Field disabled={readOnly} label="Дата" type="date" value={draft?.date ?? ""} onChange={(value) => updateDraft({ date: value })} />
        <SelectField
          disabled={readOnly}
          label="Статус"
          options={APPOINTMENT_STATUSES}
          value={draft?.status ?? "planned"}
          onChange={(value) => updateDraft({ status: value as AppointmentStatus })}
        />
        <Field disabled={readOnly} label="Начало" type="time" value={draft?.start ?? ""} onChange={(value) => updateDraft({ start: value })} />
        <Field disabled={readOnly} label="Окончание" type="time" value={draft?.end ?? ""} onChange={(value) => updateDraft({ end: value })} />
        <Field disabled={readOnly} label="Пациент" value={draft?.patientName ?? ""} onChange={(value) => updateDraft({ patientName: value })} />
        <Field disabled={readOnly} label="Телефон" type="tel" value={draft?.patientPhone ?? ""} onChange={(value) => updateDraft({ patientPhone: value })} />
        <Field
          description="Нужна, чтобы показать день рождения на обзоре"
          disabled={readOnly}
          label="Дата рождения"
          type="date"
          value={draft?.patientBirthDate ?? ""}
          onChange={(value) => updateDraft({ patientBirthDate: value })}
        />
        <div className="sm:col-span-2">
          <AreaField disabled={readOnly} label="Комментарий" value={draft?.notes ?? ""} onChange={(value) => updateDraft({ notes: value })} />
        </div>
        {draft && !draft.isNew && can("delete") ? (
          <div className="sm:col-span-2">
            <Button variant="danger-soft" onPress={() => setPendingDelete(draft)}>
              Удалить запись
            </Button>
          </div>
        ) : null}
      </FormDialog>

      <ConfirmDialog
        description={pendingDelete ? `Запись ${pendingDelete.patientName} на ${pendingDelete.date} будет удалена из расписания.` : ""}
        open={pendingDelete !== null}
        title="Удалить запись?"
        onClose={() => setPendingDelete(null)}
        onConfirm={() => {
          if (pendingDelete) removeAppointment(pendingDelete.id);
          setPendingDelete(null);
          setDraft(null);
        }}
      />
    </div>
  );
}
