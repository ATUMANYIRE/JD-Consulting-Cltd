// Company identity and contact details. Leave a field null until JD Mining Consulting
// supplies it: the UI then shows a "to be supplied" placeholder instead of an invented value.
export const company = {
  name: "JD Mining Consulting",
  // Exactly as registered with RDB (an individual enterprise, so never "Ltd").
  legalName: "JD MINING CONSULTING",
  email: "contact@jdmining.rw",
  phone: "+250 788 709 777",
  // Same number, digits only in international format, for wa.me links.
  whatsapp: "250788709777",
  // RDB Enterprise Code, confirmed by the client as the TIN to display.
  tin: "149882845",
  // District level only until the final office location is fixed (it stays in Kicukiro).
  address: "Kicukiro, Kigali, Rwanda",
  // Path to the official logo in /public (e.g. "/logo.svg"). Null keeps the temporary "JD" mark.
  logo: null,
};

export const phoneHref = `tel:${company.phone.replace(/\s/g, "")}`;

export function whatsappHref(message) {
  const text = message ? `?text=${encodeURIComponent(message)}` : "";
  return `https://wa.me/${company.whatsapp}${text}`;
}
