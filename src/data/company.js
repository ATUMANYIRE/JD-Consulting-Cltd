// Company identity and contact details. Leave a field null until JD Mining Consulting
// supplies it: the UI then shows a "to be supplied" placeholder instead of an invented value.
export const company = {
  name: "JD Mining Consulting",
  legalName: "JD Mining Consulting Ltd",
  email: "contact@jdmining.rw",
  phone: "+250 788 709 777",
  // Same number, digits only in international format, for wa.me links.
  whatsapp: "250788709777",
  tin: null,
  address: null,
  // The approved mandate statement, shown on the Mandate page. Null shows a placeholder.
  mandate: null,
  // Path to the official logo in /public (e.g. "/logo.svg"). Null keeps the temporary "JD" mark.
  logo: null,
};

export const phoneHref = `tel:${company.phone.replace(/\s/g, "")}`;

export function whatsappHref(message) {
  const text = message ? `?text=${encodeURIComponent(message)}` : "";
  return `https://wa.me/${company.whatsapp}${text}`;
}
