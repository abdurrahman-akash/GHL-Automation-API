import { axiosInstance } from "@/lib/axios";
import type {
  ConnectGhlPayload,
  ConnectGhlResponse,
  DuplicateCheckPayload,
  DuplicateCheckResponse,
  HealthResponse,
  SyncStatusResponse,
  SyncTriggerResponse,
} from "@/lib/types";
import { useAuthStore } from "@/store/auth.store";

const CONNECT_GHL_PATH = "/api/v1/auth/connect-ghl";
const DUPLICATE_CHECK_PATH = "/api/v1/duplicate/check";
const HEALTH_PATH = "/health";
const SYNC_TRIGGER_PATH = process.env.NEXT_PUBLIC_SYNC_TRIGGER_PATH ?? "/api/v1/sync/trigger";
const SYNC_STATUS_PATH = process.env.NEXT_PUBLIC_SYNC_STATUS_PATH ?? "/api/v1/sync/status";

let requestInterceptorAttached = false;

if (!requestInterceptorAttached) {
  requestInterceptorAttached = true;

  axiosInstance.interceptors.request.use((config) => {
    const accessKey = useAuthStore.getState().accessKey;

    // Keep credential handling centralized so UI layers never set headers manually.
    if (accessKey) {
      config.headers = config.headers ?? {};
      config.headers["x-access-key"] = accessKey;
    }

    return config;
  });
}

export async function connectGhl(payload: ConnectGhlPayload): Promise<ConnectGhlResponse> {
  const { data } = await axiosInstance.post<ConnectGhlResponse>(CONNECT_GHL_PATH, payload);
  return data;
}

export async function checkDuplicate(payload: DuplicateCheckPayload): Promise<DuplicateCheckResponse> {
  const { data } = await axiosInstance.post<DuplicateCheckResponse>(DUPLICATE_CHECK_PATH, payload);
  return data;
}

export async function triggerContactSync(): Promise<SyncTriggerResponse> {
  const { data } = await axiosInstance.post<SyncTriggerResponse>(SYNC_TRIGGER_PATH, {});
  return data;
}

export async function getSyncStatus(): Promise<SyncStatusResponse> {
  const { data } = await axiosInstance.get<SyncStatusResponse>(SYNC_STATUS_PATH);
  return data;
}

export async function getBackendHealth(): Promise<HealthResponse> {
  const { data } = await axiosInstance.get<HealthResponse>(HEALTH_PATH);
  return data;
}
