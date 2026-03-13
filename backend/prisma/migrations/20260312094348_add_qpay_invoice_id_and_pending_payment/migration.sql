-- AlterEnum
ALTER TYPE "OrderStatus" ADD VALUE 'pending_payment';

-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "qpay_invoice_id" TEXT;
