-- CreateEnum
CREATE TYPE "InvestigationStage" AS ENUM ('PENDING', 'PLANNING', 'INVESTIGATING', 'ANALYZING_IMPACT', 'GENERATING_FIX', 'DOCUMENTING', 'COMPLETED', 'FAILED');

-- AlterTable
ALTER TABLE "data_incidents" ADD COLUMN     "documentation" JSONB,
ADD COLUMN     "error" TEXT,
ADD COLUMN     "evidence" JSONB,
ADD COLUMN     "impact" JSONB,
ADD COLUMN     "plan" JSONB,
ADD COLUMN     "proposed_fix" JSONB,
ADD COLUMN     "stage" "InvestigationStage" NOT NULL DEFAULT 'PENDING';

-- CreateIndex
CREATE INDEX "data_incidents_stage_idx" ON "data_incidents"("stage");
