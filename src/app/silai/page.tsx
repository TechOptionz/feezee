import type { Metadata } from "next";
import { PageFrame } from "@/components/layout/page-frame";
import { Values } from "@/components/sections/values";
import { SilaiBanner } from "@/components/silai/silai-banner";
import { SilaiFaq } from "@/components/silai/silai-faq";
import { SilaiFinishes } from "@/components/silai/silai-finishes";
import { SilaiGallery } from "@/components/silai/silai-gallery";
import { SilaiMeasurements } from "@/components/silai/silai-measurements";
import { SilaiPricing } from "@/components/silai/silai-pricing";
import { SilaiServices } from "@/components/silai/silai-services";
import { SilaiStart } from "@/components/silai/silai-start";
import { SilaiSteps } from "@/components/silai/silai-steps";
import { SilaiVoices } from "@/components/silai/silai-voices";
import { silaiMeta } from "@/content/silai";

export const metadata: Metadata = {
  title: silaiMeta.title,
  description: silaiMeta.description,
};

/**
 * Silai — the made-to-order service, on a page of its own.
 *
 * It used to be an anchor on the home page, which was enough while it was a
 * single panel but not once it had to answer what it costs, how long it takes
 * and what happens when the sleeve is tight. The five shop routes still carry
 * the compressed version in `MadeToOrderBand`; every one of those buttons now
 * ends up here.
 *
 * The order is a sales conversation, not a brochure: what it is, how it works,
 * what we cut, what we need from you, what you get to choose, what it costs,
 * proof, other people, objections, and only then the ask. The ask is `#start`,
 * which every button above it points at.
 */
export default function SilaiPage() {
  return (
    <PageFrame>
      <SilaiBanner />
      <SilaiSteps />
      <SilaiServices />
      <SilaiMeasurements />
      <SilaiFinishes />
      <SilaiPricing />
      <SilaiGallery />
      <SilaiVoices />
      <SilaiFaq />
      <SilaiStart />
      <Values />
    </PageFrame>
  );
}
