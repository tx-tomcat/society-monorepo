-- CreateEnum
CREATE TYPE "InteractionEventType" AS ENUM ('VIEW', 'PROFILE_OPEN', 'SWIPE_RIGHT', 'SWIPE_LEFT', 'BOOKMARK', 'UNBOOKMARK', 'MESSAGE_SENT', 'BOOKING_STARTED', 'BOOKING_COMPLETED', 'BOOKING_CANCELLED');

-- CreateTable
CREATE TABLE "user_interactions" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "companion_id" UUID NOT NULL,
    "event_type" "InteractionEventType" NOT NULL,
    "event_value" DECIMAL(4,2) NOT NULL DEFAULT 0,
    "dwell_time_ms" INTEGER,
    "session_id" TEXT,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_interactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "recommendation_cache" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "companions" JSONB NOT NULL,
    "algorithm_ver" TEXT NOT NULL DEFAULT 'v1',
    "expires_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "recommendation_cache_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "user_interactions_user_id_created_at_idx" ON "user_interactions"("user_id", "created_at" DESC);

-- CreateIndex
CREATE INDEX "user_interactions_companion_id_created_at_idx" ON "user_interactions"("companion_id", "created_at" DESC);

-- CreateIndex
CREATE INDEX "user_interactions_user_id_companion_id_event_type_idx" ON "user_interactions"("user_id", "companion_id", "event_type");

-- CreateIndex
CREATE UNIQUE INDEX "recommendation_cache_user_id_key" ON "recommendation_cache"("user_id");

-- CreateIndex
CREATE INDEX "recommendation_cache_expires_at_idx" ON "recommendation_cache"("expires_at");
