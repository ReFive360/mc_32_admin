"use client";

import { Button, Chip, Table } from "@heroui/react";
import {
  CheckField,
  ConfirmDialog,
  Field,
  FormDialog,
  NoAccess,
  PageHeader,
  ToggleField,
} from "@/components/ui";
import { createId } from "@/lib/format";
import { PERMISSIONS, permissionLabel } from "@/lib/labels";
import { useStore } from "@/lib/store";
import type { Admin, Permission } from "@/lib/types";
import { useState } from "react";

type Draft = Omit<Admin, "password"> & { password: string; isNew: boolean };

function toDraft(account?: Admin): Draft {
  return {
    id: account?.id ?? createId(),
    name: account?.name ?? "",
    email: account?.email ?? "",
    password: "",
    permissions: account?.permissions ?? ["view"],
    active: account?.active ?? true,
    isNew: !account,
  };
}

export default function AdminsPage() {
  const { db, admin, can, saveAdmin, removeAdmin } = useStore();
  const [draft, setDraft] = useState<Draft | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pendingDelete, setPendingDelete] = useState<Admin | null>(null);
  const readOnly = !can("edit");
  const allowed = can("view") || can("edit") || can("delete");

  function togglePermission(permission: Permission, selected: boolean) {
    setDraft((current) => {
      if (!current) return current;
      const permissions = selected
        ? [...new Set([...current.permissions, permission])]
        : current.permissions.filter((item) => item !== permission);
      return { ...current, permissions };
    });
  }

  function save() {
    if (!draft) return;
    const message = saveAdmin(
      {
        id: draft.id,
        name: draft.name.trim(),
        email: draft.email.trim(),
        password: draft.password,
        permissions: draft.permissions,
        active: draft.active,
      },
      draft.isNew,
    );
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
              Новый администратор
            </Button>
          ) : null
        }
        description="Роли можно сочетать. Просмотр открывает разделы, редактирование позволяет создавать и менять записи, удаление — убирать их."
        eyebrow="Доступ"
        title="Администраторы"
      />
      <Table>
        <Table.ScrollContainer>
          <Table.Content aria-label="Администраторы">
            <Table.Header>
              <Table.Column isRowHeader>Сотрудник</Table.Column>
              <Table.Column>Роли</Table.Column>
              <Table.Column>Статус</Table.Column>
              <Table.Column>Действия</Table.Column>
            </Table.Header>
            <Table.Body>
              {db.admins.map((account) => (
                <Table.Row key={account.id} id={account.id}>
                  <Table.Cell>
                    <span className="block font-medium">
                      {account.name}
                      {account.id === admin?.id ? " · это вы" : ""}
                    </span>
                    <span className="block text-xs text-muted">{account.email}</span>
                  </Table.Cell>
                  <Table.Cell>
                    <span className="flex flex-wrap gap-1">
                      {account.permissions.map((permission) => (
                        <Chip key={permission} size="sm" variant="soft">
                          {permissionLabel(permission)}
                        </Chip>
                      ))}
                    </span>
                  </Table.Cell>
                  <Table.Cell>
                    <Chip color={account.active ? "success" : "danger"} size="sm" variant="soft">
                      {account.active ? "Активен" : "Отключён"}
                    </Chip>
                  </Table.Cell>
                  <Table.Cell>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="tertiary"
                        onPress={() => {
                          setError(null);
                          setDraft(toDraft(account));
                        }}
                      >
                        {readOnly ? "Открыть" : "Изменить"}
                      </Button>
                      {can("delete") && account.id !== admin?.id ? (
                        <Button size="sm" variant="danger-soft" onPress={() => setPendingDelete(account)}>
                          Удалить
                        </Button>
                      ) : null}
                    </div>
                  </Table.Cell>
                </Table.Row>
              ))}
            </Table.Body>
          </Table.Content>
        </Table.ScrollContainer>
      </Table>

      <FormDialog
        description="Пароль хранится только в этом браузере. При редактировании оставьте поле пустым, чтобы не менять его."
        error={error}
        open={draft !== null}
        readOnly={readOnly}
        title={draft?.isNew ? "Новый администратор" : "Учётная запись"}
        onClose={() => setDraft(null)}
        onSubmit={save}
      >
        <Field disabled={readOnly} label="Имя" value={draft?.name ?? ""} onChange={(value) => setDraft((current) => current && { ...current, name: value })} />
        <Field disabled={readOnly} label="Email" type="email" value={draft?.email ?? ""} onChange={(value) => setDraft((current) => current && { ...current, email: value })} />
        <div className="sm:col-span-2">
          <Field
            description={draft?.isNew ? "Минимум 4 символа" : "Заполните только если нужно сменить пароль"}
            disabled={readOnly}
            label="Пароль"
            type="password"
            value={draft?.password ?? ""}
            onChange={(value) => setDraft((current) => current && { ...current, password: value })}
          />
        </div>
        <div className="sm:col-span-2 flex flex-col gap-3">
          <p className="text-sm font-medium">Роли</p>
          {PERMISSIONS.map((permission) => (
            <CheckField
              key={permission.id}
              disabled={readOnly}
              label={`${permission.label} — ${permission.hint}`}
              selected={draft?.permissions.includes(permission.id) ?? false}
              onChange={(selected) => togglePermission(permission.id, selected)}
            />
          ))}
        </div>
        <div className="sm:col-span-2">
          <ToggleField
            disabled={readOnly || draft?.id === admin?.id}
            label="Учётная запись активна"
            selected={draft?.active ?? true}
            onChange={(value) => setDraft((current) => current && { ...current, active: value })}
          />
        </div>
      </FormDialog>

      <ConfirmDialog
        description={pendingDelete ? `${pendingDelete.name} больше не сможет войти.` : ""}
        open={pendingDelete !== null}
        title="Удалить администратора?"
        onClose={() => setPendingDelete(null)}
        onConfirm={() => {
          if (!pendingDelete) return;
          const message = removeAdmin(pendingDelete.id);
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
