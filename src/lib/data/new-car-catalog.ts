import type { LucideIcon } from "lucide-react";
import { CalendarClock, Flame, Sparkles } from "lucide-react";
import type { CarSpecs } from "@/lib/data/car-specs";

export type NewCarTab = "popular" | "upcoming" | "launched";

export type NewCarView = {
  id?: string;
  slug: string;
  name: string;
  make: string;
  year: number;
  tab: NewCarTab;
  price: number;
  image: string;
  summary?: string | null;
  specs: CarSpecs;
  isActive?: boolean;
  sortOrder?: number;
};

export const NEW_CAR_TABS: { id: NewCarTab; label: string; icon: LucideIcon }[] = [
  { id: "popular", label: "Popular", icon: Flame },
  { id: "upcoming", label: "Upcoming", icon: CalendarClock },
  { id: "launched", label: "Newly Launched", icon: Sparkles },
];

const photo = (id: string) =>
  `https://images.unsplash.com/${id}?auto=format&fit=crop&w=800&q=80`;

const IMAGES = {
  corolla: photo("photo-1503376780353-7e6692767b70"),
  civic: photo("photo-1552519507-da3b142c6e3d"),
  alto: photo("photo-1549317661-bd32c8ce0db2"),
  sportage: photo("photo-1618843479313-40f8afb4b4d8"),
  tucson: photo("photo-1609521263047-f8f205293f24"),
  fortuner: photo("photo-1542362567-b07e54358753"),
  atto: photo("photo-1590362891991-f776e747a588"),
  ioniq: photo("photo-1619767886558-efdc259cde1a"),
  ev6: photo("photo-1571607388263-1044f9ea01dd"),
  deepal: photo("photo-1533473359331-0135ef1b58bf"),
  h6: photo("photo-1507136566006-cfc505b114fc"),
  raize: photo("photo-1511919884226-fd3cad34687c"),
  cross: photo("photo-1583121274602-3e2820c69888"),
  hrv: photo("photo-1544636331-e26879cd4d9b"),
  fronx: photo("photo-1494976388531-d1058494cdd8"),
  mg: photo("photo-1560958089-b8a1929cea89"),
  oshan: photo("photo-1553449449-bb562411e964"),
  sonet: photo("photo-1549317661-bd32c8ce0db2"),
};

