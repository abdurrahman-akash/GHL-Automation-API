"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { useConnectGhl } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

type ConnectFormErrors = {
  locationId?: string;
  ghlApiKey?: string;
};

function validate(locationId: string, ghlApiKey: string): ConnectFormErrors {
  const errors: ConnectFormErrors = {};

  if (!locationId.trim()) {
    errors.locationId = "Location ID is required.";
  }

  if (!ghlApiKey.trim()) {
    errors.ghlApiKey = "GHL API key is required.";
  } else if (ghlApiKey.trim().length < 10) {
    errors.ghlApiKey = "GHL API key appears too short.";
  }

  return errors;
}

function maskAccessKey(accessKey: string): string {
  if (accessKey.length <= 14) {
    return "*".repeat(accessKey.length);
  }

  return `${accessKey.slice(0, 8)}${"*".repeat(accessKey.length - 12)}${accessKey.slice(-4)}`;
}

export function ConnectGhlForm() {
  const router = useRouter();
  const connectMutation = useConnectGhl();

  const [locationId, setLocationId] = useState("");
  const [ghlApiKey, setGhlApiKey] = useState("");
  const [errors, setErrors] = useState<ConnectFormErrors>({});
  const [showAccessKey, setShowAccessKey] = useState(false);

  const generatedAccessKey = connectMutation.data?.accessKey ?? null;

  const copyAccessKey = async () => {
    if (!generatedAccessKey) {
      return;
    }

    try {
      await navigator.clipboard.writeText(generatedAccessKey);
      toast.success("Access key copied. Use it in GHL header x-access-key.");
    } catch {
      toast.error("Unable to copy access key. Please copy it manually.");
    }
  };

  const submit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const nextErrors = validate(locationId, ghlApiKey);
    setErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    connectMutation.mutate({
      locationId: locationId.trim(),
      ghlApiKey: ghlApiKey.trim(),
    }, {
      onSuccess: () => {
        // Avoid keeping the original tenant API key in browser state after handoff.
        setGhlApiKey("");
      }
    });
  };

  if (generatedAccessKey) {
    return (
      <Card className="max-w-2xl space-y-4">
        <CardTitle>GHL Connected Successfully</CardTitle>
        <CardDescription>
          Copy and store this access key now. Your GHL automation should send this value in header
          <strong> x-access-key</strong> when calling duplicate check.
        </CardDescription>

        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Generated Access Key</p>
          <p className="mt-2 break-all font-mono text-sm text-slate-800">
            {showAccessKey ? generatedAccessKey : maskAccessKey(generatedAccessKey)}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Button type="button" onClick={copyAccessKey}>Copy Access Key</Button>
          <Button type="button" variant="secondary" onClick={() => setShowAccessKey((current) => !current)}>
            {showAccessKey ? "Hide Key" : "Reveal Key"}
          </Button>
          <Button type="button" variant="ghost" onClick={() => router.push("/dashboard")}>Go To Dashboard</Button>
        </div>

        <p className="text-sm text-slate-600">
          This browser session keeps the key in memory and the server also stores it in an HttpOnly cookie for
          fallback authentication.
        </p>
      </Card>
    );
  }

  return (
    <Card className="max-w-2xl">
      <CardTitle>Connect Your GHL Account</CardTitle>
      <CardDescription className="mt-2">
        Enter the tenant location ID and GHL API key once. The backend returns a tenant access key used for
        duplicate checks.
      </CardDescription>

      <form className="mt-6 space-y-4" onSubmit={submit}>
        <Input
          id="locationId"
          label="Location ID"
          name="locationId"
          placeholder="e.g. abc123"
          autoComplete="off"
          value={locationId}
          onChange={(event) => setLocationId(event.target.value)}
          error={errors.locationId}
        />

        <Input
          id="ghlApiKey"
          label="GHL API Key"
          name="ghlApiKey"
          type="password"
          placeholder="Enter private API key"
          autoComplete="off"
          value={ghlApiKey}
          onChange={(event) => setGhlApiKey(event.target.value)}
          error={errors.ghlApiKey}
        />

        <Button type="submit" className="w-full sm:w-auto" isLoading={connectMutation.isPending}>
          {connectMutation.isPending ? "Connecting..." : "Connect GHL"}
        </Button>
      </form>
    </Card>
  );
}
