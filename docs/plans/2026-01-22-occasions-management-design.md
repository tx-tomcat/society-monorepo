# Occasions Management System Design

## Overview

Admin-managed contextual occasions system where the backend automatically determines which occasions to show based on time of day, day of week, and active holidays. Mobile app fetches occasions dynamically with caching.

## Requirements

- **Admin-managed**: Full CRUD for occasions and holidays via admin API
- **Localized**: English and Vietnamese translations stored in database
- **Contextual**: Occasions filtered by time slot, day type, and holidays
- **Auto-detection**: Backend determines context from current timestamp
- **Emoji icons**: Simple emoji characters for occasion icons
- **Full migration**: Replace `ServiceType` enum with database table

## Database Schema

### Occasion Model

```prisma
model Occasion {
  id              String   @id @default(cuid())
  code            String   @unique
  emoji           String
  nameEn          String   @map("name_en")
  nameVi          String   @map("name_vi")
  descriptionEn   String?  @map("description_en")
  descriptionVi   String?  @map("description_vi")
  displayOrder    Int      @default(0) @map("display_order")
  isActive        Boolean  @default(true) @map("is_active")

  // Context filters - empty array means "show anytime"
  timeSlots       String[] @default([]) @map("time_slots")      // ["morning", "afternoon", "evening", "night"]
  dayTypes        String[] @default([]) @map("day_types")       // ["weekday", "weekend"]
  holidays        String[] @default([]) @map("holidays")        // ["tet", "christmas", "valentine"]

  createdAt       DateTime @default(now()) @map("created_at")
  updatedAt       DateTime @updatedAt @map("updated_at")

  bookings        Booking[]

  @@map("occasions")
  @@index([isActive, displayOrder])
}
```

### Holiday Model

```prisma
model Holiday {
  id          String   @id @default(cuid())
  code        String   @unique
  nameEn      String   @map("name_en")
  nameVi      String   @map("name_vi")
  startDate   DateTime @map("start_date")
  endDate     DateTime @map("end_date")
  isRecurring Boolean  @default(true) @map("is_recurring")
  isActive    Boolean  @default(true) @map("is_active")

  createdAt   DateTime @default(now()) @map("created_at")
  updatedAt   DateTime @updatedAt @map("updated_at")

  @@map("holidays")
  @@index([startDate, endDate, isActive])
}
```

### Booking Model Update

```prisma
model Booking {
  // ... existing fields

  // Replace occasionType enum with foreign key
  occasionId    String?   @map("occasion_id")
  occasion      Occasion? @relation(fields: [occasionId], references: [id])

  // Remove: occasionType ServiceType
}
```

## Context Detection Logic

### Time Slots
| Slot | Hours |
|------|-------|
| morning | 05:00 - 11:59 |
| afternoon | 12:00 - 16:59 |
| evening | 17:00 - 20:59 |
| night | 21:00 - 04:59 |

### Day Types
| Type | Days |
|------|------|
| weekday | Monday - Friday |
| weekend | Saturday - Sunday |

### Filtering Rules
1. If `timeSlots` is empty → show regardless of time
2. If `dayTypes` is empty → show regardless of day
3. If `holidays` is empty AND no holiday is active → show
4. If `holidays` contains active holiday code → show during that holiday
5. All conditions must pass (AND logic)

## API Endpoints

### Public Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/occasions` | Get contextual occasions (auto-detected) |
| GET | `/occasions?timezone=Asia/Ho_Chi_Minh` | Optional timezone override |
| GET | `/occasions/all` | Get all active occasions (no filtering) |

### Admin Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/admin/occasions` | List all occasions |
| POST | `/admin/occasions` | Create occasion |
| PATCH | `/admin/occasions/:id` | Update occasion |
| DELETE | `/admin/occasions/:id` | Delete occasion |
| GET | `/admin/holidays` | List all holidays |
| POST | `/admin/holidays` | Create holiday |
| PATCH | `/admin/holidays/:id` | Update holiday |
| DELETE | `/admin/holidays/:id` | Delete holiday |

### Response Format

```typescript
// GET /occasions response
{
  occasions: [
    {
      id: "clxxx",
      code: "cafe",
      emoji: "☕",
      name: "Cà phê",        // Based on Accept-Language header
      description: null,
      displayOrder: 10
    }
  ],
  context: {
    timeSlot: "afternoon",
    dayType: "weekend",
    activeHolidays: []
  }
}
```

## Seed Data

### Holidays

