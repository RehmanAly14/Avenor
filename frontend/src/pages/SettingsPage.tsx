import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { GitBranch, Database, ShieldAlert, ArrowRight } from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "../components/ui/Tabs";
import { Card, CardContent } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { Input, Label } from "../components/ui/Input";
import { ConfirmDialog } from "../components/ui/ConfirmDialog";
import { useToast } from "../components/ui/Toast";
import { useAuth } from "../context/AuthContext";
import { useWorkspace } from "../context/WorkspaceContext";
import * as usersApi from "../lib/api/users";
import * as workspacesApi from "../lib/api/workspaces";
import { ApiError } from "../lib/api/client";
import { ROUTES } from "../constants/routes";

export default function SettingsPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-8 md:px-8">
      <h1 className="text-2xl font-semibold tracking-tight text-text-primary">Settings</h1>
      <p className="mt-1 text-sm text-text-secondary">Manage your account, workspace, and integrations.</p>

      <Tabs defaultValue="profile" className="mt-7">
        <TabsList>
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="workspace">Workspace</TabsTrigger>
          <TabsTrigger value="github">GitHub</TabsTrigger>
          <TabsTrigger value="datasources">Data Sources</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="mt-6">
          <ProfileTab />
        </TabsContent>
        <TabsContent value="workspace" className="mt-6">
          <WorkspaceTab />
        </TabsContent>
        <TabsContent value="github" className="mt-6">
          <LinkOutTab icon={<GitBranch className="h-4 w-4" />} title="GitHub" description="Manage your GitHub connection and linked repositories." to={ROUTES.github} />
        </TabsContent>
        <TabsContent value="datasources" className="mt-6">
          <LinkOutTab icon={<Database className="h-4 w-4" />} title="Data Sources" description="Manage connected databases for the current project." to={ROUTES.dataSources} />
        </TabsContent>
        <TabsContent value="security" className="mt-6">
          <SecurityTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function ProfileTab() {
  const { user, logout } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [name, setName] = useState(user?.name ?? "");
  const [error, setError] = useState<string | null>(null);

  const updateMutation = useMutation({
    mutationFn: () => usersApi.updateMe({ name }),
    onSuccess: () => {
      queryClient.invalidateQueries();
      toast({ title: "Profile updated", variant: "success" });
    },
    onError: (err) => setError(err instanceof ApiError ? err.message : "Couldn't update your profile."),
  });

  return (
    <Card>
      <CardContent className="space-y-4">
        {error && <p className="rounded-md border border-danger/30 bg-danger-muted px-3 py-2 text-sm text-danger">{error}</p>}
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-accent-muted text-base font-semibold text-accent-hover">
            {user?.name?.charAt(0).toUpperCase()}
          </div>
          <div>
            <p className="text-sm font-medium text-text-primary">{user?.name}</p>
            <p className="text-xs text-text-tertiary">{user?.email}</p>
          </div>
        </div>
        <div>
          <Label htmlFor="profile-name">Full name</Label>
          <Input id="profile-name" value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <div>
          <Label htmlFor="profile-email">Email</Label>
          <Input id="profile-email" value={user?.email ?? ""} disabled />
        </div>
        <div className="flex justify-between pt-2">
          <Button variant="ghost" onClick={logout}>
            Sign out
          </Button>
          <Button
            onClick={() => {
              setError(null);
              updateMutation.mutate();
            }}
            loading={updateMutation.isPending}
          >
            Save changes
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function WorkspaceTab() {
  const { currentWorkspace, refetch } = useWorkspace();
  const { toast } = useToast();
  const [name, setName] = useState(currentWorkspace?.name ?? "");
  const [error, setError] = useState<string | null>(null);

  const updateMutation = useMutation({
    mutationFn: () => workspacesApi.updateWorkspace(currentWorkspace!.slug, { name }),
    onSuccess: () => {
      refetch();
      toast({ title: "Workspace updated", variant: "success" });
    },
    onError: (err) => setError(err instanceof ApiError ? err.message : "Couldn't update this workspace."),
  });

  if (!currentWorkspace) {
    return <p className="text-sm text-text-secondary">Select a workspace in the sidebar first.</p>;
  }

  return (
    <Card>
      <CardContent className="space-y-4">
        {error && <p className="rounded-md border border-danger/30 bg-danger-muted px-3 py-2 text-sm text-danger">{error}</p>}
        <div>
          <Label htmlFor="workspace-name">Workspace name</Label>
          <Input id="workspace-name" value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <div>
          <Label>Slug</Label>
          <Input value={currentWorkspace.slug} disabled className="font-mono" />
        </div>
        <div className="flex justify-end">
          <Button
            onClick={() => {
              setError(null);
              updateMutation.mutate();
            }}
            loading={updateMutation.isPending}
          >
            Save changes
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function LinkOutTab({ icon, title, description, to }: { icon: React.ReactNode; title: string; description: string; to: string }) {
  return (
    <Card>
      <CardContent className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-md bg-surface-elevated text-text-secondary">{icon}</div>
          <div>
            <p className="text-sm font-medium text-text-primary">{title}</p>
            <p className="text-xs text-text-tertiary">{description}</p>
          </div>
        </div>
        <Link to={to}>
          <Button variant="outline" size="sm">
            Manage <ArrowRight className="h-3.5 w-3.5" />
          </Button>
        </Link>
      </CardContent>
    </Card>
  );
}

function SecurityTab() {
  const { logout } = useAuth();
  const { toast } = useToast();
  const [confirmOpen, setConfirmOpen] = useState(false);

  const deleteMutation = useMutation({
    mutationFn: usersApi.deleteMe,
    onSuccess: () => {
      toast({ title: "Account deleted", variant: "info" });
      logout();
    },
  });

  return (
    <Card className="border-danger/25">
      <CardContent className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-md bg-danger-muted text-danger">
            <ShieldAlert className="h-4 w-4" />
          </div>
          <div>
            <p className="text-sm font-medium text-text-primary">Delete account</p>
            <p className="text-xs text-text-tertiary">Permanently removes your account and everything owned by it.</p>
          </div>
        </div>
        <Button variant="danger" size="sm" onClick={() => setConfirmOpen(true)}>
          Delete
        </Button>
      </CardContent>

      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title="Delete your account?"
        description="This permanently deletes your account, projects, and workspaces. This cannot be undone."
        confirmLabel="Delete account"
        variant="danger"
        loading={deleteMutation.isPending}
        onConfirm={() => deleteMutation.mutate()}
      />
    </Card>
  );
}
