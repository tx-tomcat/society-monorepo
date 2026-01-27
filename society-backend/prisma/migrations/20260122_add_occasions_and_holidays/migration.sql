-- CreateTable
CREATE TABLE "occasions" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "emoji" TEXT NOT NULL,
    "name_en" TEXT NOT NULL,
    "name_vi" TEXT NOT NULL,
    "description_en" TEXT,
    "description_vi" TEXT,
    "display_order" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "time_slots" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "day_types" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "holidays" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "occasions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "holidays" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name_en" TEXT NOT NULL,
    "name_vi" TEXT NOT NULL,
    "start_date" TIMESTAMP(3) NOT NULL,
    "end_date" TIMESTAMP(3) NOT NULL,
    "is_recurring" BOOLEAN NOT NULL DEFAULT true,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "holidays_pkey" PRIMARY KEY ("id")
);

-- AlterTable: Add occasionId to bookings
ALTER TABLE "bookings" ADD COLUMN "occasion_id" TEXT;

-- Make occasionType nullable (for migration period)
ALTER TABLE "bookings" ALTER COLUMN "occasion_type" DROP NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "occasions_code_key" ON "occasions"("code");

-- CreateIndex
CREATE INDEX "occasions_is_active_display_order_idx" ON "occasions"("is_active", "display_order");

-- CreateIndex
CREATE UNIQUE INDEX "holidays_code_key" ON "holidays"("code");

-- CreateIndex
CREATE INDEX "holidays_start_date_end_date_is_active_idx" ON "holidays"("start_date", "end_date", "is_active");

-- CreateIndex
CREATE INDEX "bookings_occasion_id_idx" ON "bookings"("occasion_id");

-- AddForeignKey
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_occasion_id_fkey" FOREIGN KEY ("occasion_id") REFERENCES "occasions"("id") ON DELETE SET NULL ON UPDATE CASCADE;
