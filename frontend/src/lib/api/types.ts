// Shared domain types mirrored from backend/prisma/schema.prisma and the
// response shapes documented in backend/README.md. Kept hand-written and
// deliberately minimal (no codegen) since the backend is small and stable.

export interface User {
  id: string;
  name: string;
  email: string;
  avatar: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Project {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  ownerId: string;
  githubRepositoryId: string | null;
  githubBranch: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Workspace {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  ownerId: string;
  createdAt: string;
  updatedAt: string;
}

export type DataSourceProvider = "POSTGRESQL" | "MYSQL";
export type DataSourceStatus = "ACTIVE" | "INACTIVE" | "ERROR";

export interface DataSource {
  id: string;
  projectId: string;
  workspaceId: string;
  name: string;
  provider: DataSourceProvider;
  host: string;
  port: number;
  database: string;
  username: string;
  status: DataSourceStatus;
  lastSyncedAt: string | null;
  lastError: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface DataSourceSyncSummary {
  tablesScanned: number;
  assetsCreated: number;
  assetsUpdated: number;
  schemaChangesDetected: number;
  lineageDiscovered: number;
  lineageCreated: number;
  lineageRemoved: number;
  lineageError: string | null;
}

export interface MetadataColumn {
  id?: string;
  name: string;
  dataType: string;
  description?: string | null;
  isNullable?: boolean;
  ordinal?: number;
}

export interface MetadataSchema {
  id?: string;
  name: string;
  columns: MetadataColumn[];
}

export interface MetadataOwner {
  id: string;
  workspaceId: string;
  name: string;
  email: string | null;
}

export interface MetadataTag {
  id: string;
  workspaceId: string;
  name: string;
  description: string | null;
}

export interface MetadataDomain {
  id: string;
  workspaceId: string;
  name: string;
  description: string | null;
}

export interface MetadataAsset {
  id: string;
  projectId: string;
  workspaceId: string;
  dataSourceId: string | null;
  name: string;
  description: string | null;
  qualifiedName: string | null;
  assetType: string;
  domainId: string | null;
  domain?: MetadataDomain | null;
  owners?: MetadataOwner[];
  tags?: MetadataTag[];
  schemas?: MetadataSchema[];
  dataSource?: { id: string; name: string; provider: DataSourceProvider } | null;
  createdAt: string;
  updatedAt: string;
}

export type LineageRelationshipType = "UPSTREAM" | "DOWNSTREAM" | "DERIVED_FROM" | "READS_FROM" | "WRITES_TO";

export interface LineageGraphNode {
  id: string;
  position: { x: number; y: number };
  data: { label: string; depth: number };
}

export interface LineageGraphEdge {
  id: string;
  source: string;
  target: string;
  label: string;
}

export interface LineageGraph {
  nodes: LineageGraphNode[];
  edges: LineageGraphEdge[];
}

export interface ImpactAnalysis {
  asset: MetadataAsset;
  affectedAssets: Array<{ id: string; name: string; depth: number }>;
  affectedDashboards: Array<{ id: string; name: string; depth: number }>;
  affectedModels: Array<{ id: string; name: string; depth: number }>;
  affectedPipelines: Array<{ id: string; name: string; depth: number }>;
  totalImpact: number;
}

export type SchemaChangeType = "COLUMN_ADDED" | "COLUMN_REMOVED" | "COLUMN_RENAMED" | "TYPE_CHANGED" | "NULLABLE_CHANGED";
export type SchemaChangeSeverity = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

export interface SchemaChange {
  type: SchemaChangeType;
  column: string;
  severity: SchemaChangeSeverity;
  [key: string]: unknown;
}

export type DataIncidentStatus = "OPEN" | "INVESTIGATING" | "RESOLVED" | "FAILED";
export type DataIncidentSeverity = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
export type InvestigationStage =
  | "PENDING"
  | "PLANNING"
  | "INVESTIGATING"
  | "ANALYZING_IMPACT"
  | "GENERATING_FIX"
  | "DOCUMENTING"
  | "COMPLETED"
  | "FAILED";
export type FixApprovalStatus = "PROPOSED" | "VALIDATED" | "AWAITING_APPROVAL" | "APPROVED" | "REJECTED" | "PR_CREATED" | "RESOLVED";

export interface Investigation {
  id: string;
  projectId: string;
  workspaceId: string;
  title: string;
  description: string | null;
  status: DataIncidentStatus;
  severity: DataIncidentSeverity;
  rootCause: string | null;
  stage: InvestigationStage;
  error: string | null;
  fixApprovalStatus: FixApprovalStatus | null;
  impact?: { summary?: { totalAffected: number }; categories?: Record<string, number>; risk?: string } | null;
  proposedFix?: ProposedFix | null;
  createdAt: string;
  updatedAt: string;
}

export interface ProposedFix {
  status: string;
  fixType: string;
  summary: string;
  sql: string;
  tests: string[];
  files: string[];
  risk: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL" | string;
}

export interface InvestigationReport {
  complete: boolean;
  stage: InvestigationStage;
  rootCause: { type: string; column?: string; confidence: number; description: string } | null;
  evidence: Array<{ asset: string; finding: string }>;
  lineage: string[];
  impact: {
    summary: { totalAffected: number };
    categories: { dashboards: number; mlModels: number; pipelines: number; datasets: number };
    risk: string;
  } | null;
  proposedFix: ProposedFix | null;
  validation: { valid: boolean; risk: string; warnings: string[]; blocked: boolean } | null;
  github: { branch: string; prNumber: number; prUrl: string } | null;
  documentation: { rootCause: string; resolution: { status: string; timestamp: string }; recommendations: string[] } | null;
  timeline: Array<{ type: string; message: string; createdAt: string }>;
  recommendation: string | null;
}

export type IncidentEventType =
  | "INVESTIGATION_STARTED"
  | "ASSET_RESOLVED"
  | "ROOT_CAUSE_FOUND"
  | "IMPACT_ANALYZED"
  | "FIX_GENERATED"
  | "FIX_VALIDATED"
  | "AWAITING_APPROVAL"
  | "FIX_APPROVED"
  | "FIX_REJECTED"
  | "GITHUB_BRANCH_CREATED"
  | "GITHUB_PR_CREATED"
  | "GITHUB_PR_MERGED"
  | "GITHUB_PR_CLOSED"
  | "DOCUMENTATION_GENERATED"
  | "INCIDENT_RESOLVED";

export interface TimelineEvent {
  id: string;
  incidentId: string;
  type: IncidentEventType;
  message: string;
  metadata: Record<string, unknown> | null;
  createdAt: string;
}

export interface FixDetail {
  fix: ProposedFix | null;
  status: FixApprovalStatus | null;
  validation: { valid: boolean; risk: string; warnings: string[]; blocked: boolean } | null;
  github: { branch: string; prNumber: number; prUrl: string } | null;
}

export interface GitHubStatus {
  connected: boolean;
  githubLogin: string | null;
  githubAvatarUrl: string | null;
  connectedAt: string | null;
}

export interface GitHubAccount {
  login: string;
  name: string | null;
  avatarUrl: string;
  htmlUrl: string;
  publicRepos: number;
}

export interface GitHubRepository {
  id: string;
  owner: string;
  name: string;
  fullName: string;
  private: boolean;
  defaultBranch: string;
  htmlUrl: string;
  permissions: { pull: boolean; push: boolean; admin: boolean } | null;
}
