// ───────────── Fixtures de démonstration HolzDirekt ─────────────
// AVERTISSEMENT : ces données sont fictives et utilisées uniquement
// pour le développement de l'interface. Elles ne correspondent pas
// à des produits, marques ou certifications réelles.
// ───────────────────────────────────────────────────────────────

export type ProductType = "wood" | "pellet" | "briquette" | "stove" | "accessory";

export interface Product {
  id: string;
  type: ProductType;
  name: string;
  slug: string;
  category: string;
  brand?: string;
  description: string;
  priceCents: number;
  basePriceCents?: number;
  basePriceUnit?: string;
  image: string;
  images: string[];
  stock: "in_stock" | "low_stock" | "out_of_stock" | "preorder";
  deliveryTime: string;
  badges: Array<{
    label: string;
    variant: "success" | "info" | "warning" | "accent" | "brand";
  }>;
  rating: number;
  reviewCount: number;
  featured?: boolean;
}

export interface WoodProduct extends Product {
  type: "wood";
  woodType: string;
  length: string;
  moisture: string;
  unit: string;
  quantity: string;
  origin: string;
  packaging: string;
}

export interface StoveProduct extends Product {
  type: "stove";
  powerKw: number;
  efficiency: number;
  energyClass: string;
  fuel: string;
  flueDiameter: number;
  connection: string;
  weight: number;
  dimensions: string;
  colors: string[];
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string;
  image: string;
  productCount: number;
}

// ───────────── Categories ─────────────

export const categories: Category[] = [
  {
    id: "cat-1",
    name: "Brennholz",
    slug: "brennholz",
    description: "Hochwertiges Kaminholz in verschiedenen Längen und Holzarten",
    image: "/images/categories/brennholz.jpg",
    productCount: 12,
  },
  {
    id: "cat-2",
    name: "Kaminöfen",
    slug: "kaminoefen",
    description: "Moderne Kaminöfen mit hohem Wirkungsgrad",
    image: "/images/categories/kaminoefen.jpg",
    productCount: 10,
  },
  {
    id: "cat-3",
    name: "Anzündholz",
    slug: "anzuendholz",
    description: "Praktisches Anzündholz für eine saubere Verbrennung",
    image: "/images/categories/anzuendholz.jpg",
    productCount: 4,
  },
  {
    id: "cat-4",
    name: "Holzbriketts",
    slug: "holzbriketts",
    description: "Gepresste Holzbriketts mit hohem Heizwert",
    image: "/images/categories/briketts.jpg",
    productCount: 6,
  },
  {
    id: "cat-5",
    name: "Ofenzubehör",
    slug: "ofenzubehoer",
    description: "Zubehör für Ihren Kaminofen",
    image: "/images/categories/zubehoer.jpg",
    productCount: 8,
  },
];

// ───────────── Wood Products ─────────────

