-- CreateEnum
CREATE TYPE "FixApprovalStatus" AS ENUM ('PROPOSED', 'VALIDATED', 'AWAITING_APPROVAL', 'APPROVED', 'REJECTED', 'PR_CREATED', 'RESOLVED');

-- CreateEnum
CREATE TYPE "IncidentEventType" AS ENUM ('INVESTIGATION_STARTED', 'ASSET_RESOLVED', 'ROOT_CAUSE_FOUND', 'IMPACT_ANALYZED', 'FIX_GENERATED', 'FIX_VALIDATED', 'AWAITING_APPROVAL', 'FIX_APPROVED', 'FIX_REJECTED', 'GITHUB_BRANCH_CREATED', 'GITHUB_PR_CREATED', 'DOCUMENTATION_GENERATED', 'INCIDENT_RESOLVED');

-- AlterTable
ALTER TABLE "data_incidents" ADD COLUMN     "approved_at" TIMESTAMP(3),
ADD COLUMN     "fix_approval_status" "FixApprovalStatus",
ADD COLUMN     "fix_validation" JSONB,
ADD COLUMN     "github_pr" JSONB,
ADD COLUMN     "rejected_at" TIMESTAMP(3),
ADD COLUMN     "rejection_reason" TEXT;

-- CreateTable
CREATE TABLE "incident_events" (
    "id" TEXT NOT NULL,
    "incident_id" TEXT NOT NULL,
    "type" "IncidentEventType" NOT NULL,
    "message" TEXT NOT NULL,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "incident_events_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "incident_events_incident_id_idx" ON "incident_events"("incident_id");

-- CreateIndex
CREATE INDEX "incident_events_type_idx" ON "incident_events"("type");

-- CreateIndex
CREATE INDEX "data_incidents_fix_approval_status_idx" ON "data_incidents"("fix_approval_status");

-- AddForeignKey
ALTER TABLE "incident_events" ADD CONSTRAINT "incident_events_incident_id_fkey" FOREIGN KEY ("incident_id") REFERENCES "data_incidents"("id") ON DELETE CASCADE ON UPDATE CASCADE;
