import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { FolderKanban, Plus, Trash2, MoreVertical, GitBranch } from "lucide-react";
import { Button } from "../components/ui/Button";
import { Card, CardContent } from "../components/ui/Card";
import { Badge } from "../components/ui/Badge";
import { EmptyState } from "../components/ui/EmptyState";
import { Modal } from "../components/ui/Modal";
import { Input, Label, Textarea } from "../components/ui/Input";
import { ConfirmDialog } from "../components/ui/ConfirmDialog";
import { Dropdown, DropdownTrigger, DropdownContent, DropdownItem } from "../components/ui/Dropdown";
import { useToast } from "../components/ui/Toast";
import * as projectsApi from "../lib/api/projects";
import { useWorkspace } from "../context/WorkspaceContext";
import { ApiError } from "../lib/api/client";

export default function ProjectsPage() {
  const { projects, isLoading, setCurrentProjectSlug } = useWorkspace();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [createOpen, setCreateOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [form, setForm] = useState({ name: "", description: "" });
  const [formError, setFormError] = useState<string | null>(null);

  const createMutation = useMutation({
    mutationFn: () => projectsApi.createProject({ name: form.name, description: form.description || null }),
    onSuccess: (project) => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      setCurrentProjectSlug(project.slug);
      setCreateOpen(false);
      setForm({ name: "", description: "" });
      toast({ title: "Project created", variant: "success" });
    },
    onError: (err) => setFormError(err instanceof ApiError ? err.message : "Couldn't create this project."),
  });

  const deleteMutation = useMutation({
    mutationFn: (slug: string) => projectsApi.deleteProject(slug),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      setDeleteTarget(null);
      toast({ title: "Project deleted", variant: "info" });
    },
  });

  return (
    <div className="mx-auto max-w-6xl space-y-6 px-4 py-8 md:px-8">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-text-primary">Projects</h1>
          <p className="mt-1 text-sm text-text-secondary">Containers for data sources, assets, and investigations.</p>
        </div>
        <Button onClick={() => setCreateOpen(true)}>
          <Plus className="h-4 w-4" /> New Project
        </Button>
      </div>

      {isLoading ? null : projects.length === 0 ? (
        <EmptyState icon={<FolderKanban className="h-5 w-5" />} title="No projects yet" description="Create a project to start connecting data sources and running investigations." action={<Button onClick={() => setCreateOpen(true)}>New Project</Button>} />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {projects.map((project) => (
            <Card key={project.id}>
              <CardContent className="space-y-2.5">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <FolderKanban className="h-4 w-4 text-text-tertiary" />
                    <p className="text-sm font-medium text-text-primary">{project.name}</p>
                  </div>
                  <Dropdown>
                    <DropdownTrigger asChild>
                      <button className="rounded p-1 text-text-tertiary hover:bg-surface-elevated hover:text-text-primary">
                        <MoreVertical className="h-4 w-4" />
                      </button>
                    </DropdownTrigger>
                    <DropdownContent>
                      <DropdownItem onSelect={() => setDeleteTarget(project.slug)} className="text-danger hover:text-danger">
                        <Trash2 className="h-3.5 w-3.5" /> Delete
                      </DropdownItem>
                    </DropdownContent>
                  </Dropdown>
                </div>
                {project.description && <p className="line-clamp-2 text-xs text-text-secondary">{project.description}</p>}
                <div className="flex items-center gap-2 pt-1">
                  <Badge tone="neutral">{project.slug}</Badge>
                  {project.githubRepositoryId ? (
                    <Badge tone="success">
                      <GitBranch className="h-3 w-3" /> Connected
                    </Badge>
                  ) : (
                    <Badge tone="neutral">No repository</Badge>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Modal open={createOpen} onOpenChange={setCreateOpen} title="New project">
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
            <Label htmlFor="project-name">Name</Label>
            <Input id="project-name" required minLength={2} value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="Revenue Analytics" />
          </div>
          <div>
            <Label htmlFor="project-description">Description (optional)</Label>
            <Textarea id="project-description" rows={3} value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} />
          </div>
          <Button type="submit" className="w-full" loading={createMutation.isPending}>
            Create project
          </Button>
        </form>
      </Modal>

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title="Delete this project?"
        description="This cannot be undone."
        confirmLabel="Delete"
        variant="danger"
        loading={deleteMutation.isPending}
        onConfirm={() => deleteTarget && deleteMutation.mutate(deleteTarget)}
      />
    </div>
  );
}
