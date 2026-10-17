"use client";

import Link from "next/link";
import { useActionState } from "react";

import type { ContactFormState } from "@/app/actions";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { ContactField, ContactInput } from "@/lib/validation";

type ContactFormProps = {
  action: (state: ContactFormState, formData: FormData) => Promise<ContactFormState>;
  initialValues?: ContactInput;
  submitLabel: string;
  cancelHref: string;
};

const emptyValues: ContactInput = { name: "", howWeMet: "", phone: "", email: "" };

export function ContactForm({
  action,
  initialValues = emptyValues,
  submitLabel,
  cancelHref,
}: ContactFormProps) {
  const [state, formAction, pending] = useActionState(action, {
    values: initialValues,
    errors: {},
  });

  const fieldProps = (field: ContactField) => ({
    id: field,
    name: field,
    defaultValue: state.values[field],
    "aria-invalid": state.errors[field] ? true : undefined,
    "aria-describedby": state.errors[field] ? `${field}-error` : undefined,
  });

  return (
    <form action={formAction} className="flex flex-col gap-5" noValidate>
      <Field label="Имя" field="name" error={state.errors.name} required>
        <Input {...fieldProps("name")} autoComplete="off" autoFocus placeholder="Иван Петров" />
      </Field>

      <Field label="Откуда знакомы" field="howWeMet" error={state.errors.howWeMet}>
        <Textarea
          {...fieldProps("howWeMet")}
          placeholder="Например: учились вместе в университете"
          rows={2}
        />
      </Field>

      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Телефон" field="phone" error={state.errors.phone}>
          <Input {...fieldProps("phone")} type="tel" placeholder="+7 900 123-45-67" />
        </Field>

        <Field label="Почта" field="email" error={state.errors.email}>
          <Input {...fieldProps("email")} type="email" placeholder="ivan@mail.ru" />
        </Field>
      </div>

      {state.formError && (
        <p role="alert" className="text-sm text-destructive">
          {state.formError}
        </p>
      )}

      <div className="mt-1 flex flex-col gap-2 sm:flex-row">
        <Button type="submit" size="lg" disabled={pending}>
          {pending ? (
            "Сохраняю…"
          ) : (
            <>
              {submitLabel}
              <span className="text-brand" aria-hidden>
                →
              </span>
            </>
          )}
        </Button>
        <Link href={cancelHref} className={buttonVariants({ variant: "ghost", size: "lg" })}>
          Отмена
        </Link>
      </div>
    </form>
  );
}

function Field({
  label,
  field,
  error,
  required,
  children,
}: {
  label: string;
  field: ContactField;
  error?: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-2">
      <Label htmlFor={field}>
        {label}
        {required ? (
          <span className="text-brand" aria-hidden>
            *
          </span>
        ) : (
          <span className="font-normal text-subtle">— необязательно</span>
        )}
      </Label>
      {children}
      {error && (
        <p id={`${field}-error`} className="text-sm text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}
