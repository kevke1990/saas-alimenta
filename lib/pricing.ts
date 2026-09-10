export const PRICING = {
  private: {
    name: "Particulier",
    annual: 19.95,
    includedClients: 1,
    extraClient: 0,
    key: "private",
    vatLabel: "incl. btw",
    description: "Voor één persoonlijk alimentatiedossier, inclusief KA/PAL, documenten en professionele rapportage."
  },
  pro: {
    name: "Zakelijk",
    annual: 249,
    includedClients: 5,
    extraClient: 0,
    key: "pro",
    vatLabel: "excl. btw",
    description: "Eén professionele praktijklicentie voor advocaten, mediators en financieel adviseurs. 5 actieve cliëntdossiers inbegrepen."
  }
} as const;

export function priceForClients(plan: keyof typeof PRICING, clients: number) {
  const p = PRICING[plan];
  return p.annual;
}