export const woodProducts: WoodProduct[] = [
  {
    id: "wood-1",
    type: "wood",
    name: "Buchenholz, 25 cm",
    slug: "buchenholz-25-cm",
    category: "brennholz",
    description:
      "Hochwertiges Buchenholz aus nachhaltiger Forstwirtschaft. Das Holz ist kammergetrocknet und sofort verwendbar.",
    woodType: "Buche",
    length: "ca. 25 cm",
    moisture: "Unter 20 %",
    unit: "Schüttraummeter (Srm)",
    quantity: "1,8 Srm",
    origin: "Deutschland",
    packaging: "Palette",
    priceCents: 6649,
    basePriceCents: 36,
    basePriceUnit: "Srm",
    image: "/images/products/buche-25.jpg",
    images: ["/images/products/buche-25.jpg"],
    stock: "in_stock",
    deliveryTime: "3–5 Werktage",
    badges: [
      { label: "Kammergetrocknet", variant: "success" },
      { label: "Ofenfertig", variant: "info" },
    ],
    rating: 4.7,
    reviewCount: 89,
    featured: true,
  },
  {
    id: "wood-2",
    type: "wood",
    name: "Eichenholz, 33 cm",
    slug: "eichenholz-33-cm",
    category: "brennholz",
    description:
      "Langsam brennendes Eichenholz mit hohem Heizwert. Ideal für den Kaminofen.",
    woodType: "Eiche",
    length: "ca. 33 cm",
    moisture: "Unter 18 %",
    unit: "Raummeter (Rm)",
    quantity: "1,7 Rm",
    origin: "Deutschland",
    packaging: "Palette",
    priceCents: 9099,
    basePriceCents: 53,
    basePriceUnit: "Rm",
    image: "/images/products/eiche-33.jpg",
    images: ["/images/products/eiche-33.jpg"],
    stock: "in_stock",
    deliveryTime: "3–5 Werktage",
    badges: [
      { label: "Bestseller", variant: "accent" },
      { label: "Kammergetrocknet", variant: "success" },
    ],
    rating: 4.8,
    reviewCount: 124,
    featured: true,
  },
  {
    id: "wood-3",
    type: "wood",
    name: "Birkenholz im Karton, 20 kg",
    slug: "birkenholz-karton-20-kg",
    category: "brennholz",
    description:
      "Birkenholz in praktischer Kartonverpackung. Ideal für den gelegentlichen Gebrauch.",
    woodType: "Birke",
    length: "ca. 25 cm",
    moisture: "Unter 20 %",
    unit: "kg",
    quantity: "20 kg",
    origin: "Deutschland",
    packaging: "Karton",
    priceCents: 1609,
    basePriceCents: 8,
    basePriceUnit: "kg",
    image: "/images/products/birke-karton.jpg",
    images: ["/images/products/birke-karton.jpg"],
    stock: "in_stock",
    deliveryTime: "2–3 Werktage",
    badges: [{ label: "Praktisch", variant: "info" }],
    rating: 4.5,
    reviewCount: 45,
  },
  {
    id: "wood-4",
    type: "wood",
    name: "Mischholz günstig, 2 Srm",
    slug: "mischholz-2-srm",
    category: "brennholz",
    description:
      "Preiswertes Mischholz aus Fichte, Kiefer und Lärche. Ideal für die Übergangszeit.",
    woodType: "Fichte/Kiefer/Lärche",
    length: "ca. 25–33 cm",
    moisture: "Unter 22 %",
    unit: "Schüttraummeter (Srm)",
    quantity: "2 Srm",
    origin: "Deutschland",
    packaging: "Palette",
    priceCents: 5599,
    basePriceCents: 28,
    basePriceUnit: "Srm",
    image: "/images/products/mischholz.jpg",
    images: ["/images/products/mischholz.jpg"],
    stock: "in_stock",
    deliveryTime: "5–7 Werktage",
    badges: [{ label: "Preiswert", variant: "warning" }],
    rating: 4.2,
    reviewCount: 67,
    featured: true,
  },
  {
    id: "wood-5",
    type: "wood",
    name: "Buchenholz Premium, 25 cm",
    slug: "buchenholz-premium-25-cm",
    category: "brennholz",
    description:
      "Premium Buchenholz aus dem Bayerischen Wald. Besonders lange Brenndauer.",
    woodType: "Buche",
    length: "ca. 25 cm",
    moisture: "Unter 16 %",
    unit: "Raummeter (Rm)",
    quantity: "1,5 Rm",
    origin: "Bayern, Deutschland",
    packaging: "Palette",
    priceCents: 10499,
    basePriceCents: 70,
    basePriceUnit: "Rm",
    image: "/images/products/buche-premium.jpg",
    images: ["/images/products/buche-premium.jpg"],
    stock: "in_stock",
    deliveryTime: "3–5 Werktage",
    badges: [
      { label: "Premium", variant: "brand" },
      { label: "Extra trocken", variant: "success" },
    ],
    rating: 4.9,
    reviewCount: 203,
    featured: true,
  },
];

// ───────────── Stove Products ─────────────

