/** Seed the starter new-car catalogue into the admin-managed table. */
import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";
import { DEFAULT_NEW_CARS } from "../src/lib/data/new-car-catalog";

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL! }),
});

async function main() {
  const sortOrder = new Map<string, number>();
  for (const car of DEFAULT_NEW_CARS) {
    const next = (sortOrder.get(car.tab) ?? 0) + 1;
    sortOrder.set(car.tab, next);

    await prisma.newCar.upsert({
      where: { slug: car.slug },
      update: {
        name: car.name,
        make: car.make,
        year: car.year,
        tab: car.tab,
        imageUrl: car.image,
        price: car.price,
        summary: car.summary ?? null,
        specs: car.specs,
        sortOrder: next,
        isActive: true,
      },
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
        sortOrder: next,
        isActive: true,
      },
    });
  }
  console.log(`Seeded ${DEFAULT_NEW_CARS.length} new cars.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
