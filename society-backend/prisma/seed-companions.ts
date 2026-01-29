import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import { PrismaClient } from '../src/generated/client';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

// Vietnamese names for realistic mock data
const vietnameseNames = {
  female: [
    'Nguyễn Minh Anh',
    'Trần Thị Hạnh',
    'Lê Thu Hương',
    'Phạm Ngọc Lan',
    'Hoàng Thùy Linh',
    'Vũ Khánh Linh',
    'Đặng Mai Chi',
    'Bùi Thanh Tâm',
    'Ngô Phương Thảo',
    'Đỗ Quỳnh Anh',
  ],
  male: [
    'Nguyễn Văn Hùng',
    'Trần Minh Đức',
    'Lê Quốc Bảo',
    'Phạm Hoàng Nam',
    'Hoàng Việt Anh',
  ],
};

// Vietnamese hirer names for reviews
const hirerNames = [
  'Trần Văn Minh',
  'Nguyễn Thị Hồng',
  'Lê Hoàng Long',
  'Phạm Thùy Dung',
  'Hoàng Văn Đức',
  'Vũ Thị Mai',
  'Đặng Quốc Bảo',
  'Bùi Thị Lan',
  'Ngô Minh Tuấn',
  'Đỗ Thị Hạnh',
];

// Sample review comments
const reviewComments = [
  'Rất chuyên nghiệp và thân thiện. Mọi người trong gia đình đều rất hài lòng!',
  'Bạn đồng hành tuyệt vời, giao tiếp tốt và rất lịch sự. Sẽ đặt lại lần sau.',
  'Đúng giờ, ăn mặc đẹp và rất biết cách ứng xử. Highly recommended!',
  'Cuộc trò chuyện rất thú vị, bạn ấy có kiến thức rộng và rất dễ chịu.',
  'Mình rất hài lòng với dịch vụ. Bạn ấy rất chu đáo và quan tâm.',
  'Tuyệt vời! Bạn ấy giúp buổi tiệc thêm vui vẻ và ấm cúng.',
  'Rất tự tin và chuyên nghiệp. Đối tác kinh doanh của mình đều ấn tượng.',
  'Bạn ấy rất dễ thương và hòa đồng. Gia đình mình rất thích!',
  'Dịch vụ tốt, đáng giá tiền. Sẽ giới thiệu cho bạn bè.',
  'Lần đầu sử dụng dịch vụ và rất hài lòng. Bạn ấy rất tinh tế.',
  'Excellent! Vượt xa mong đợi của mình. 10/10 sẽ đặt lại.',
  'Bạn đồng hành rất am hiểu và biết cách làm mọi người thoải mái.',
];

const bios = [
  'Tốt nghiệp Đại học Kinh tế TP.HCM. Yêu thích du lịch và khám phá văn hóa. Có kinh nghiệm đồng hành trong các sự kiện doanh nghiệp và gia đình.',
  'Sinh viên năm cuối Đại học Ngoại thương. Thông thạo tiếng Anh và tiếng Nhật. Thích đọc sách và nấu ăn.',
  'Cựu tiếp viên hàng không Vietnam Airlines. Có kỹ năng giao tiếp tốt và hiểu biết về nghi thức xã giao.',
  'Tốt nghiệp Đại học RMIT chuyên ngành Marketing. Năng động, vui vẻ và có nhiều kinh nghiệm tham gia các sự kiện networking.',
  'Giáo viên tiếng Anh tại trung tâm IELTS. Có khả năng giao tiếp lưu loát và tự tin trong mọi tình huống.',
  'Nhân viên ngân hàng với 3 năm kinh nghiệm. Chuyên nghiệp, lịch sự và hiểu biết về văn hóa doanh nghiệp.',
  'Người mẫu tự do tại Sài Gòn. Có kinh nghiệm tham gia các buổi chụp hình và sự kiện thời trang.',
  'Cử nhân Luật Đại học Luật TP.HCM. Thông minh, đĩnh đạc và có kỹ năng ứng xử xuất sắc.',
  'Dancer và fitness instructor. Năng động, vui vẻ và luôn mang đến năng lượng tích cực.',
  'Pharmacist tại bệnh viện quốc tế. Hiền lành, chu đáo và có kiến thức phong phú.',
];

