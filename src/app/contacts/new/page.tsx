import type { Metadata } from "next";

import { createContact } from "@/app/actions";
import { ContactForm } from "@/components/contact-form";
import { Card, CardContent } from "@/components/ui/card";

export const metadata: Metadata = {
  title: "Новый контакт — Личная CRM",
};

export default function NewContactPage() {
  return (
    <div className="flex flex-col gap-6 lg:gap-8">
      <h1 className="text-title font-semibold uppercase">Новый контакт</h1>
      <Card>
        <CardContent>
          <ContactForm action={createContact} submitLabel="Добавить контакт" cancelHref="/" />
        </CardContent>
      </Card>
    </div>
  );
}
