import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
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
  supportEmail: "support@luxe.vn",
  supportPhone: "+84 28 1234 5678",
  minAppVersion: "1.0.0",
  currentAppVersion: "1.0.0",
};

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
}

main()
  .catch((e) => {
    console.error("Error seeding platform config:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
