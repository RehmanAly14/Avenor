-- CreateEnum
CREATE TYPE "GitHubConnectionStatus" AS ENUM ('ACTIVE', 'REVOKED');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "IncidentEventType" ADD VALUE 'GITHUB_PR_MERGED';
ALTER TYPE "IncidentEventType" ADD VALUE 'GITHUB_PR_CLOSED';

-- AlterTable
ALTER TABLE "projects" ADD COLUMN     "github_branch" TEXT,
ADD COLUMN     "github_repository_id" TEXT;

-- CreateTable
CREATE TABLE "github_connections" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "github_user_id" TEXT NOT NULL,
    "github_login" TEXT NOT NULL,
    "github_avatar_url" TEXT,
    "encrypted_access_token" TEXT NOT NULL,
    "scope" TEXT,
    "status" "GitHubConnectionStatus" NOT NULL DEFAULT 'ACTIVE',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "github_connections_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "github_repositories" (
    "id" TEXT NOT NULL,
    "connection_id" TEXT NOT NULL,
    "github_repository_id" TEXT NOT NULL,
    "owner" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "full_name" TEXT NOT NULL,
    "private" BOOLEAN NOT NULL DEFAULT false,
    "default_branch" TEXT NOT NULL DEFAULT 'main',
    "html_url" TEXT NOT NULL,
    "permissions" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "github_repositories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "github_oauth_states" (
    "id" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "used_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "github_oauth_states_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "github_connections_user_id_idx" ON "github_connections"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "github_connections_user_id_github_user_id_key" ON "github_connections"("user_id", "github_user_id");

-- CreateIndex
CREATE INDEX "github_repositories_connection_id_idx" ON "github_repositories"("connection_id");

-- CreateIndex
CREATE UNIQUE INDEX "github_repositories_connection_id_github_repository_id_key" ON "github_repositories"("connection_id", "github_repository_id");

-- CreateIndex
CREATE UNIQUE INDEX "github_oauth_states_state_key" ON "github_oauth_states"("state");

-- CreateIndex
CREATE INDEX "github_oauth_states_user_id_idx" ON "github_oauth_states"("user_id");

-- CreateIndex
CREATE INDEX "projects_github_repository_id_idx" ON "projects"("github_repository_id");

-- AddForeignKey
ALTER TABLE "projects" ADD CONSTRAINT "projects_github_repository_id_fkey" FOREIGN KEY ("github_repository_id") REFERENCES "github_repositories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "github_connections" ADD CONSTRAINT "github_connections_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "github_repositories" ADD CONSTRAINT "github_repositories_connection_id_fkey" FOREIGN KEY ("connection_id") REFERENCES "github_connections"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "github_oauth_states" ADD CONSTRAINT "github_oauth_states_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
