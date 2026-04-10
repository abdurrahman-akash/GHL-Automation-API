"use client";

import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { checkDuplicate } from "@/lib/api-client";
import { toErrorMessage } from "@/lib/axios";
import type { DuplicateCheckPayload } from "@/lib/types";

export function useDuplicateCheck() {
  return useMutation({
    mutationFn: (payload: DuplicateCheckPayload) => checkDuplicate(payload),
    onSuccess: () => {
      toast.success("Duplicate check completed.");
    },
    onError: (error) => {
      toast.error(toErrorMessage(error));
    },
  });
}
