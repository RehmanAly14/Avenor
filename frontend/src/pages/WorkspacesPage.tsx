import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Building2, Plus, Trash2, MoreVertical } from "lucide-react";
import { Button } from "../components/ui/Button";
import { Card, CardContent } from "../components/ui/Card";
import { Badge } from "../components/ui/Badge";
import { EmptyState } from "../components/ui/EmptyState";
import { Modal } from "../components/ui/Modal";
import { Input, Label, Textarea } from "../components/ui/Input";
import { ConfirmDialog } from "../components/ui/ConfirmDialog";
import { Dropdown, DropdownTrigger, DropdownContent, DropdownItem } from "../components/ui/Dropdown";
import { useToast } from "../components/ui/Toast";
import * as workspacesApi from "../lib/api/workspaces";
import { useWorkspace } from "../context/WorkspaceContext";
import { ApiError } from "../lib/api/client";

export default function WorkspacesPage() {
  const { workspaces, isLoading, setCurrentWorkspaceSlug } = useWorkspace();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [createOpen, setCreateOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [form, setForm] = useState({ name: "", description: "" });
  const [formError, setFormError] = useState<string | null>(null);

  const createMutation = useMutation({
    mutationFn: () => workspacesApi.createWorkspace({ name: form.name, description: form.description || null }),
    onSuccess: (workspace) => {
      queryClient.invalidateQueries({ queryKey: ["workspaces"] });
      setCurrentWorkspaceSlug(workspace.slug);
      setCreateOpen(false);
      setForm({ name: "", description: "" });
      toast({ title: "Workspace created", variant: "success" });
    },
    onError: (err) => setFormError(err instanceof ApiError ? err.message : "Couldn't create this workspace."),
  });

  const deleteMutation = useMutation({
    mutationFn: (slug: string) => workspacesApi.deleteWorkspace(slug),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["workspaces"] });
      setDeleteTarget(null);
      toast({ title: "Workspace deleted", variant: "info" });
    },
  });

  return (
    <div className="mx-auto max-w-6xl space-y-6 px-4 py-8 md:px-8">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-text-primary">Workspaces</h1>
          <p className="mt-1 text-sm text-text-secondary">The top-level organizational unit for your data and projects.</p>
        </div>
        <Button onClick={() => setCreateOpen(true)}>
          <Plus className="h-4 w-4" /> New Workspace
        </Button>
      </div>

      {isLoading ? null : workspaces.length === 0 ? (
        <EmptyState icon={<Building2 className="h-5 w-5" />} title="No workspaces yet" description="Create a workspace to organize your projects and data sources." action={<Button onClick={() => setCreateOpen(true)}>New Workspace</Button>} />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {workspaces.map((workspace) => (
            <Card key={workspace.id}>
              <CardContent className="space-y-2.5">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <Building2 className="h-4 w-4 text-text-tertiary" />
                    <p className="text-sm font-medium text-text-primary">{workspace.name}</p>
                  </div>
                  <Dropdown>
                    <DropdownTrigger asChild>
                      <button className="rounded p-1 text-text-tertiary hover:bg-surface-elevated hover:text-text-primary">
                        <MoreVertical className="h-4 w-4" />
                      </button>
                    </DropdownTrigger>
                    <DropdownContent>
                      <DropdownItem onSelect={() => setDeleteTarget(workspace.slug)} className="text-danger hover:text-danger">
                        <Trash2 className="h-3.5 w-3.5" /> Delete
                      </DropdownItem>
                    </DropdownContent>
                  </Dropdown>
                </div>
                {workspace.description && <p className="line-clamp-2 text-xs text-text-secondary">{workspace.description}</p>}
                <Badge tone="neutral">{workspace.slug}</Badge>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Modal open={createOpen} onOpenChange={setCreateOpen} title="New workspace">
        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            setFormError(null);
            createMutation.mutate();
          }}
        >
          {formError && <p className="rounded-md border border-danger/30 bg-danger-muted px-3 py-2 text-sm text-danger">{formError}</p>}
          <div>
            <Label htmlFor="workspace-name">Name</Label>
            <Input id="workspace-name" required minLength={2} value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="Acme Data Platform" />
          </div>
          <div>
            <Label htmlFor="workspace-description">Description (optional)</Label>
            <Textarea id="workspace-description" rows={3} value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} />
          </div>
          <Button type="submit" className="w-full" loading={createMutation.isPending}>
            Create workspace
          </Button>
        </form>
      </Modal>

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title="Delete this workspace?"
        description="This cannot be undone."
        confirmLabel="Delete"
        variant="danger"
        loading={deleteMutation.isPending}
        onConfirm={() => deleteTarget && deleteMutation.mutate(deleteTarget)}
      />
    </div>
  );
}
