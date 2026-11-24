import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";
import type { TaxonomyGroup, UserRoleName } from "../src/generated/prisma/enums";
import bcrypt from "bcryptjs";
import slugify from "slugify";
import { DEFAULT_NEW_CARS } from "../src/lib/data/new-car-catalog";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) throw new Error("DATABASE_URL is required to seed");

const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString }) });

const s = (value: string) => slugify(value, { lower: true, strict: true });

const permissions = [
  "listing.create", "listing.edit.own", "listing.delete.own", "listing.moderate",
  "listing.promote", "user.manage", "dealer.manage", "dealer.verify",
  "admin.access", "category.manage", "location.manage", "taxonomy.manage",
  "payment.manage", "cms.manage", "settings.manage", "report.manage", "audit.view",
];

const rolePermissions: Record<string, string[]> = {
  SUPER_ADMIN: permissions,
  ADMIN: permissions.filter((p) => p !== "settings.manage" && p !== "audit.view"),
  MODERATOR: ["listing.moderate", "report.manage", "user.manage"],
  SUPPORT_AGENT: ["report.manage", "listing.moderate"],
  DEALER: ["listing.create", "listing.edit.own", "listing.delete.own", "listing.promote"],
  USER: ["listing.create", "listing.edit.own", "listing.delete.own"],
};

/** Admin-editable options. Values intentionally match the previous enum values so existing listings keep their labels. */
const taxonomySeed: Record<string, { value: string; label: string }[]> = {
  TRANSMISSION: [
    { value: "MANUAL", label: "Manual" },
    { value: "AUTOMATIC", label: "Automatic" },
    { value: "TIPTRONIC", label: "Tiptronic" },
    { value: "CVT", label: "CVT" },
  ],
  FUEL_TYPE: [
    { value: "PETROL", label: "Petrol" },
    { value: "DIESEL", label: "Diesel" },
    { value: "HYBRID", label: "Hybrid" },
    { value: "ELECTRIC", label: "Electric" },
    { value: "CNG", label: "CNG" },
    { value: "LPG", label: "LPG" },
  ],
  BODY_TYPE: [
    { value: "SEDAN", label: "Sedan" },
    { value: "HATCHBACK", label: "Hatchback" },
    { value: "SUV", label: "SUV" },
    { value: "CROSSOVER", label: "Crossover" },
    { value: "COUPE", label: "Coupe" },
    { value: "WAGON", label: "Wagon" },
    { value: "PICKUP", label: "Pickup" },
    { value: "VAN", label: "Van" },
    { value: "TRUCK", label: "Truck" },
    { value: "BUS", label: "Bus" },
    { value: "BIKE", label: "Bike" },
    { value: "SCOOTER", label: "Scooter" },
    { value: "THREE_WHEELER", label: "Three-wheeler" },
    { value: "OTHER", label: "Other" },
  ],
  ASSEMBLY_TYPE: [
    { value: "LOCAL", label: "Local" },
    { value: "IMPORTED", label: "Imported" },
    { value: "ASSEMBLED", label: "Locally assembled" },
  ],
  CONDITION: [
    { value: "EXCELLENT", label: "Excellent" },
    { value: "GOOD", label: "Good" },
    { value: "FAIR", label: "Fair" },
    { value: "POOR", label: "Needs work" },
  ],
  FEATURE: [
    "Air Conditioning", "Power Steering", "Power Windows", "Leather Seats", "Sunroof", "Airbags",
    "ABS", "Cruise Control", "Reverse Camera", "Parking Sensors", "Navigation", "Bluetooth",
    "Alloy Wheels", "Fog Lights", "Keyless Entry", "Push Start", "Roof Rack", "Tow Package",
    "Service History", "Original Documents",
  ].map((label) => ({ value: label, label })),
};

