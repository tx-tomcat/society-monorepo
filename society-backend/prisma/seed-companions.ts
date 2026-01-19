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

// Service types with descriptions
const serviceTypes = [
  { type: 'FAMILY_INTRODUCTION', description: 'Đồng hành trong các buổi gặp gỡ gia đình' },
  { type: 'WEDDING_ATTENDANCE', description: 'Đồng hành tham dự đám cưới và sự kiện' },
  { type: 'TET_COMPANIONSHIP', description: 'Đồng hành trong dịp Tết và lễ hội' },
  { type: 'BUSINESS_EVENT', description: 'Đồng hành trong các sự kiện doanh nghiệp' },
  { type: 'CASUAL_OUTING', description: 'Đồng hành cafe, ăn uống, shopping' },
  { type: 'CLASS_REUNION', description: 'Đồng hành trong các buổi họp lớp' },
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

async function main() {
  console.log('🌱 Seeding mock companions...\n');

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

    try {
      // Create user with companion profile
      const user = await prisma.user.create({
        data: {
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
              hourlyRate,
              halfDayRate: Math.floor(hourlyRate * 4 * 0.9), // 10% discount
              fullDayRate: Math.floor(hourlyRate * 8 * 0.8), // 20% discount
              ratingAvg: parseFloat(ratingAvg),
              ratingCount,
              totalBookings,
              completedBookings,
              verificationStatus: Math.random() > 0.2 ? 'VERIFIED' : 'PENDING',
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
      const selectedServices = pickRandom(serviceTypes, serviceCount);

      for (const service of selectedServices) {
        await prisma.companionService.create({
          data: {
            companionId: companionProfile.id,
            serviceType: service.type,
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

  console.log(`\n🎉 Seeding complete! Created ${created} companions.`);
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
