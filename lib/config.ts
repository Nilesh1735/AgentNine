export function getContactEmail() {
  const value = process.env.NEXT_PUBLIC_CONTACT_EMAIL?.trim();
  return value || null;
}

export function getContactMailto(subject = "", body = "") {
  const email = getContactEmail();
  if (!email) return null;
  const query = new URLSearchParams();
  if (subject) query.set("subject", subject);
  if (body) query.set("body", body);
  const suffix = query.toString();
  return `mailto:${email}${suffix ? `?${suffix}` : ""}`;
}
