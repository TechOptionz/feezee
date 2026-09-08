import { ChatWidget } from "@/components/chat/chat-widget";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { Hero } from "@/components/sections/hero";
import { Categories } from "@/components/sections/categories";
import { NewArrivals } from "@/components/sections/new-arrivals";
import { Silai } from "@/components/sections/silai";
import { Values } from "@/components/sections/values";
import { Lookbook } from "@/components/sections/lookbook";
import { TrackOrderBand } from "@/components/sections/track-order-band";
import {
  boutiqueLooks,
  catalogueForClient,
  newArrivalTabs,
} from "@/modules/catalogue/collections";

/**
 * The three sections that quote a price — the drop, the boutique rail and the
 * assistant — are fed from the database here rather than importing the design
 * file, so a price changed in the admin is the price the home page shows.
 * Everything above them is photography and copy, which has no stock to be
 * wrong about.
 */
export const revalidate = 60;

export default async function HomePage() {
  const [groups, looks, catalogue] = await Promise.all([
    newArrivalTabs(),
    boutiqueLooks(),
    catalogueForClient(),
  ]);

  return (
    <div className="bg-cream min-h-screen">
      <Header overHero />
      <main>
        <Hero />
        <Categories />
        <NewArrivals groups={groups} />
        <Silai />
        <Values />
        <Lookbook looks={looks} />
        <TrackOrderBand />
      </main>
      <Footer />
      <ChatWidget products={catalogue} />
    </div>
  );
}
