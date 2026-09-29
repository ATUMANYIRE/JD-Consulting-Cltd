import { company } from "../data/company";

// Set VITE_ENQUIRY_ENDPOINT (e.g. in .env.local or the Vercel project settings) to a URL that
// accepts a JSON POST once a real inbox or form backend exists. Until then, enquiries open the
// visitor's email app with the message filled in; nothing is stored by the site.
const ENDPOINT = import.meta.env.VITE_ENQUIRY_ENDPOINT;

export const hasInbox = Boolean(ENDPOINT);

export function mailtoHref({ topic, name, email, phone, organization, message }) {
  const subject = [topic, name].filter(Boolean).join(" · ");
  const body = [
    message,
    "",
    "—",
    name && `Name: ${name}`,
    email && `Email: ${email}`,
    phone && `Phone: ${phone}`,
    organization && `Organization: ${organization}`,
  ]
    .filter((line) => line !== undefined && line !== null && line !== false)
    .join("\n");
  return `mailto:${company.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

// Resolves to "sent" when the backend accepted it, or "mailto" when the email app was opened.
export async function sendEnquiry(enquiry) {
  if (!ENDPOINT) {
    window.location.href = mailtoHref(enquiry);
    return "mailto";
  }
  const response = await fetch(ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(enquiry),
  });
  if (!response.ok) throw new Error(`Enquiry endpoint responded ${response.status}`);
  return "sent";
}
