-- Fix earnings where companionId incorrectly references User.id instead of CompanionProfile.id
-- Run this script manually after db push: psql $DATABASE_URL -f prisma/scripts/fix-earnings-companion-id.sql

-- Update earnings to use the correct CompanionProfile.id based on booking relationship
UPDATE "Earning" e
SET "companionId" = cp.id
FROM "Booking" b
INNER JOIN "CompanionProfile" cp ON cp."userId" = b."companionId"
WHERE e."bookingId" = b.id
  AND e."companionId" != cp.id;

-- Show affected rows
SELECT 'Fixed earnings count:' as message, count(*) as count
FROM "Earning" e
INNER JOIN "CompanionProfile" cp ON e."companionId" = cp.id;
