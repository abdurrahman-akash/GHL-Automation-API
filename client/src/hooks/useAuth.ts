"use client";

import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { connectGhl } from "@/lib/api-client";
import { toErrorMessage } from "@/lib/axios";
import type { ConnectGhlPayload } from "@/lib/types";
import { useAuthStore } from "@/store/auth.store";

export function useConnectGhl() {
  const setSession = useAuthStore((state) => state.setSession);

  return useMutation({
    mutationFn: (payload: ConnectGhlPayload) => connectGhl(payload),
    onSuccess: (response, variables) => {
      setSession({ accessKey: response.accessKey, locationId: variables.locationId });
      toast.success("GHL account connected successfully.");
    },
    onError: (error) => {
      toast.error(toErrorMessage(error));
    },
  });
}
