"use client";

import { Button, Card, Chip } from "@heroui/react";
import {
  AreaField,
  ConfirmDialog,
  Field,
  FormDialog,
  NoAccess,
  PageHeader,
  SelectField,
  ToggleField,
} from "@/components/ui";
import { createId, formatDate, renderPhrase, shortName, todayISO } from "@/lib/format";
import {
  CLINIC_NAME,
  PHRASE_CHANNELS,
  PHRASE_KINDS,
  PHRASE_TOKENS,
  phraseChannelLabel,
  phraseKindLabel,
} from "@/lib/labels";
import { useStore } from "@/lib/store";
import type { Phrase, PhraseChannel, PhraseKind } from "@/lib/types";
import { useState } from "react";

type Draft = Phrase & { isNew: boolean };

function toDraft(phrase?: Phrase): Draft {
  return {
    id: phrase?.id ?? createId(),
    title: phrase?.title ?? "",
    kind: phrase?.kind ?? "birthday",
    channel: phrase?.channel ?? "sms",
    body: phrase?.body ?? "",
    active: phrase?.active ?? true,
    isNew: !phrase,
  };
}

export default function PhrasesPage() {
  const { db, can, savePhrase, removePhrase } = useStore();
  const [kind, setKind] = useState("all");
  const [draft, setDraft] = useState<Draft | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);
  const [pendingDelete, setPendingDelete] = useState<Phrase | null>(null);
  const readOnly = !can("edit");
  const allowed = can("view") || can("edit") || can("delete");

  const doctor = db.doctors.find((item) => item.active);
  const service = db.services.find((item) => item.active);
  const sample = {
    "{имя}": "Анна",
    "{дата}": formatDate(todayISO()),
    "{время}": "10:30",
    "{врач}": doctor ? shortName(doctor.fullName) : "Иванова М. С.",
    "{услуга}": service?.name ?? "Первичный приём",
    "{клиника}": CLINIC_NAME,
    "{скидка}": "15%",
  };

  const phrases = db.phrases.filter((phrase) => kind === "all" || phrase.kind === kind);

  async function copy(phrase: Phrase) {
    const text = renderPhrase(phrase.body, sample);
    await navigator.clipboard.writeText(text);
    setCopied(phrase.id);
    window.setTimeout(() => setCopied((current) => (current === phrase.id ? null : current)), 1600);
  }

  function save() {
    if (!draft) return;
    const message = savePhrase({
      id: draft.id,
      title: draft.title.trim(),
      kind: draft.kind,
      channel: draft.channel,
      body: draft.body.trim(),
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
              Новая фраза
            </Button>
          ) : null
        }
        description="Шаблоны поздравлений, напоминаний и других оповещений. Подстановки заполняются на превью, отправка появится вместе с сервером."
        eyebrow="Сообщения"
        title="Базовые фразы"
      />
      <div className="mb-4 max-w-xs">
        <SelectField
          label="Тип"
          options={[{ id: "all", label: "Все фразы" }, ...PHRASE_KINDS]}
          value={kind}
          onChange={setKind}
        />
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        {phrases.map((phrase) => (
          <Card key={phrase.id}>
            <Card.Header className="flex items-start justify-between gap-3">
              <div>
                <Card.Title>{phrase.title}</Card.Title>
                <Card.Description>
                  {phraseKindLabel(phrase.kind)} · {phraseChannelLabel(phrase.channel)}
                </Card.Description>
              </div>
              <Chip color={phrase.active ? "success" : "default"} size="sm" variant="soft">
                {phrase.active ? "Активна" : "Выключена"}
              </Chip>
            </Card.Header>
            <Card.Content>
              <p className="whitespace-pre-wrap text-sm leading-6">{renderPhrase(phrase.body, sample)}</p>
              <p className="mt-3 text-xs text-muted">Шаблон: {phrase.body}</p>
            </Card.Content>
            <Card.Footer className="flex flex-wrap gap-2">
              <Button size="sm" variant="secondary" onPress={() => void copy(phrase)}>
                {copied === phrase.id ? "Скопировано" : "Скопировать текст"}
              </Button>
              <Button
                size="sm"
                variant="tertiary"
                onPress={() => {
                  setError(null);
                  setDraft(toDraft(phrase));
                }}
              >
                {readOnly ? "Открыть" : "Изменить"}
              </Button>
              {can("delete") ? (
                <Button size="sm" variant="danger-soft" onPress={() => setPendingDelete(phrase)}>
                  Удалить
                </Button>
              ) : null}
            </Card.Footer>
          </Card>
        ))}
      </div>
      {phrases.length === 0 ? <p className="mt-4 text-sm text-muted">Фраз этого типа пока нет.</p> : null}

      <FormDialog
        description="Вставьте подстановку в конец текста. На карточке она заменится примером пациента."
        error={error}
        open={draft !== null}
        readOnly={readOnly}
        title={draft?.isNew ? "Новая фраза" : "Фраза"}
        onClose={() => setDraft(null)}
        onSubmit={save}
      >
        <div className="sm:col-span-2">
          <Field disabled={readOnly} label="Название" value={draft?.title ?? ""} onChange={(value) => setDraft((current) => current && { ...current, title: value })} />
        </div>
        <SelectField
          disabled={readOnly}
          label="Тип"
          options={PHRASE_KINDS}
          value={draft?.kind ?? "birthday"}
          onChange={(value) => setDraft((current) => current && { ...current, kind: value as PhraseKind })}
        />
        <SelectField
          disabled={readOnly}
          label="Канал"
          options={PHRASE_CHANNELS}
          value={draft?.channel ?? "sms"}
          onChange={(value) => setDraft((current) => current && { ...current, channel: value as PhraseChannel })}
        />
        <div className="sm:col-span-2">
          <ToggleField
            disabled={readOnly}
            label="Фраза активна"
            selected={draft?.active ?? true}
            onChange={(value) => setDraft((current) => current && { ...current, active: value })}
          />
        </div>
        <div className="sm:col-span-2 flex flex-wrap gap-2">
          {PHRASE_TOKENS.map((token) => (
            <Button
              key={token}
              isDisabled={readOnly}
              size="sm"
              variant="secondary"
              onPress={() => setDraft((current) => current && { ...current, body: `${current.body}${current.body.endsWith(" ") || current.body.length === 0 ? "" : " "}${token}` })}
            >
              {token}
            </Button>
          ))}
        </div>
        <div className="sm:col-span-2">
          <AreaField disabled={readOnly} label="Текст" rows={5} value={draft?.body ?? ""} onChange={(value) => setDraft((current) => current && { ...current, body: value })} />
        </div>
        <div className="sm:col-span-2 rounded-xl bg-surface-secondary p-3 text-sm leading-6">
          {renderPhrase(draft?.body || "Здесь появится превью.", sample)}
        </div>
      </FormDialog>

      <ConfirmDialog
        description={pendingDelete ? `Фраза «${pendingDelete.title}» будет удалена.` : ""}
        open={pendingDelete !== null}
        title="Удалить фразу?"
        onClose={() => setPendingDelete(null)}
        onConfirm={() => {
          if (pendingDelete) removePhrase(pendingDelete.id);
          setPendingDelete(null);
        }}
      />
    </div>
  );
}
