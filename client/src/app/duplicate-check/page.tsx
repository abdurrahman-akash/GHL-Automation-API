import { AuthGuard } from "@/components/auth/auth-guard";
import { DuplicateCheckForm } from "@/components/forms/duplicate-check-form";
import { AppShell } from "@/components/ui/app-shell";

export default function DuplicateCheckPage() {
  return (
    <AppShell
      title="Duplicate Check"
      description="Validate if a contact email and phone number already exist in your tenant dataset."
    >
      <AuthGuard>
        <DuplicateCheckForm />
      </AuthGuard>
    </AppShell>
  );
}
