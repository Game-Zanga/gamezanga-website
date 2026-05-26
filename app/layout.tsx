import type { Metadata } from "next";
import { Cairo, Space_Grotesk, JetBrains_Mono } from "next/font/google";
import { cookies } from "next/headers";
import "./globals.css";
import { LocaleProvider } from "@/components/LocaleProvider";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { JAM_CONFIG } from "@/lib/jam-config";
import { LOCALE_COOKIE, DEFAULT_LOCALE, dir, type Locale } from "@/lib/i18n";

const arabic = Cairo({
  variable: "--font-arabic",
  subsets: ["arabic", "latin"],
  weight: ["400", "600", "700", "900"],
});

const display = Space_Grotesk({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const mono = JetBrains_Mono({
  variable: "--font-mono-display",
  subsets: ["latin"],
  weight: ["400", "700"],
});

export const metadata: Metadata = {
  title: `${JAM_CONFIG.name_ar} ${JAM_CONFIG.edition} — ${JAM_CONFIG.name_en}`,
  description: `${JAM_CONFIG.tagline_ar} — ${JAM_CONFIG.tagline_en}`,
  icons: { icon: "/favicon.ico" },
};

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const cookieStore = await cookies();
  const stored = cookieStore.get(LOCALE_COOKIE)?.value;
  const locale: Locale = stored === "en" || stored === "ar" ? stored : DEFAULT_LOCALE;

  return (
    <html
      lang={locale}
      dir={dir(locale)}
      className={`${arabic.variable} ${display.variable} ${mono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <LocaleProvider initialLocale={locale}>
          <Navbar />
          <main className="flex-1">{children}</main>
          <Footer />
        </LocaleProvider>
      </body>
    </html>
  );
}
