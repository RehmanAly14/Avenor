-- CreateEnum
CREATE TYPE "MetadataLineageType" AS ENUM ('UPSTREAM', 'DOWNSTREAM', 'DERIVED_FROM', 'READS_FROM', 'WRITES_TO');

-- CreateEnum
CREATE TYPE "DataIncidentStatus" AS ENUM ('OPEN', 'INVESTIGATING', 'RESOLVED', 'FAILED');

-- CreateEnum
CREATE TYPE "DataIncidentSeverity" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');

-- CreateTable
CREATE TABLE "metadata_lineages" (
    "id" TEXT NOT NULL,
    "project_id" TEXT NOT NULL,
    "workspace_id" TEXT NOT NULL,
    "source_asset_id" TEXT NOT NULL,
    "target_asset_id" TEXT NOT NULL,
    "relationship_type" "MetadataLineageType" NOT NULL,
    "confidence" DOUBLE PRECISION NOT NULL DEFAULT 1.0,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "metadata_lineages_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "metadata_lineages_no_self_reference" CHECK ("source_asset_id" <> "target_asset_id")
);

-- CreateTable
CREATE TABLE "data_incidents" (
    "id" TEXT NOT NULL,
    "project_id" TEXT NOT NULL,
    "workspace_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "status" "DataIncidentStatus" NOT NULL DEFAULT 'OPEN',
    "severity" "DataIncidentSeverity" NOT NULL DEFAULT 'MEDIUM',
    "root_cause" TEXT,
    "affected_assets" JSONB,
    "resolution" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "data_incidents_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "metadata_lineages_project_id_idx" ON "metadata_lineages"("project_id");

-- CreateIndex
CREATE INDEX "metadata_lineages_workspace_id_idx" ON "metadata_lineages"("workspace_id");

-- CreateIndex
CREATE INDEX "metadata_lineages_source_asset_id_idx" ON "metadata_lineages"("source_asset_id");

-- CreateIndex
CREATE INDEX "metadata_lineages_target_asset_id_idx" ON "metadata_lineages"("target_asset_id");

-- CreateIndex
CREATE INDEX "metadata_lineages_relationship_type_idx" ON "metadata_lineages"("relationship_type");

-- CreateIndex
CREATE UNIQUE INDEX "metadata_lineages_source_asset_id_target_asset_id_relations_key" ON "metadata_lineages"("source_asset_id", "target_asset_id", "relationship_type");

-- CreateIndex
CREATE INDEX "data_incidents_project_id_idx" ON "data_incidents"("project_id");

-- CreateIndex
CREATE INDEX "data_incidents_workspace_id_idx" ON "data_incidents"("workspace_id");

-- CreateIndex
CREATE INDEX "data_incidents_status_idx" ON "data_incidents"("status");

-- CreateIndex
CREATE INDEX "data_incidents_severity_idx" ON "data_incidents"("severity");

-- AddForeignKey
ALTER TABLE "metadata_lineages" ADD CONSTRAINT "metadata_lineages_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "metadata_lineages" ADD CONSTRAINT "metadata_lineages_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "metadata_lineages" ADD CONSTRAINT "metadata_lineages_source_asset_id_fkey" FOREIGN KEY ("source_asset_id") REFERENCES "metadata_assets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "metadata_lineages" ADD CONSTRAINT "metadata_lineages_target_asset_id_fkey" FOREIGN KEY ("target_asset_id") REFERENCES "metadata_assets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "data_incidents" ADD CONSTRAINT "data_incidents_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "data_incidents" ADD CONSTRAINT "data_incidents_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;
