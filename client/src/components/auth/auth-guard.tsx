"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import { useAuthStore } from "@/store/auth.store";

type AuthGuardProps = {
  children: React.ReactNode;
};

export function AuthGuard({ children }: AuthGuardProps) {
  const router = useRouter();
  const accessKey = useAuthStore((state) => state.accessKey);

  useEffect(() => {
    if (!accessKey) {
      router.replace("/connect");
    }
  }, [accessKey, router]);

  if (!accessKey) {
    return (
      <Card className="flex items-center gap-3">
        <Spinner className="text-slate-700" />
        <p className="text-sm text-slate-600">Redirecting to connection page...</p>
      </Card>
    );
  }

  return <>{children}</>;
}
