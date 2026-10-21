import type { Metadata, Viewport } from "next";
import Image from "next/image";
import Link from "next/link";
import { Geist, Geist_Mono } from "next/font/google";
import { CartCount, CartProvider } from "@/components/cart";
import { SHOP_PHONE_DISPLAY, SHOP_PHONE_TEL, WHATSAPP_NUMBER } from "@/lib/contact";
import { CATEGORIES } from "@/lib/types";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: { default: "IvyKemmy ThriftHub", template: "%s | IvyKemmy ThriftHub" },
  description: "Quality thrifted clothes, shoes and bags in Kenya. One-of-a-kind pieces, paid with M-Pesa, delivered to your door.",
  manifest: "/manifest.webmanifest",
};

export const viewport: Viewport = {
  themeColor: "#6b1f6e",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col">
        <CartProvider>
          <header className="sticky top-0 z-10 border-b border-blush bg-background/95 backdrop-blur">
            <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
              <Link href="/" className="flex items-center gap-2 text-lg font-bold tracking-tight text-brand">
                <Image src="/logo-128.png" alt="" width={44} height={44} priority />
                <span>
                  IvyKemmy <span className="font-normal text-foreground">ThriftHub</span>
                </span>
              </Link>
              <nav className="flex items-center gap-5 text-sm font-medium">
                <Link href="/shop" className="hover:text-brand">
                  Shop
                </Link>
                <Link href="/cart" className="flex items-center hover:text-brand">
                  Bag
                  <CartCount />
                </Link>
              </nav>
            </div>
            <div className="mx-auto flex max-w-6xl gap-4 overflow-x-auto px-4 pb-2 text-sm text-muted">
              {CATEGORIES.map((c) => (
                <Link key={c.id} href={`/shop?category=${c.id}`} className="whitespace-nowrap hover:text-brand">
                  {c.label}
                </Link>
              ))}
            </div>
          </header>
          <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6">{children}</main>
          <footer className="border-t border-blush py-8 text-center text-sm text-muted">
            <Image src="/logo-128.png" alt="IvyKemmy ThriftHub logo" width={64} height={64} className="mx-auto mb-2" />
            <p className="font-semibold text-foreground">IvyKemmy ThriftHub</p>
            <p className="italic text-accent">Quality Finds, Great Vibes</p>
            <p className="mt-1">Pre-loved fashion, delivered across Kenya. Pay with M-Pesa or card.</p>
            <p className="mt-2 flex justify-center gap-4 font-medium">
              <a href={`tel:${SHOP_PHONE_TEL}`} className="text-brand hover:underline">
                Call {SHOP_PHONE_DISPLAY}
              </a>
              <a href={`https://wa.me/${WHATSAPP_NUMBER}`} className="text-brand hover:underline">
                WhatsApp us
              </a>
            </p>
          </footer>
        </CartProvider>
      </body>
    </html>
  );
}
