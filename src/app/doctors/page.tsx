"use client";

import { Button, Chip, Table } from "@heroui/react";
import {
  AreaField,
  ConfirmDialog,
  Field,
  FormDialog,
  NoAccess,
  PageHeader,
  SearchBox,
  ToggleField,
} from "@/components/ui";
import { createId } from "@/lib/format";
import { DOCTOR_COLORS } from "@/lib/labels";
import { useStore } from "@/lib/store";
import type { Doctor } from "@/lib/types";
import { useMemo, useState } from "react";

type Draft = Omit<Doctor, "experience"> & { experience: string; isNew: boolean };

function toDraft(doctor?: Doctor): Draft {
  return {
    id: doctor?.id ?? createId(),
    fullName: doctor?.fullName ?? "",
    specialty: doctor?.specialty ?? "",
    phone: doctor?.phone ?? "",
    email: doctor?.email ?? "",
    room: doctor?.room ?? "",
    experience: doctor ? String(doctor.experience) : "",
    about: doctor?.about ?? "",
    active: doctor?.active ?? true,
    color: doctor?.color ?? DOCTOR_COLORS[0],
    isNew: !doctor,
  };
}

export default function DoctorsPage() {
  const { db, can, saveDoctor, removeDoctor } = useStore();
  const [query, setQuery] = useState("");
  const [draft, setDraft] = useState<Draft | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pendingDelete, setPendingDelete] = useState<Doctor | null>(null);
  const readOnly = !can("edit");
  const allowed = can("view") || can("edit") || can("delete");

  const rows = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return db.doctors
      .filter((doctor) => `${doctor.fullName} ${doctor.specialty} ${doctor.room}`.toLowerCase().includes(needle))
      .sort((a, b) => a.fullName.localeCompare(b.fullName, "ru"));
  }, [db.doctors, query]);

  function save() {
    if (!draft) return;
    if (!draft.fullName.trim() || !draft.specialty.trim()) {
      setError("Укажите имя и специальность.");
      return;
    }
    const experience = Number(draft.experience);
    if (!Number.isFinite(experience) || experience < 0) {
      setError("Стаж должен быть числом от 0.");
      return;
    }
    saveDoctor({
      id: draft.id,
      fullName: draft.fullName.trim(),
      specialty: draft.specialty.trim(),
      phone: draft.phone.trim(),
      email: draft.email.trim(),
      room: draft.room.trim(),
      experience,
      about: draft.about.trim(),
      active: draft.active,
      color: draft.color,
    });
    setDraft(null);
  }

  if (!allowed) return <NoAccess />;

  return (
    <div>
      <PageHeader
        action={
          can("edit") ? (
            <Button
              variant="primary"
              onPress={() => {
                setError(null);
                setDraft(toDraft());
              }}
            >
              Новый врач
            </Button>
          ) : null
        }
        description="Карточки врачей используются в расписании. Цвет виден на карточках записей."
        eyebrow="Команда"
        title="Врачи"
      />
      <div className="mb-4">
        <SearchBox placeholder="Имя, специальность или кабинет" value={query} onChange={setQuery} />
      </div>
      <Table>
        <Table.ScrollContainer>
          <Table.Content aria-label="Врачи">
            <Table.Header>
              <Table.Column isRowHeader>Врач</Table.Column>
              <Table.Column>Специальность</Table.Column>
              <Table.Column>Кабинет</Table.Column>
              <Table.Column>Стаж</Table.Column>
              <Table.Column>Статус</Table.Column>
              <Table.Column>Действия</Table.Column>
            </Table.Header>
            <Table.Body items={rows} renderEmptyState={() => "Врачи не найдены"}>
              {(doctor) => (
                <Table.Row id={doctor.id}>
                  <Table.Cell>
                    <span className="flex items-center gap-2">
                      <span className="size-2.5 rounded-full" style={{ background: doctor.color }} />
                      <span>
                        <span className="block font-medium">{doctor.fullName}</span>
                        <span className="block text-xs text-muted">{doctor.phone || "телефон не указан"}</span>
                      </span>
                    </span>
                  </Table.Cell>
                  <Table.Cell>{doctor.specialty}</Table.Cell>
                  <Table.Cell>{doctor.room || "—"}</Table.Cell>
                  <Table.Cell>{doctor.experience} лет</Table.Cell>
                  <Table.Cell>
                    <Chip color={doctor.active ? "success" : "default"} size="sm" variant="soft">
                      {doctor.active ? "Принимает" : "Не принимает"}
                    </Chip>
                  </Table.Cell>
                  <Table.Cell>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="tertiary"
                        onPress={() => {
                          setError(null);
                          setDraft(toDraft(doctor));
                        }}
                      >
                        {readOnly ? "Открыть" : "Изменить"}
                      </Button>
                      {can("delete") ? (
                        <Button size="sm" variant="danger-soft" onPress={() => setPendingDelete(doctor)}>
                          Удалить
                        </Button>
                      ) : null}
                    </div>
                  </Table.Cell>
                </Table.Row>
              )}
            </Table.Body>
          </Table.Content>
        </Table.ScrollContainer>
      </Table>

      <FormDialog
        error={error}
        open={draft !== null}
        readOnly={readOnly}
        title={draft?.isNew ? "Новый врач" : "Карточка врача"}
        onClose={() => setDraft(null)}
        onSubmit={save}
      >
        <div className="sm:col-span-2">
          <Field disabled={readOnly} label="ФИО" value={draft?.fullName ?? ""} onChange={(value) => setDraft((current) => current && { ...current, fullName: value })} />
        </div>
        <Field disabled={readOnly} label="Специальность" value={draft?.specialty ?? ""} onChange={(value) => setDraft((current) => current && { ...current, specialty: value })} />
        <Field disabled={readOnly} label="Стаж, лет" type="number" value={draft?.experience ?? ""} onChange={(value) => setDraft((current) => current && { ...current, experience: value })} />
        <Field disabled={readOnly} label="Телефон" value={draft?.phone ?? ""} onChange={(value) => setDraft((current) => current && { ...current, phone: value })} />
        <Field disabled={readOnly} label="Email" type="email" value={draft?.email ?? ""} onChange={(value) => setDraft((current) => current && { ...current, email: value })} />
        <Field disabled={readOnly} label="Кабинет" value={draft?.room ?? ""} onChange={(value) => setDraft((current) => current && { ...current, room: value })} />
        <ToggleField
          description="Скрывает врача из новых записей"
          disabled={readOnly}
          label="Принимает пациентов"
          selected={draft?.active ?? true}
          onChange={(value) => setDraft((current) => current && { ...current, active: value })}
        />
        <div className="sm:col-span-2">
          <p className="mb-2 text-sm font-medium">Цвет в расписании</p>
          <div className="flex flex-wrap gap-2">
            {DOCTOR_COLORS.map((color) => (
              <button
                key={color}
                aria-label={color}
                className="size-8 rounded-full border-2"
                disabled={readOnly}
                style={{ background: color, borderColor: draft?.color === color ? "var(--foreground)" : "transparent" }}
                type="button"
                onClick={() => setDraft((current) => current && { ...current, color })}
              />
            ))}
          </div>
        </div>
        <div className="sm:col-span-2">
          <AreaField disabled={readOnly} label="О враче" value={draft?.about ?? ""} onChange={(value) => setDraft((current) => current && { ...current, about: value })} />
        </div>
      </FormDialog>

      <ConfirmDialog
        description={pendingDelete ? `${pendingDelete.fullName} исчезнет из справочника. Если у врача есть записи, удаление будет остановлено.` : ""}
        open={pendingDelete !== null}
        title="Удалить врача?"
        onClose={() => setPendingDelete(null)}
        onConfirm={() => {
          if (!pendingDelete) return;
          const message = removeDoctor(pendingDelete.id);
          setPendingDelete(null);
          if (message) {
            setError(message);
            setDraft(toDraft(pendingDelete));
          }
        }}
      />
    </div>
  );
}
