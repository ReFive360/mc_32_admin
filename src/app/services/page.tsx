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
  SelectField,
  ToggleField,
} from "@/components/ui";
import { createId, money } from "@/lib/format";
import { SERVICE_CATEGORIES } from "@/lib/labels";
import { bestOffer } from "@/lib/pricing";
import { useStore } from "@/lib/store";
import type { Service } from "@/lib/types";
import { useMemo, useState } from "react";

type Draft = Omit<Service, "duration" | "price"> & { duration: string; price: string; isNew: boolean };

function toDraft(service?: Service): Draft {
  return {
    id: service?.id ?? createId(),
    name: service?.name ?? "",
    category: service?.category ?? SERVICE_CATEGORIES[0],
    duration: service ? String(service.duration) : "30",
    price: service ? String(service.price) : "",
    description: service?.description ?? "",
    active: service?.active ?? true,
    isNew: !service,
  };
}

export default function ServicesPage() {
  const { db, can, saveService, removeService } = useStore();
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("all");
  const [draft, setDraft] = useState<Draft | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pendingDelete, setPendingDelete] = useState<Service | null>(null);
  const readOnly = !can("edit");
  const allowed = can("view") || can("edit") || can("delete");

  const rows = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return db.services
      .filter((service) => category === "all" || service.category === category)
      .filter((service) => `${service.name} ${service.description}`.toLowerCase().includes(needle))
      .sort((a, b) => a.category.localeCompare(b.category, "ru") || a.name.localeCompare(b.name, "ru"));
  }, [category, db.services, query]);

  function save() {
    if (!draft) return;
    const duration = Number(draft.duration);
    const price = Number(draft.price);
    if (!draft.name.trim() || !draft.category) {
      setError("Укажите название и категорию.");
      return;
    }
    if (!Number.isFinite(duration) || duration <= 0) {
      setError("Длительность должна быть больше нуля.");
      return;
    }
    if (!Number.isFinite(price) || price < 0) {
      setError("Цена не может быть отрицательной.");
      return;
    }
    saveService({
      id: draft.id,
      name: draft.name.trim(),
      category: draft.category,
      duration,
      price,
      description: draft.description.trim(),
      active: draft.active,
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
              Новая услуга
            </Button>
          ) : null
        }
        description="Базовая цена и цена со скидкой, если сейчас действует акция на эту услугу или на весь прайс."
        eyebrow="Прайс"
        title="Услуги"
      />
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end">
        <div className="sm:w-64">
          <SelectField
            label="Категория"
            options={[{ id: "all", label: "Все категории" }, ...SERVICE_CATEGORIES.map((item) => ({ id: item, label: item }))]}
            value={category}
            onChange={setCategory}
          />
        </div>
        <SearchBox placeholder="Название услуги" value={query} onChange={setQuery} />
      </div>
      <Table>
        <Table.ScrollContainer>
          <Table.Content aria-label="Услуги и прайс">
            <Table.Header>
              <Table.Column isRowHeader>Услуга</Table.Column>
              <Table.Column>Категория</Table.Column>
              <Table.Column>Длительность</Table.Column>
              <Table.Column>Цена</Table.Column>
              <Table.Column>Статус</Table.Column>
              <Table.Column>Действия</Table.Column>
            </Table.Header>
            <Table.Body items={rows} renderEmptyState={() => "Услуги не найдены"}>
              {(service) => {
                const offer = bestOffer(service, db.promotions);
                return (
                  <Table.Row id={service.id}>
                    <Table.Cell>
                      <span className="block font-medium">{service.name}</span>
                      <span className="block max-w-sm text-xs text-muted">{service.description}</span>
                    </Table.Cell>
                    <Table.Cell>{service.category}</Table.Cell>
                    <Table.Cell>{service.duration} мин</Table.Cell>
                    <Table.Cell>
                      <span className="block">{money(offer.price)}</span>
                      {offer.promotion ? (
                        <span className="block text-xs text-muted line-through">{money(service.price)}</span>
                      ) : null}
                      {offer.promotion ? (
                        <span className="block text-xs text-accent">{offer.promotion.code}</span>
                      ) : null}
                    </Table.Cell>
                    <Table.Cell>
                      <Chip color={service.active ? "success" : "default"} size="sm" variant="soft">
                        {service.active ? "В прайсе" : "Скрыта"}
                      </Chip>
                    </Table.Cell>
                    <Table.Cell>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="tertiary"
                          onPress={() => {
                            setError(null);
                            setDraft(toDraft(service));
                          }}
                        >
                          {readOnly ? "Открыть" : "Изменить"}
                        </Button>
                        {can("delete") ? (
                          <Button size="sm" variant="danger-soft" onPress={() => setPendingDelete(service)}>
                            Удалить
                          </Button>
                        ) : null}
                      </div>
                    </Table.Cell>
                  </Table.Row>
                );
              }}
            </Table.Body>
          </Table.Content>
        </Table.ScrollContainer>
      </Table>

      <FormDialog
        error={error}
        open={draft !== null}
        readOnly={readOnly}
        title={draft?.isNew ? "Новая услуга" : "Услуга"}
        onClose={() => setDraft(null)}
        onSubmit={save}
      >
        <div className="sm:col-span-2">
          <Field disabled={readOnly} label="Название" value={draft?.name ?? ""} onChange={(value) => setDraft((current) => current && { ...current, name: value })} />
        </div>
        <SelectField
          disabled={readOnly}
          label="Категория"
          options={SERVICE_CATEGORIES.map((item) => ({ id: item, label: item }))}
          value={draft?.category ?? ""}
          onChange={(value) => setDraft((current) => current && { ...current, category: value })}
        />
        <Field disabled={readOnly} label="Длительность, мин" type="number" value={draft?.duration ?? ""} onChange={(value) => setDraft((current) => current && { ...current, duration: value })} />
        <Field disabled={readOnly} label="Цена, ₽" type="number" value={draft?.price ?? ""} onChange={(value) => setDraft((current) => current && { ...current, price: value })} />
        <ToggleField
          disabled={readOnly}
          label="Показывать в прайсе"
          selected={draft?.active ?? true}
          onChange={(value) => setDraft((current) => current && { ...current, active: value })}
        />
        <div className="sm:col-span-2">
          <AreaField disabled={readOnly} label="Описание" value={draft?.description ?? ""} onChange={(value) => setDraft((current) => current && { ...current, description: value })} />
        </div>
      </FormDialog>

      <ConfirmDialog
        description={pendingDelete ? `«${pendingDelete.name}» будет удалена. Если услуга стоит в расписании, удаление остановится.` : ""}
        open={pendingDelete !== null}
        title="Удалить услугу?"
        onClose={() => setPendingDelete(null)}
        onConfirm={() => {
          if (!pendingDelete) return;
          const message = removeService(pendingDelete.id);
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
