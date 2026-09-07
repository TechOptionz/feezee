import { ChatWidget } from "@/components/chat/chat-widget";
import { Footer } from "@/components/layout/footer";
import { Header } from "@/components/layout/header";
import { catalogueForClient } from "@/modules/catalogue/collections";

/**
 * Everything a page that is not the home page shares: a solid header in the
 * flow (there is no hero here for it to float over), the page, and the footer
 * pinned below it so a short page — an empty bag, an empty wishlist — still
 * fills the window instead of leaving the footer stranded mid-screen.
 *
 * The assistant is handed the catalogue from here rather than importing it.
 * It is a client component, so it cannot reach the database itself; passing the
 * garments down as props is what lets it quote a live price instead of one
 * frozen into the bundle at build time.
 */
export async function PageFrame({ children }: { children: React.ReactNode }) {
  const products = await catalogueForClient();

  return (
    <div className="bg-cream min-h-screen flex flex-col">
      <Header />
      <main className="flex-1">{children}</main>
      <Footer />
      <ChatWidget products={products} />
    </div>
  );
}
