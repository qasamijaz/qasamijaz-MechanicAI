/** Deterministic, offline task intake and specialist routing. No LLM or remote API. */
export const DOMAINS = Object.freeze({
  vehicle: { label: "Mekanik", mode: "guided-steps", safety: "mechanical" },
  electrical: { label: "El og lamper", mode: "conceptual-layout", safety: "regulated-electrical" },
  construction: { label: "Hegn og byggeri", mode: "conceptual-3d", safety: "structural-review" },
  architecture: { label: "Hus og rumdesign", mode: "conceptual-floorplan", safety: "planning-review" },
  general: { label: "Generel opgave", mode: "guided-steps", safety: "needs-review" }
});
const RULES = [
  ["electrical", /\b(lampe|lamper|stikkontakt|ledning|elinstallation|loftlys|afbryder)\b/i],
  ["architecture", /\b(hus|plantegning|værelser|rumindretning|boligdesign|grundplan|arkitektur)\b/i],
  ["construction", /\b(hegn|terrasse|skur|carport|træværk|indkørsel|plankeværk)\b/i],
  ["vehicle", /\b(motorcykel|motor|olie|olieskift|bundprop|bremse|kæde|bil|suzuki|filter)\b/i]
];
const QUESTIONS = {
  vehicle: "Hvilket køretøj og hvilken opgave drejer det sig om?",
  electrical: "Hvor skal lampen placeres, og handler det om placering eller elektrisk tilslutning?",
  construction: "Hvad skal bygges, og hvilke omtrentlige mål har du?",
  architecture: "Hvor stort skal huset eller rummet være, og hvilke rum ønsker du?",
  general: "Hvad vil du lave, og vil du helst se en visualisering eller trinvis hjælp?"
};
export function planTask(raw) {
  const input = String(raw ?? "").trim().slice(0, 1000);
  if (!input) return { domain: "general", ...DOMAINS.general, input, needsClarification: true, question: QUESTIONS.general, preview: [] };
  const domain = RULES.find(([, pattern]) => pattern.test(input))?.[0] ?? "general";
  const capability = DOMAINS[domain];
  const preview = domain === "vehicle"
    ? ["Afklar køretøj og opgave", "Find dokumentation for præcis variant", "Vis relevante komponenter", "Følg verificerede trin med bekræftelse"]
    : domain === "electrical"
      ? ["Afklar rum og placering", "Lav en konceptuel placeringstegning", "Kontrollér regler og krav om autorisation", "Planlæg lovligt og sikkert arbejde"]
      : domain === "construction"
        ? ["Indsaml mål og placering", "Lav en konceptuel 3D-skitse", "Kontrollér lokale regler og konstruktion", "Lav en materialeliste efter godkendt design"]
        : domain === "architecture"
          ? ["Indsaml areal og rumbehov", "Lav en konceptuel plantegning", "Gennemgå ændringer", "Kontrollér byggetilladelse og faglig projektering"]
          : ["Afklar opgaven", "Vælg visualisering eller trinvis guide", "Find dokumentation", "Gennemgå resultatet"];
  return { input, domain, ...capability, preview, needsClarification: true, question: QUESTIONS[domain],
    status: "concept-only", verifiedInstructions: false };
}
