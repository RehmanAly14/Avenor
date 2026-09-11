import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { Plus, Search } from "lucide-react";
import { Button } from "../components/ui/Button";
import { Input, Select } from "../components/ui/Input";
import { Skeleton } from "../components/ui/Skeleton";
import { EmptyState } from "../components/ui/EmptyState";
import { ErrorState } from "../components/ui/ErrorState";
import { StatusPill } from "../components/ui/StatusPill";
import { Table, TableContainer, TableHeader, TableBody, TableRow, TableHead, TableCell } from "../components/ui/Table";
import * as investigationsApi from "../lib/api/investigations";
import type { DataIncidentStatus } from "../lib/api/types";
import { ROUTES } from "../constants/routes";
import { formatRelativeTime, truncate } from "../utils/format";

const STATUS_OPTIONS: { label: string; value: DataIncidentStatus | "" }[] = [
  { label: "All statuses", value: "" },
  { label: "Open", value: "OPEN" },
  { label: "Investigating", value: "INVESTIGATING" },
  { label: "Resolved", value: "RESOLVED" },
  { label: "Failed", value: "FAILED" },
];

export default function InvestigationsPage() {
  const [status, setStatus] = useState<DataIncidentStatus | "">("");
  const [search, setSearch] = useState("");

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["investigations", "list", status],
    queryFn: () => investigationsApi.listInvestigations({ limit: 100, status: status || undefined }),
  });

  const investigations = (data?.investigations ?? [])
    .filter((inv) => inv.title.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt));

  return (
    <div className="mx-auto max-w-6xl space-y-6 px-4 py-8 md:px-8">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-text-primary">Investigations</h1>
          <p className="mt-1 text-sm text-text-secondary">Investigate a data issue and let Avenor trace the root cause.</p>
        </div>
        <Link to={ROUTES.newInvestigation}>
          <Button>
            <Plus className="h-4 w-4" /> New Investigation
          </Button>
        </Link>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <Input
          placeholder="Search investigations…"
          icon={<Search className="h-4 w-4" />}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="sm:max-w-xs"
        />
        <Select value={status} onChange={(e) => setStatus(e.target.value as DataIncidentStatus | "")} className="sm:max-w-[180px]">
          {STATUS_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </Select>
      </div>

      {isError ? (
        <ErrorState description="We couldn't load your investigations." onRetry={() => refetch()} />
      ) : isLoading ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-14 w-full" />
          ))}
        </div>
      ) : investigations.length === 0 ? (
        <EmptyState
          icon={<Search className="h-5 w-5" />}
          title="No investigations yet"
          description="Start your first investigation to see root causes, impact, and fixes here."
          action={
            <Link to={ROUTES.newInvestigation}>
              <Button size="sm">Start investigating</Button>
            </Link>
          }
        />
      ) : (
        <TableContainer>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Incident</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Risk</TableHead>
                <TableHead>Root Cause</TableHead>
                <TableHead>Assets</TableHead>
                <TableHead>Created</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {investigations.map((inv) => (
                <TableRow key={inv.id}>
                  <TableCell>
                    <Link to={ROUTES.investigationDetail(inv.id)} className="font-medium text-text-primary hover:text-accent">
                      {truncate(inv.title, 56)}
                    </Link>
                  </TableCell>
                  <TableCell>
                    <StatusPill value={inv.stage} />
                  </TableCell>
                  <TableCell>
                    <StatusPill value={inv.severity} />
                  </TableCell>
                  <TableCell className="max-w-[220px] truncate text-text-secondary">{inv.rootCause ?? "—"}</TableCell>
                  <TableCell className="text-text-secondary">{inv.impact?.summary?.totalAffected ?? "—"}</TableCell>
                  <TableCell className="whitespace-nowrap text-text-tertiary">{formatRelativeTime(inv.createdAt)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </div>
  );
}
