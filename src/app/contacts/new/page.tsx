import type { Metadata } from "next";

import { createContact } from "@/app/actions";
import { ContactForm } from "@/components/contact-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata: Metadata = {
  title: "Новый контакт — Личная CRM",
};

export default function NewContactPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl">Новый контакт</CardTitle>
      </CardHeader>
      <CardContent>
        <ContactForm action={createContact} submitLabel="Добавить контакт" cancelHref="/" />
      </CardContent>
    </Card>
  );
}
