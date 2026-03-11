-- AlterTable User: optional password (for Google sign-in), add google_id
ALTER TABLE "User" ALTER COLUMN "password_hash" DROP NOT NULL;
ALTER TABLE "User" ADD COLUMN "google_id" TEXT;
CREATE UNIQUE INDEX "User_google_id_key" ON "User"("google_id");

-- CreateTable OtpCode
CREATE TABLE "otp_codes" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "otp_codes_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "otp_codes_user_id_idx" ON "otp_codes"("user_id");
CREATE INDEX "otp_codes_expires_at_idx" ON "otp_codes"("expires_at");
ALTER TABLE "otp_codes" ADD CONSTRAINT "otp_codes_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AlterTable Address: add phone
ALTER TABLE "Address" ADD COLUMN "phone" TEXT;
