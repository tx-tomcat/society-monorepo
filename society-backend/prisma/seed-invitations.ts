import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import { PrismaClient } from '../src/generated/client';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('Seeding invitation packages...');

  // Create invitation packages
  const packages = [
    {
      name: 'Starter Pack',
      description: 'Perfect for getting started',
      codeCount: 3,
      priceVnd: 500000,
      priceUsd: 20,
      sortOrder: 1,
    },
    {
      name: 'Growth Pack',
      description: 'Grow your network',
      codeCount: 10,
      priceVnd: 1500000,
      priceUsd: 60,
      sortOrder: 2,
    },
    {
      name: 'Premium Pack',
      description: 'Maximum reach',
      codeCount: 25,
      priceVnd: 3000000,
      priceUsd: 120,
      sortOrder: 3,
    },
  ];

  for (const pkg of packages) {
    await prisma.invitationPackage.upsert({
      where: { name: pkg.name },
      update: pkg,
      create: pkg,
    });
    console.log(`✓ Created package: ${pkg.name}`);
  }

  console.log('Seeding complete!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
