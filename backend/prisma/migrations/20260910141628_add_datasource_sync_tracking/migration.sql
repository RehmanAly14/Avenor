-- AlterTable
ALTER TABLE "data_sources" ADD COLUMN     "last_error" TEXT,
ADD COLUMN     "last_synced_at" TIMESTAMP(3);
