import type { Metadata } from "next";
import { Manrope } from "next/font/google";
import { Providers } from "@/components/providers";
import "./globals.css";

const manrope = Manrope({
  subsets: ["latin", "cyrillic"],
  variable: "--font-manrope",
});

export const metadata: Metadata = {
  title: "МЦ-32 — админ-панель",
  description: "Расписание, врачи, прайс, акции и фразы клиники",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html className={`${manrope.variable} light h-full antialiased`} data-theme="light" lang="ru">
      <body className="min-h-full">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
