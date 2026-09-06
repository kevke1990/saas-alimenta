export const PRICING = {
  pro: {
    name: "Professional",
    annual: 249,
    includedClients: 5,
    extraClient: 19.95,
    key: "pro",
    description: "Voor zelfstandige advocaten, mediators en adviseurs."
  },
  practice20: {
    name: "Practice 20",
    annual: 495,
    includedClients: 20,
    extraClient: 0,
    key: "practice20",
    description: "20 eigen klantdossiers inbegrepen; daarna vaste staffel."
  },
  practice50: {
    name: "Practice 50",
    annual: 895,
    includedClients: 50,
    extraClient: 0,
    key: "practice50",
    description: "Voor kantoren met structureel veel dossiers."
  },
  enterprise: {
    name: "Enterprise",
    annual: 1495,
    includedClients: 999999,
    extraClient: 0,
    key: "enterprise",
    description: "Onbeperkt gebruik, meerdere gebruikers en maatwerk."
  }
} as const;

export function priceForClients(plan: keyof typeof PRICING, clients: number) {
  const p = PRICING[plan];
  if (plan === "pro") {
    return p.annual + Math.max(0, clients - p.includedClients) * p.extraClient;
  }
  return p.annual;
}
