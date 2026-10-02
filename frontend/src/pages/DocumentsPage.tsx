import { useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { FileText, UploadCloud, Trash2, FolderOpen } from "lucide-react";
import { Button } from "../components/ui/Button";
import { Badge } from "../components/ui/Badge";
import { Skeleton } from "../components/ui/Skeleton";
import { EmptyState } from "../components/ui/EmptyState";
import { ErrorState } from "../components/ui/ErrorState";
import { ConfirmDialog } from "../components/ui/ConfirmDialog";
import { Table, TableContainer, TableHeader, TableBody, TableRow, TableHead, TableCell } from "../components/ui/Table";
import { useToast } from "../components/ui/Toast";
import * as documentsApi from "../lib/api/documents";
import type { DocumentStatus } from "../lib/api/documents";
import { useWorkspace } from "../context/WorkspaceContext";
import { ApiError } from "../lib/api/client";
import { formatFileSize, formatRelativeTime } from "../utils/format";
import { cn } from "../utils/cn";

const STATUS_TONE: Record<DocumentStatus, "success" | "neutral" | "danger"> = {
  UPLOADED: "success",
  PENDING: "neutral",
  FAILED: "danger",
};

export default function DocumentsPage() {
  const { currentWorkspace, currentProject, hasWorkspace, hasProject } = useWorkspace();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragActive, setDragActive] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["documents", currentWorkspace?.id, currentProject?.id],
    queryFn: () => documentsApi.listDocuments({ workspaceId: currentWorkspace?.id, projectId: currentProject?.id, limit: 100 }),
    enabled: hasWorkspace && hasProject,
  });

  const uploadMutation = useMutation({
    mutationFn: (file: File) => documentsApi.uploadDocument({ projectId: currentProject!.id, workspaceId: currentWorkspace!.id, file }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["documents"] });
      toast({ title: "Document uploaded", variant: "success" });
    },
    onError: (err) => toast({ title: "Upload failed", description: err instanceof ApiError ? err.message : undefined, variant: "error" }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => documentsApi.deleteDocument(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["documents"] });
      setDeleteTarget(null);
      toast({ title: "Document deleted", variant: "info" });
    },
  });

  const documents = data?.documents ?? [];
  const canUpload = hasWorkspace && hasProject;

  const handleFiles = (files: FileList | null) => {
    if (!files || files.length === 0 || !canUpload) return;
    Array.from(files).forEach((file) => uploadMutation.mutate(file));
  };

  return (
    <div className="mx-auto max-w-6xl space-y-6 px-4 py-8 md:px-8">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-text-primary">Documents</h1>
          <p className="mt-1 text-sm text-text-secondary">Reference material Avenor can draw on — runbooks, schemas, incident notes.</p>
        </div>
        <Button onClick={() => fileInputRef.current?.click()} disabled={!canUpload}>
          <UploadCloud className="h-4 w-4" /> Upload Document
        </Button>
        <input ref={fileInputRef} type="file" multiple className="hidden" onChange={(e) => handleFiles(e.target.files)} />
      </div>

      {!canUpload ? (
        <EmptyState icon={<FolderOpen className="h-5 w-5" />} title="Select a workspace and project" description="Use the switcher in the sidebar to pick a workspace and project first." />
      ) : (
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragActive(true);
          }}
          onDragLeave={() => setDragActive(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragActive(false);
            handleFiles(e.dataTransfer.files);
          }}
          className={cn(
            "flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed px-6 py-10 text-center transition-colors",
            dragActive ? "border-accent bg-accent-muted" : "border-border bg-surface"
          )}
        >
          <UploadCloud className={cn("h-6 w-6", dragActive ? "text-accent" : "text-text-tertiary")} />
          <p className="text-sm font-medium text-text-primary">Drag and drop files here</p>
          <p className="text-xs text-text-tertiary">
            or{" "}
            <button onClick={() => fileInputRef.current?.click()} className="font-medium text-accent hover:underline">
              browse from your computer
            </button>
          </p>
        </div>
      )}

      {isError ? (
        <ErrorState description="We couldn't load your documents." onRetry={() => refetch()} />
      ) : isLoading ? (
        <div className="space-y-2">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      ) : documents.length === 0 ? (
        canUpload && (
          <EmptyState
            icon={<FileText className="h-5 w-5" />}
            title="No documents yet"
            description="Upload runbooks, schema docs, or incident notes so Avenor can reference them during investigations."
          />
        )
      ) : (
        <TableContainer>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>File</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Size</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Uploaded</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {documents.map((doc) => (
                <TableRow key={doc.id}>
                  <TableCell>
                    <div className="flex items-center gap-2.5">
                      <FileText className="h-4 w-4 shrink-0 text-text-tertiary" />
                      <span className="truncate font-medium">{doc.filename}</span>
                    </div>
                  </TableCell>
                  <TableCell className="font-mono text-xs text-text-tertiary">{doc.mimeType}</TableCell>
                  <TableCell className="text-text-secondary">{formatFileSize(doc.fileSize)}</TableCell>
                  <TableCell>
                    <Badge tone={STATUS_TONE[doc.status]}>{doc.status}</Badge>
                  </TableCell>
                  <TableCell className="text-text-tertiary">{formatRelativeTime(doc.createdAt)}</TableCell>
                  <TableCell>
                    <button
                      onClick={() => setDeleteTarget(doc.id)}
                      className="rounded p-1.5 text-text-tertiary hover:bg-danger-muted hover:text-danger"
                      aria-label={`Delete ${doc.filename}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title="Delete this document?"
        description="This can't be undone."
        confirmLabel="Delete"
        variant="danger"
        loading={deleteMutation.isPending}
        onConfirm={() => deleteTarget && deleteMutation.mutate(deleteTarget)}
      />
    </div>
  );
}
