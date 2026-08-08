-- CreateEnum
CREATE TYPE "DataSourceProvider" AS ENUM ('POSTGRESQL', 'MYSQL');
CREATE TYPE "DataSourceStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'ERROR');
CREATE TYPE "DocumentStatus" AS ENUM ('UPLOADED', 'PENDING', 'FAILED');

CREATE TABLE "data_sources" (
  "id" TEXT NOT NULL, "project_id" TEXT NOT NULL, "workspace_id" TEXT NOT NULL,
  "name" TEXT NOT NULL, "provider" "DataSourceProvider" NOT NULL, "host" TEXT NOT NULL,
  "port" INTEGER NOT NULL, "database" TEXT NOT NULL, "username" TEXT NOT NULL,
  "encrypted_password" TEXT NOT NULL, "status" "DataSourceStatus" NOT NULL DEFAULT 'ACTIVE',
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "data_sources_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "metadata_domains" (
  "id" TEXT NOT NULL, "workspace_id" TEXT NOT NULL, "name" TEXT NOT NULL, "description" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "metadata_domains_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "metadata_assets" (
  "id" TEXT NOT NULL, "project_id" TEXT NOT NULL, "workspace_id" TEXT NOT NULL,
  "data_source_id" TEXT, "name" TEXT NOT NULL, "description" TEXT, "qualified_name" TEXT,
  "asset_type" TEXT NOT NULL DEFAULT 'TABLE', "domain_id" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "metadata_assets_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "metadata_schemas" (
  "id" TEXT NOT NULL, "asset_id" TEXT NOT NULL, "name" TEXT NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "metadata_schemas_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "metadata_columns" (
  "id" TEXT NOT NULL, "schema_id" TEXT NOT NULL, "name" TEXT NOT NULL, "data_type" TEXT NOT NULL,
  "description" TEXT, "is_nullable" BOOLEAN NOT NULL DEFAULT true, "ordinal" INTEGER NOT NULL DEFAULT 0,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "metadata_columns_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "metadata_owners" (
  "id" TEXT NOT NULL, "workspace_id" TEXT NOT NULL, "name" TEXT NOT NULL, "email" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "metadata_owners_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "metadata_tags" (
  "id" TEXT NOT NULL, "workspace_id" TEXT NOT NULL, "name" TEXT NOT NULL, "description" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "metadata_tags_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "documents" (
  "id" TEXT NOT NULL, "project_id" TEXT NOT NULL, "workspace_id" TEXT NOT NULL, "filename" TEXT NOT NULL,
  "file_size" INTEGER NOT NULL, "mime_type" TEXT NOT NULL, "storage_path" TEXT NOT NULL,
  "status" "DocumentStatus" NOT NULL DEFAULT 'UPLOADED', "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL, CONSTRAINT "documents_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "_MetadataAssetToMetadataOwner" ("A" TEXT NOT NULL, "B" TEXT NOT NULL);
CREATE TABLE "_MetadataAssetToMetadataTag" ("A" TEXT NOT NULL, "B" TEXT NOT NULL);

CREATE UNIQUE INDEX "data_sources_workspace_id_name_key" ON "data_sources"("workspace_id", "name");
CREATE INDEX "data_sources_project_id_idx" ON "data_sources"("project_id");
CREATE INDEX "data_sources_workspace_id_idx" ON "data_sources"("workspace_id");
CREATE UNIQUE INDEX "metadata_domains_workspace_id_name_key" ON "metadata_domains"("workspace_id", "name");
CREATE INDEX "metadata_domains_workspace_id_idx" ON "metadata_domains"("workspace_id");
CREATE UNIQUE INDEX "metadata_assets_qualified_name_key" ON "metadata_assets"("qualified_name");
CREATE INDEX "metadata_assets_project_id_idx" ON "metadata_assets"("project_id");
CREATE INDEX "metadata_assets_workspace_id_idx" ON "metadata_assets"("workspace_id");
CREATE INDEX "metadata_assets_data_source_id_idx" ON "metadata_assets"("data_source_id");
CREATE INDEX "metadata_assets_domain_id_idx" ON "metadata_assets"("domain_id");
CREATE INDEX "metadata_assets_name_idx" ON "metadata_assets"("name");
CREATE UNIQUE INDEX "metadata_schemas_asset_id_name_key" ON "metadata_schemas"("asset_id", "name");
CREATE INDEX "metadata_schemas_asset_id_idx" ON "metadata_schemas"("asset_id");
CREATE UNIQUE INDEX "metadata_columns_schema_id_name_key" ON "metadata_columns"("schema_id", "name");
CREATE INDEX "metadata_columns_schema_id_idx" ON "metadata_columns"("schema_id");
CREATE UNIQUE INDEX "metadata_owners_workspace_id_name_key" ON "metadata_owners"("workspace_id", "name");
CREATE INDEX "metadata_owners_workspace_id_idx" ON "metadata_owners"("workspace_id");
CREATE UNIQUE INDEX "metadata_tags_workspace_id_name_key" ON "metadata_tags"("workspace_id", "name");
CREATE INDEX "metadata_tags_workspace_id_idx" ON "metadata_tags"("workspace_id");
CREATE UNIQUE INDEX "documents_storage_path_key" ON "documents"("storage_path");
CREATE INDEX "documents_project_id_idx" ON "documents"("project_id");
CREATE INDEX "documents_workspace_id_idx" ON "documents"("workspace_id");
CREATE UNIQUE INDEX "_MetadataAssetToMetadataOwner_AB_unique" ON "_MetadataAssetToMetadataOwner"("A", "B");
CREATE INDEX "_MetadataAssetToMetadataOwner_B_index" ON "_MetadataAssetToMetadataOwner"("B");
CREATE UNIQUE INDEX "_MetadataAssetToMetadataTag_AB_unique" ON "_MetadataAssetToMetadataTag"("A", "B");
CREATE INDEX "_MetadataAssetToMetadataTag_B_index" ON "_MetadataAssetToMetadataTag"("B");

ALTER TABLE "data_sources" ADD CONSTRAINT "data_sources_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "data_sources" ADD CONSTRAINT "data_sources_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "metadata_domains" ADD CONSTRAINT "metadata_domains_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "metadata_assets" ADD CONSTRAINT "metadata_assets_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "metadata_assets" ADD CONSTRAINT "metadata_assets_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "metadata_assets" ADD CONSTRAINT "metadata_assets_data_source_id_fkey" FOREIGN KEY ("data_source_id") REFERENCES "data_sources"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "metadata_assets" ADD CONSTRAINT "metadata_assets_domain_id_fkey" FOREIGN KEY ("domain_id") REFERENCES "metadata_domains"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "metadata_schemas" ADD CONSTRAINT "metadata_schemas_asset_id_fkey" FOREIGN KEY ("asset_id") REFERENCES "metadata_assets"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "metadata_columns" ADD CONSTRAINT "metadata_columns_schema_id_fkey" FOREIGN KEY ("schema_id") REFERENCES "metadata_schemas"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "metadata_owners" ADD CONSTRAINT "metadata_owners_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "metadata_tags" ADD CONSTRAINT "metadata_tags_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "documents" ADD CONSTRAINT "documents_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "documents" ADD CONSTRAINT "documents_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "_MetadataAssetToMetadataOwner" ADD CONSTRAINT "_MetadataAssetToMetadataOwner_A_fkey" FOREIGN KEY ("A") REFERENCES "metadata_assets"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "_MetadataAssetToMetadataOwner" ADD CONSTRAINT "_MetadataAssetToMetadataOwner_B_fkey" FOREIGN KEY ("B") REFERENCES "metadata_owners"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "_MetadataAssetToMetadataTag" ADD CONSTRAINT "_MetadataAssetToMetadataTag_A_fkey" FOREIGN KEY ("A") REFERENCES "metadata_assets"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "_MetadataAssetToMetadataTag" ADD CONSTRAINT "_MetadataAssetToMetadataTag_B_fkey" FOREIGN KEY ("B") REFERENCES "metadata_tags"("id") ON DELETE CASCADE ON UPDATE CASCADE;