export const stoveProducts: StoveProduct[] = [
  {
    id: "stove-1",
    type: "stove",
    name: "Nordfeuer Nordlicht 7",
    slug: "nordfeuer-nordlicht-7",
    category: "kaminoefen",
    brand: "Nordfeuer",
    description:
      "Moderner Kaminofen mit hochwertiger Speckstein-Verkleidung undeffizienter Verbrennungstechnologie.",
    powerKw: 7.0,
    efficiency: 81,
    energyClass: "A+",
    fuel: "Scheitholz",
    flueDiameter: 150,
    connection: "Oben / Hinten",
    weight: 118,
    dimensions: "54 × 48 × 102 cm (B×T×H)",
    colors: ["Speckstein Natur", "Speckstein Anthrazit"],
    priceCents: 149999,
    image: "/images/stoves/nordlicht-7.jpg",
    images: ["/images/stoves/nordlicht-7.jpg"],
    stock: "in_stock",
    deliveryTime: "5–10 Werktage",
    badges: [
      { label: "Ecodesign 2022", variant: "success" },
      { label: "1. BImSchV Stufe 2", variant: "info" },
      { label: "A+", variant: "brand" },
    ],
    rating: 4.6,
    reviewCount: 34,
    featured: true,
  },
  {
    id: "stove-2",
    type: "stove",
    name: "Bergen Wärme Bergen 5",
    slug: "bergen-waerme-bergen-5",
    category: "kaminoefen",
    brand: "Bergen Wärme",
    description:
      "Kompakter Kaminofen mit klassischem Design und optimierter Verbrennung.",
    powerKw: 5.0,
    efficiency: 79,
    energyClass: "A",
    fuel: "Scheitholz",
    flueDiameter: 120,
    connection: "Oben",
    weight: 85,
    dimensions: "49 × 42 × 88 cm (B×T×H)",
    colors: ["Schwarz Matt", "Weiß"],
    priceCents: 113999,
    image: "/images/stoves/bergen-5.jpg",
    images: ["/images/stoves/bergen-5.jpg"],
    stock: "in_stock",
    deliveryTime: "5–10 Werktage",
    badges: [{ label: "Ecodesign 2022", variant: "success" }],
    rating: 4.4,
    reviewCount: 28,
    featured: true,
  },
  {
    id: "stove-3",
    type: "stove",
    name: "Elbstein Elbstein 8",
    slug: "elbstein-elbstein-8",
    category: "kaminoefen",
    brand: "Elbstein",
    description:
      "Großzügiger Kaminofen mit Speckstein-Verkleidung für langanhaltende Wärmeabgabe.",
    powerKw: 8.0,
    efficiency: 83,
    energyClass: "A+",
    fuel: "Scheitholz / Holzbriketts",
    flueDiameter: 150,
    connection: "Oben / Hinten",
    weight: 142,
    dimensions: "58 × 52 × 108 cm (B×T×H)",
    colors: ["Speckstein Hell", "Speckstein Grau"],
    priceCents: 179999,
    image: "/images/stoves/elbstein-8.jpg",
    images: ["/images/stoves/elbstein-8.jpg"],
    stock: "low_stock",
    deliveryTime: "7–14 Werktage",
    badges: [
      { label: "Ecodesign 2022", variant: "success" },
      { label: "A+", variant: "brand" },
      { label: "Nur noch 2", variant: "warning" },
    ],
    rating: 4.8,
    reviewCount: 19,
  },
  {
    id: "stove-4",
    type: "stove",
    name: "Waldkraft Waldruh 6",
    slug: "waldkraft-waldruh-6",
    category: "kaminoefen",
    brand: "Waldkraft",
    description:
      "Runder Kaminofen mit Panorama-Glasscheibe für einen freien Blick auf das Feuer.",
    powerKw: 6.0,
    efficiency: 80,
    energyClass: "A",
    fuel: "Scheitholz",
    flueDiameter: 150,
    connection: "Oben",
    weight: 95,
    dimensions: "48 × 48 × 90 cm (B×T×H)",
    colors: ["Schwarz Matt"],
    priceCents: 131999,
    image: "/images/stoves/waldruh-6.jpg",
    images: ["/images/stoves/waldruh-6.jpg"],
    stock: "in_stock",
    deliveryTime: "5–10 Werktage",
    badges: [{ label: "Ecodesign 2022", variant: "success" }],
    rating: 4.5,
    reviewCount: 41,
    featured: true,
  },
];

// ───────────── Accessories ─────────────