| Code | Name EN | Name VI | Start | End | Recurring |
|------|---------|---------|-------|-----|-----------|
| tet | Lunar New Year | Tết Nguyên Đán | Jan 20 | Feb 5 | Yes |
| christmas | Christmas | Giáng sinh | Dec 20 | Dec 26 | Yes |
| valentine | Valentine's Day | Ngày Valentine | Feb 13 | Feb 15 | Yes |
| new_year | New Year | Năm mới | Dec 31 | Jan 2 | Yes |
| women_day_vn | Vietnamese Women's Day | Ngày Phụ nữ VN | Oct 19 | Oct 21 | Yes |
| women_day_intl | Int'l Women's Day | Ngày Quốc tế Phụ nữ | Mar 7 | Mar 9 | Yes |
| teachers_day | Teachers' Day | Ngày Nhà giáo | Nov 19 | Nov 21 | Yes |
| independence_day | Independence Day | Ngày Quốc khánh | Sep 1 | Sep 3 | Yes |

### Occasions

#### General (No time/day restrictions)

| Code | Emoji | Name EN | Name VI | Time | Day | Holiday |
|------|-------|---------|---------|------|-----|---------|
| other | 🎯 | Other | Khác | [] | [] | [] |

#### Daytime Activities

| Code | Emoji | Name EN | Name VI | Time | Day | Holiday |
|------|-------|---------|---------|------|-----|---------|
| cafe | ☕ | Cafe | Cà phê | [afternoon, evening] | [] | [] |
| brunch | 🥐 | Brunch | Ăn brunch | [morning, afternoon] | [weekend] | [] |
| lunch | 🍜 | Lunch | Ăn trưa | [afternoon] | [] | [] |
| shopping | 🛍️ | Shopping | Mua sắm | [afternoon, evening] | [] | [] |
| museum | 🏛️ | Museum Visit | Tham quan bảo tàng | [morning, afternoon] | [] | [] |
| spa | 💆 | Spa & Wellness | Spa & Chăm sóc | [morning, afternoon, evening] | [] | [] |

#### Evening Activities

| Code | Emoji | Name EN | Name VI | Time | Day | Holiday |
|------|-------|---------|---------|------|-----|---------|
| dinner | 🍽️ | Dinner | Ăn tối | [evening] | [] | [] |
| movie | 🎬 | Movie | Xem phim | [evening, night] | [] | [] |
| concert | 🎵 | Concert | Buổi hòa nhạc | [evening, night] | [] | [] |
| rooftop | 🌃 | Rooftop Bar | Bar sân thượng | [evening, night] | [] | [] |

#### Night Activities

| Code | Emoji | Name EN | Name VI | Time | Day | Holiday |
|------|-------|---------|---------|------|-----|---------|
| bar | 🍸 | Bar | Quán bar | [night] | [] | [] |
| pub | 🍺 | Pub | Quán pub | [night] | [] | [] |
| club | 🪩 | Nightclub | Hộp đêm | [night] | [weekend] | [] |
| night_dining | 🍜 | Late Night Food | Ăn đêm | [night] | [] | [] |
| karaoke | 🎤 | Karaoke | Karaoke | [evening, night] | [] | [] |

#### Weekend Activities

| Code | Emoji | Name EN | Name VI | Time | Day | Holiday |
|------|-------|---------|---------|------|-----|---------|
| lake_walk | 🚶 | Lake Walk | Dạo Hồ Tây | [afternoon, evening] | [weekend] | [] |
| picnic | 🧺 | Picnic | Dã ngoại | [morning, afternoon] | [weekend] | [] |
| beach | 🏖️ | Beach | Đi biển | [morning, afternoon] | [weekend] | [] |
| hiking | 🥾 | Hiking | Leo núi | [morning, afternoon] | [weekend] | [] |
| golf | ⛳ | Golf | Golf | [morning, afternoon] | [weekend] | [] |

#### Business/Professional

| Code | Emoji | Name EN | Name VI | Time | Day | Holiday |
|------|-------|---------|---------|------|-----|---------|
| business_meeting | 💼 | Business Meeting | Họp công việc | [morning, afternoon] | [weekday] | [] |
| networking | 🤝 | Networking Event | Sự kiện networking | [evening] | [weekday] | [] |
| conference | 📊 | Conference | Hội nghị | [morning, afternoon] | [weekday] | [] |
| business_dinner | 🥂 | Business Dinner | Tiệc công việc | [evening] | [weekday] | [] |

#### Family Events

