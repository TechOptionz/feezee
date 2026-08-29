/**
 * Hero slideshow content.
 *
 * The photographs are wide (16:9) with the model centred, so on the tall
 * mobile crop the `focus` value decides how much headroom survives — it is a
 * CSS `object-position`, tuned per shot rather than guessed globally.
 */

export type HeroSlide = {
  /** File in `public/img/hero/`. */
  file: string;
  alt: string;
  /** Collection caption shown alongside the slide. */
  caption: string;
  /**
   * `object-position` for the crop. Held high: on a wide, short window the
   * full-bleed hero crops top and bottom, and the face has to survive it.
   */
  focus: string;
  /**
   * Every slide pushes in; this is the sideways drift that rides along with
   * the zoom, alternated so consecutive slides never travel the same way.
   */
  drift: "left" | "right";
};

export const heroSlides: HeroSlide[] = [
  {
    file: "look-02.jpg",
    alt: "Ivory floral-print long kurta styled against a terracotta wall",
    caption: "Floral Print",
    focus: "50% 18%",
    drift: "left",
  },
  {
    file: "look-09.jpg",
    alt: "Mint embroidered chiffon suit with a scalloped lace dupatta, in a courtyard garden by a white staircase",
    caption: "Chiffon & Lace",
    focus: "54% 12%",
    drift: "right",
  },
  {
    file: "look-03.jpg",
    alt: "Ivory silk kaftan with palm-motif print and teal embroidered borders against a terracotta studio backdrop",
    caption: "Festive Formals",
    focus: "50% 15%",
    drift: "left",
  },
  {
    file: "look-04.jpg",
    alt: "Sea-green pleated anarkali with organza dupatta",
    caption: "Festive Anarkali",
    focus: "50% 16%",
    drift: "right",
  },
  {
    file: "look-07.jpg",
    alt: "Grey-blue kurta with pink and gold floral embroidery, styled with a carved wooden fan in a lamplit haveli archway",
    caption: "Luxury Pret",
    focus: "54% 16%",
    drift: "left",
  },
  {
    file: "look-08.jpg",
    alt: "Teal blue kurta with pink floral embroidery and a matching net dupatta, in a terracotta room with an arched doorway",
    caption: "Embroidered Suits",
    focus: "52% 14%",
    drift: "right",
  },
];

/** How long each slide holds, in milliseconds. */
export const HERO_SLIDE_MS = 3200;
