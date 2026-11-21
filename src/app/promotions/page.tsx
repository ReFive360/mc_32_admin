"use client";

import { Button, Chip, Table } from "@heroui/react";
import {
  AreaField,
  CheckField,
  ConfirmDialog,
  Field,
  FormDialog,
  NoAccess,
  PageHeader,
  SearchBox,
  SelectField,
  ToggleField,
} from "@/components/ui";
import { createId, formatDate, money, todayISO } from "@/lib/format";
import { discountLabel } from "@/lib/labels";
import { applyDiscount, promotionIsCurrent } from "@/lib/pricing";
import { useStore } from "@/lib/store";
import type { DiscountType, Promotion } from "@/lib/types";
import { useMemo, useState } from "react";

type Draft = Omit<Promotion, "discountValue"> & { discountValue: string; isNew: boolean };

function toDraft(promotion?: Promotion): Draft {
  const today = todayISO();
  return {
    id: promotion?.id ?? createId(),
    title: promotion?.title ?? "",
    code: promotion?.code ?? "",
    description: promotion?.description ?? "",
    discountType: promotion?.discountType ?? "percent",
    discountValue: promotion ? String(promotion.discountValue) : "10",
    serviceIds: promotion?.serviceIds ?? [],
    startsOn: promotion?.startsOn ?? today,
    endsOn: promotion?.endsOn ?? today,
    active: promotion?.active ?? true,
    isNew: !promotion,
  };
}

function periodLabel(promotion: Promotion) {
  if (!promotion.active) return "Выключена";
  if (promotionIsCurrent(promotion)) return "Действует";
  if (promotion.startsOn > todayISO()) return "Скоро";
  return "Завершена";
}

