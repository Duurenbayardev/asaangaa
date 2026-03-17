-- CreateTable
CREATE TABLE "product_images" (
    "id" TEXT NOT NULL,
    "mime_type" TEXT NOT NULL,
    "data" BYTEA NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "product_images_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "product_images_created_at_idx" ON "product_images"("created_at");
