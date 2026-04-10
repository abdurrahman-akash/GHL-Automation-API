import { create } from "zustand";

type AuthStore = {
  accessKey: string | null;
  locationId: string | null;
  connectedAt: string | null;
  setSession: (input: { accessKey: string; locationId: string }) => void;
  clearSession: () => void;
  getAccessKey: () => string | null;
};

export const useAuthStore = create<AuthStore>((set, get) => ({
  accessKey: null,
  locationId: null,
  connectedAt: null,
  setSession: ({ accessKey, locationId }) => {
    set({
      accessKey,
      locationId,
      connectedAt: new Date().toISOString(),
    });
  },
  clearSession: () => {
    set({
      accessKey: null,
      locationId: null,
      connectedAt: null,
    });
  },
  getAccessKey: () => get().accessKey,
}));
