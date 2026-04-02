"use client";

import { useMemo, useState } from "react";

type Contact = {
  id: string;
  name: string;
  email: string;
  phone: string;
};

type ContactWithStatus = Contact & {
  emailStatus: "Missing" | "Unique" | "Duplicate";
  phoneStatus: "Missing" | "Unique" | "Duplicate";
};

type GroupByMode = "name" | "email";

const ALL_GROUP_VALUE = "__all__";

function normalize(value: string): string {
  return value.trim().toLowerCase();
}

function normalizePhone(value: string): string {
  return value.replace(/[^0-9]/g, "");
}

function badgeClass(status: "Missing" | "Unique" | "Duplicate"): string {
  if (status === "Duplicate") {
    return "bg-red-100 text-red-800";
  }
  if (status === "Unique") {
    return "bg-emerald-100 text-emerald-800";
  }
  return "bg-zinc-100 text-zinc-600";
}

export default function Home() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [fetchedAt, setFetchedAt] = useState<string>("");
  const [ghlApiKey, setGhlApiKey] = useState("");
  const [ghlLocationId, setGhlLocationId] = useState("");
  const [accessKey, setAccessKey] = useState("");
  const [groupBy, setGroupBy] = useState<GroupByMode>("name");
  const [selectedGroup, setSelectedGroup] = useState<string>(ALL_GROUP_VALUE);

  const fetchContacts = async () => {
    if (!ghlApiKey.trim() || !ghlLocationId.trim() || !accessKey.trim()) {
      setError("Enter GHL API key, GHL Location ID, and your access key.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/ghl/contacts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ghlApiKey,
          ghlLocationId,
          accessKey,
        }),
      });
      const payload = (await response.json()) as {
        contacts?: Contact[];
        error?: string;
      };

      if (!response.ok) {
        throw new Error(payload.error || "Failed to load contacts.");
      }

      setContacts(payload.contacts ?? []);
      setFetchedAt(new Date().toLocaleString());
      setSelectedGroup(ALL_GROUP_VALUE);
    } catch (requestError) {
      const message = requestError instanceof Error ? requestError.message : "Unknown error";
      setError(message);
      setContacts([]);
    } finally {
      setLoading(false);
    }
  };

  const groups = useMemo(() => {
    const map = new Map<string, number>();

    for (const contact of contacts) {
      const source = groupBy === "name" ? contact.name : contact.email;
      const key = source.trim() || "(empty)";
      map.set(key, (map.get(key) || 0) + 1);
    }

    return Array.from(map.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([key, count]) => ({ key, count }));
  }, [contacts, groupBy]);

  const contactsInBulk = useMemo(() => {
    if (selectedGroup === ALL_GROUP_VALUE) {
      return contacts;
    }

    return contacts.filter((contact) => {
      const source = groupBy === "name" ? contact.name : contact.email;
      const key = source.trim() || "(empty)";
      return key === selectedGroup;
    });
  }, [contacts, groupBy, selectedGroup]);

  const result = useMemo(() => {
    const emailCount = new Map<string, number>();
    const phoneCount = new Map<string, number>();

    for (const contact of contactsInBulk) {
      const emailKey = normalize(contact.email);
      const phoneKey = normalizePhone(contact.phone);

      if (emailKey) {
        emailCount.set(emailKey, (emailCount.get(emailKey) || 0) + 1);
      }
      if (phoneKey) {
        phoneCount.set(phoneKey, (phoneCount.get(phoneKey) || 0) + 1);
      }
    }

    const rows: ContactWithStatus[] = contactsInBulk.map((contact) => {
      const emailKey = normalize(contact.email);
      const phoneKey = normalizePhone(contact.phone);

      const emailStatus = !emailKey
        ? "Missing"
        : (emailCount.get(emailKey) || 0) > 1
          ? "Duplicate"
          : "Unique";

      const phoneStatus = !phoneKey
        ? "Missing"
        : (phoneCount.get(phoneKey) || 0) > 1
          ? "Duplicate"
          : "Unique";

      return {
        ...contact,
        emailStatus,
        phoneStatus,
      };
    });

    const duplicateByEmail = rows.filter((row) => row.emailStatus === "Duplicate").length;
    const duplicateByPhone = rows.filter((row) => row.phoneStatus === "Duplicate").length;

    return {
      rows,
      duplicateByEmail,
      duplicateByPhone,
    };
  }, [contactsInBulk]);

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_right,#e2e8f0,transparent_35%),radial-gradient(circle_at_bottom_left,#bfdbfe,transparent_45%),linear-gradient(145deg,#f8fafc,#eef2ff)] px-4 py-10 text-zinc-900 sm:px-8">
      <main className="mx-auto flex w-full max-w-6xl flex-col gap-8 rounded-3xl border border-white/60 bg-white/85 p-6 shadow-2xl backdrop-blur sm:p-8">
        <section className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-sky-700">GHL Contact Auditor</p>
            <h1 className="text-3xl font-black tracking-tight text-zinc-900 sm:text-4xl">
              Bulk unique vs duplicate checker
            </h1>
            <p className="mt-2 max-w-3xl text-sm text-zinc-600 sm:text-base">
              Enter credentials from user form, then fetch all contacts from GHL and verify if each contact&apos;s phone and email are unique or duplicated.
            </p>
          </div>

          <button
            type="button"
            onClick={fetchContacts}
            disabled={loading}
            className="rounded-xl bg-zinc-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-zinc-700 disabled:cursor-not-allowed disabled:bg-zinc-400"
          >
            {loading ? "Loading contacts..." : "Fetch All Contacts"}
          </button>
        </section>

        <section className="grid gap-4 rounded-2xl border border-zinc-200 bg-zinc-50/80 p-4 sm:grid-cols-3">
          <label className="flex flex-col gap-2 text-sm font-medium text-zinc-700">
            GHL API Key (from user)
            <input
              type="password"
              value={ghlApiKey}
              onChange={(event) => setGhlApiKey(event.target.value)}
              placeholder="Enter GHL_API_KEY"
              className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm outline-none ring-sky-500 focus:ring-2"
            />
          </label>

          <label className="flex flex-col gap-2 text-sm font-medium text-zinc-700">
            GHL Location ID (from user)
            <input
              type="text"
              value={ghlLocationId}
              onChange={(event) => setGhlLocationId(event.target.value)}
              placeholder="Enter GHL_LOCATION_ID"
              className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm outline-none ring-sky-500 focus:ring-2"
            />
          </label>

          <label className="flex flex-col gap-2 text-sm font-medium text-zinc-700">
            Access Key (from admin)
            <input
              type="password"
              value={accessKey}
              onChange={(event) => setAccessKey(event.target.value)}
              placeholder="Enter access key"
              className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm outline-none ring-sky-500 focus:ring-2"
            />
          </label>
        </section>

        <section className="grid gap-4 rounded-2xl border border-zinc-200 bg-zinc-50/80 p-4 sm:grid-cols-3">
          <label className="flex flex-col gap-2 text-sm font-medium text-zinc-700">
            Group contacts by
            <select
              value={groupBy}
              onChange={(event) => {
                setGroupBy(event.target.value as GroupByMode);
                setSelectedGroup(ALL_GROUP_VALUE);
              }}
              className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm outline-none ring-sky-500 focus:ring-2"
            >
              <option value="name">Name</option>
              <option value="email">Email</option>
            </select>
          </label>

          <label className="flex flex-col gap-2 text-sm font-medium text-zinc-700 sm:col-span-2">
            Select bulk {groupBy === "name" ? "name" : "email"}
            <select
              value={selectedGroup}
              onChange={(event) => setSelectedGroup(event.target.value)}
              className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm outline-none ring-sky-500 focus:ring-2"
              disabled={contacts.length === 0}
            >
              <option value={ALL_GROUP_VALUE}>All contacts ({contacts.length})</option>
              {groups.map((group) => (
                <option key={group.key} value={group.key}>
                  {group.key} ({group.count})
                </option>
              ))}
            </select>
          </label>
        </section>

        <section className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-zinc-200 bg-white p-4">
            <p className="text-sm text-zinc-500">Contacts in selected bulk</p>
            <p className="mt-2 text-2xl font-bold">{contactsInBulk.length}</p>
          </div>
          <div className="rounded-2xl border border-red-200 bg-red-50 p-4">
            <p className="text-sm text-red-600">Duplicate email status</p>
            <p className="mt-2 text-2xl font-bold text-red-700">{result.duplicateByEmail}</p>
          </div>
          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
            <p className="text-sm text-amber-700">Duplicate phone status</p>
            <p className="mt-2 text-2xl font-bold text-amber-800">{result.duplicateByPhone}</p>
          </div>
        </section>

        {fetchedAt && <p className="text-xs text-zinc-500">Last fetched: {fetchedAt}</p>}
        {error && <p className="rounded-lg bg-red-100 px-4 py-3 text-sm text-red-700">{error}</p>}

        <section className="overflow-hidden rounded-2xl border border-zinc-200">
          <div className="max-h-[60vh] overflow-auto">
            <table className="min-w-full divide-y divide-zinc-200 text-sm">
              <thead className="sticky top-0 bg-zinc-100">
                <tr className="text-left text-zinc-700">
                  <th className="px-4 py-3 font-semibold">Name</th>
                  <th className="px-4 py-3 font-semibold">Email</th>
                  <th className="px-4 py-3 font-semibold">Email Status</th>
                  <th className="px-4 py-3 font-semibold">Phone</th>
                  <th className="px-4 py-3 font-semibold">Phone Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 bg-white">
                {result.rows.length === 0 ? (
                  <tr>
                    <td className="px-4 py-5 text-zinc-500" colSpan={5}>
                      Fetch contacts to start checking status.
                    </td>
                  </tr>
                ) : (
                  result.rows.map((row) => (
                    <tr key={row.id}>
                      <td className="px-4 py-3">{row.name || "-"}</td>
                      <td className="px-4 py-3">{row.email || "-"}</td>
                      <td className="px-4 py-3">
                        <span className={`rounded-full px-3 py-1 text-xs font-semibold ${badgeClass(row.emailStatus)}`}>
                          {row.emailStatus}
                        </span>
                      </td>
                      <td className="px-4 py-3">{row.phone || "-"}</td>
                      <td className="px-4 py-3">
                        <span className={`rounded-full px-3 py-1 text-xs font-semibold ${badgeClass(row.phoneStatus)}`}>
                          {row.phoneStatus}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
      </main>
    </div>
  );
}
