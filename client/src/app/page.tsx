import Link from "next/link";
import { AppShell } from "@/components/ui/app-shell";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";

const cards = [
  {
    title: "Connect Tenant",
    description: "Attach a GHL location and receive an internal access key.",
    href: "/connect",
  },
  {
    title: "Dashboard",
    description: "View tenant connection state and sync health indicators.",
    href: "/dashboard",
  },
  {
    title: "Duplicate Check",
    description: "Test email and phone values against the duplicate engine.",
    href: "/duplicate-check",
  },
];

export default function HomePage() {
  return (
    <AppShell
      title="Contact Quality Control"
      description="A production-ready client for onboarding tenants and running duplicate checks against your backend APIs."
    >
      <section className="grid gap-4 md:grid-cols-3">
        {cards.map((card) => (
          <Card key={card.href} className="flex flex-col justify-between">
            <div>
              <CardTitle>{card.title}</CardTitle>
              <CardDescription className="mt-2">{card.description}</CardDescription>
            </div>

            <Link
              href={card.href}
              className="mt-4 inline-flex w-fit rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 transition hover:border-sky-300 hover:text-sky-700"
            >
              Open
            </Link>
          </Card>
        ))}
      </section>
    </AppShell>
  );
}
