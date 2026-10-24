"use client";

import { Trash2Icon } from "lucide-react";
import { useTransition } from "react";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { pluralize } from "@/lib/format";

type DeleteContactButtonProps = {
  name: string;
  noteCount: number;
  action: () => Promise<void>;
};

export function DeleteContactButton({ name, noteCount, action }: DeleteContactButtonProps) {
  const [pending, startTransition] = useTransition();

  return (
    <AlertDialog>
      <AlertDialogTrigger render={<Button variant="destructive" />}>
        <Trash2Icon />
        Удалить
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Удалить контакт?</AlertDialogTitle>
          <AlertDialogDescription>
            Контакт <span className="font-medium text-foreground">{name}</span>
            {noteCount > 0
              ? ` и ${noteCount} ${pluralize(noteCount, ["заметка", "заметки", "заметок"])} удалятся`
              : " удалится"}{" "}
            навсегда — вернуть будет нельзя.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel variant="ghost" disabled={pending}>
            Отмена
          </AlertDialogCancel>
          <AlertDialogAction
            variant="destructive"
            disabled={pending}
            onClick={() => startTransition(() => action())}
          >
            {pending ? (
              "Удаляю…"
            ) : (
              <>
                <Trash2Icon />
                Удалить
              </>
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
