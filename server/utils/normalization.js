export const normalizeEmail = (value) => {
  if (!value || typeof value !== "string") {
    return null;
  }

  const email = value.trim().toLowerCase();
  return email.length ? email : null;
};

export const normalizePhone = (value) => {
  if (!value || typeof value !== "string") {
    return null;
  }

  const digits = value.replace(/[^\d+]/g, "").replace(/(?!^)\+/g, "");
  if (!digits) {
    return null;
  }

  const hasLeadingPlus = digits.startsWith("+");
  const plainDigits = hasLeadingPlus ? digits.slice(1) : digits;

  // Normalize common Bangladesh local mobile format (01XXXXXXXXX) to E.164 (+8801XXXXXXXXX).
  if (!hasLeadingPlus && /^01\d{9}$/.test(plainDigits)) {
    return `+88${plainDigits}`;
  }

  // Normalize country-code form without plus (8801XXXXXXXXX) to E.164.
  if (!hasLeadingPlus && /^8801\d{9}$/.test(plainDigits)) {
    return `+${plainDigits}`;
  }

  // Keep E.164 style values when provided, otherwise store digit-only.
  if (hasLeadingPlus) {
    return digits;
  }

  return plainDigits.replace(/^0+/, "") || plainDigits;
};

export const expandPhoneLookupVariants = (phone) => {
  const normalized = normalizePhone(phone);
  if (!normalized) {
    return [];
  }

  const variants = new Set([normalized]);
  const normalizedDigits = normalized.replace(/^\+/, "");

  // Support legacy stored forms that may omit "+".
  variants.add(normalizedDigits);

  // Support matching +8801XXXXXXXXX <-> 01XXXXXXXXX across historical data.
  if (/^8801\d{9}$/.test(normalizedDigits)) {
    variants.add(`0${normalizedDigits.slice(3)}`);
  }

  return [...variants];
};
