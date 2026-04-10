export type DuplicateStatus = "duplicate" | "unique" | "null";

export type ConnectGhlPayload = {
  locationId: string;
  ghlApiKey: string;
};

export type ConnectGhlResponse = {
  message: string;
  accessKey: string;
};

export type DuplicateCheckPayload = {
  email?: string;
  phone?: string;
};

export type DuplicateCheckResponse = {
  email: DuplicateStatus;
  phone: DuplicateStatus;
};

export type SyncTriggerResponse = {
  message?: string;
  status?: string;
  jobId?: string;
};

export type SyncStatusResponse = {
  status?: string;
  syncStatus?: string;
  state?: string;
  progress?: number;
  lastSyncedAt?: string | null;
  lastSyncTime?: string | null;
};

export type HealthResponse = {
  status: string;
};
