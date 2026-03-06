-- AlterTable User: add role
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "role" TEXT NOT NULL DEFAULT 'user';

-- AlterTable Product: add description, tags; make id default (Prisma uses app-generated cuid)
ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "description" TEXT;
ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "tags" TEXT[] DEFAULT ARRAY[]::TEXT[];

-- Product.id: existing rows keep id; new rows need default. Use gen_random_uuid() for new inserts if not provided.
-- Prisma generates cuid in app, so we leave id as-is (no DB default). Admin creates will pass id from app or use create without id.
