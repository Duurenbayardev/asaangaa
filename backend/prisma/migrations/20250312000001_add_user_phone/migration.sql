-- AlterTable User: add phone for SMS OTP (Mongolian numbers, E.164)
ALTER TABLE "User" ADD COLUMN "phone" TEXT;