const locationSeed = [
  { name: "Punjab", code: "PB", capital: "Lahore", cities: [
    ["Lahore", true, 31.5204, 74.3587, ["Gulberg", "DHA", "Johar Town", "Model Town", "Bahria Town", "Wapda Town"]],
    ["Faisalabad", true, 31.4504, 73.135, ["Jaranwala Road", "D Ground", "Samanabad"]],
    ["Rawalpindi", true, 33.6844, 73.0479, ["Saddar", "Bahria Town", "Chaklala"]],
    ["Multan", true, 30.1575, 71.5249, ["Gulgasht", "DHA", "Shah Rukn-e-Alam"]],
    ["Gujranwala", true, 32.161, 74.188, ["Model Town", "Garden Town"]],
    ["Sialkot", true, 32.4945, 74.5229, ["Daska Road", "Umer Kot"]],
    ["Bahawalpur", false, 29.3956, 71.6836, ["City Area", "Model Town"]],
    ["Sargodha", false, 32.0836, 72.6711, ["City Area"]],
    ["Gujrat", false, 32.5797, 74.3193, ["City Area"]],
  ] },
  { name: "Sindh", code: "SD", capital: "Karachi", cities: [
    ["Karachi", true, 24.8607, 67.0011, ["DHA", "Clifton", "Gulshan-e-Iqbal", "Malir", "Korangi", "North Nazimabad"]],
    ["Hyderabad", true, 25.396, 68.3578, ["Latifabad", "Qasimabad"]],
    ["Sukkur", false, 27.7068, 68.8581, ["City Area"]],
    ["Gwadar", false, 25.1236, 62.3191, ["City Area"]],
    ["Larkana", false, 27.5633, 68.2178, ["City Area"]],
  ] },
  { name: "Khyber Pakhtunkhwa", code: "KP", capital: "Peshawar", cities: [
    ["Peshawar", true, 34.0151, 71.5249, ["Hayatabad", "Saddar", "Gulberg"]],
    ["Abbottabad", true, 34.0769, 73.0468, ["Hassanabad", "City Area"]],
    ["Mardan", false, 34.1956, 72.0114, ["City Area"]],
    ["Swat", false, 35.2227, 72.4258, ["Mingora"]],
    ["Kohat", false, 33.5889, 71.4394, ["City Area"]],
  ] },
  { name: "Balochistan", code: "BL", capital: "Quetta", cities: [
    ["Quetta", true, 30.1798, 66.975, ["Chaman Road", "Saddar", "Gulistan"]],
    ["Turbat", false, 26.0635, 63.1262, ["City Area"]],
    ["Khuzdar", false, 27.7922, 66.6327, ["City Area"]],
  ] },
  { name: "Islamabad Capital Territory", code: "ICT", capital: "Islamabad", cities: [
    ["Islamabad", true, 33.6844, 73.0479, ["F-7", "F-10", "G-9", "Bahria Town", "DHA Valley", "E-11"]],
  ] },
  { name: "Gilgit-Baltistan", code: "GB", capital: "Gilgit", cities: [
    ["Gilgit", true, 35.9208, 74.3087, ["City Area"]],
    ["Skardu", false, 35.2974, 75.6333, ["City Area"]],
  ] },
  { name: "Azad Jammu and Kashmir", code: "AJK", capital: "Muzaffarabad", cities: [
    ["Muzaffarabad", true, 34.3545, 73.4728, ["City Area"]],
    ["Mirpur", false, 33.2969, 73.6311, ["City Area"]],
  ] },
] as const;

const categories = [
  { name: "Cars", slug: "cars", icon: "CarFront", description: "New and used cars from every major city in Pakistan." },
  { name: "Motorcycles", slug: "bikes", icon: "Bike", description: "Motorcycles and scooters from trusted owners and dealers." },
  { name: "Commercial Vehicles", slug: "commercial-vehicles", icon: "Truck", description: "Pickups, vans, trucks and buses for business." },
  { name: "Auto Parts", slug: "auto-parts", icon: "Wrench", description: "Genuine and aftermarket spare parts." },
  { name: "Accessories", slug: "accessories", icon: "Sparkles", description: "Interior, exterior and performance accessories." },
];

