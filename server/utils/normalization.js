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

  // Keep E.164 style values when provided, otherwise store digit-only.
  if (digits.startsWith("+")) {
    return digits;
  }

  return digits.replace(/^0+/, "") || digits;
};
