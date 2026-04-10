import { ConnectGhlForm } from "@/components/forms/connect-ghl-form";
import { AppShell } from "@/components/ui/app-shell";

export default function ConnectPage() {
  return (
    <AppShell
      title="Connect GHL"
      description="Register a tenant location with your backend and securely receive an access key for subsequent API calls."
    >
      <ConnectGhlForm />
    </AppShell>
  );
}
