import { notFound } from "next/navigation";
import { Suspense } from "react";

import { updateContact } from "@/app/actions";
import { ContactForm } from "@/components/contact-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getContact, parseContactId } from "@/lib/contacts";

export default function EditContactPage({ params }: PageProps<"/contacts/[id]/edit">) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl">Изменить контакт</CardTitle>
      </CardHeader>
      <CardContent>
        <Suspense fallback={<div className="h-72 animate-pulse rounded-lg bg-muted" />}>
          <EditContactForm params={params} />
        </Suspense>
      </CardContent>
    </Card>
  );
}

async function EditContactForm({ params }: Pick<PageProps<"/contacts/[id]/edit">, "params">) {
  const id = parseContactId((await params).id);
  if (id === null) notFound();

  const contact = await getContact(id);
  if (!contact) notFound();

  return (
    <ContactForm
      action={updateContact.bind(null, contact.id)}
      initialValues={{
        name: contact.name,
        howWeMet: contact.howWeMet,
        phone: contact.phone,
        email: contact.email,
      }}
      submitLabel="Сохранить"
      cancelHref={`/contacts/${contact.id}`}
    />
  );
}
