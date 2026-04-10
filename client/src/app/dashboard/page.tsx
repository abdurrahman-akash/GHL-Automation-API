"use client";

import { useState } from "react";
import { toast } from "sonner";
import { AuthGuard } from "@/components/auth/auth-guard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { AppShell } from "@/components/ui/app-shell";
import { Spinner } from "@/components/ui/spinner";
import { useSystemStatus, useTriggerSync } from "@/hooks/useSync";
import { useAuthStore } from "@/store/auth.store";

function formatDate(value: string | null): string {
  if (!value) {
    return "Not available";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "Not available";
  }

  return date.toLocaleString();
}

function maskAccessKey(accessKey: string): string {
  if (accessKey.length <= 14) {
    return "*".repeat(accessKey.length);
  }

  return `${accessKey.slice(0, 8)}${"*".repeat(accessKey.length - 12)}${accessKey.slice(-4)}`;
}

const DUPLICATE_API_PATH = "/api/v1/duplicate/check";

function toDuplicateApiUrl() {
  const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
  if (!baseUrl) {
    return DUPLICATE_API_PATH;
  }

  return `${baseUrl.replace(/\/$/, "")}${DUPLICATE_API_PATH}`;
}

const DUPLICATE_BODY_TEMPLATE = JSON.stringify(
  {
    email: "{{contact.email}}",
    phone: "{{contact.phone}}"
  },
  null,
  2
);

