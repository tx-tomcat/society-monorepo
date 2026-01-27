-- AlterTable: Add phone verification fields to users table
ALTER TABLE "users" ADD COLUMN "phone_hash" TEXT;
ALTER TABLE "users" ADD COLUMN "is_phone_verified" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "users" ADD COLUMN "phone_verified_at" TIMESTAMP(3);

-- CreateIndex: Unique constraint on phone_hash for duplicate detection
CREATE UNIQUE INDEX "users_phone_hash_key" ON "users"("phone_hash");

-- CreateIndex: Index on phone_hash for faster lookups
CREATE INDEX "users_phone_hash_idx" ON "users"("phone_hash");