const makes = [
  { name: "Toyota", models: [
    { name: "Corolla", body: "SEDAN", variants: ["GLi 1.6", "GLi 1.8", "Altis 1.8", "Altis 2.0"] },
    { name: "Civic", body: "SEDAN", variants: ["EXi", "LX", "RS Turbo"] },
    { name: "Land Cruiser", body: "SUV", variants: ["VX", "GXR"] },
    { name: "Hilux", body: "PICKUP", variants: ["G", "V"] },
    { name: "Fortuner", body: "SUV", variants: ["G", "V"] },
  ] },
  { name: "Honda", models: [
    { name: "Civic", body: "SEDAN", variants: ["ASPIRE", "ORIEL", "RS"] },
    { name: "City", body: "SEDAN", variants: ["LX", "EX", "ASPIRE"] },
    { name: "HR-V", body: "SUV", variants: ["E", "EX"] },
    { name: "CB 150F", body: "BIKE", variants: ["Standard"] },
  ] },
  { name: "Suzuki", models: [
    { name: "Alto", body: "HATCHBACK", variants: ["VXR", "GL", "APV"] },
    { name: "Swift", body: "HATCHBACK", variants: ["GL", "GLX", "RS"] },
    { name: "Ciaz", body: "SEDAN", variants: ["GL", "GLX"] },
    { name: "Vitara", body: "SUV", variants: ["GLX", "AllGrip"] },
  ] },
  { name: "Kia", models: [
    { name: "Sportage", body: "SUV", variants: ["Alpha", "Theta", "Luxe"] },
    { name: "Sorento", body: "SUV", variants: ["HEV", "PHEV"] },
    { name: "Pegas", body: "SEDAN", variants: ["1.5L"] },
  ] },
  { name: "Hyundai", models: [
    { name: "Tucson", body: "SUV", variants: ["GLS", "GLX"] },
    { name: "Sonata", body: "SEDAN", variants: ["HEV"] },
    { name: "Elantra", body: "SEDAN", variants: ["GLS"] },
  ] },
  { name: "MG", models: [
    { name: "HS", body: "SUV", variants: ["Trend", "Style", "Trophy"] },
    { name: "ZS", body: "SUV", variants: ["Style"] },
    { name: "MG4", body: "HATCHBACK", variants: ["EV"] },
  ] },
  { name: "Changan", models: [
    { name: "Alsvin", body: "SEDAN", variants: ["DCT", "MT"] },
    { name: "CS55", body: "SUV", variants: ["Plus"] },
    { name: "Oshan X7", body: "SUV", variants: ["Comfort"] },
  ] },
  { name: "BYD", models: [
    { name: "Atto 3", body: "SUV", variants: ["EV"] },
    { name: "Dolphin", body: "HATCHBACK", variants: ["EV"] },
    { name: "Han", body: "SEDAN", variants: ["EV"] },
  ] },
  { name: "Nissan", models: [
    { name: "Altima", body: "SEDAN", variants: ["SV", "SL"] },
    { name: "X-Trail", body: "SUV", variants: ["SV"] },
  ] },
  { name: "BMW", models: [
    { name: "3 Series", body: "SEDAN", variants: ["320i", "330i"] },
    { name: "X5", body: "SUV", variants: ["xDrive40i"] },
  ] },
  { name: "Mercedes-Benz", models: [
    { name: "C-Class", body: "SEDAN", variants: ["C200", "C300"] },
    { name: "GLC", body: "SUV", variants: ["GLC 300"] },
  ] },
  { name: "Yamaha", models: [
    { name: "YZF-R3", body: "BIKE", variants: ["Standard"] },
    { name: "MT-15", body: "BIKE", variants: ["Standard"] },
  ] },
] as const;

const IMAGES = [
  "photo-1503376780353-7e6692767b70",
  "photo-1494976388531-d1058494cdd8",
  "photo-1552519507-da3b142c6e3d",
  "photo-1549317661-bd32c8ce0db2",
  "photo-1583121274602-3e2820c69888",
  "photo-1618843479313-40f8afb4b4d8",
  "photo-1606664515524-ed2f786a0bd6",
  "photo-1590362891991-f776e747a588",
  "photo-1568605114967-8130f3a36994",
  "photo-1511919884226-fd3cad34687c",
];

const img = (index: number, width = 1200) =>
  `https://images.unsplash.com/${IMAGES[index % IMAGES.length]}?auto=format&fit=crop&w=${width}&q=80`;

