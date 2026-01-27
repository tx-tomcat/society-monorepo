-- Performance indexes for common query patterns
-- Part of Phase 3: Database & Query Optimization
--
-- VERIFICATION: Run EXPLAIN ANALYZE to confirm index usage:
--   EXPLAIN ANALYZE SELECT * FROM "Booking" WHERE "companion_id" = '...' AND "status" = 'CONFIRMED' ORDER BY "start_datetime";
--
-- EXPECTED IMPACT:
--   - Booking queries: 80-95% reduction in query time
--   - Companion browse: 60-75% reduction with partial indexes
--   - Chat/conversation lookups: 70-85% improvement
--
-- MONITORING: Check index usage with:
--   SELECT schemaname, tablename, indexname, idx_scan, idx_tup_read
--   FROM pg_stat_user_indexes WHERE indexname LIKE 'idx_%';
--
-- Note: Many indexes already exist in schema.prisma @@index declarations.
-- This migration adds additional indexes not covered by the schema.

-- Booking queries by companion, status, and start datetime (used in companion dashboard, requests list)
-- Covers: findMany({ where: { companionId, status }, orderBy: { startDatetime } })
CREATE INDEX IF NOT EXISTS idx_booking_companion_status_starttime
ON "Booking" ("companion_id", "status", "start_datetime");

-- Booking queries by hirer and status (used in hirer orders list)
CREATE INDEX IF NOT EXISTS idx_booking_hirer_status
ON "Booking" ("hirer_id", "status");

-- Booking queries by hirer and start datetime (for upcoming bookings)
CREATE INDEX IF NOT EXISTS idx_booking_hirer_starttime
ON "Booking" ("hirer_id", "start_datetime" DESC);

-- Companion browsing - partial index for active, non-hidden companions sorted by rating
-- More efficient than full table scan when filtering active companions
CREATE INDEX IF NOT EXISTS idx_companion_browse_active
ON "CompanionProfile" ("rating_avg" DESC, "total_bookings" DESC)
WHERE "is_active" = true AND "is_hidden" = false;

-- Companion browsing by province (location-based filtering)
CREATE INDEX IF NOT EXISTS idx_companion_province_active
ON "CompanionProfile" ("province", "rating_avg" DESC)
WHERE "is_active" = true AND "is_hidden" = false;

-- Payment webhook lookups by external payment ID (partial index for non-null values)
CREATE INDEX IF NOT EXISTS idx_payment_external_id
ON "Payment" ("external_payment_id")
WHERE "external_payment_id" IS NOT NULL;

-- User blocks lookup (for filtering blocked users in browse)
-- Used in browseCompanions() to exclude blocked users
CREATE INDEX IF NOT EXISTS idx_user_block_blocker
ON "UserBlock" ("blocker_id");

CREATE INDEX IF NOT EXISTS idx_user_block_blocked
ON "UserBlock" ("blocked_id");

-- Conversation lookups by participants (for chat list)
CREATE INDEX IF NOT EXISTS idx_conversation_participant1
ON "Conversation" ("participant1_id", "updated_at" DESC);

CREATE INDEX IF NOT EXISTS idx_conversation_participant2
ON "Conversation" ("participant2_id", "updated_at" DESC);

-- Message queries by conversation (for chat history)
CREATE INDEX IF NOT EXISTS idx_message_conversation_created
ON "Message" ("conversation_id", "created_at" DESC);

-- Wallet balance lookups by user
CREATE INDEX IF NOT EXISTS idx_wallet_user
ON "Wallet" ("user_id");

-- Withdrawal queries by user and status
CREATE INDEX IF NOT EXISTS idx_withdrawal_user_status
ON "Withdrawal" ("user_id", "status", "created_at" DESC);
