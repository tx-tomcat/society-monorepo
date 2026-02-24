-- AlterEnum: Add feed-specific interaction event types
ALTER TYPE "InteractionEventType" ADD VALUE 'SKIP';
ALTER TYPE "InteractionEventType" ADD VALUE 'DWELL_VIEW';
ALTER TYPE "InteractionEventType" ADD VALUE 'DWELL_PAUSE';
ALTER TYPE "InteractionEventType" ADD VALUE 'PHOTO_BROWSE';
ALTER TYPE "InteractionEventType" ADD VALUE 'REVISIT';
ALTER TYPE "InteractionEventType" ADD VALUE 'NOT_INTERESTED';
ALTER TYPE "InteractionEventType" ADD VALUE 'SHARE';
