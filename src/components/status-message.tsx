/** A short confirmation after an action, e.g. "Контакт добавлен". */
export function StatusMessage({ children }: { children: React.ReactNode }) {
  return (
    <p
      role="status"
      className="flex items-center gap-3 rounded-inset bg-card px-4 py-3 text-sm font-medium shadow-card"
    >
      <span className="size-2.5 shrink-0 rounded-full bg-brand" aria-hidden />
      {children}
    </p>
  );
}
