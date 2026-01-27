-- Remove SWIPE_RIGHT and SWIPE_LEFT from InteractionEventType enum
-- PostgreSQL doesn't support ALTER TYPE ... DROP VALUE, so we need to recreate the enum

-- Step 1: Create new enum without swipe values
CREATE TYPE "InteractionEventType_new" AS ENUM (
  'VIEW',
  'PROFILE_OPEN',
  'BOOKMARK',
  'UNBOOKMARK',
  'MESSAGE_SENT',
  'BOOKING_STARTED',
  'BOOKING_COMPLETED',
  'BOOKING_CANCELLED'
);

-- Step 2: Alter the table to use the new enum
-- This will fail if any rows contain SWIPE_RIGHT or SWIPE_LEFT values
ALTER TABLE "user_interactions"
  ALTER COLUMN "event_type" TYPE "InteractionEventType_new"
  USING ("event_type"::text::"InteractionEventType_new");

-- Step 3: Drop old enum and rename new one
DROP TYPE "InteractionEventType";
ALTER TYPE "InteractionEventType_new" RENAME TO "InteractionEventType";
