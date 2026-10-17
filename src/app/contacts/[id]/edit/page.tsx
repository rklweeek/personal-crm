import { notFound } from "next/navigation";
import { Suspense } from "react";

import { updateContact } from "@/app/actions";
import { ContactForm } from "@/components/contact-form";
import { Card, CardContent } from "@/components/ui/card";
import { getContact, parseContactId } from "@/lib/contacts";

export default function EditContactPage({ params }: PageProps<"/contacts/[id]/edit">) {
  return (
    <div className="flex flex-col gap-6 lg:gap-8">
      <h1 className="text-title font-semibold uppercase">Изменить контакт</h1>
      <Card>
        <CardContent>
          <Suspense fallback={<div className="h-80 animate-pulse rounded-inset bg-muted" />}>
            <EditContactForm params={params} />
          </Suspense>
        </CardContent>
      </Card>
    </div>
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