export const accessoryProducts: Product[] = [
  {
    id: "acc-1",
    type: "accessory",
    name: "Funkenschutzplatte Klarglas",
    slug: "funkenschutzplatte-klarglas",
    category: "zubehoer",
    description:
      "Elegante Funkenschutzplatte aus gehärtetem Klarglas mit rutschfester Unterseite.",
    priceCents: 4799,
    image: "/images/accessories/funkenschutz.jpg",
    images: ["/images/accessories/funkenschutz.jpg"],
    stock: "in_stock",
    deliveryTime: "2–3 Werktage",
    badges: [],
    rating: 4.3,
    reviewCount: 56,
    featured: true,
  },
  {
    id: "acc-2",
    type: "accessory",
    name: "Ofenrohr-Set Schwarz, Ø 150 mm",
    slug: "ofenrohr-set-schwarz-150mm",
    category: "zubehoer",
    description: "Komplettes Ofenrohr-Set mit Bogen und Wandfutter in Schwarz.",
    priceCents: 7799,
    image: "/images/accessories/ofenrohr-set.jpg",
    images: ["/images/accessories/ofenrohr-set.jpg"],
    stock: "in_stock",
    deliveryTime: "3–5 Werktage",
    badges: [],
    rating: 4.4,
    reviewCount: 38,
  },
  {
    id: "acc-3",
    type: "accessory",
    name: "Kaminbesteck-Set Premium",
    slug: "kaminbesteck-set-premium",
    category: "zubehoer",
    description: "Vierteliges Kaminbesteck aus geschmiedetem Stahl mit Ständer.",
    priceCents: 3599,
    image: "/images/accessories/kaminbesteck.jpg",
    images: ["/images/accessories/kaminbesteck.jpg"],
    stock: "in_stock",
    deliveryTime: "2–3 Werktage",
    badges: [{ label: "Premium", variant: "brand" }],
    rating: 4.6,
    reviewCount: 72,
  },
  {
    id: "acc-4",
    type: "accessory",
    name: "Anzündholz Natur, 10 kg",
    slug: "anzuendholz-natur-10-kg",
    category: "zubehoer",
    description: "Kiefernanmachholz aus Deutschland. Ideal zum Anzünden von Kaminöfen.",
    priceCents: 899,
    basePriceCents: 9,
    basePriceUnit: "kg",
    image: "/images/accessories/anzuendholz.jpg",
    images: ["/images/accessories/anzuendholz.jpg"],
    stock: "in_stock",
    deliveryTime: "2–3 Werktage",
    badges: [],
    rating: 4.1,
    reviewCount: 94,
    featured: true,
  },
];

// ───────────── Reviews ─────────────

export interface Review {
  id: string;
  name: string;
  city: string;
  rating: number;
  productName: string;
  text: string;
  date: string;
}

export const reviews: Review[] = [
  {
    id: "rev-1",
    name: "Thomas",
    city: "München",
    rating: 5,
    productName: "Buchenholz, 25 cm",
    text: "Sehr gutes Holz, perfekt getrocknet. Brennt gleichmäßig und lange.",
    date: "2026-06-15",
  },
  {
    id: "rev-2",
    name: "Sabine",
    city: "Hamburg",
    rating: 4,
    productName: "Nordfeuer Nordlicht 7",
    text: "Schöner Ofen, tolle Optik. Lieferung war unkompliziert.",
    date: "2026-06-10",
  },
  {
    id: "rev-3",
    name: "Martin",
    city: "Berlin",
    rating: 5,
    productName: "Eichenholz, 33 cm",
    text: "Beste Qualität! Das Holz ist schön trocken und gibt viel Wärme ab.",
    date: "2026-05-28",
  },
  {
    id: "rev-4",
    name: "Julia",
    city: "Köln",
    rating: 4,
    productName: "Mischholz günstig, 2 Srm",
    text: "Gutes Preis-Leistungs-Verhältnis. Für den Übergang perfekt.",
    date: "2026-05-20",
  },
  {
    id: "rev-5",
    name: "Andreas",
    city: "Stuttgart",
    rating: 5,
    productName: "Bergen Wärme Bergen 5",
    text: "Toller Ofen für unsere Wohnung. Heizt schnell auf und ist schön klein.",
    date: "2026-05-15",
  },
  {
    id: "rev-6",
    name: "Petra",
    city: "Frankfurt",
    rating: 5,
    productName: "Buchenholz Premium, 25 cm",
    text: "Das Premium-Holz ist jeden Cent wert. Kaum Asche und tolle Flamme.",
    date: "2026-05-08",
  },
];