export default function PromotionsPage() {
  const { db, can, savePromotion, removePromotion } = useStore();
  const [query, setQuery] = useState("");
  const [draft, setDraft] = useState<Draft | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pendingDelete, setPendingDelete] = useState<Promotion | null>(null);
  const readOnly = !can("edit");
  const allowed = can("view") || can("edit") || can("delete");

  const rows = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return db.promotions
      .filter((item) => `${item.title} ${item.code} ${item.description}`.toLowerCase().includes(needle))
      .sort((a, b) => b.startsOn.localeCompare(a.startsOn));
  }, [db.promotions, query]);

  const sample = db.services.find((service) => service.id === "s1") ?? db.services[0];

  function save() {
    if (!draft) return;
    const message = savePromotion({
      id: draft.id,
      title: draft.title.trim(),
      code: draft.code.trim().toUpperCase(),
      description: draft.description.trim(),
      discountType: draft.discountType,
      discountValue: Number(draft.discountValue),
      serviceIds: draft.serviceIds,
      startsOn: draft.startsOn,
      endsOn: draft.endsOn,
      active: draft.active,
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
            <Button
              variant="primary"
              onPress={() => {
                setError(null);
                setDraft(toDraft());
              }}
            >
              Новая акция
            </Button>
          ) : null
        }
        description="Скидка может действовать на все услуги или только на выбранные. Пустой список услуг означает весь прайс."
        eyebrow="Маркетинг"
        title="Акции и скидки"
      />
      <div className="mb-4">
        <SearchBox placeholder="Название или промокод" value={query} onChange={setQuery} />
      </div>
      <Table>
        <Table.ScrollContainer>
          <Table.Content aria-label="Акции">
            <Table.Header>
              <Table.Column isRowHeader>Акция</Table.Column>
              <Table.Column>Скидка</Table.Column>
              <Table.Column>Период</Table.Column>
              <Table.Column>Услуги</Table.Column>
              <Table.Column>Статус</Table.Column>
              <Table.Column>Действия</Table.Column>
            </Table.Header>
            <Table.Body items={rows} renderEmptyState={() => "Акции не найдены"}>
              {(promo) => (
                <Table.Row id={promo.id}>
                  <Table.Cell>
                    <span className="block font-medium">{promo.title}</span>
                    <span className="block text-xs text-muted">{promo.code || "без кода"}</span>
                  </Table.Cell>
                  <Table.Cell>{discountLabel(promo.discountType, promo.discountValue)}</Table.Cell>
                  <Table.Cell>
                    {formatDate(promo.startsOn)} — {formatDate(promo.endsOn)}
                  </Table.Cell>
                  <Table.Cell>{promo.serviceIds.length === 0 ? "Весь прайс" : `${promo.serviceIds.length} услуг`}</Table.Cell>
                  <Table.Cell>
                    <Chip
                      color={periodLabel(promo) === "Действует" ? "success" : periodLabel(promo) === "Скоро" ? "accent" : "default"}
                      size="sm"
                      variant="soft"
                    >
                      {periodLabel(promo)}
                    </Chip>
                  </Table.Cell>
                  <Table.Cell>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="tertiary"
                        onPress={() => {
                          setError(null);
                          setDraft(toDraft(promo));
                        }}
                      >
                        {readOnly ? "Открыть" : "Изменить"}
                      </Button>
                      {can("delete") ? (
                        <Button size="sm" variant="danger-soft" onPress={() => setPendingDelete(promo)}>
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
        description={sample && draft ? `Пример: «${sample.name}» ${money(sample.price)} → ${money(applyDiscount(sample.price, { ...draft, discountValue: Number(draft.discountValue) || 0 }))}` : undefined}
        error={error}
        open={draft !== null}
        readOnly={readOnly}
        title={draft?.isNew ? "Новая акция" : "Акция"}
        onClose={() => setDraft(null)}
        onSubmit={save}
      >
        <Field disabled={readOnly} label="Название" value={draft?.title ?? ""} onChange={(value) => setDraft((current) => current && { ...current, title: value })} />
        <Field disabled={readOnly} label="Промокод" value={draft?.code ?? ""} onChange={(value) => setDraft((current) => current && { ...current, code: value })} />
        <SelectField
          disabled={readOnly}
          label="Тип скидки"
          options={[
            { id: "percent", label: "Процент" },
            { id: "amount", label: "Сумма, ₽" },
          ]}
          value={draft?.discountType ?? "percent"}
          onChange={(value) => setDraft((current) => current && { ...current, discountType: value as DiscountType })}
        />
        <Field disabled={readOnly} label="Размер скидки" type="number" value={draft?.discountValue ?? ""} onChange={(value) => setDraft((current) => current && { ...current, discountValue: value })} />
        <Field disabled={readOnly} label="Начало" type="date" value={draft?.startsOn ?? ""} onChange={(value) => setDraft((current) => current && { ...current, startsOn: value })} />
        <Field disabled={readOnly} label="Окончание" type="date" value={draft?.endsOn ?? ""} onChange={(value) => setDraft((current) => current && { ...current, endsOn: value })} />
        <div className="sm:col-span-2">
          <ToggleField
            disabled={readOnly}
            label="Акция включена"
            selected={draft?.active ?? true}
            onChange={(value) => setDraft((current) => current && { ...current, active: value })}
          />
        </div>
        <div className="sm:col-span-2">
          <p className="mb-1 text-sm font-medium">Услуги</p>
          <p className="mb-3 text-xs text-muted">Если ничего не выбрано, скидка действует на весь прайс.</p>
          <div className="flex max-h-48 flex-col gap-2 overflow-auto rounded-xl border border-border p-3">
            {db.services.map((service) => (
              <CheckField
                key={service.id}
                disabled={readOnly}
                label={`${service.name} · ${money(service.price)}`}
                selected={draft?.serviceIds.includes(service.id) ?? false}
                onChange={(selected) =>
                  setDraft((current) =>
                    current
                      ? {
                          ...current,
                          serviceIds: selected
                            ? [...current.serviceIds, service.id]
                            : current.serviceIds.filter((id) => id !== service.id),
                        }
                      : current,
                  )
                }
              />
            ))}
          </div>
        </div>
        <div className="sm:col-span-2">
          <AreaField disabled={readOnly} label="Описание" value={draft?.description ?? ""} onChange={(value) => setDraft((current) => current && { ...current, description: value })} />
        </div>
      </FormDialog>

      <ConfirmDialog
        description={pendingDelete ? `Акция «${pendingDelete.title}» исчезнет из прайса.` : ""}
        open={pendingDelete !== null}
        title="Удалить акцию?"
        onClose={() => setPendingDelete(null)}
        onConfirm={() => {
          if (pendingDelete) removePromotion(pendingDelete.id);
          setPendingDelete(null);
        }}
      />
    </div>
  );
}
