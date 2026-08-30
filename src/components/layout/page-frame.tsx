import { ChatWidget } from "@/components/chat/chat-widget";
import { Footer } from "@/components/layout/footer";
import { Header } from "@/components/layout/header";

/**
 * Everything a page that is not the home page shares: a solid header in the
 * flow (there is no hero here for it to float over), the page, and the footer
 * pinned below it so a short page — an empty bag, an empty wishlist — still
 * fills the window instead of leaving the footer stranded mid-screen.
 */
export function PageFrame({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-cream min-h-screen flex flex-col">
      <Header />
      <main className="flex-1">{children}</main>
      <Footer />
      <ChatWidget />
    </div>
  );
}
