import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { AlertCircle, ArrowRight, FileSearch, Loader2, Network, ShieldCheck, Wrench } from "lucide-react";
import { Textarea } from "../components/ui/Input";
import { Button } from "../components/ui/Button";
import { Card, CardContent } from "../components/ui/Card";
import { useWorkspace } from "../context/WorkspaceContext";
import * as investigationsApi from "../lib/api/investigations";
import { ApiError } from "../lib/api/client";
import { ROUTES } from "../constants/routes";
import { truncate } from "../utils/format";

const PIPELINE_STAGES = [
  { icon: FileSearch, label: "Resolving the affected asset" },
  { icon: Network, label: "Tracing lineage and schema history" },
  { icon: Wrench, label: "Analyzing impact and generating a fix" },
  { icon: ShieldCheck, label: "Running safety validation" },
];

export default function NewInvestigationPage() {
  const navigate = useNavigate();
  const { currentWorkspace, currentProject, hasWorkspace, hasProject } = useWorkspace();

  const [description, setDescription] = useState("");
  const [isRunning, setIsRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canSubmit = hasWorkspace && hasProject && description.trim().length > 0;

  const handleSubmit = async () => {
    if (!currentWorkspace || !currentProject || !description.trim()) return;
    setError(null);
    setIsRunning(true);
    try {
      const investigation = await investigationsApi.createInvestigation({
        workspaceId: currentWorkspace.id,
        projectId: currentProject.id,
        title: truncate(description.trim(), 255),
        description: description.trim(),
      });
      await investigationsApi.runInvestigation(investigation.id);
      navigate(ROUTES.investigationDetail(investigation.id));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Couldn't start the investigation. Try again.");
      setIsRunning(false);
    }
  };

  if (isRunning) {
    return (
      <div className="flex min-h-[calc(100vh-3.5rem)] items-center justify-center px-6">
        <div className="w-full max-w-md text-center">
          <Loader2 className="mx-auto h-8 w-8 animate-spin text-accent" />
          <h1 className="mt-5 text-lg font-semibold text-text-primary">Investigating…</h1>
          <p className="mt-1.5 text-sm text-text-secondary">Avenor is running the full pipeline. This usually takes a few seconds.</p>
          <div className="mt-7 space-y-3 text-left">
            {PIPELINE_STAGES.map((stage) => (
              <div key={stage.label} className="flex items-center gap-3 rounded-md border border-border-subtle bg-surface px-3.5 py-2.5">
                <stage.icon className="h-4 w-4 shrink-0 text-text-tertiary" />
                <span className="text-sm text-text-secondary">{stage.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-12 md:px-8">
      <h1 className="text-2xl font-semibold tracking-tight text-text-primary">New Investigation</h1>
      <p className="mt-1.5 text-sm text-text-secondary">Describe what went wrong. Avenor resolves the asset, traces the cause, and proposes a fix — you don't need to configure anything else.</p>

      <Card className="mt-8">
        <CardContent className="space-y-5">
          {error && (
            <div className="flex items-start gap-2 rounded-md border border-danger/30 bg-danger-muted px-3 py-2.5 text-sm text-danger" role="alert">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" /> {error}
            </div>
          )}

          <div>
            <label htmlFor="description" className="mb-1.5 block text-xs font-medium text-text-secondary">
              What went wrong?
            </label>
            <Textarea
              id="description"
              rows={4}
              placeholder="Monthly Revenue dashboard is broken — started failing after yesterday's deployment."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              maxLength={5000}
            />
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-medium text-text-secondary">Project</label>
            {!hasWorkspace || !hasProject ? (
              <p className="rounded-md border border-dashed border-border px-3 py-2.5 text-sm text-text-tertiary">
                You need a workspace and a project before starting an investigation.{" "}
                <a href={ROUTES.workspaces} className="text-accent hover:text-accent-hover">
                  Create one
                </a>
                .
              </p>
            ) : (
              <div className="rounded-md border border-border bg-surface-elevated px-3 py-2.5 text-sm text-text-primary">
                {currentProject?.name} <span className="text-text-tertiary">· {currentWorkspace?.name}</span>
              </div>
            )}
          </div>

          <Button className="w-full" size="lg" disabled={!canSubmit} onClick={handleSubmit}>
            Investigate <ArrowRight className="h-4 w-4" />
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
