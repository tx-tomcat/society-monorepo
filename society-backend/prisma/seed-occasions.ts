import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import { PrismaClient } from '../src/generated/client';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

// Holiday seed data
const holidays = [
  {
    code: 'tet',
    nameEn: 'Lunar New Year',
    nameVi: 'Tết Nguyên Đán',
    startDate: new Date('2026-01-20'),
    endDate: new Date('2026-02-05'),
    isRecurring: true,
    isActive: true,
  },
  {
    code: 'christmas',
    nameEn: 'Christmas',
    nameVi: 'Giáng sinh',
    startDate: new Date('2025-12-20'),
    endDate: new Date('2025-12-26'),
    isRecurring: true,
    isActive: true,
  },
  {
    code: 'valentine',
    nameEn: "Valentine's Day",
    nameVi: 'Ngày Valentine',
    startDate: new Date('2026-02-13'),
    endDate: new Date('2026-02-15'),
    isRecurring: true,
    isActive: true,
  },
  {
    code: 'new_year',
    nameEn: 'New Year',
    nameVi: 'Năm mới',
    startDate: new Date('2025-12-31'),
    endDate: new Date('2026-01-02'),
    isRecurring: true,
    isActive: true,
  },
  {
    code: 'women_day_vn',
    nameEn: "Vietnamese Women's Day",
    nameVi: 'Ngày Phụ nữ Việt Nam',
    startDate: new Date('2026-10-19'),
    endDate: new Date('2026-10-21'),
    isRecurring: true,
    isActive: true,
  },
  {
    code: 'women_day_intl',
    nameEn: "International Women's Day",
    nameVi: 'Ngày Quốc tế Phụ nữ',
    startDate: new Date('2026-03-07'),
    endDate: new Date('2026-03-09'),
    isRecurring: true,
    isActive: true,
  },
  {
    code: 'teachers_day',
    nameEn: "Teachers' Day",
    nameVi: 'Ngày Nhà giáo Việt Nam',
    startDate: new Date('2026-11-19'),
    endDate: new Date('2026-11-21'),
    isRecurring: true,
    isActive: true,
  },
  {
    code: 'independence_day',
    nameEn: 'Independence Day',
    nameVi: 'Ngày Quốc khánh',
    startDate: new Date('2026-09-01'),
    endDate: new Date('2026-09-03'),
    isRecurring: true,
    isActive: true,
  },
];