// ───────────── Guide Articles ─────────────

export interface Article {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  category: string;
  image: string;
  author: string;
  date: string;
}

export const articles: Article[] = [
  {
    id: "art-1",
    title: "Raummeter und Schüttraummeter einfach erklärt",
    slug: "raummeter-schuettraummeter-erklaert",
    excerpt:
      "Was ist der Unterschied zwischen Raummeter und Schüttraummeter? Wir erklären es verständlich mit Beispielen.",
    category: "Brennholz",
    image: "/images/articles/raummeter.jpg",
    author: "HolzDirekt Team",
    date: "2026-06-20",
  },
  {
    id: "art-2",
    title: "Welche Holzart brennt am besten?",
    slug: "welche-holzart-brennt-am-besten",
    excerpt:
      "Buche, Eiche oder Birke? Ein Vergleich der wichtigsten Brennholz-Arten für Ihren Kamin.",
    category: "Brennholz",
    image: "/images/articles/holzart.jpg",
    author: "HolzDirekt Team",
    date: "2026-06-12",
  },
  {
    id: "art-3",
    title: "So finden Sie den passenden Kaminofen für Ihr Zuhause",
    slug: "passenden-kaminofen-finden",
    excerpt:
      "Leistung, Größe, Design – worauf Sie bei der Auswahl eines Kaminofens achten sollten.",
    category: "Kaminöfen",
    image: "/images/articles/kaminofen-auswahl.jpg",
    author: "HolzDirekt Team",
    date: "2026-06-05",
  },
  {
    id: "art-4",
    title: "Richtige Lagerung von Brennholz",
    slug: "richtige-lagerung-von-brennholz",
    excerpt:
      "So lagern Sie Ihr Brennholz richtig, damit es trocken bleibt und optimal brennt.",
    category: "Lagerung",
    image: "/images/articles/lagerung.jpg",
    author: "HolzDirekt Team",
    date: "2026-05-28",
  },
  {
    id: "art-5",
    title: "Energieeffizienz bei Kaminöfen: Was bedeuten die Klassen?",
    slug: "energieeffizienz-kaminoefen",
    excerpt:
      "Energieeffizienzklasse A+ oder A? Wir erklären die Unterschiede und was sie bedeuten.",
    category: "Energie",
    image: "/images/articles/energieeffizienz.jpg",
    author: "HolzDirekt Team",
    date: "2026-05-20",
  },
];

// ───────────── Helpers ─────────────

export function getAllProducts(): Product[] {
  return [...woodProducts, ...stoveProducts, ...accessoryProducts];
}

export function getProductBySlug(slug: string): Product | undefined {
  return getAllProducts().find((p) => p.slug === slug);
}

export function getFeaturedProducts(): Product[] {
  return getAllProducts().filter((p) => p.featured);
}

export function getProductsByCategory(category: string): Product[] {
  return getAllProducts().filter((p) => p.category === category);
}

export function formatDeliveryArea(
  postcode: string,
): {
  available: boolean;
  priceCents: number;
  minAmount: string;
  deliveryTime: string;
  message: string;
} | null {
  if (!/^\d{5}$/.test(postcode)) return null;
  const firstDigit = Number(postcode[0]);
  if (firstDigit >= 1 && firstDigit <= 5) {
    return {
      available: true,
      priceCents: 599,
      minAmount: "50,00 €",
      deliveryTime: "3–5 Werktage",
      message:
        "Wir liefern in Ihre Region. Die Zustellung erfolgt bis zur Bordsteinkante.",
    };
  }
  if (firstDigit >= 6 && firstDigit <= 9) {
    return {
      available: true,
      priceCents: 999,
      minAmount: "100,00 €",
      deliveryTime: "5–7 Werktage",
      message:
        "Wir liefern in Ihre Region. Es können zusätzliche Transportkosten anfallen.",
    };
  }
  return {
    available: false,
    priceCents: 0,
    minAmount: "-",
    deliveryTime: "-",
    message:
      "Diese PLZ wird aktuell nicht bedient. Kontaktieren Sie uns für eine individuelle Anfrage.",
  };
}
