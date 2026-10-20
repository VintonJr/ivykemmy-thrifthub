import type { Metadata, Viewport } from "next";
import Link from "next/link";
import { Geist, Geist_Mono } from "next/font/google";
import { CartCount, CartProvider } from "@/components/cart";
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
  themeColor: "#c2346e",
};

const WHATSAPP = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER;

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col">
        <CartProvider>
          <header className="sticky top-0 z-10 border-b border-blush bg-background/95 backdrop-blur">
            <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
              <Link href="/" className="text-lg font-bold tracking-tight text-brand">
                IvyKemmy <span className="font-normal text-foreground">ThriftHub</span>
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
            <p className="font-semibold text-foreground">IvyKemmy ThriftHub</p>
            <p>Pre-loved fashion, delivered across Kenya. Pay with M-Pesa or card.</p>
            {WHATSAPP && (
              <a href={`https://wa.me/${WHATSAPP}`} className="mt-2 inline-block font-medium text-brand hover:underline">
                Chat with us on WhatsApp
              </a>
            )}
          </footer>
        </CartProvider>
      </body>
    </html>
  );
}
