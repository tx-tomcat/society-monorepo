-- CreateEnum
CREATE TYPE "PaymentRequestType" AS ENUM ('TOPUP', 'BOOKING');

-- CreateEnum
CREATE TYPE "PaymentRequestStatus" AS ENUM ('PENDING', 'COMPLETED', 'EXPIRED', 'FAILED');

-- CreateTable
CREATE TABLE "payment_requests" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "code" TEXT NOT NULL,
    "type" "PaymentRequestType" NOT NULL,
    "amount" INTEGER NOT NULL,
    "status" "PaymentRequestStatus" NOT NULL DEFAULT 'PENDING',
    "booking_id" UUID,
    "sepay_id" INTEGER,
    "gateway" TEXT,
    "reference_code" TEXT,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "completed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "payment_requests_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "payment_requests_code_key" ON "payment_requests"("code");

-- CreateIndex
CREATE INDEX "payment_requests_user_id_idx" ON "payment_requests"("user_id");

-- CreateIndex
CREATE INDEX "payment_requests_code_idx" ON "payment_requests"("code");

-- CreateIndex
CREATE INDEX "payment_requests_status_expires_at_idx" ON "payment_requests"("status", "expires_at");

-- AddForeignKey
ALTER TABLE "payment_requests" ADD CONSTRAINT "payment_requests_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payment_requests" ADD CONSTRAINT "payment_requests_booking_id_fkey" FOREIGN KEY ("booking_id") REFERENCES "bookings"("id") ON DELETE SET NULL ON UPDATE CASCADE;
