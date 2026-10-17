import type { Metadata } from "next";
import { JetBrains_Mono, Onest } from "next/font/google";
import Link from "next/link";

import "./globals.css";

const onest = Onest({
  variable: "--font-onest",
  subsets: ["latin", "cyrillic"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin", "cyrillic"],
});

export const metadata: Metadata = {
  title: "Личная CRM",
  description: "Контакты людей, которых я знаю лично",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="ru"
      className={`${onest.variable} ${jetbrainsMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col">
        <header className="mx-auto flex w-full max-w-3xl items-center px-gutter py-5 lg:py-7">
          <Link href="/" className="text-logo font-semibold tracking-caps uppercase hover:opacity-85">
            Личная CRM
          </Link>
        </header>
        <main className="mx-auto w-full max-w-3xl flex-1 px-gutter pt-2 pb-12 lg:pt-4">
          {children}
        </main>
        <footer className="mx-auto w-full max-w-3xl px-gutter pb-10">
          <div className="flex justify-between border-t pt-4 font-mono text-footer tracking-mono text-subtle uppercase lg:pt-5">
            <span>Личная CRM</span>
            <span>2026</span>
          </div>
        </footer>
      </body>
    </html>
  );
}
