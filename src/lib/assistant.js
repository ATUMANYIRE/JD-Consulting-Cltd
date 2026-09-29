import { company, phoneHref, whatsappHref } from "../data/company";
import { serviceSlugs } from "../data/services";
import { vacancies } from "../data/careers";
import { projects } from "../data/projects";

// Rule-based assistant: it recognizes what a visitor is asking about (English, French or
// Kinyarwanda keywords) and answers only from the site's own published content. Anything it
// can't match is handed to the team, or to VITE_ASSISTANT_ENDPOINT if an AI backend is added.
export const ASSISTANT_ENDPOINT = import.meta.env.VITE_ASSISTANT_ENDPOINT;

// Keywords are accent-free and lowercase. Keywords of 5+ characters also match inside longer
// words (so "tailing" matches "tailings"); shorter ones must match a whole word.
const INTENTS = [
  { id: "esg-compliance", weight: 2, keywords: ["esg", "oecd", "ocde", "icglr", "cirgl", "traceab", "tracab", "due diligence", "diligence", "supply chain", "3tg", "chain of custody", "certification", "rcm", "conflict mineral", "responsible sourcing", "approvisionnement", "inkomoko", "urunana"] },
  { id: "circular-economy", weight: 2, keywords: ["tailing", "waste", "recp", "esia", "emp", "acid mine", "amd", "rehabilit", "circular", "environment", "impact assessment", "residu", "dechet", "ibidukikije", "ibisigazwa", "imyanda"] },
  { id: "tvet-workforce", weight: 2, keywords: ["training", "train", "tvet", "dacum", "cbet", "curricul", "skill", "workforce", "upskill", "ohs", "health and safety", "safety", "formation", "competence", "securite", "amahugurwa", "guhugura", "integanyanyigisho", "umutekano", "asm", "artisanal"] },
  { id: "technical-advisory", weight: 2, keywords: ["feasib", "geotech", "mine plan", "planning", "rqd", "rmr", "slope", "stope", "fleet", "haulage", "processing", "recovery", "optimi", "simulation", "schedul", "faisabilite", "planification", "inyigo", "jewoteknike"] },
  { id: "institutional-advisory", weight: 2, keywords: ["policy", "policies", "government", "ministry", "legal", "monitoring", "m&e", "donor", "value addition", "governance", "politique", "gouvernement", "bailleur", "politiki", "leta", "amategeko"] },
  // Price questions outrank the topic they're about ("how much is a feasibility study?").
  { id: "proposal", weight: 3, keywords: ["price", "cost", "costs", "pricing", "fee", "fees", "rates", "budget", "how much", "devis", "prix", "tarif", "cout", "combien", "igiciro", "amafaranga"] },
  { id: "proposal", weight: 1.6, keywords: ["proposal", "quote", "quotation", "hire", "offre", "saba serivisi"] },
  { id: "careers", weight: 1.6, keywords: ["job", "jobs", "career", "vacanc", "hiring", "recruit", "employ", "internship", "cv", "emploi", "poste", "recrutement", "stage", "akazi", "imyanya"] },
  { id: "projects", weight: 1.5, keywords: ["project", "portfolio", "client", "reference", "past work", "track record", "experience", "projet", "imishinga", "abakiriya"] },
  { id: "founder", weight: 1.5, keywords: ["founder", "owner", "ceo", "director", "team", "expert", "consultant", "staff", "who runs", "fondateur", "directeur", "equipe", "uwashinze", "nyiri", "umuyobozi"] },
  { id: "contact", weight: 1.5, keywords: ["contact", "email", "e mail", "mail", "phone", "call", "telephone", "number", "reach", "whatsapp", "numero", "courriel", "twandikire", "telefone", "nimero", "hamagara"] },
  { id: "location", weight: 1.5, keywords: ["where", "located", "location", "office", "address", "kigali", "based", "adresse", "bureau", "situe", "aho", "ibiro", "mukorera"] },
  { id: "hours", weight: 1.5, keywords: ["hours", "opening", "open", "weekend", "horaire", "ouvert", "amasaha"] },
  { id: "human", weight: 1.5, keywords: ["human", "person", "agent", "real person", "someone", "speak", "talk", "humain", "personne", "umuntu", "kuvugana"] },
  { id: "minerals", weight: 1.5, keywords: ["mineral", "tin", "tantalum", "tungsten", "gold", "lithium", "graphite", "coltan", "cassiterite", "wolfram", "minerai", "etain", "tantale", "tungstene", "amabuye", "gasegereti", "koluta", "zahabu"] },
  { id: "sectors", weight: 1.5, keywords: ["oil", "gas", "petroleum", "energy", "quarry", "quarrying", "sector", "petrole", "energie", "carriere", "ingufu"] },
  { id: "vision", weight: 1.5, keywords: ["vision", "icyerekezo"] },
  { id: "mission", weight: 1.5, keywords: ["mission", "inshingano"] },
  { id: "values", weight: 1.5, keywords: ["value", "values", "valeur", "principle", "indangagaciro"] },
  { id: "about", weight: 1.2, keywords: ["who are you", "about", "company", "jd mining", "firm", "tell me", "entreprise", "cabinet", "qui etes", "abo muri bo", "ikigo"] },
  { id: "services", weight: 1, keywords: ["service", "offer", "provide", "what do you do", "prestation", "serivisi", "mukora", "mutanga"] },
  { id: "greeting", weight: 0.5, keywords: ["hello", "hi", "hey", "bonjour", "salut", "bonsoir", "muraho", "mwaramutse", "mwiriwe"] },
  { id: "thanks", weight: 0.5, keywords: ["thank", "thanks", "merci", "murakoze", "urakoze"] },
];

