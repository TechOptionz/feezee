import type { Metadata } from "next";
import localFont from "next/font/local";
import { CartDrawer } from "@/components/cart/cart-drawer";
import { MobileMenu } from "@/components/layout/mobile-menu";
import { StoreProvider } from "@/components/store/store-provider";
import { site } from "@/lib/site";
import "./globals.css";

// Self-hosted (latin subset from Google Fonts) rather than `next/font/google`:
// Google sometimes serves `/l/font?kit=…&skey=…` URLs, which Turbopack's font
// loader can't parse, and it also keeps builds from depending on the network.
const jost = localFont({
  src: "./fonts/jost-latin.woff2",
  variable: "--font-jost",
  weight: "300 600",
  display: "swap",
});

const marcellus = localFont({
  src: "./fonts/marcellus-latin.woff2",
  variable: "--font-marcellus",
  weight: "400",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: { default: site.title, template: `%s | ${site.name}` },
  description: site.description,
  openGraph: {
    title: site.title,
    description: site.description,
    url: site.url,
    siteName: site.name,
    type: "website",
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${jost.variable} ${marcellus.variable}`}>
      <body>
        {/*
          The drawer and the menu cover the page from every route, so they are
          mounted here rather than in each one. Both render nothing until they
          are opened, and both read the same store as the header that opens them.
        */}
        <StoreProvider>
          {children}
          <MobileMenu />
          <CartDrawer />
        </StoreProvider>
      </body>
    </html>
  );
}
