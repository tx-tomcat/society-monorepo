-- Migration: Concurrency Constraints
-- Purpose: Add database-level constraints to prevent race conditions
-- Date: 2026-01-23

-- ============================================
-- 1. Webhook Idempotency Table
-- Prevents duplicate webhook processing
-- ============================================
CREATE TABLE "webhook_logs" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "idempotency_key" TEXT UNIQUE NOT NULL,
  "source" TEXT NOT NULL,
  "endpoint" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'processing',
  "response" JSONB,
  "processed_at" TIMESTAMP DEFAULT NOW(),
  "created_at" TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_webhook_logs_idempotency ON "webhook_logs" ("idempotency_key");
CREATE INDEX idx_webhook_logs_source_created ON "webhook_logs" ("source", "created_at" DESC);

-- ============================================
-- 2. Booking Frequency Constraint
-- Prevents same hirer from booking same companion on same day
-- Excludes cancelled/declined bookings
-- ============================================
CREATE UNIQUE INDEX idx_booking_frequency
ON "bookings" ("hirer_id", "companion_id", DATE("start_datetime"))
WHERE status NOT IN ('CANCELLED', 'DECLINED', 'EXPIRED');

-- ============================================
-- 3. Payment Processing Lock Index
-- Supports atomic status transitions with WHERE clause
-- ============================================
CREATE INDEX idx_payment_status_lock
ON "payments" ("id", "status");

-- ============================================
-- 4. Payment Request Processing Lock Index
-- Supports atomic status transitions for SePay webhooks
-- ============================================
CREATE INDEX idx_payment_request_status_lock
ON "payment_requests" ("id", "status");

CREATE INDEX idx_payment_request_code_status
ON "payment_requests" ("code", "status");

-- ============================================
-- 5. Companion Rating Update Lock
-- For atomic rating calculations
-- ============================================
CREATE INDEX idx_companion_rating_lock
ON "companions" ("user_id");

-- ============================================
-- 6. Add processed_webhook_id to payment_requests
-- Links payment request to webhook for audit trail
-- ============================================
ALTER TABLE "payment_requests"
ADD COLUMN IF NOT EXISTS "webhook_log_id" UUID REFERENCES "webhook_logs"("id");

-- ============================================
-- 7. Payment Transaction ID Uniqueness
-- Prevents duplicate bank transfer processing
-- ============================================
CREATE UNIQUE INDEX idx_payment_provider_txn_unique
ON "payments" ("provider_txn_id")
WHERE "provider_txn_id" IS NOT NULL;

-- ============================================
-- NOTES:
-- - Race conditions are also fixed at application level
-- - These constraints provide database-level guarantees
-- - Serializable transactions should be used for critical paths
-- ============================================