// Occasion seed data
const occasions = [
  // General (No restrictions)
  {
    code: 'other',
    emoji: '🎯',
    nameEn: 'Other',
    nameVi: 'Khác',
    descriptionEn: 'Any other occasion',
    descriptionVi: 'Dịp khác',
    displayOrder: 100,
    timeSlots: [],
    dayTypes: [],
    holidays: [],
  },

  // Daytime Activities
  {
    code: 'cafe',
    emoji: '☕',
    nameEn: 'Cafe',
    nameVi: 'Cà phê',
    descriptionEn: 'Coffee date or casual meetup',
    descriptionVi: 'Hẹn cà phê hoặc gặp gỡ thường ngày',
    displayOrder: 10,
    timeSlots: ['afternoon', 'evening'],
    dayTypes: [],
    holidays: [],
  },
  {
    code: 'brunch',
    emoji: '🥐',
    nameEn: 'Brunch',
    nameVi: 'Ăn brunch',
    descriptionEn: 'Weekend brunch',
    descriptionVi: 'Bữa brunch cuối tuần',
    displayOrder: 11,
    timeSlots: ['morning', 'afternoon'],
    dayTypes: ['weekend'],
    holidays: [],
  },
  {
    code: 'lunch',
    emoji: '🍜',
    nameEn: 'Lunch',
    nameVi: 'Ăn trưa',
    descriptionEn: 'Lunch date',
    descriptionVi: 'Hẹn ăn trưa',
    displayOrder: 12,
    timeSlots: ['afternoon'],
    dayTypes: [],
    holidays: [],
  },
  {
    code: 'shopping',
    emoji: '🛍️',
    nameEn: 'Shopping',
    nameVi: 'Mua sắm',
    descriptionEn: 'Shopping companion',
    descriptionVi: 'Đi mua sắm cùng',
    displayOrder: 13,
    timeSlots: ['afternoon', 'evening'],
    dayTypes: [],
    holidays: [],
  },
  {
    code: 'museum',
    emoji: '🏛️',
    nameEn: 'Museum Visit',
    nameVi: 'Tham quan bảo tàng',
    descriptionEn: 'Visit museums or galleries',
    descriptionVi: 'Tham quan bảo tàng hoặc triển lãm',
    displayOrder: 14,
    timeSlots: ['morning', 'afternoon'],
    dayTypes: [],
    holidays: [],
  },
  {
    code: 'spa',
    emoji: '💆',
    nameEn: 'Spa & Wellness',
    nameVi: 'Spa & Chăm sóc',
    descriptionEn: 'Spa and wellness companion',
    descriptionVi: 'Đi spa và chăm sóc sức khỏe',
    displayOrder: 15,
    timeSlots: ['morning', 'afternoon', 'evening'],
    dayTypes: [],
    holidays: [],
  },

  // Evening Activities
  {
    code: 'dinner',
    emoji: '🍽️',
    nameEn: 'Dinner',
    nameVi: 'Ăn tối',
    descriptionEn: 'Dinner date',
    descriptionVi: 'Hẹn ăn tối',
    displayOrder: 20,
    timeSlots: ['evening'],
    dayTypes: [],
    holidays: [],
  },
  {
    code: 'movie',
    emoji: '🎬',
    nameEn: 'Movie',
    nameVi: 'Xem phim',
    descriptionEn: 'Watch a movie together',
    descriptionVi: 'Xem phim cùng nhau',
    displayOrder: 21,
    timeSlots: ['evening', 'night'],
    dayTypes: [],
    holidays: [],
  },
  {
    code: 'concert',
    emoji: '🎵',
    nameEn: 'Concert',
    nameVi: 'Buổi hòa nhạc',
    descriptionEn: 'Attend a concert or live show',
    descriptionVi: 'Tham dự buổi hòa nhạc hoặc biểu diễn',
    displayOrder: 22,
    timeSlots: ['evening', 'night'],
    dayTypes: [],
    holidays: [],
  },
  {
    code: 'rooftop',
    emoji: '🌃',
    nameEn: 'Rooftop Bar',
    nameVi: 'Bar sân thượng',
    descriptionEn: 'Drinks at a rooftop bar',
    descriptionVi: 'Uống nước ở bar sân thượng',
    displayOrder: 23,
    timeSlots: ['evening', 'night'],
    dayTypes: [],
    holidays: [],
  },

  // Night Activities
  {
    code: 'bar',
    emoji: '🍸',
    nameEn: 'Bar',
    nameVi: 'Quán bar',
    descriptionEn: 'Drinks at a bar',
    descriptionVi: 'Uống ở quán bar',
    displayOrder: 30,
    timeSlots: ['night'],
    dayTypes: [],
    holidays: [],
  },
  {
    code: 'pub',
    emoji: '🍺',
    nameEn: 'Pub',
    nameVi: 'Quán pub',
    descriptionEn: 'Drinks at a pub',
    descriptionVi: 'Uống ở quán pub',
    displayOrder: 31,
    timeSlots: ['night'],
    dayTypes: [],
    holidays: [],
  },
  {
    code: 'club',
    emoji: '🪩',
    nameEn: 'Nightclub',
    nameVi: 'Hộp đêm',
    descriptionEn: 'Night out at a club',
    descriptionVi: 'Đi hộp đêm',
    displayOrder: 32,
    timeSlots: ['night'],
    dayTypes: ['weekend'],
    holidays: [],
  },
  {
    code: 'night_dining',
    emoji: '🍜',
    nameEn: 'Late Night Food',
    nameVi: 'Ăn đêm',
    descriptionEn: 'Late night food and drinks',
    descriptionVi: 'Ăn uống đêm khuya',
    displayOrder: 33,
    timeSlots: ['night'],
    dayTypes: [],
    holidays: [],
  },
  {
    code: 'karaoke',
    emoji: '🎤',
    nameEn: 'Karaoke',
    nameVi: 'Karaoke',
    descriptionEn: 'Karaoke night',
    descriptionVi: 'Đi hát karaoke',
    displayOrder: 34,
    timeSlots: ['evening', 'night'],
    dayTypes: [],
    holidays: [],
  },

  // Weekend Activities
  {
    code: 'lake_walk',
    emoji: '🚶',
    nameEn: 'Lake Walk',
    nameVi: 'Dạo Hồ Tây',
    descriptionEn: 'Walk around West Lake',
    descriptionVi: 'Đi dạo quanh Hồ Tây',
    displayOrder: 40,
    timeSlots: ['afternoon', 'evening'],
    dayTypes: ['weekend'],
    holidays: [],
  },
  {
    code: 'picnic',
    emoji: '🧺',
    nameEn: 'Picnic',
    nameVi: 'Dã ngoại',
    descriptionEn: 'Outdoor picnic',
    descriptionVi: 'Dã ngoại ngoài trời',
    displayOrder: 41,
    timeSlots: ['morning', 'afternoon'],
    dayTypes: ['weekend'],
    holidays: [],
  },
  {
    code: 'beach',
    emoji: '🏖️',
    nameEn: 'Beach',
    nameVi: 'Đi biển',
    descriptionEn: 'Beach day trip',
    descriptionVi: 'Đi biển trong ngày',
    displayOrder: 42,
    timeSlots: ['morning', 'afternoon'],
    dayTypes: ['weekend'],
    holidays: [],
  },
  {
    code: 'hiking',
    emoji: '🥾',
    nameEn: 'Hiking',
    nameVi: 'Leo núi',
    descriptionEn: 'Hiking or trekking',
    descriptionVi: 'Leo núi hoặc đi bộ đường dài',
    displayOrder: 43,
    timeSlots: ['morning', 'afternoon'],
    dayTypes: ['weekend'],
    holidays: [],
  },
  {
    code: 'golf',
    emoji: '⛳',
    nameEn: 'Golf',
    nameVi: 'Golf',
    descriptionEn: 'Golf companion',
    descriptionVi: 'Đi chơi golf',
    displayOrder: 44,
    timeSlots: ['morning', 'afternoon'],
    dayTypes: ['weekend'],
    holidays: [],
  },

  // Business/Professional
  {
    code: 'business_meeting',
    emoji: '💼',
    nameEn: 'Business Meeting',
    nameVi: 'Họp công việc',
    descriptionEn: 'Professional meeting companion',
    descriptionVi: 'Đi cùng họp công việc',
    displayOrder: 50,
    timeSlots: ['morning', 'afternoon'],
    dayTypes: ['weekday'],
    holidays: [],
  },
  {
    code: 'networking',
    emoji: '🤝',
    nameEn: 'Networking Event',
    nameVi: 'Sự kiện networking',
    descriptionEn: 'Professional networking events',
    descriptionVi: 'Sự kiện giao lưu chuyên nghiệp',
    displayOrder: 51,
    timeSlots: ['evening'],
    dayTypes: ['weekday'],
    holidays: [],
  },
  {
    code: 'conference',
    emoji: '📊',
    nameEn: 'Conference',
    nameVi: 'Hội nghị',
    descriptionEn: 'Business conference companion',
    descriptionVi: 'Đi cùng dự hội nghị',
    displayOrder: 52,
    timeSlots: ['morning', 'afternoon'],
    dayTypes: ['weekday'],
    holidays: [],
  },
  {
    code: 'business_dinner',
    emoji: '🥂',
    nameEn: 'Business Dinner',
    nameVi: 'Tiệc công việc',
    descriptionEn: 'Business dinner companion',
    descriptionVi: 'Đi cùng tiệc công việc',
    displayOrder: 53,
    timeSlots: ['evening'],
    dayTypes: ['weekday'],
    holidays: [],
  },

  // Family Events
  {
    code: 'family_intro',
    emoji: '👨‍👩‍👧',
    nameEn: 'Meet the Family',
    nameVi: 'Ra mắt gia đình',
    descriptionEn: 'Family introduction events',
    descriptionVi: 'Sự kiện ra mắt gia đình',
    displayOrder: 60,
    timeSlots: [],
    dayTypes: ['weekend'],
    holidays: [],
  },
  {
    code: 'wedding',
    emoji: '💒',
    nameEn: 'Wedding',
    nameVi: 'Đám cưới',
    descriptionEn: 'Wedding attendance',
    descriptionVi: 'Tham dự đám cưới',
    displayOrder: 61,
    timeSlots: [],
    dayTypes: ['weekend'],
    holidays: [],
  },
  {
    code: 'reunion',
    emoji: '🎓',
    nameEn: 'Class Reunion',
    nameVi: 'Họp lớp',
    descriptionEn: 'School or class reunion',
    descriptionVi: 'Họp lớp hoặc hội khóa',
    displayOrder: 62,
    timeSlots: ['evening', 'night'],
    dayTypes: ['weekend'],
    holidays: [],
  },
  {
    code: 'birthday',
    emoji: '🎂',
    nameEn: 'Birthday Party',
    nameVi: 'Sinh nhật',
    descriptionEn: 'Birthday celebration',
    descriptionVi: 'Tiệc sinh nhật',
    displayOrder: 63,
    timeSlots: ['evening'],
    dayTypes: [],
    holidays: [],
  },
  {
    code: 'anniversary',
    emoji: '💑',
    nameEn: 'Anniversary',
    nameVi: 'Kỷ niệm',
    descriptionEn: 'Anniversary celebration',
    descriptionVi: 'Kỷ niệm ngày đặc biệt',
    displayOrder: 64,
    timeSlots: ['evening'],
    dayTypes: [],
    holidays: [],
  },

  // Holiday-Specific
  {
    code: 'tet',
    emoji: '🧧',
    nameEn: 'Tet Celebration',
    nameVi: 'Mừng Tết',
    descriptionEn: 'Lunar New Year celebration',
    descriptionVi: 'Lễ mừng Tết Nguyên Đán',
    displayOrder: 70,
    timeSlots: [],
    dayTypes: [],
    holidays: ['tet'],
  },
  {
    code: 'tet_dinner',
    emoji: '🍲',
    nameEn: 'Tet Family Dinner',
    nameVi: 'Tiệc Tất niên',
    descriptionEn: 'New Year family dinner',
    descriptionVi: 'Tiệc tất niên cùng gia đình',
    displayOrder: 71,
    timeSlots: ['evening'],
    dayTypes: [],
    holidays: ['tet'],
  },
  {
    code: 'christmas',
    emoji: '🎄',
    nameEn: 'Christmas',
    nameVi: 'Giáng sinh',
    descriptionEn: 'Christmas celebration',
    descriptionVi: 'Lễ Giáng sinh',
    displayOrder: 72,
    timeSlots: [],
    dayTypes: [],
    holidays: ['christmas'],
  },
  {
    code: 'christmas_dinner',
    emoji: '🦃',
    nameEn: 'Christmas Dinner',
    nameVi: 'Tiệc Giáng sinh',
    descriptionEn: 'Christmas dinner event',
    descriptionVi: 'Tiệc ăn tối Giáng sinh',
    displayOrder: 73,
    timeSlots: ['evening'],
    dayTypes: [],
    holidays: ['christmas'],
  },
  {
    code: 'valentine',
    emoji: '💝',
    nameEn: "Valentine's Date",
    nameVi: 'Hẹn hò Valentine',
    descriptionEn: "Valentine's Day date",
    descriptionVi: 'Hẹn hò ngày Valentine',
    displayOrder: 74,
    timeSlots: [],
    dayTypes: [],
    holidays: ['valentine'],
  },
  {
    code: 'valentine_dinner',
    emoji: '🌹',
    nameEn: 'Valentine Dinner',
    nameVi: 'Tiệc Valentine',
    descriptionEn: "Valentine's dinner date",
    descriptionVi: 'Tiệc tối Valentine',
    displayOrder: 75,
    timeSlots: ['evening'],
    dayTypes: [],
    holidays: ['valentine'],
  },
  {
    code: 'new_year_eve',
    emoji: '🎆',
    nameEn: "New Year's Eve",
    nameVi: 'Giao thừa',
    descriptionEn: 'New Year countdown celebration',
    descriptionVi: 'Đón giao thừa',
    displayOrder: 76,
    timeSlots: ['night'],
    dayTypes: [],
    holidays: ['new_year'],
  },
  {
    code: 'women_day',
    emoji: '💐',
    nameEn: "Women's Day",
    nameVi: 'Ngày Phụ nữ',
    descriptionEn: "Women's Day celebration",
    descriptionVi: 'Mừng Ngày Phụ nữ',
    displayOrder: 77,
    timeSlots: [],
    dayTypes: [],
    holidays: ['women_day_vn', 'women_day_intl'],
  },
  {
    code: 'teachers_day',
    emoji: '📚',
    nameEn: "Teachers' Day",
    nameVi: 'Ngày Nhà giáo',
    descriptionEn: "Teachers' Day celebration",
    descriptionVi: 'Mừng Ngày Nhà giáo',
    displayOrder: 78,
    timeSlots: [],
    dayTypes: [],
    holidays: ['teachers_day'],
  },
];

