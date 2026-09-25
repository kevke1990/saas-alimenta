import Link from "next/link";

export const MEReloBrand = {
  name: "Merelo",
  tagline: "Alimentatie inzichtelijk.",
  promise: "Bereken. Begrijp. Spreek af.",
} as const;

export function MereloMark({ size = 40, dark = false }: { size?: number; dark?: boolean }) {
  const petrol = dark ? "#ffffff" : "#163C3A";
  return <svg width={size} height={Math.round(size * 0.78)} viewBox="0 0 64 50" fill="none" aria-hidden="true" focusable="false">
    <path d="M7 8C16 3 24 5 32 15L44 30C39 36 36 39 32 42L20 27C16 22 12 21 7 23V8Z" fill={petrol}/>
    <path d="M57 8C48 3 40 5 32 15L20 30C25 36 28 39 32 42L44 27C48 22 52 21 57 23V8Z" fill="#63C6B2"/>
    <path d="M32 15L38 23L32 31L26 23L32 15Z" fill={dark ? "#163C3A" : "#F4F7F5"} opacity=".96"/>
  </svg>;
}

export function MereloLogo({ href = "/", compact = false, dark = false }: { href?: string; compact?: boolean; dark?: boolean }) {
  return <Link href={href} className="merelo-brand-link" aria-label="Merelo home">
    <span className={`merelo-lockup${compact ? " merelo-lockup-compact" : ""}${dark ? " merelo-lockup-dark" : ""}`}>
      <span className="merelo-mark"><MereloMark size={compact ? 34 : 42} dark={dark}/></span>
      <span className="merelo-wordmark"><strong>Merelo</strong>{!compact ? <small>Alimentatie inzichtelijk.</small> : null}</span>
    </span>
  </Link>;
}
