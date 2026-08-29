import { AnnouncementBar } from "@/components/layout/announcement-bar";
import { Header } from "@/components/layout/header";
import { MobileMenu } from "@/components/layout/mobile-menu";
import { Footer } from "@/components/layout/footer";
import { Hero } from "@/components/sections/hero";
import { Categories } from "@/components/sections/categories";
import { NewArrivals } from "@/components/sections/new-arrivals";
import { Silai } from "@/components/sections/silai";
import { Values } from "@/components/sections/values";
import { Lookbook } from "@/components/sections/lookbook";

export default function HomePage() {
  return (
    <div className="bg-cream min-h-screen">
      <AnnouncementBar />
      <Header />
      <MobileMenu />
      <main>
        <Hero />
        <Categories />
        <NewArrivals />
        <Silai />
        <Values />
        <Lookbook />
      </main>
      <Footer />
    </div>
  );
}