// Sample photo URLs (placeholder - replace with actual photos in production)
const samplePhotoUrls = [
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=800',
  'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=800',
  'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=800',
  'https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?w=800',
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=800',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800',
  'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=800',
  'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=800',
  'https://images.unsplash.com/photo-1519345182560-3f2917c472ef?w=800',
  'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=800',
  'https://images.unsplash.com/photo-1502823403499-6ccfcf4fb453?w=800',
  'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=800',
  'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=800',
  'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=800',
  'https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=800',
];

// Occasion codes mapped to descriptions (will be matched with DB occasions)
const occasionCodes = [
  { code: 'family_intro', description: 'Đồng hành trong các buổi gặp gỡ gia đình' },
  { code: 'wedding', description: 'Đồng hành tham dự đám cưới và sự kiện' },
  { code: 'tet', description: 'Đồng hành trong dịp Tết và lễ hội' },
  { code: 'business_meeting', description: 'Đồng hành trong các sự kiện doanh nghiệp' },
  { code: 'cafe', description: 'Đồng hành cafe, ăn uống, shopping' },
  { code: 'reunion', description: 'Đồng hành trong các buổi họp lớp' },
] as const;

// Helper to generate random hourly rate (in VND)
function generateHourlyRate(): number {
  const rates = [500000, 700000, 800000, 1000000, 1200000, 1500000, 2000000];
  return rates[Math.floor(Math.random() * rates.length)];
}

// Helper to generate random height
function generateHeight(gender: 'MALE' | 'FEMALE'): number {
  if (gender === 'FEMALE') {
    return Math.floor(Math.random() * (175 - 158 + 1)) + 158; // 158-175cm
  }
  return Math.floor(Math.random() * (185 - 168 + 1)) + 168; // 168-185cm
}

// Helper to pick random items from array
function pickRandom<T>(arr: T[], count: number): T[] {
  const shuffled = [...arr].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
}

// Vietnamese provinces for seed data (weighted towards major cities)
const provinces = [
  'HCM', 'HCM', 'HCM', 'HCM', 'HCM', 'HCM', 'HCM', // 7 in HCM (most)
  'HN', 'HN', 'HN', 'HN', // 4 in Hanoi
  'DN', 'DN', // 2 in Da Nang
  'CT', // 1 in Can Tho
  'HP', // 1 in Hai Phong
];