function normalize(text) {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9&]+/g, " ")
    .trim();
}

export function detectIntent(text) {
  const padded = ` ${normalize(text)} `;
  let best = { id: "fallback", score: 0 };
  for (const intent of INTENTS) {
    const hits = intent.keywords.filter((keyword) => padded.includes(` ${keyword} `) || (keyword.length >= 5 && padded.includes(keyword))).length;
    const score = hits * intent.weight;
    if (score > best.score) best = { id: intent.id, score };
  }
  return best.id;
}

const fill = (template) => template.replace("{phone}", company.phone).replace("{email}", company.email);

function teamLinks(t, question) {
  const a = t.assistant;
  const message = question ? `${a.whatsappMessage}\n\n${question}` : a.whatsappMessage;
  const body = question ? `?subject=${encodeURIComponent(a.emailSubject)}&body=${encodeURIComponent(question)}` : "";
  return [
    { label: a.links.whatsapp, href: whatsappHref(message), external: true, kind: "whatsapp" },
    { label: a.links.email, href: `mailto:${company.email}${body}` },
  ];
}

// A reply is { text, list?, links? }, built from the current language so the conversation
// re-renders if the visitor switches language.
export function buildReply(intent, t, question) {
  const a = t.assistant;
  const r = a.replies;

  if (serviceSlugs.includes(intent)) {
    const pillar = t.pillars[intent];
    return { title: pillar.title, text: `${pillar.summary} ${r.pillar}`, list: pillar.points, links: [{ label: a.links.service, to: `/services/${intent}` }, { label: a.links.proposal, to: "/contact" }] };
  }

  switch (intent) {
    case "intro":
      return { text: r.intro };
    case "greeting":
      return { text: r.greeting };
    case "thanks":
      return { text: r.thanks };
    case "services":
      return { text: r.services, list: serviceSlugs.map((slug) => t.pillars[slug].title), links: [{ label: a.links.services, to: "/services" }] };
    case "proposal":
      return { text: r.proposal, links: [{ label: a.links.proposal, to: "/contact" }, teamLinks(t)[0]] };
    case "contact":
      return { text: fill(r.contact), links: [...teamLinks(t), { label: company.phone, href: phoneHref }, { label: a.links.contact, to: "/contact" }] };
    case "location":
      return { text: r.location, links: teamLinks(t) };
    case "hours":
      return { text: r.hours, links: teamLinks(t) };
    case "human":
      return { text: r.human, links: [...teamLinks(t, question), { label: company.phone, href: phoneHref }] };
    case "vision":
      return { text: r.vision, quote: t.common.visionText, list: t.common.visionPoints.map((point) => point.title), links: [{ label: a.links.about, to: "/about" }] };
    case "mission":
      return { text: r.mission, quote: t.common.missionText, list: t.common.missionPoints.map((point) => point.title), links: [{ label: a.links.about, to: "/about" }] };
    case "values":
      return { text: r.values, list: t.about.values.map((value) => value.title), links: [{ label: a.links.about, to: "/about" }] };
    case "about":
      return { text: t.about.p1, links: [{ label: a.links.about, to: "/about" }, { label: a.links.services, to: "/services" }] };
    case "founder":
      return { text: r.founder, links: [{ label: a.links.founder, to: "/about#founder" }] };
    case "careers":
      return { text: vacancies.length ? r.careersOpen : r.careers, links: [{ label: a.links.careers, to: "/careers" }] };
    case "projects":
      return { text: projects.length ? r.projectsOpen : r.projects, links: [{ label: a.links.projects, to: "/projects" }, { label: a.links.services, to: "/services" }] };
    case "minerals":
      return { text: r.minerals, list: t.home.minerals, extra: `${t.home.standardsLabel}: ${t.home.standards.join(" · ")}` };
    case "sectors":
      return { text: r.sectors, links: [{ label: a.links.services, to: "/services" }] };
    default:
      return { text: r.fallback, links: teamLinks(t, question) };
  }
}