async function seedOccasions() {
  console.log('🌱 Seeding holidays...');

  for (const holiday of holidays) {
    await prisma.holiday.upsert({
      where: { code: holiday.code },
      update: holiday,
      create: holiday,
    });
    console.log(`  ✓ Holiday: ${holiday.code}`);
  }

  console.log(`\n🌱 Seeding occasions...`);

  for (const occasion of occasions) {
    await prisma.occasion.upsert({
      where: { code: occasion.code },
      update: occasion,
      create: occasion,
    });
    console.log(`  ✓ Occasion: ${occasion.code}`);
  }

  console.log(`\n✅ Seeded ${holidays.length} holidays and ${occasions.length} occasions`);
}

async function migrateBookingOccasions() {
  console.log('\n🔄 Migrating existing booking occasion types...');

  // Mapping from old enum to new occasion codes
  const enumToCodeMapping: Record<string, string> = {
    FAMILY_INTRODUCTION: 'family_intro',
    WEDDING_ATTENDANCE: 'wedding',
    TET_COMPANIONSHIP: 'tet',
    BUSINESS_EVENT: 'business_meeting',
    CASUAL_OUTING: 'cafe',
    CLASS_REUNION: 'reunion',
    OTHER: 'other',
  };

  // Get all occasions for ID lookup
  const allOccasions = await prisma.occasion.findMany();
  const codeToId = new Map(allOccasions.map((o) => [o.code, o.id]));

  // Update bookings with occasionType but no occasionId
  const bookingsToMigrate = await prisma.booking.findMany({
    where: {
      occasionType: { not: null },
      occasionId: null,
    },
    select: { id: true, occasionType: true },
  });

  let migratedCount = 0;
  for (const booking of bookingsToMigrate) {
    const occasionCode = enumToCodeMapping[booking.occasionType!];
    const occasionId = codeToId.get(occasionCode);

    if (occasionId) {
      await prisma.booking.update({
        where: { id: booking.id },
        data: { occasionId },
      });
      migratedCount++;
    }
  }

  console.log(`✅ Migrated ${migratedCount} bookings to new occasion system`);
}

async function main() {
  try {
    await seedOccasions();
    await migrateBookingOccasions();
  } catch (error) {
    console.error('❌ Seed failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

main();
