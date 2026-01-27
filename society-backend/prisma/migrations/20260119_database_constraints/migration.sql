-- Database Constraints Migration
-- These constraints cannot be expressed in Prisma schema and must be added via raw SQL
-- Run after applying Prisma migrations

-- ============================================
-- CHECK CONSTRAINTS
-- ============================================

-- Rating constraints (1-5 scale)
ALTER TABLE reviews
ADD CONSTRAINT chk_reviews_rating CHECK (rating >= 1 AND rating <= 5);

-- Trust score constraints (0-100)
ALTER TABLE users
ADD CONSTRAINT chk_users_trust_score CHECK (trust_score >= 0 AND trust_score <= 100);

-- Response rate constraints (0-100%)
ALTER TABLE companions
ADD CONSTRAINT chk_companions_response_rate CHECK (response_rate >= 0 AND response_rate <= 100);

-- Acceptance rate constraints (0-100%)
ALTER TABLE companions
ADD CONSTRAINT chk_companions_acceptance_rate CHECK (acceptance_rate >= 0 AND acceptance_rate <= 100);

-- Rollout percentage constraints (0-100%)
ALTER TABLE feature_flags
ADD CONSTRAINT chk_feature_flags_rollout_percentage CHECK (rollout_percentage >= 0 AND rollout_percentage <= 100);

-- Positive amount constraints for financial tables
ALTER TABLE payments
ADD CONSTRAINT chk_payments_amount_positive CHECK (amount > 0);

ALTER TABLE earnings
ADD CONSTRAINT chk_earnings_amounts_positive CHECK (
  gross_amount > 0 AND
  platform_fee >= 0 AND
  net_amount > 0
);

ALTER TABLE withdrawals
ADD CONSTRAINT chk_withdrawals_amount_positive CHECK (amount > 0);

-- Booking price constraints
ALTER TABLE bookings
ADD CONSTRAINT chk_bookings_prices_positive CHECK (
  base_price >= 0 AND
  platform_fee >= 0 AND
  surge_fee >= 0 AND
  total_price > 0
);

-- Companion rate constraints
ALTER TABLE companions
ADD CONSTRAINT chk_companions_rates_positive CHECK (
  hourly_rate > 0 AND
  (half_day_rate IS NULL OR half_day_rate > 0) AND
  (full_day_rate IS NULL OR full_day_rate > 0)
);

-- Duration constraints
ALTER TABLE bookings
ADD CONSTRAINT chk_bookings_duration_positive CHECK (duration_hours > 0);

-- Datetime ordering constraints
ALTER TABLE bookings
ADD CONSTRAINT chk_bookings_datetime_order CHECK (end_datetime > start_datetime);

ALTER TABLE user_suspensions
ADD CONSTRAINT chk_user_suspensions_datetime_order CHECK (
  suspended_until IS NULL OR suspended_until > suspended_at
);

-- Day of week constraints for availability
ALTER TABLE companion_availability
ADD CONSTRAINT chk_companion_availability_day_of_week CHECK (
  day_of_week IS NULL OR (day_of_week >= 0 AND day_of_week <= 6)
);

-- File size constraints (max 50MB)
ALTER TABLE files
ADD CONSTRAINT chk_files_size_limit CHECK (size_bytes > 0 AND size_bytes <= 52428800);

-- Priority constraints for moderation queue
ALTER TABLE moderation_queue
ADD CONSTRAINT chk_moderation_queue_priority CHECK (priority >= 0);

-- Photo position constraints
ALTER TABLE companion_photos
ADD CONSTRAINT chk_companion_photos_position CHECK (position >= 0);

-- ============================================
-- PARTIAL INDEXES FOR SOFT DELETE
-- These indexes only include non-deleted records for faster queries
-- ============================================

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_active
ON users (id) WHERE deleted_at IS NULL;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_companions_active
ON companions (id) WHERE deleted_at IS NULL;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_hirer_profiles_active
ON hirer_profiles (id) WHERE deleted_at IS NULL;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_bookings_active
ON bookings (id) WHERE deleted_at IS NULL;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_reviews_active
ON reviews (id) WHERE deleted_at IS NULL;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_messages_active
ON messages (id) WHERE deleted_at IS NULL;

-- ============================================
-- PARTIAL INDEXES FOR COMMON QUERIES
-- ============================================

-- Active companions with verified status
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_companions_verified_active
ON companions (rating_avg DESC, total_bookings DESC)
WHERE is_active = true AND is_hidden = false AND verification_status = 'VERIFIED' AND deleted_at IS NULL;

-- Pending booking requests (for expiration job)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_bookings_pending_requests
ON bookings (request_expires_at)
WHERE status = 'PENDING' AND deleted_at IS NULL;

-- Unread notifications
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_notifications_unread
ON notifications (user_id, created_at DESC)
WHERE is_read = false;

-- Active push tokens
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_push_tokens_active
ON push_tokens (user_id)
WHERE is_active = true;

-- Open support tickets
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_support_tickets_open
ON support_tickets (created_at DESC)
WHERE status = 'open';

-- Pending moderation items
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_moderation_queue_pending
ON moderation_queue (priority DESC, created_at)
WHERE status = 'PENDING';

-- Active emergency events
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_emergency_events_active
ON emergency_events (triggered_at DESC)
WHERE status = 'ACTIVE';

-- Available earnings for withdrawal
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_earnings_available
ON earnings (companion_id, net_amount)
WHERE status = 'AVAILABLE';

-- Active profile boosts
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_profile_boosts_active
ON profile_boosts (companion_id, multiplier DESC)
WHERE status = 'ACTIVE';

-- ============================================
-- GIN INDEXES FOR JSONB COLUMNS
-- These enable efficient queries on JSONB data
-- ============================================

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_verifications_metadata
ON verifications USING GIN (metadata);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_payments_provider_response
ON payments USING GIN (provider_response);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_notifications_data
ON notifications USING GIN (data);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_moderation_queue_flags
ON moderation_queue USING GIN (flags);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_files_metadata
ON files USING GIN (metadata);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_files_variants
ON files USING GIN (variants);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_security_events_details
ON security_events USING GIN (details);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_feature_flags_conditions
ON feature_flags USING GIN (conditions);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_feature_flags_user_whitelist
ON feature_flags USING GIN (user_whitelist);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_admin_audit_logs_old_value
ON admin_audit_logs USING GIN (old_value);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_admin_audit_logs_new_value
ON admin_audit_logs USING GIN (new_value);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_system_config_value
ON system_config USING GIN (value);

-- ============================================
-- GIN INDEXES FOR ARRAY COLUMNS
-- ============================================

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_companions_languages
ON companions USING GIN (languages);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_reviews_tags
ON reviews USING GIN (tags);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_reports_evidence_urls
ON reports USING GIN (evidence_urls);