| Code | Emoji | Name EN | Name VI | Time | Day | Holiday |
|------|-------|---------|---------|------|-----|---------|
| family_intro | 👨‍👩‍👧 | Meet the Family | Ra mắt gia đình | [] | [weekend] | [] |
| wedding | 💒 | Wedding | Đám cưới | [] | [weekend] | [] |
| reunion | 🎓 | Class Reunion | Họp lớp | [evening, night] | [weekend] | [] |
| birthday | 🎂 | Birthday Party | Sinh nhật | [evening] | [] | [] |
| anniversary | 💑 | Anniversary | Kỷ niệm | [evening] | [] | [] |

#### Holiday-Specific

| Code | Emoji | Name EN | Name VI | Time | Day | Holiday |
|------|-------|---------|---------|------|-----|---------|
| tet | 🧧 | Tet Celebration | Mừng Tết | [] | [] | [tet] |
| tet_dinner | 🍲 | Tet Family Dinner | Tiệc Tất niên | [evening] | [] | [tet] |
| christmas | 🎄 | Christmas | Giáng sinh | [] | [] | [christmas] |
| christmas_dinner | 🦃 | Christmas Dinner | Tiệc Giáng sinh | [evening] | [] | [christmas] |
| valentine | 💝 | Valentine's Date | Hẹn hò Valentine | [] | [] | [valentine] |
| valentine_dinner | 🌹 | Valentine Dinner | Tiệc Valentine | [evening] | [] | [valentine] |
| new_year_eve | 🎆 | New Year's Eve | Giao thừa | [night] | [] | [new_year] |
| women_day | 💐 | Women's Day | Ngày Phụ nữ | [] | [] | [women_day_vn, women_day_intl] |
| teachers_day | 📚 | Teachers' Day | Ngày Nhà giáo | [] | [] | [teachers_day] |

## Migration Strategy

### Phase 1: Create Tables (Non-breaking)

1. Create `occasions` table
2. Create `holidays` table
3. Run seed script for initial data

### Phase 2: Add Foreign Key

1. Add `occasion_id` column to `bookings` table (nullable)
2. Create mapping from old enum values to new occasion IDs
3. Run data migration script

### Phase 3: Update Application Code

1. Update backend to use new `occasionId` field
2. Update mobile app to fetch occasions from API
3. Remove hardcoded occasion constants from mobile

### Phase 4: Remove Old Enum (After verification)

1. Drop `occasion_type` column from `bookings`
2. Drop `ServiceType` enum

### Enum to Occasion Mapping

| Old Enum Value | New Occasion Code |
|----------------|-------------------|
| FAMILY_INTRODUCTION | family_intro |
| WEDDING_ATTENDANCE | wedding |
| TET_COMPANIONSHIP | tet |
| BUSINESS_EVENT | business_meeting |
| CASUAL_OUTING | cafe |
| CLASS_REUNION | reunion |
| OTHER | other |

## Mobile Integration

### Hook

```typescript
export const useOccasions = createQuery<OccasionsResponse, void, AxiosError>({
  queryKey: ['occasions'],
  fetcher: () => client.get('/occasions').then(res => res.data),
  staleTime: 5 * 60 * 1000, // 5 minutes - background refresh
});

export const useAllOccasions = createQuery<OccasionsResponse, void, AxiosError>({
  queryKey: ['occasions', 'all'],
  fetcher: () => client.get('/occasions/all').then(res => res.data),
  staleTime: 30 * 60 * 1000, // 30 minutes
});
```

### Types

```typescript
type Occasion = {
  id: string;
  code: string;
  emoji: string;
  name: string;
  description: string | null;
  displayOrder: number;
};

type OccasionsResponse = {
  occasions: Occasion[];
  context: {
    timeSlot: 'morning' | 'afternoon' | 'evening' | 'night';
    dayType: 'weekday' | 'weekend';
    activeHolidays: string[];
  };
};
```

## Implementation Tasks

1. **Backend: Database Schema**
   - Add Occasion and Holiday models to Prisma schema
   - Create migration
   - Update Booking model with occasionId relation

2. **Backend: Seed Script**
   - Create `prisma/seed-occasions.ts`
   - Seed all holidays and occasions

3. **Backend: Occasions Module**
   - Create OccasionsModule, Controller, Service
   - Implement context detection logic
   - Implement CRUD endpoints

4. **Backend: Admin Endpoints**
   - Add admin routes for occasions management
   - Add admin routes for holidays management

5. **Backend: Migration Script**
   - Map existing bookings from enum to occasion IDs
   - Remove old enum after verification

6. **Mobile: API Integration**
   - Create occasions service
   - Create useOccasions hook
   - Update booking flow to use dynamic occasions

7. **Mobile: Remove Hardcoded Data**
   - Remove occasion constants
   - Remove occasion translations (use API response)