async function main() {
  console.log("Seeding Garidekho…");

  // Roles & permissions
  for (const permission of permissions) {
    await prisma.permission.upsert({
      where: { key: permission },
      update: {},
      create: { key: permission, description: permission.replaceAll(".", " ") },
    });
  }
  for (const [name, keys] of Object.entries(rolePermissions)) {
    const roleName = name as UserRoleName;
    const role = await prisma.role.upsert({
      where: { name: roleName },
      update: { description: `${name.replaceAll("_", " ")} role` },
      create: { name: roleName, description: `${name.replaceAll("_", " ")} role` },
    });
    for (const key of keys) {
      await prisma.rolePermission.upsert({
        where: { roleName_permissionKey: { roleName: role.name, permissionKey: key } },
        update: {},
        create: { roleName: role.name, permissionKey: key },
      });
    }
  }

  // Dynamic form options used by the sell wizard and search filters
  for (const [groupKey, options] of Object.entries(taxonomySeed)) {
    for (const [index, option] of options.entries()) {
      await prisma.taxonomyOption.upsert({
        where: { groupName_value: { groupName: groupKey as TaxonomyGroup, value: option.value } },
        update: { label: option.label, sortOrder: index, isActive: true },
        create: {
          groupName: groupKey as TaxonomyGroup,
          value: option.value,
          label: option.label,
          sortOrder: index,
          isActive: true,
        },
      });
    }
  }

  // Users
  const passwordHash = await bcrypt.hash("Admin@12345", 10);
  const users = [
    { email: "admin@garidekho.com.pk", name: "Abuzar Khan", role: "SUPER_ADMIN" as const, phone: "+923390009333", city: "Lahore" },
    { email: "moderator@garidekho.com.pk", name: "Bilal Ahmed", role: "MODERATOR" as const, phone: "+923001000002", city: "Karachi" },
    { email: "dealer@garidekho.com.pk", name: "Omar Farooq", role: "DEALER" as const, phone: "+923001000003", city: "Lahore" },
    { email: "seller@garidekho.com.pk", name: "Hassan Raza", role: "USER" as const, phone: "+923001000004", city: "Islamabad" },
    { email: "buyer@garidekho.com.pk", name: "Sana Iqbal", role: "USER" as const, phone: "+923001000005", city: "Karachi" },
  ];
  const userMap = new Map<string, string>();
  for (const item of users) {
    const user = await prisma.user.upsert({
      where: { email: item.email },
      update: { roleName: item.role },
      create: { email: item.email, phone: item.phone, passwordHash, roleName: item.role, lastLoginAt: new Date() },
    });
    userMap.set(item.email, user.id);
    const [firstName, ...rest] = item.name.split(" ");
    await prisma.userProfile.upsert({
      where: { userId: user.id },
      update: { firstName, lastName: rest.join(" ") },
      create: {
        userId: user.id,
        firstName,
        lastName: rest.join(" "),
        phoneVerifiedAt: new Date(),
        emailVerifiedAt: new Date(),
        identityStatus: "VERIFIED",
        bio: "Verified Garidekho member.",
      },
    });
  }

  // Locations
  const cityMap = new Map<string, string>();
  for (const province of locationSeed) {
    const p = await prisma.province.upsert({
      where: { code: province.code },
      update: { name: province.name, capital: province.capital },
      create: { name: province.name, slug: s(province.name), code: province.code, capital: province.capital },
    });
    for (const [cityName, major, lat, lng, areas] of province.cities) {
      const city = await prisma.city.upsert({
        where: { slug: s(cityName) },
        update: { isMajor: major, latitude: lat, longitude: lng, provinceId: p.id },
        create: {
          name: cityName, slug: s(cityName), provinceId: p.id,
          isMajor: major, latitude: lat, longitude: lng,
          description: `Browse verified cars and bikes for sale in ${cityName}, ${province.name} on Garidekho.`,
        },
      });
      cityMap.set(cityName, city.id);
      for (const area of areas) {
        await prisma.area.upsert({
          where: { cityId_slug: { cityId: city.id, slug: s(area) } },
          update: {},
          create: { cityId: city.id, name: area, slug: s(area) },
        });
      }
    }
  }

  // Categories
  const categoryMap = new Map<string, string>();
  for (const category of categories) {
    const record = await prisma.category.upsert({
      where: { slug: category.slug },
      update: { description: category.description, icon: category.icon },
      create: category,
    });
    categoryMap.set(category.slug, record.id);
  }

  // Vehicle taxonomy
  const makeMap = new Map<string, string>();
  const modelMap = new Map<string, string>();
  for (const make of makes) {
    const makeRecord = await prisma.vehicleMake.upsert({
      where: { slug: s(make.name) },
      update: { isPopular: true },
      create: { name: make.name, slug: s(make.name), isPopular: true },
    });
    makeMap.set(make.name, makeRecord.id);
    for (const model of make.models) {
      const modelSlug = s(`${make.name}-${model.name}`);
      const modelRecord = await prisma.vehicleModel.upsert({
        where: { slug: modelSlug },
        update: { bodyType: model.body as never },
        create: {
          makeId: makeRecord.id, name: model.name, slug: modelSlug,
          bodyType: model.body as never, yearFrom: 2010, yearTo: 2026,
        },
      });
      modelMap.set(modelSlug, modelRecord.id);
      for (const variant of model.variants) {
        await prisma.vehicleVariant.upsert({
          where: { slug: s(`${modelSlug}-${variant}`) },
          update: {},
          create: { modelId: modelRecord.id, name: variant, slug: s(`${modelSlug}-${variant}`) },
        });
      }
    }
  }

  // Dealer
  const dealerUser = await prisma.user.findUniqueOrThrow({ where: { email: "dealer@garidekho.com.pk" } });
  let dealer = await prisma.dealer.findUnique({ where: { userId: dealerUser.id } });
  if (!dealer) {
    dealer = await prisma.dealer.create({
      data: {
        userId: dealerUser.id,
        businessName: "Motor City Motors",
        slug: "motor-city-motors",
        description: "Family-run dealership in Lahore specialising in Japanese sedans and SUVs. Every vehicle is inspected and verified before listing.",
        phone: "+923001000003",
        whatsapp: "+923001000003",
        email: "dealer@garidekho.com.pk",
        address: "Gulberg III, Lahore",
        cityId: cityMap.get("Lahore"),
        verificationStatus: "VERIFIED",
        verifiedAt: new Date(),
        ratingAvg: 4.8,
        ratingCount: 46,
        totalSales: 214,
      },
    });
  }

  // Listings
  const listingSeeds = [
    { title: "Toyota Corolla Altis 1.8 2021 — Full Original", make: "Toyota", model: "Corolla", variant: "Altis 1.8", year: 2021, price: 5625000, mileage: 42000, city: "Lahore", area: "Gulberg", fuel: "PETROL", trans: "AUTOMATIC", color: "Pearl White", seller: "seller@garidekho.com.pk", featured: true, verified: true, status: "ACTIVE", image: 0, desc: "Single owner, complete service history from Toyota authorized centre. Original paint, clean interior, all documents up to date. Engine and transmission in excellent condition. Test drive welcome in Lahore." },
    { title: "Honda Civic RS Turbo 2022 — Immaculate", make: "Honda", model: "Civic", variant: "RS", year: 2022, price: 8950000, mileage: 28000, city: "Karachi", area: "DHA", fuel: "PETROL", trans: "AUTOMATIC", color: "Meteorite Grey", seller: "dealer@garidekho.com.pk", featured: true, verified: true, status: "ACTIVE", image: 1, desc: "Honda Civic RS Turbo in showroom condition. Full option, original tyres, low mileage and complete maintenance record. Bank loan and exchange possible." },
    { title: "Suzuki Alto VXR 2020 — Fuel Efficient", make: "Suzuki", model: "Alto", variant: "VXR", year: 2020, price: 2275000, mileage: 56000, city: "Islamabad", area: "G-9", fuel: "PETROL", trans: "MANUAL", color: "Silky Silver", seller: "seller@garidekho.com.pk", featured: false, verified: true, status: "ACTIVE", image: 2, desc: "Well maintained Alto VXR with new tyres and battery. Perfect for city driving with excellent fuel average. One owner, non-accidental." },
    { title: "Kia Sportage Alpha 2023 — Panoramic Roof", make: "Kia", model: "Sportage", variant: "Alpha", year: 2023, price: 11750000, mileage: 19000, city: "Lahore", area: "DHA", fuel: "PETROL", trans: "AUTOMATIC", color: "Midnight Black", seller: "dealer@garidekho.com.pk", featured: true, verified: true, status: "ACTIVE", image: 3, desc: "Kia Sportage Alpha with panoramic roof, 360 camera and complete warranty. Under 20k km, freshly serviced and ready for immediate delivery." },
    { title: "Hyundai Tucson GLS 2021 — AWD", make: "Hyundai", model: "Tucson", variant: "GLS", year: 2021, price: 8650000, mileage: 38000, city: "Rawalpindi", area: "Bahria Town", fuel: "PETROL", trans: "AUTOMATIC", color: "Phantom Black", seller: "seller@garidekho.com.pk", featured: false, verified: true, status: "ACTIVE", image: 4, desc: "Imported Hyundai Tucson, AWD, full option. Regularly serviced, clean title and all original tools available." },
    { title: "MG HS Trophy 2022 — Low Mileage", make: "MG", model: "HS", variant: "Trophy", year: 2022, price: 7350000, mileage: 31500, city: "Faisalabad", area: "D Ground", fuel: "PETROL", trans: "AUTOMATIC", color: "Glacier White", seller: "seller@garidekho.com.pk", featured: false, verified: false, status: "ACTIVE", image: 5, desc: "MG HS Trophy with leather interior, sunroof and electric seats. Alloy wheels recently replaced. Genuine reason for sale." },
    { title: "BYD Atto 3 EV 2024 — Almost New", make: "BYD", model: "Atto 3", variant: "EV", year: 2024, price: 10950000, mileage: 8500, city: "Karachi", area: "Clifton", fuel: "ELECTRIC", trans: "AUTOMATIC", color: "Aurora Blue", seller: "dealer@garidekho.com.pk", featured: true, verified: true, status: "ACTIVE", image: 6, desc: "Nearly new BYD Atto 3 with full battery health report. Home charger included. Under manufacturer warranty with low running cost." },
    { title: "Changan Alsvin DCT 2022 — Clean Title", make: "Changan", model: "Alsvin", variant: "DCT", year: 2022, price: 4150000, mileage: 44000, city: "Multan", area: "DHA", fuel: "PETROL", trans: "AUTOMATIC", color: "Polar White", seller: "seller@garidekho.com.pk", featured: false, verified: true, status: "ACTIVE", image: 7, desc: "Changan Alsvin with DCT transmission. Well cared for, complete documentation and recent service done." },
    { title: "Toyota Land Cruiser VX 2019 — Full Option", make: "Toyota", model: "Land Cruiser", variant: "VX", year: 2019, price: 31500000, mileage: 62000, city: "Islamabad", area: "F-7", fuel: "DIESEL", trans: "AUTOMATIC", color: "Pearl White", seller: "dealer@garidekho.com.pk", featured: false, verified: true, status: "ACTIVE", image: 8, desc: "Full option Land Cruiser VX, original condition with full agency service history. Sunroof, leather seats, rear entertainment and more." },
    { title: "Honda CB 150F 2021 — One Owner", make: "Honda", model: "CB 150F", variant: "Standard", year: 2021, price: 385000, mileage: 12000, city: "Peshawar", area: "Hayatabad", fuel: "PETROL", trans: "MANUAL", color: "Red", seller: "seller@garidekho.com.pk", featured: false, verified: true, status: "ACTIVE", image: 9, desc: "Honda CB 150F in excellent condition. Low mileage, original paint and regularly serviced." },
    { title: "Nissan Altima SV 2020 — Sinfully Stylish", make: "Nissan", model: "Altima", variant: "SV", year: 2020, price: 6250000, mileage: 51000, city: "Sialkot", area: "Daska Road", fuel: "PETROL", trans: "AUTOMATIC", color: "Gun Metallic", seller: "seller@garidekho.com.pk", featured: false, verified: false, status: "PENDING", image: 1, desc: "Nissan Altima in good condition, awaiting verification by our moderation team." },
    { title: "BMW 320i 2018 — Sport Line", make: "BMW", model: "3 Series", variant: "320i", year: 2018, price: 9750000, mileage: 68000, city: "Quetta", area: "Saddar", fuel: "PETROL", trans: "AUTOMATIC", color: "Alpine White", seller: "seller@garidekho.com.pk", featured: false, verified: false, status: "ACTIVE", image: 0, desc: "BMW 320i Sport Line, well maintained with complete service history. New tyres and brakes." },
  ];

  for (const [index, item] of listingSeeds.entries()) {
    const existing = await prisma.listing.findFirst({ where: { title: item.title } });
    if (existing) continue;
    const modelSlug = s(`${item.make}-${item.model}`);
    const vehicle = await prisma.vehicle.create({
      data: {
        categoryId: item.model === "CB 150F" ? categoryMap.get("bikes")! : categoryMap.get("cars")!,
        makeId: makeMap.get(item.make)!,
        modelId: modelMap.get(modelSlug)!,
        year: item.year,
        mileageKm: item.mileage,
        engineCc: item.fuel === "ELECTRIC" ? null : 1800,
        transmission: item.trans as never,
        fuelType: item.fuel as never,
        bodyType: item.model === "CB 150F" ? "BIKE" : "SEDAN",
        exteriorColor: item.color,
        assemblyType: "LOCAL",
        condition: "GOOD",
        features: ["Air Conditioning", "Power Steering", "ABS", "Alloy Wheels", "Sunroof"],
      },
    });
    const sellerId = userMap.get(item.seller)!;
    const seller = await prisma.user.findUniqueOrThrow({ where: { id: sellerId }, include: { profile: true } });
    const slugBase = `${s(item.title)}-${item.year}`;
    const now = new Date();
    const published = item.status === "ACTIVE" ? new Date(now.getTime() - index * 86400000) : null;
    const listing = await prisma.listing.create({
      data: {
        slug: slugBase,
        title: item.title,
        description: item.desc,
        vehicleId: vehicle.id,
        userId: sellerId,
        dealerId: item.seller === "dealer@garidekho.com.pk" ? dealer!.id : null,
        price: item.price,
        status: item.status as never,
        sellerType: item.seller === "dealer@garidekho.com.pk" ? "DEALER" : "OWNER",
        sellerName: `${seller.profile?.firstName ?? "Seller"} ${seller.profile?.lastName ?? ""}`.trim(),
        sellerPhone: seller.phone ?? "+923001000000",
        whatsappNumber: seller.phone,
        cityId: cityMap.get(item.city),
        areaId: await prisma.area.findFirst({ where: { cityId: cityMap.get(item.city), slug: s(item.area) } }).then((a) => a?.id),
        registrationCityId: cityMap.get(item.city),
        isFeatured: item.featured,
        isVerified: item.verified,
        viewCount: 120 + index * 37,
        publishedAt: published,
        expiresAt: published ? new Date(published.getTime() + 90 * 86400000) : null,
      },
    });
    for (let i = 0; i < 4; i++) {
      await prisma.vehicleImage.create({
        data: {
          listingId: listing.id,
          url: img(item.image + i),
          alt: `${item.title} — view ${i + 1}`,
          position: i,
          isPrimary: i === 0,
          width: 1200,
          height: 800,
        },
      });
    }
  }

  // Ad packages & dealer plans
  const packages = [
    { name: "Featured Ad", slug: "featured-ad", price: 2500, durationDays: 7, features: ["Featured badge", "Homepage placement", "Priority in search"] },
    { name: "Premium Ad", slug: "premium-ad", price: 6000, durationDays: 15, features: ["Top search placement", "Homepage carousel", "Featured badge", "Analytics"] },
    { name: "Homepage Spotlight", slug: "homepage-spotlight", price: 15000, durationDays: 30, features: ["Hero placement", "Top search placement", "Premium badge", "Analytics", "Dedicated support"] },
  ];
  for (const pkg of packages) {
    await prisma.adPackage.upsert({ where: { slug: pkg.slug }, update: { price: pkg.price }, create: pkg });
  }
  const plans = [
    { name: "Starter", slug: "starter", price: 15000, interval: "MONTHLY" as const, listingLimit: 15, features: ["15 active listings", "Dealer storefront", "Lead management"] },
    { name: "Growth", slug: "growth", price: 39000, interval: "MONTHLY" as const, listingLimit: 50, features: ["50 active listings", "Featured monthly", "Analytics", "Priority support"] },
    { name: "Enterprise", slug: "enterprise", price: 99000, interval: "MONTHLY" as const, listingLimit: 200, features: ["200 active listings", "Homepage promotion", "API access", "Dedicated account manager"] },
  ];
  for (const plan of plans) {
    await prisma.dealerPlan.upsert({ where: { slug: plan.slug }, update: { price: plan.price }, create: plan });
  }

  // Editorial content
  const articles = [
    {
      title: "Used Car Buying Guide: What Pakistani Buyers Must Check",
      slug: "used-car-buying-guide-pakistan",
      excerpt: "A practical checklist for inspecting a used car for sale in Pakistan, from service history to document verification.",
      content: "Buying a used car for sale in Pakistan can be a smart decision if you know what to look for. Start with the documents: original registration book, CNIC of the seller and a clear transfer path. Next, inspect the chassis and engine numbers against the papers. Ask for the full service history and confirm it with the authorised workshop where possible. Compare the price in Pakistan with similar listings before you agree a deal. A proper test drive should cover city roads and the motorway. Check suspension, brakes, air conditioning and the gearbox under load. Finally, never pay the full amount before the transfer is complete. Garidekho verifies seller identity so you can buy with confidence.",
      seoTitle: "Used Car Buying Guide in Pakistan",
      seoDescription: "Inspect a used car for sale in Pakistan, verify documents and compare the price in Pakistan before you buy.",
      category: "Buying Guides",
      published: true,
    },
    {
      title: "Electric Cars in Pakistan: Charging, Cost and Reality",
      slug: "electric-cars-in-pakistan-guide",
      excerpt: "Everything you need to know about owning an EV in Pakistan in 2026, from charging options to price in Pakistan.",
      content: "Electric vehicles are gaining momentum in Pakistan, especially in Karachi, Lahore and Islamabad. Before making the switch, calculate your daily mileage and check charging options at home or nearby public chargers. While electricity is cheaper than petrol per kilometre, the upfront cost and resale value deserve careful consideration. Compare EV price in Pakistan with petrol running costs before you decide, and read the battery warranty terms carefully. Garidekho lists verified EVs with detailed specifications to help you compare total cost of ownership.",
      seoTitle: "Electric Cars in Pakistan: Prices, Charging and Reality",
      seoDescription: "Compare electric car price in Pakistan, charging options and ownership costs before switching to an EV.",
      category: "Industry",
      published: true,
    },
    {
      title: "How to Sell Your Car Fast and Safely in Pakistan",
      slug: "sell-car-fast-safely-pakistan",
      excerpt: "Prepare your car, price it right and find serious buyers for your used car for sale in Pakistan.",
      content: "A great listing starts with honest photos taken in daylight from every angle. Use active listings to check the price in Pakistan for the same model, year and condition rather than guessing an asking price. Write a detailed description that mentions service history, tyres, battery and any modifications. Verify your phone number and respond quickly to genuine inquiries. Garidekho's multi-step posting flow helps you build a complete listing in minutes, while moderation keeps the marketplace trustworthy.",
      seoTitle: "How to Sell Your Car in Pakistan Fast and Safely",
      seoDescription: "Price your used car for sale in Pakistan, build a trusted listing and find serious buyers safely.",
      category: "Selling Tips",
      published: true,
    },
  ];
  for (const [articleIndex, article] of articles.entries()) {
    await prisma.newsArticle.upsert({
      where: { slug: article.slug },
      update: { coverUrl: img(articleIndex + 2) },
      create: {
        title: article.title, slug: article.slug, excerpt: article.excerpt, content: article.content,
        seoTitle: article.seoTitle, seoDescription: article.seoDescription,
        category: article.category, status: article.published ? "PUBLISHED" : "DRAFT",
        publishedAt: article.published ? new Date() : null,
        coverUrl: img(articleIndex + 2),
        tags: ["automotive", "pakistan", s(article.category)],
      },
    });
  }

  const pages = [
    { title: "About Garidekho", slug: "about", content: "Garidekho is a Pakistani automotive marketplace built to make buying and selling vehicles simple, transparent and safe. We verify sellers, moderate listings and provide the tools buyers need to make confident decisions." },
    { title: "Privacy Policy", slug: "privacy-policy", content: "We collect only the information needed to operate the marketplace: account details, listing content and usage data. Seller phone numbers are shown only where a seller has chosen to make them public. We never sell personal data." },
    { title: "Terms of Use", slug: "terms-of-use", content: "By using Garidekho you agree to post accurate listings, respect other users and comply with Pakistani law. We may remove listings that are fraudulent, duplicate or misleading." },
  ];
  for (const page of pages) {
    await prisma.cmsPage.upsert({
      where: { slug: page.slug },
      update: { content: page.content },
      create: { ...page, status: "PUBLISHED", publishedAt: new Date() },
    });
  }

  await prisma.siteSetting.upsert({
    where: { key: "site.announcement" },
    update: {},
    create: { key: "site.announcement", value: "Every listing reviewed by our moderation team", description: "Homepage announcement strip" },
  });

  // Showroom catalogue for Featured New Cars and new-car comparisons.
  // Existing rows are left untouched so admin edits survive a reseed.
  const newCarOrder = new Map<string, number>();
  for (const car of DEFAULT_NEW_CARS) {
    const sortOrder = (newCarOrder.get(car.tab) ?? 0) + 1;
    newCarOrder.set(car.tab, sortOrder);
    await prisma.newCar.upsert({
      where: { slug: car.slug },
      update: {},
      create: {
        slug: car.slug,
        name: car.name,
        make: car.make,
        year: car.year,
        tab: car.tab,
        imageUrl: car.image,
        price: car.price,
        summary: car.summary ?? null,
        specs: car.specs,
        sortOrder,
        isActive: true,
      },
    });
  }

  console.log("Seed complete.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
