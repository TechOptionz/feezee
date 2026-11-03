import type { Metadata } from "next";
import { Jost, Marcellus } from "next/font/google";
import { CartDrawer } from "@/components/cart/cart-drawer";
import { MobileMenu } from "@/components/layout/mobile-menu";
import { StoreProvider } from "@/components/store/store-provider";
import { site } from "@/lib/site";
import "./globals.css";

const jost = Jost({
  variable: "--font-jost",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
  display: "swap",
});

const marcellus = Marcellus({
  variable: "--font-marcellus",
  subsets: ["latin"],
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
