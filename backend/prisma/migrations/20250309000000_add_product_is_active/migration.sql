-- AlterTable Product: add is_active
ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "is_active" BOOLEAN NOT NULL DEFAULT true;
