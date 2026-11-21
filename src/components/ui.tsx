"use client";

import {
  Button,
  Checkbox,
  Description,
  Input,
  Label,
  ListBox,
  Modal,
  Select,
  Switch,
  TextArea,
  TextField,
} from "@heroui/react";
import type { Key } from "@react-types/shared";
import type { ReactNode } from "react";

export function PageHeader({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        {eyebrow ? (
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-accent">{eyebrow}</p>
        ) : null}
        <h1 className="mt-1 text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">{title}</h1>
        {description ? <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">{description}</p> : null}
      </div>
      {action}
    </div>
  );
}

export function NoAccess() {
  return (
    <div className="rounded-2xl border border-border bg-surface px-6 py-10 text-center">
      <h2 className="text-lg font-semibold">Нет доступа к разделу</h2>
      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-muted">
        У этой учётной записи нет ни одной роли. Попросите администратора включить просмотр, редактирование или удаление.
      </p>
    </div>
  );
}

export function Field({
  label,
  value,
  onChange,
  type = "text",
  placeholder,
  description,
  required,
  disabled,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  placeholder?: string;
  description?: string;
  required?: boolean;
  disabled?: boolean;
}) {
  return (
    <TextField
      className="w-full"
      fullWidth
      isDisabled={disabled}
      isRequired={required}
      type={type}
      value={value}
      onChange={onChange}
    >
      <Label>{label}</Label>
      <Input placeholder={placeholder} />
      {description ? <Description>{description}</Description> : null}
    </TextField>
  );
}

export function AreaField({
  label,
  value,
  onChange,
  placeholder,
  description,
  rows = 4,
  disabled,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  description?: string;
  rows?: number;
  disabled?: boolean;
}) {
  return (
    <TextField className="w-full" fullWidth isDisabled={disabled} value={value} onChange={onChange}>
      <Label>{label}</Label>
      <TextArea placeholder={placeholder} rows={rows} />
      {description ? <Description>{description}</Description> : null}
    </TextField>
  );
}

export function SelectField({
  label,
  value,
  onChange,
  options,
  placeholder = "Выберите",
  disabled,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: { id: string; label: string }[];
  placeholder?: string;
  disabled?: boolean;
}) {
  return (
    <Select
      className="w-full"
      fullWidth
      isDisabled={disabled}
      placeholder={placeholder}
      value={value || null}
      onChange={(next: Key | Key[] | null) => {
        if (Array.isArray(next) || next == null) {
          onChange("");
          return;
        }
        onChange(String(next));
      }}
    >
      <Label>{label}</Label>
      <Select.Trigger>
        <Select.Value />
        <Select.Indicator />
      </Select.Trigger>
      <Select.Popover>
        <ListBox>
          {options.map((option) => (
            <ListBox.Item key={option.id} id={option.id} textValue={option.label}>
              {option.label}
              <ListBox.ItemIndicator />
            </ListBox.Item>
          ))}
        </ListBox>
      </Select.Popover>
    </Select>
  );
}

export function ToggleField({
  label,
  description,
  selected,
  onChange,
  disabled,
}: {
  label: string;
  description?: string;
  selected: boolean;
  onChange: (value: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <Switch isDisabled={disabled} isSelected={selected} onChange={onChange}>
      <Switch.Control>
        <Switch.Thumb />
      </Switch.Control>
      <Switch.Content>
        <Label>{label}</Label>
        {description ? <Description>{description}</Description> : null}
      </Switch.Content>
    </Switch>
  );
}

export function CheckField({
  label,
  selected,
  onChange,
  disabled,
}: {
  label: string;
  selected: boolean;
  onChange: (value: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <Checkbox isDisabled={disabled} isSelected={selected} variant="secondary" onChange={onChange}>
      <Checkbox.Content>
        <Checkbox.Control>
          <Checkbox.Indicator />
        </Checkbox.Control>
        {label}
      </Checkbox.Content>
    </Checkbox>
  );
}

export function FormDialog({
  open,
  title,
  description,
  onClose,
  onSubmit,
  children,
  submitLabel = "Сохранить",
  error,
  readOnly,
}: {
  open: boolean;
  title: string;
  description?: string;
  onClose: () => void;
  onSubmit?: () => void;
  children: ReactNode;
  submitLabel?: string;
  error?: string | null;
  readOnly?: boolean;
}) {
  return (
    <Modal>
      <Modal.Backdrop isOpen={open} onOpenChange={(next) => !next && onClose()}>
        <Modal.Container scroll="inside" size="lg">
          <Modal.Dialog>
            <Modal.CloseTrigger />
            <Modal.Header>
              <Modal.Heading>{title}</Modal.Heading>
            </Modal.Header>
            <Modal.Body>
              {description ? <p className="mb-4 text-sm leading-6 text-muted">{description}</p> : null}
              <div className="grid gap-4 sm:grid-cols-2">{children}</div>
              {error ? <p className="mt-4 text-sm text-danger">{error}</p> : null}
            </Modal.Body>
            <Modal.Footer>
              <Button variant="tertiary" onPress={onClose}>
                {readOnly ? "Закрыть" : "Отмена"}
              </Button>
              {!readOnly && onSubmit ? (
                <Button variant="primary" onPress={onSubmit}>
                  {submitLabel}
                </Button>
              ) : null}
            </Modal.Footer>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </Modal>
  );
}

export function ConfirmDialog({
  open,
  title,
  description,
  onClose,
  onConfirm,
  confirmLabel = "Удалить",
}: {
  open: boolean;
  title: string;
  description: string;
  onClose: () => void;
  onConfirm: () => void;
  confirmLabel?: string;
}) {
  return (
    <Modal>
      <Modal.Backdrop isOpen={open} onOpenChange={(next) => !next && onClose()}>
        <Modal.Container size="sm">
          <Modal.Dialog>
            <Modal.Header>
              <Modal.Heading>{title}</Modal.Heading>
            </Modal.Header>
            <Modal.Body>
              <p className="text-sm leading-6 text-muted">{description}</p>
            </Modal.Body>
            <Modal.Footer>
              <Button variant="tertiary" onPress={onClose}>
                Отмена
              </Button>
              <Button variant="danger" onPress={onConfirm}>
                {confirmLabel}
              </Button>
            </Modal.Footer>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </Modal>
  );
}

export function SearchBox({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
}) {
  return (
    <TextField aria-label={placeholder} className="w-full sm:max-w-xs" value={value} onChange={onChange}>
      <Input placeholder={placeholder} />
    </TextField>
  );
}
