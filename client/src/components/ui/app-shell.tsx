"use client";

import Link from "next/link";

type AppShellProps = {
  title: string;
  description: string;
  children: React.ReactNode;
  actions?: React.ReactNode;
};

const navItems = [
  { href: "/connect", label: "Connect" },
  { href: "/dashboard", label: "Dashboard" },
  { href: "/duplicate-check", label: "Duplicate Check" },
];

export function AppShell({ title, description, children, actions }: AppShellProps) {
  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_10%_10%,rgba(56,189,248,0.18),transparent_35%),radial-gradient(circle_at_85%_30%,rgba(34,197,94,0.15),transparent_30%),linear-gradient(140deg,#f4f8ff_0%,#f8fafc_40%,#eef7ff_100%)] px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
        <header className="rounded-2xl border border-white/70 bg-white/85 p-5 shadow-[0_20px_40px_-28px_rgba(17,24,39,0.45)] backdrop-blur sm:p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-sky-700">GHL Duplicate Guard</p>
              <h1 className="mt-1 text-3xl font-black tracking-tight text-slate-900">{title}</h1>
              <p className="mt-2 max-w-2xl text-sm text-slate-600">{description}</p>
            </div>

            {actions ? <div className="shrink-0">{actions}</div> : null}
          </div>

          <nav className="mt-5 flex flex-wrap gap-2">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:border-sky-300 hover:text-sky-700"
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </header>

        <main>{children}</main>
      </div>
    </div>
  );
}
