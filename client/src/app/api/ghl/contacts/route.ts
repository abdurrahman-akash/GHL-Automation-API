import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

type ContactRecord = {
  id: string;
  name: string;
  email: string;
  phone: string;
};

type Credentials = {
  apiToken: string;
  locationId: string;
};

type JsonObject = Record<string, unknown>;

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function firstString(values: unknown[]): string {
  for (const value of values) {
    if (isNonEmptyString(value)) {
      return value.trim();
    }
  }

  return "";
}

function normalizeContact(raw: JsonObject): ContactRecord {
  const name = firstString([
    raw.name,
    [raw.firstName, raw.lastName].filter(isNonEmptyString).join(" "),
    raw.firstName,
    raw.lastName,
  ]);

  let email = firstString([raw.email, raw.primaryEmail]);
  if (!email && Array.isArray(raw.emails)) {
    email = firstString(raw.emails);
  }

  let phone = firstString([raw.phone, raw.phoneNumber, raw.mobilePhone]);
  if (!phone && Array.isArray(raw.phones)) {
    phone = firstString(raw.phones);
  }

  return {
    id: firstString([raw.id, raw._id, crypto.randomUUID()]),
    name,
    email,
    phone,
  };
}

function pickContacts(json: unknown): JsonObject[] {
  if (!json || typeof json !== "object") {
    return [];
  }

  const data = json as JsonObject;

  const candidates = [
    data.contacts,
    data.data,
    (data.data as JsonObject | undefined)?.contacts,
    data.results,
    (data.payload as JsonObject | undefined)?.contacts,
  ];

  for (const candidate of candidates) {
    if (Array.isArray(candidate)) {
      return candidate.filter((item): item is JsonObject => !!item && typeof item === "object");
    }
  }

  return [];
}

function toAbsoluteUrl(baseUrl: string, maybeRelative: string): string {
  if (/^https?:\/\//i.test(maybeRelative)) {
    return maybeRelative;
  }

  return new URL(maybeRelative, baseUrl).toString();
}

function pickNextUrl(
  json: unknown,
  baseUrl: string,
  endpoint: string,
  locationId: string,
  limit: number,
  pageContacts: ContactRecord[]
): string | null {
  if (!json || typeof json !== "object") {
    return null;
  }

  const data = json as JsonObject;
  const meta = (data.meta ?? {}) as JsonObject;

  const directNext = [
    data.nextPageUrl,
    data.nextUrl,
    meta.nextPageUrl,
    meta.nextUrl,
  ].find(isNonEmptyString);

  if (directNext) {
    return toAbsoluteUrl(baseUrl, directNext);
  }

  const pageToken = [data.nextPageToken, meta.nextPageToken].find(isNonEmptyString);
  if (pageToken) {
    const tokenUrl = new URL(endpoint);
    tokenUrl.searchParams.set("locationId", locationId);
    tokenUrl.searchParams.set("limit", String(limit));
    tokenUrl.searchParams.set("pageToken", pageToken);
    return tokenUrl.toString();
  }

  if (pageContacts.length >= limit) {
    const lastContactId = pageContacts[pageContacts.length - 1]?.id;
    if (isNonEmptyString(lastContactId)) {
      const fallbackUrl = new URL(endpoint);
      fallbackUrl.searchParams.set("locationId", locationId);
      fallbackUrl.searchParams.set("limit", String(limit));
      fallbackUrl.searchParams.set("startAfterId", lastContactId);
      return fallbackUrl.toString();
    }
  }

  return null;
}

async function fetchAllContacts(credentials: Credentials): Promise<NextResponse> {
  const apiBaseUrl = process.env.GHL_API_BASE_URL ?? "https://services.leadconnectorhq.com";
  const apiVersion = process.env.GHL_API_VERSION ?? "2021-07-28";
  const limit = Number(process.env.GHL_CONTACT_PAGE_LIMIT ?? "100");
  const { apiToken, locationId } = credentials;

  const baseUrl = apiBaseUrl.endsWith("/") ? apiBaseUrl : `${apiBaseUrl}/`;
  const endpoint = new URL("contacts/", baseUrl).toString();

  const headers: HeadersInit = {
    Authorization: `Bearer ${apiToken}`,
    Version: apiVersion,
    Accept: "application/json",
  };

  const seenUrls = new Set<string>();
  const contacts: ContactRecord[] = [];

  let nextUrl: string | null = (() => {
    const url = new URL(endpoint);
    url.searchParams.set("locationId", locationId);
    url.searchParams.set("limit", String(limit));
    return url.toString();
  })();

  let safetyCounter = 0;

  while (nextUrl) {
    if (seenUrls.has(nextUrl)) {
      break;
    }
    seenUrls.add(nextUrl);

    safetyCounter += 1;
    if (safetyCounter > 200) {
      return NextResponse.json(
        { error: "Stopped because pagination exceeded 200 pages." },
        { status: 500 }
      );
    }

    const response = await fetch(nextUrl, {
      method: "GET",
      headers,
      cache: "no-store",
    });

    if (!response.ok) {
      const reason = await response.text();
      return NextResponse.json(
        {
          error: "Failed to fetch contacts from GHL.",
          status: response.status,
          reason,
          requestUrl: nextUrl,
        },
        { status: response.status }
      );
    }

    const json = (await response.json()) as unknown;
    const rawContacts = pickContacts(json);
    const pageContacts = rawContacts.map(normalizeContact);
    contacts.push(...pageContacts);

    nextUrl = pickNextUrl(json, baseUrl, endpoint, locationId, limit, pageContacts);
  }

  return NextResponse.json({
    total: contacts.length,
    contacts,
  });
}

export async function GET(): Promise<NextResponse> {
  const apiToken = process.env.GHL_API_KEY;
  const locationId = process.env.GHL_LOCATION_ID;

  if (!apiToken || !locationId) {
    return NextResponse.json(
      {
        error:
          "Missing env vars. Add GHL_API_KEY and GHL_LOCATION_ID to your environment before fetching contacts.",
      },
      { status: 500 }
    );
  }

  return fetchAllContacts({ apiToken, locationId });
}

export async function POST(request: Request): Promise<NextResponse> {
  const requiredAccessKey = process.env.APP_ACCESS_KEY;

  if (!requiredAccessKey) {
    return NextResponse.json(
      {
        error: "Missing APP_ACCESS_KEY in server environment.",
      },
      { status: 500 }
    );
  }

  const body = (await request.json()) as {
    ghlApiKey?: string;
    ghlLocationId?: string;
    accessKey?: string;
  };

  const accessKey = body.accessKey?.trim() ?? "";
  const apiToken = body.ghlApiKey?.trim() ?? "";
  const locationId = body.ghlLocationId?.trim() ?? "";

  if (!accessKey || !apiToken || !locationId) {
    return NextResponse.json(
      {
        error: "Please provide access key, GHL API key, and GHL location ID.",
      },
      { status: 400 }
    );
  }

  if (accessKey !== requiredAccessKey) {
    return NextResponse.json(
      {
        error: "Invalid access key.",
      },
      { status: 401 }
    );
  }

  return fetchAllContacts({ apiToken, locationId });
}
