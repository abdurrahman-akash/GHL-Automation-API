"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { getBackendHealth, getSyncStatus, triggerContactSync } from "@/lib/api-client";
import { ApiClientError, toErrorMessage } from "@/lib/axios";
import { useAuthStore } from "@/store/auth.store";

type SystemStatus = {
  backendOnline: boolean;
  syncStatus: "idle" | "in_progress" | "completed" | "failed" | "unavailable";
  progress: number | null;
  lastSyncTime: string | null;
};

const SYSTEM_STATUS_QUERY_KEY = ["system-status"] as const;

export function useSystemStatus() {
  const locationId = useAuthStore((state) => state.locationId);

  return useQuery<SystemStatus>({
    queryKey: [...SYSTEM_STATUS_QUERY_KEY, locationId],
    enabled: Boolean(locationId),
    refetchInterval: 15000,
    queryFn: async () => {
      const [healthResult, syncStatusResult] = await Promise.allSettled([
        getBackendHealth(),
        getSyncStatus(),
      ]);

      const backendOnline = healthResult.status === "fulfilled" && healthResult.value.status === "ok";

      if (syncStatusResult.status === "fulfilled") {
        const rawStatus =
          syncStatusResult.value.syncStatus ??
          syncStatusResult.value.state ??
          syncStatusResult.value.status ??
          "idle";

        const normalizedStatus =
          rawStatus === "in_progress" || rawStatus === "completed" || rawStatus === "failed"
            ? rawStatus
            : "idle";

        return {
          backendOnline,
          syncStatus: normalizedStatus,
          progress: typeof syncStatusResult.value.progress === "number" ? syncStatusResult.value.progress : null,
          lastSyncTime: syncStatusResult.value.lastSyncedAt ?? syncStatusResult.value.lastSyncTime ?? null,
        };
      }

      if (syncStatusResult.reason instanceof ApiClientError && syncStatusResult.reason.status === 404) {
        return {
          backendOnline,
          syncStatus: "unavailable",
          progress: null,
          lastSyncTime: null,
        };
      }

      return {
        backendOnline,
        syncStatus: "failed",
        progress: null,
        lastSyncTime: null,
      };
    },
  });
}

export function useTriggerSync() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => triggerContactSync(),
    onSuccess: () => {
      toast.success("Sync has been triggered.");
      queryClient.invalidateQueries({ queryKey: SYSTEM_STATUS_QUERY_KEY });
    },
    onError: (error) => {
      toast.error(toErrorMessage(error));
    },
  });
}