async function main() {
  console.log('🌱 Seeding mock companions...\n');

  // Delete old seeded companions first
  console.log('🗑️  Removing old seeded companions...');
  const oldCompanions = await prisma.user.findMany({
    where: {
      zaloId: { startsWith: 'seed_companion_' },
    },
    select: { id: true, fullName: true },
  });

  if (oldCompanions.length > 0) {
    // Delete in correct order due to foreign key constraints
    const userIds = oldCompanions.map((u) => u.id);

    // Get companion profile IDs
    const companionProfiles = await prisma.companionProfile.findMany({
      where: { userId: { in: userIds } },
      select: { id: true },
    });
    const companionIds = companionProfiles.map((p) => p.id);

    // Delete related records first
    await prisma.companionService.deleteMany({
      where: { companionId: { in: companionIds } },
    });
    await prisma.companionPhoto.deleteMany({
      where: { companionId: { in: companionIds } },
    });
    await prisma.companionAvailability.deleteMany({
      where: { companionId: { in: companionIds } },
    });
    await prisma.companionProfile.deleteMany({
      where: { id: { in: companionIds } },
    });
    await prisma.user.deleteMany({
      where: { id: { in: userIds } },
    });

    console.log(`✓ Deleted ${oldCompanions.length} old seeded companions\n`);
  } else {
    console.log('  No old seeded companions found\n');
  }

  // First, fetch occasions from database to get their IDs
  const occasions = await prisma.occasion.findMany({
    where: { isActive: true },
  });

  if (occasions.length === 0) {
    console.error('❌ No occasions found in database. Please run seed-occasions.ts first.');
    process.exit(1);
  }

  console.log(`📋 Found ${occasions.length} occasions in database\n`);

  // Build occasion lookup map by code
  const occasionMap = new Map(occasions.map((o) => [o.code, o]));

  // Filter occasionCodes to only include ones that exist in DB
  const availableServices = occasionCodes
    .filter((s) => occasionMap.has(s.code))
    .map((s) => ({
      occasionId: occasionMap.get(s.code)!.id,
      code: s.code,
      description: s.description,
    }));

  console.log(`✅ Matched ${availableServices.length} occasion codes to database\n`);

  const companionsToCreate = 15;
  let created = 0;

  for (let i = 0; i < companionsToCreate; i++) {
    const isFemale = i < 10; // 10 female, 5 male
    const gender = isFemale ? 'FEMALE' : 'MALE';
    const names = isFemale ? vietnameseNames.female : vietnameseNames.male;
    const nameIndex = isFemale ? i : i - 10;
    const name = names[nameIndex];

    // Generate random data
    const hourlyRate = generateHourlyRate();
    const ratingAvg = (3.5 + Math.random() * 1.5).toFixed(1); // 3.5-5.0
    const ratingCount = Math.floor(Math.random() * 50) + 5;
    const totalBookings = Math.floor(ratingCount * (1 + Math.random() * 0.5));
    const completedBookings = Math.floor(totalBookings * (0.85 + Math.random() * 0.15));

    // Create email from name
    const emailName = name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/đ/g, 'd')
      .replace(/Đ/g, 'D')
      .replace(/\s+/g, '.');
    const email = `${emailName}${i + 1}@example.com`;

    // Generate unique zaloId for seeding (required field)
    const zaloId = `seed_companion_${i + 1}_${Date.now()}`;
    // Generate phone number
    const phone = `+8490${String(1000000 + i).slice(-7)}`;

    try {
      // Create user with companion profile
      const user = await prisma.user.create({
        data: {
          zaloId,
          phone,
          email,
          fullName: name,
          gender,
          dateOfBirth: new Date(1995 + Math.floor(Math.random() * 8), Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1),
          role: 'COMPANION',
          status: 'ACTIVE',
          isVerified: Math.random() > 0.2, // 80% verified
          trustScore: 80 + Math.floor(Math.random() * 20),
          avatarUrl: samplePhotoUrls[i % samplePhotoUrls.length],
          companionProfile: {
            create: {
              bio: bios[i % bios.length],
              heightCm: generateHeight(gender),
              languages: Math.random() > 0.5 ? ['vi', 'en'] : ['vi'],
              province: provinces[i % provinces.length], // Location
              hourlyRate,
              halfDayRate: Math.floor(hourlyRate * 4 * 0.9), // 10% discount
              fullDayRate: Math.floor(hourlyRate * 8 * 0.8), // 20% discount
              ratingAvg: parseFloat(ratingAvg),
              ratingCount,
              totalBookings,
              completedBookings,
              verificationStatus: 'VERIFIED', // All seed companions are verified for testing
              isFeatured: Math.random() > 0.7, // 30% featured
              isActive: true,
              isHidden: false,
              responseRate: 85 + Math.floor(Math.random() * 15),
              acceptanceRate: 80 + Math.floor(Math.random() * 20),
            },
          },
        },
        include: {
          companionProfile: true,
        },
      });

      const companionProfile = user.companionProfile!;

      // Add photos (2-4 photos per companion)
      const photoCount = 2 + Math.floor(Math.random() * 3);
      const photoUrls = pickRandom(samplePhotoUrls, photoCount);

      for (let p = 0; p < photoUrls.length; p++) {
        await prisma.companionPhoto.create({
          data: {
            companionId: companionProfile.id,
            url: photoUrls[p],
            position: p,
            isVerified: p === 0, // First photo is verified
            isPrimary: p === 0, // First photo is primary
          },
        });
      }

      // Add services (3-5 random services)
      const serviceCount = 3 + Math.floor(Math.random() * 3);
      const selectedServices = pickRandom(availableServices, serviceCount);

      for (const service of selectedServices) {
        await prisma.companionService.create({
          data: {
            companionId: companionProfile.id,
            occasionId: service.occasionId,
            description: service.description,
            priceAdjustment: Math.random() > 0.7 ? Math.floor(Math.random() * 200000) : 0,
            isEnabled: true,
          },
        });
      }

      // Add availability (weekdays and weekends)
      const availabilitySlots = [
        { dayOfWeek: 0, startTime: '10:00', endTime: '22:00' }, // Sunday
        { dayOfWeek: 1, startTime: '18:00', endTime: '22:00' }, // Monday
        { dayOfWeek: 2, startTime: '18:00', endTime: '22:00' }, // Tuesday
        { dayOfWeek: 3, startTime: '18:00', endTime: '22:00' }, // Wednesday
        { dayOfWeek: 4, startTime: '18:00', endTime: '22:00' }, // Thursday
        { dayOfWeek: 5, startTime: '17:00', endTime: '23:00' }, // Friday
        { dayOfWeek: 6, startTime: '10:00', endTime: '23:00' }, // Saturday
      ];

      // Each companion has different availability
      const availableDays = pickRandom(availabilitySlots, 4 + Math.floor(Math.random() * 4));

      for (const slot of availableDays) {
        await prisma.companionAvailability.create({
          data: {
            companionId: companionProfile.id,
            dayOfWeek: slot.dayOfWeek,
            startTime: slot.startTime,
            endTime: slot.endTime,
            isRecurring: true,
            isAvailable: true,
          },
        });
      }

      created++;
      console.log(`✓ Created companion: ${name} (${email})`);
      console.log(`  - Location: ${provinces[i % provinces.length]}`);
      console.log(`  - Hourly rate: ${hourlyRate.toLocaleString()}đ`);
      console.log(`  - Rating: ${ratingAvg} (${ratingCount} reviews)`);
      console.log(`  - Photos: ${photoCount}, Services: ${serviceCount}`);
      console.log('');
    } catch (error) {
      const isPrismaUniqueConstraintError =
        error instanceof Error &&
        'code' in error &&
        (error as { code: string }).code === 'P2002';

      if (isPrismaUniqueConstraintError) {
        console.log(`⚠ Skipped (already exists): ${name}`);
      } else {
        console.error(`✗ Failed to create ${name}:`, error);
      }
    }
  }

  console.log(`\n🎉 Created ${created} companions.`);

  // ============================================
  // Create mock hirers and reviews
  // ============================================
  console.log('\n📝 Creating mock hirers and reviews...\n');

  // Delete old seeded hirers
  const oldHirers = await prisma.user.findMany({
    where: { zaloId: { startsWith: 'seed_hirer_' } },
    select: { id: true },
  });

  if (oldHirers.length > 0) {
    const hirerIds = oldHirers.map((h) => h.id);

    // Delete reviews first (foreign key)
    await prisma.review.deleteMany({
      where: { reviewerId: { in: hirerIds } },
    });
    // Delete bookings
    await prisma.booking.deleteMany({
      where: { hirerId: { in: hirerIds } },
    });
    // Delete hirer profiles
    await prisma.hirerProfile.deleteMany({
      where: { userId: { in: hirerIds } },
    });
    // Delete users
    await prisma.user.deleteMany({
      where: { id: { in: hirerIds } },
    });
    console.log(`✓ Deleted ${oldHirers.length} old seeded hirers\n`);
  }

  // Get all seeded companions
  const seededCompanions = await prisma.user.findMany({
    where: { zaloId: { startsWith: 'seed_companion_' } },
    include: { companionProfile: true },
  });

  if (seededCompanions.length === 0) {
    console.log('⚠ No seeded companions found, skipping reviews');
  } else {
    // Create hirers
    const createdHirers: { id: string; fullName: string }[] = [];

    for (let i = 0; i < hirerNames.length; i++) {
      const name = hirerNames[i];
      const emailName = name
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/đ/g, 'd')
        .replace(/Đ/g, 'D')
        .replace(/\s+/g, '.');

      try {
        const hirer = await prisma.user.create({
          data: {
            zaloId: `seed_hirer_${i + 1}_${Date.now()}`,
            phone: `+8491${String(2000000 + i).slice(-7)}`,
            email: `${emailName}.hirer@example.com`,
            fullName: name,
            gender: i % 2 === 0 ? 'MALE' : 'FEMALE',
            dateOfBirth: new Date(1980 + Math.floor(Math.random() * 15), Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1),
            role: 'HIRER',
            status: 'ACTIVE',
            isVerified: true,
            trustScore: 85 + Math.floor(Math.random() * 15),
            avatarUrl: samplePhotoUrls[(i + 5) % samplePhotoUrls.length],
            hirerProfile: {
              create: {
                province: provinces[i % provinces.length],
              },
            },
          },
        });
        createdHirers.push({ id: hirer.id, fullName: hirer.fullName || name });
        console.log(`✓ Created hirer: ${name}`);
      } catch (error) {
        console.log(`⚠ Skipped hirer ${name}: already exists or error`);
      }
    }

    console.log(`\n📋 Creating bookings and reviews...\n`);

    let bookingNumber = 1000;
    let reviewsCreated = 0;

    // For each companion, create some completed bookings with reviews
    for (const companion of seededCompanions) {
      if (!companion.companionProfile) continue;

      const companionProfile = companion.companionProfile;
      const reviewCount = companionProfile.ratingCount || Math.floor(Math.random() * 20) + 5;

      // Create reviews (up to reviewCount, limited by available hirers)
      const reviewsToCreate = Math.min(reviewCount, createdHirers.length);
      const shuffledHirers = [...createdHirers].sort(() => 0.5 - Math.random());

      let totalRating = 0;
      let actualReviewCount = 0;

      for (let r = 0; r < reviewsToCreate; r++) {
        const hirer = shuffledHirers[r % shuffledHirers.length];
        const occasionId = availableServices[r % availableServices.length]?.occasionId;

        // Random date in the past 6 months
        const bookingDate = new Date();
        bookingDate.setDate(bookingDate.getDate() - Math.floor(Math.random() * 180) - 7);
        const endDate = new Date(bookingDate);
        endDate.setHours(endDate.getHours() + 2 + Math.floor(Math.random() * 4));

        const basePrice = companionProfile.hourlyRate * 3;
        const platformFee = Math.floor(basePrice * 0.18);

        try {
          // Create completed booking
          const booking = await prisma.booking.create({
            data: {
              bookingNumber: `SOC-2024-${String(bookingNumber++).padStart(4, '0')}`,
              hirerId: hirer.id,
              companionId: companion.id,
              status: 'COMPLETED',
              occasionId,
              startDatetime: bookingDate,
              endDatetime: endDate,
              durationHours: 3,
              locationAddress: ['Quận 1, TP.HCM', 'Quận 3, TP.HCM', 'Quận 7, TP.HCM', 'Thủ Đức, TP.HCM'][r % 4],
              basePrice,
              platformFee,
              surgeFee: 0,
              totalPrice: basePrice + platformFee,
              paymentStatus: 'RELEASED',
              confirmedAt: bookingDate,
              completedAt: endDate,
            },
          });

          // Create review for the booking
          // Weight towards higher ratings (realistic distribution)
          const ratingWeights = [1, 2, 5, 15, 77]; // 1-star: 1%, 2-star: 2%, etc.
          const rand = Math.random() * 100;
          let rating = 5;
          let cumulative = 0;
          for (let i = 0; i < ratingWeights.length; i++) {
            cumulative += ratingWeights[i];
            if (rand < cumulative) {
              rating = i + 1;
              break;
            }
          }

          await prisma.review.create({
            data: {
              bookingId: booking.id,
              reviewerId: hirer.id,
              revieweeId: companion.id,
              rating,
              comment: reviewComments[r % reviewComments.length],
              isVisible: true,
              createdAt: endDate,
            },
          });

          totalRating += rating;
          actualReviewCount++;
          reviewsCreated++;
        } catch (error) {
          // Skip duplicate bookings
        }
      }

      // Update companion's rating stats based on actual reviews
      if (actualReviewCount > 0) {
        const avgRating = totalRating / actualReviewCount;
        await prisma.companionProfile.update({
          where: { id: companionProfile.id },
          data: {
            ratingAvg: parseFloat(avgRating.toFixed(2)),
            ratingCount: actualReviewCount,
          },
        });
      }

      console.log(`✓ Created ${actualReviewCount} reviews for ${companion.fullName}`);
    }

    console.log(`\n🎉 Created ${reviewsCreated} total reviews.`);
  }

  console.log('\n✅ Seeding complete!');
}

main()
  .catch((e) => {
    console.error('Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