export default function DashboardPage() {
  const accessKey = useAuthStore((state) => state.accessKey);
  const locationId = useAuthStore((state) => state.locationId);
  const connectedAt = useAuthStore((state) => state.connectedAt);
  const clearSession = useAuthStore((state) => state.clearSession);
  const [showAccessKey, setShowAccessKey] = useState(false);

  const syncStatusQuery = useSystemStatus();
  const triggerSyncMutation = useTriggerSync();

  const syncStatus = syncStatusQuery.data?.syncStatus ?? "idle";
  const backendOnline = syncStatusQuery.data?.backendOnline ?? false;
  const duplicateApiUrl = toDuplicateApiUrl();
  const compactDuplicateBodyTemplate = DUPLICATE_BODY_TEMPLATE.replace(/\s+/g, " ").trim();
  const duplicateCurlTemplate = [
    `curl -X POST '${duplicateApiUrl}'`,
    "  -H 'Content-Type: application/json'",
    "  -H 'x-access-key: <your_access_key>'",
    `  -d '${compactDuplicateBodyTemplate}'`
  ].join(" \\\n");

  const copyText = async (value: string, label: string) => {
    try {
      await navigator.clipboard.writeText(value);
      toast.success(`${label} copied.`);
    } catch {
      toast.error(`Unable to copy ${label.toLowerCase()}.`);
    }
  };

  const copyAccessKey = async () => {
    if (!accessKey) {
      toast.error("No access key in memory. Reconnect to generate and copy a new key.");
      return;
    }

    await copyText(accessKey, "Access key");
  };

  return (
    <AppShell
      title="Tenant Dashboard"
      description="Monitor connection state, trigger manual sync, and track contact-sync readiness."
      actions={
        <Button variant="ghost" onClick={clearSession}>
          Clear Session
        </Button>
      }
    >
      <AuthGuard>
        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <Card>
            <CardDescription>Connected Location</CardDescription>
            <CardTitle className="mt-2 text-2xl">{locationId ?? "N/A"}</CardTitle>
          </Card>

          <Card>
            <CardDescription>Connected Since</CardDescription>
            <CardTitle className="mt-2 text-xl">{formatDate(connectedAt)}</CardTitle>
          </Card>

          <Card>
            <CardDescription>Backend</CardDescription>
            <div className="mt-2">
              <Badge variant={backendOnline ? "unique" : "failed"}>{backendOnline ? "online" : "offline"}</Badge>
            </div>
          </Card>

          <Card>
            <CardDescription>Sync State</CardDescription>
            <div className="mt-2">
              <Badge
                variant={
                  syncStatus === "completed"
                    ? "unique"
                    : syncStatus === "in_progress"
                      ? "progress"
                      : syncStatus === "failed"
                        ? "failed"
                        : syncStatus === "unavailable"
                          ? "unavailable"
                          : "idle"
                }
              >
                {syncStatus}
              </Badge>
            </div>
          </Card>
        </section>

        <section className="mt-4 grid gap-4 lg:grid-cols-2">
          <Card>
            <CardTitle>Automation Access Key</CardTitle>
            <CardDescription className="mt-2">
              Use this key in your GHL custom webhook header <strong>x-access-key</strong> when calling duplicate
              check API.
            </CardDescription>

            {accessKey ? (
              <>
                <p className="mt-4 break-all rounded-xl border border-slate-200 bg-slate-50 p-3 font-mono text-sm text-slate-800">
                  {showAccessKey ? accessKey : maskAccessKey(accessKey)}
                </p>

                <div className="mt-4 flex flex-wrap gap-3">
                  <Button type="button" onClick={copyAccessKey}>
                    Copy Access Key
                  </Button>
                  <Button type="button" variant="secondary" onClick={() => setShowAccessKey((current) => !current)}>
                    {showAccessKey ? "Hide Key" : "Reveal Key"}
                  </Button>
                </div>
              </>
            ) : (
              <p className="mt-4 text-sm text-slate-600">
                Access key is not available in current memory session. Reconnect your account to view and copy it again.
              </p>
            )}
          </Card>

          <Card>
            <CardTitle>Duplicate Check API</CardTitle>
            <CardDescription className="mt-2">
              Copy this endpoint and payload for your GHL custom webhook. Pass only <strong>x-access-key</strong> header.
            </CardDescription>

            <div className="mt-4 space-y-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">API URL</p>
                <p className="mt-1 break-all rounded-xl border border-slate-200 bg-slate-50 p-3 font-mono text-sm text-slate-800">
                  {duplicateApiUrl}
                </p>
              </div>

              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Body Template</p>
                <pre className="mt-1 overflow-auto rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs text-slate-700">
                  {DUPLICATE_BODY_TEMPLATE}
                </pre>
              </div>
            </div>

            <div className="mt-4 flex flex-wrap gap-3">
              <Button type="button" onClick={() => copyText(duplicateApiUrl, "Duplicate API URL")}>
                Copy API URL
              </Button>
              <Button type="button" variant="secondary" onClick={() => copyText(DUPLICATE_BODY_TEMPLATE, "Payload template")}>
                Copy Body Template
              </Button>
              <Button type="button" variant="ghost" onClick={() => copyText(duplicateCurlTemplate, "cURL template")}>
                Copy cURL
              </Button>
            </div>
          </Card>

          <Card>
            <CardTitle>Manual Contact Sync</CardTitle>
            <CardDescription className="mt-2">
              Trigger a sync job when you need an immediate refresh. If your backend does not expose a manual sync
              endpoint, this action will fail gracefully.
            </CardDescription>

            <div className="mt-5 flex items-center gap-3">
              <Button onClick={() => triggerSyncMutation.mutate()} isLoading={triggerSyncMutation.isPending}>
                {triggerSyncMutation.isPending ? "Triggering..." : "Sync Contacts"}
              </Button>

              {syncStatusQuery.isFetching ? (
                <span className="inline-flex items-center gap-2 text-sm text-slate-600">
                  <Spinner className="text-slate-600" size="sm" />
                  Refreshing status...
                </span>
              ) : null}
            </div>
          </Card>

          <Card>
            <CardTitle>Sync Details</CardTitle>
            <CardDescription className="mt-2">Latest status details returned by the backend.</CardDescription>

            {syncStatusQuery.isLoading ? (
              <div className="mt-5 inline-flex items-center gap-2 text-sm text-slate-600">
                <Spinner className="text-slate-600" size="sm" />
                Loading status...
              </div>
            ) : (
              <div className="mt-5 space-y-2 text-sm text-slate-700">
                <p>
                  <span className="font-semibold">Last sync:</span> {formatDate(syncStatusQuery.data?.lastSyncTime ?? null)}
                </p>
                <p>
                  <span className="font-semibold">Progress:</span>{" "}
                  {typeof syncStatusQuery.data?.progress === "number" ? `${syncStatusQuery.data.progress}%` : "N/A"}
                </p>
              </div>
            )}
          </Card>
        </section>
      </AuthGuard>
    </AppShell>
  );
}