/** Starter catalogue. Also seeded into the `new_cars` table for admin editing. */
export const DEFAULT_NEW_CARS: NewCarView[] = [
  {
    slug: "toyota-corolla", name: "Toyota Corolla", make: "Toyota", year: 2024, tab: "popular",
    price: 5_800_000, image: IMAGES.corolla, summary: "A dependable compact sedan with a refined CVT and strong resale value.",
    specs: { bodyType: "SEDAN", lengthMm: 4630, widthMm: 1780, heightMm: 1435, groundClearanceMm: 140, transmission: "CVT", horsePower: 138, bootSpaceL: 470, kerbWeightKg: 1310, fuelType: "PETROL", fuelAverageKmpl: 14.5, seatingCapacity: 5, topSpeedKmph: 190, tyreSize: "195/65 R15" },
  },
  {
    slug: "honda-civic", name: "Honda Civic", make: "Honda", year: 2024, tab: "popular",
    price: 6_800_000, image: IMAGES.civic, summary: "A sharp-handling sedan with a punchy turbo-petrol engine.",
    specs: { bodyType: "SEDAN", lengthMm: 4678, widthMm: 1802, heightMm: 1415, groundClearanceMm: 125, transmission: "CVT", horsePower: 158, bootSpaceL: 440, kerbWeightKg: 1320, fuelType: "PETROL", fuelAverageKmpl: 14, seatingCapacity: 5, topSpeedKmph: 200, tyreSize: "215/55 R16" },
  },
  {
    slug: "suzuki-alto", name: "Suzuki Alto", make: "Suzuki", year: 2024, tab: "popular",
    price: 2_300_000, image: IMAGES.alto, summary: "Pakistan's favourite city hatchback, light on fuel and easy to maintain.",
    specs: { bodyType: "HATCHBACK", lengthMm: 3395, widthMm: 1475, heightMm: 1495, groundClearanceMm: 120, transmission: "CVT", horsePower: 49, bootSpaceL: 180, kerbWeightKg: 680, fuelType: "PETROL", fuelAverageKmpl: 22, seatingCapacity: 4, topSpeedKmph: 140, tyreSize: "145/80 R12" },
  },
  {
    slug: "kia-sportage", name: "Kia Sportage", make: "Kia", year: 2024, tab: "popular",
    price: 8_200_000, image: IMAGES.sportage, summary: "A spacious turbo-diesel SUV with a premium cabin.",
    specs: { bodyType: "SUV", lengthMm: 4660, widthMm: 1865, heightMm: 1660, groundClearanceMm: 165, transmission: "AUTOMATIC", horsePower: 184, bootSpaceL: 591, kerbWeightKg: 1660, fuelType: "DIESEL", fuelAverageKmpl: 12, seatingCapacity: 5, topSpeedKmph: 195, tyreSize: "235/55 R18" },
  },
  {
    slug: "hyundai-tucson", name: "Hyundai Tucson", make: "Hyundai", year: 2024, tab: "popular",
    price: 7_600_000, image: IMAGES.tucson, summary: "A modern petrol SUV with a confident road presence.",
    specs: { bodyType: "SUV", lengthMm: 4640, widthMm: 1865, heightMm: 1665, groundClearanceMm: 165, transmission: "AUTOMATIC", horsePower: 187, bootSpaceL: 539, kerbWeightKg: 1680, fuelType: "PETROL", fuelAverageKmpl: 11, seatingCapacity: 5, topSpeedKmph: 201, tyreSize: "235/55 R18" },
  },
  {
    slug: "toyota-fortuner", name: "Toyota Fortuner", make: "Toyota", year: 2024, tab: "popular",
    price: 10_500_000, image: IMAGES.fortuner, summary: "A rugged seven-seater built for long journeys and rough roads.",
    specs: { bodyType: "SUV", lengthMm: 4795, widthMm: 1855, heightMm: 1835, groundClearanceMm: 220, transmission: "AUTOMATIC", horsePower: 201, bootSpaceL: 200, kerbWeightKg: 2120, fuelType: "DIESEL", fuelAverageKmpl: 10, seatingCapacity: 7, topSpeedKmph: 190, tyreSize: "265/60 R18" },
  },
  {
    slug: "byd-atto-3", name: "BYD Atto 3", make: "BYD", year: 2025, tab: "upcoming",
    price: 8_900_000, image: IMAGES.atto, summary: "A fully electric SUV with a practical 420 km claimed range.",
    specs: { bodyType: "SUV", lengthMm: 4725, widthMm: 1875, heightMm: 1675, groundClearanceMm: 175, transmission: "AUTOMATIC", horsePower: 201, bootSpaceL: 440, kerbWeightKg: 1750, fuelType: "ELECTRIC", batteryCapacityKwh: 60.5, rangeKm: 420, chargingTimeHours: 7, seatingCapacity: 5, topSpeedKmph: 180, tyreSize: "235/55 R18" },
  },
  {
    slug: "hyundai-ioniq-5", name: "Hyundai Ioniq 5", make: "Hyundai", year: 2025, tab: "upcoming",
    price: 14_000_000, image: IMAGES.ioniq, summary: "A fast-charging electric crossover with a lounge-like interior.",
    specs: { bodyType: "CROSSOVER", lengthMm: 4635, widthMm: 1890, heightMm: 1665, groundClearanceMm: 160, transmission: "AUTOMATIC", horsePower: 214, bootSpaceL: 527, kerbWeightKg: 1830, fuelType: "ELECTRIC", batteryCapacityKwh: 72.6, rangeKm: 480, chargingTimeHours: 18, seatingCapacity: 5, topSpeedKmph: 185, tyreSize: "235/55 R19" },
  },
  {
    slug: "kia-ev6", name: "Kia EV6", make: "Kia", year: 2025, tab: "upcoming",
    price: 12_500_000, image: IMAGES.ev6, summary: "A low-slung electric crossover with strong performance.",
    specs: { bodyType: "CROSSOVER", lengthMm: 4680, widthMm: 1880, heightMm: 1580, groundClearanceMm: 150, transmission: "AUTOMATIC", horsePower: 225, bootSpaceL: 490, kerbWeightKg: 1820, fuelType: "ELECTRIC", batteryCapacityKwh: 77.4, rangeKm: 510, chargingTimeHours: 18, seatingCapacity: 5, topSpeedKmph: 192, tyreSize: "235/55 R19" },
  },
  {
    slug: "changan-deepal-s7", name: "Changan Deepal S7", make: "Changan", year: 2025, tab: "upcoming",
    price: 9_500_000, image: IMAGES.deepal, summary: "A plug-in hybrid SUV blending electric driving with long trips.",
    specs: { bodyType: "SUV", lengthMm: 4750, widthMm: 1930, heightMm: 1625, groundClearanceMm: 170, transmission: "AUTOMATIC", horsePower: 218, bootSpaceL: 480, kerbWeightKg: 1850, fuelType: "HYBRID", fuelAverageKmpl: 16, batteryCapacityKwh: 18.4, rangeKm: 90, chargingTimeHours: 4, seatingCapacity: 5, topSpeedKmph: 190, tyreSize: "235/55 R19" },
  },
  {
    slug: "haval-h6-hev", name: "Haval H6 HEV", make: "Haval", year: 2025, tab: "upcoming",
    price: 7_800_000, image: IMAGES.h6, summary: "A feature-packed hybrid SUV with strong city efficiency.",
    specs: { bodyType: "SUV", lengthMm: 4683, widthMm: 1886, heightMm: 1730, groundClearanceMm: 170, transmission: "CVT", horsePower: 240, bootSpaceL: 600, kerbWeightKg: 1700, fuelType: "HYBRID", fuelAverageKmpl: 17, batteryCapacityKwh: 1.8, rangeKm: 80, chargingTimeHours: 2, seatingCapacity: 5, topSpeedKmph: 190, tyreSize: "235/60 R18" },
  },
  {
    slug: "toyota-raize", name: "Toyota Raize", make: "Toyota", year: 2025, tab: "upcoming",
    price: 4_500_000, image: IMAGES.raize, summary: "A compact turbo SUV with high ground clearance.",
    specs: { bodyType: "SUV", lengthMm: 3995, widthMm: 1695, heightMm: 1620, groundClearanceMm: 200, transmission: "CVT", horsePower: 97, bootSpaceL: 369, kerbWeightKg: 1050, fuelType: "PETROL", fuelAverageKmpl: 16, seatingCapacity: 5, topSpeedKmph: 170, tyreSize: "205/65 R16" },
  },
  {
    slug: "toyota-corolla-cross", name: "Toyota Corolla Cross", make: "Toyota", year: 2024, tab: "launched",
    price: 7_200_000, image: IMAGES.cross, summary: "A practical crossover built on the reliable Corolla platform.",
    specs: { bodyType: "SUV", lengthMm: 4460, widthMm: 1825, heightMm: 1620, groundClearanceMm: 155, transmission: "CVT", horsePower: 138, bootSpaceL: 487, kerbWeightKg: 1380, fuelType: "PETROL", fuelAverageKmpl: 14, seatingCapacity: 5, topSpeedKmph: 185, tyreSize: "215/60 R17" },
  },
  {
    slug: "honda-hr-v", name: "Honda HR-V", make: "Honda", year: 2024, tab: "launched",
    price: 6_200_000, image: IMAGES.hrv, summary: "A city-friendly compact SUV with Honda's magic seating.",
    specs: { bodyType: "SUV", lengthMm: 4328, widthMm: 1772, heightMm: 1588, groundClearanceMm: 185, transmission: "CVT", horsePower: 119, bootSpaceL: 436, kerbWeightKg: 1270, fuelType: "PETROL", fuelAverageKmpl: 15, seatingCapacity: 5, topSpeedKmph: 180, tyreSize: "215/60 R17" },
  },
  {
    slug: "suzuki-fronx", name: "Suzuki Fronx", make: "Suzuki", year: 2024, tab: "launched",
    price: 4_700_000, image: IMAGES.fronx, summary: "A stylish compact crossover with an efficient turbo engine.",
    specs: { bodyType: "CROSSOVER", lengthMm: 3995, widthMm: 1745, heightMm: 1550, groundClearanceMm: 175, transmission: "CVT", horsePower: 99, bootSpaceL: 308, kerbWeightKg: 1055, fuelType: "PETROL", fuelAverageKmpl: 17, seatingCapacity: 5, topSpeedKmph: 170, tyreSize: "195/60 R16" },
  },
  {
    slug: "mg-hs", name: "MG HS", make: "MG", year: 2024, tab: "launched",
    price: 6_500_000, image: IMAGES.mg, summary: "A well-equipped mid-size SUV at a competitive price.",
    specs: { bodyType: "SUV", lengthMm: 4574, widthMm: 1876, heightMm: 1664, groundClearanceMm: 170, transmission: "DCT", horsePower: 162, bootSpaceL: 463, kerbWeightKg: 1660, fuelType: "PETROL", fuelAverageKmpl: 11, seatingCapacity: 5, topSpeedKmph: 190, tyreSize: "235/50 R18" },
  },
  {
    slug: "changan-oshan-x7", name: "Changan Oshan X7", make: "Changan", year: 2024, tab: "launched",
    price: 5_600_000, image: IMAGES.oshan, summary: "A roomy seven-seat SUV with a long feature list.",
    specs: { bodyType: "SUV", lengthMm: 4700, widthMm: 1860, heightMm: 1720, groundClearanceMm: 180, transmission: "DCT", horsePower: 170, bootSpaceL: 440, kerbWeightKg: 1680, fuelType: "PETROL", fuelAverageKmpl: 11, seatingCapacity: 7, topSpeedKmph: 185, tyreSize: "225/60 R18" },
  },
  {
    slug: "kia-sonet", name: "Kia Sonet", make: "Kia", year: 2024, tab: "launched",
    price: 4_200_000, image: IMAGES.sonet, summary: "A compact SUV with turbo performance and a feature-rich cabin.",
    specs: { bodyType: "SUV", lengthMm: 3995, widthMm: 1790, heightMm: 1642, groundClearanceMm: 150, transmission: "DCT", horsePower: 118, bootSpaceL: 382, kerbWeightKg: 1150, fuelType: "PETROL", fuelAverageKmpl: 15, seatingCapacity: 5, topSpeedKmph: 175, tyreSize: "215/60 R16" },
  },
];

export function defaultCarImage(name: string) {
  return IMAGES[name.toLowerCase().replace(/\s+/g, "_") as keyof typeof IMAGES]
    ?? IMAGES.corolla;
}
