import { PrismaPg } from "@prisma/adapter-pg";
import "dotenv/config";
import { Pool } from "pg";
import { PrismaClient } from "../src/generated/client";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const PLATFORM_CONFIG = {
  platformFeePercent: 0.18, // 18%
  cancellationFeePercent: 0.5, // 50%
  minBookingHours: 1,
  maxBookingHours: 12,
  minAdvanceBookingHours: 2,
  maxAdvanceBookingDays: 30,
  freeCancellationHours: 24,
  supportEmail: "support@hireme.vn",
  supportPhone: "+84 28 1234 5678",
  minAppVersion: "1.0.0",
  currentAppVersion: "1.0.0",
};

const BOOST_PRICING_TIERS = [
  {
    tier: "STANDARD" as const,
    name: "Standard Boost",
    durationHours: 24,
    price: 99_000,
    multiplier: 1.5,
    description: "Appear higher in search results for 24 hours",
  },
  {
    tier: "PREMIUM" as const,
    name: "Premium Boost",
    durationHours: 48,
    price: 179_000,
    multiplier: 2.0,
    description: "Double your visibility for 48 hours",
  },
  {
    tier: "SUPER" as const,
    name: "Super Boost",
    durationHours: 72,
    price: 249_000,
    multiplier: 3.0,
    description: "Maximum visibility for 72 hours - appear at the top",
  },
];

const MEMBERSHIP_PRICING_TIERS = [
  {
    tier: "SILVER" as const,
    name: "Silver",
    durationDays: 30,
    price: 299_000,
    forYouLimit: 2,
    maxPendingBookings: 5,
    freeCancellationHours: 48,
    priorityBooking: false,
    nearbySearch: false,
    earlyAccess: false,
    dedicatedSupport: false,
    description: "More recommendations and booking flexibility",
  },
  {
    tier: "GOLD" as const,
    name: "Gold",
    durationDays: 30,
    price: 599_000,
    forYouLimit: 3,
    maxPendingBookings: 10,
    freeCancellationHours: 48,
    priorityBooking: true,
    nearbySearch: true,
    earlyAccess: false,
    dedicatedSupport: false,
    description: "Find nearby companions with priority booking",
  },
  {
    tier: "PLATINUM" as const,
    name: "Platinum",
    durationDays: 30,
    price: 1_199_000,
    forYouLimit: 6,
    maxPendingBookings: 20,
    freeCancellationHours: 72,
    priorityBooking: true,
    nearbySearch: true,
    earlyAccess: true,
    dedicatedSupport: true,
    description: "Full VIP experience with maximum visibility",
  },
];

async function main() {
  console.log("Seeding platform configuration...");

  // Check if config already exists
  const existingConfig = await prisma.platformConfig.findFirst();

  if (existingConfig) {
    // Update existing config
    const result = await prisma.platformConfig.update({
      where: { id: existingConfig.id },
      data: PLATFORM_CONFIG,
    });
    console.log("Platform config updated:", result);
  } else {
    // Create new config
    const result = await prisma.platformConfig.create({
      data: PLATFORM_CONFIG,
    });
    console.log("Platform config created:", result);
  }

  // Seed boost pricing tiers
  console.log("Seeding boost pricing tiers...");
  for (const tier of BOOST_PRICING_TIERS) {
    const result = await prisma.boostPricingTier.upsert({
      where: { tier: tier.tier },
      create: tier,
      update: {
        name: tier.name,
        durationHours: tier.durationHours,
        price: tier.price,
        multiplier: tier.multiplier,
        description: tier.description,
      },
    });
    console.log(`Boost pricing tier upserted: ${result.tier} - ${result.name}`);
  }

  // Seed membership pricing tiers
  console.log("Seeding membership pricing tiers...");
  for (const tier of MEMBERSHIP_PRICING_TIERS) {
    const result = await prisma.membershipPricingTier.upsert({
      where: { tier: tier.tier },
      create: tier,
      update: {
        name: tier.name,
        durationDays: tier.durationDays,
        price: tier.price,
        forYouLimit: tier.forYouLimit,
        maxPendingBookings: tier.maxPendingBookings,
        freeCancellationHours: tier.freeCancellationHours,
        priorityBooking: tier.priorityBooking,
        nearbySearch: tier.nearbySearch,
        earlyAccess: tier.earlyAccess,
        dedicatedSupport: tier.dedicatedSupport,
        description: tier.description,
      },
    });
    console.log(`Membership tier upserted: ${result.tier} - ${result.name}`);
  }
}

main()
  .catch((e) => {
    console.error("Error seeding platform config:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
