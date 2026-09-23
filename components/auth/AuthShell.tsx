"use client";

import Link from "next/link";
import type { ReactNode } from "react";

type AuthShellProps = {
  children: ReactNode;
  eyebrow: string;
  title: string;
  description: string;
  asideTitle?: string;
  asideDescription?: string;
  asideFooter?: ReactNode;
  wide?: boolean;
};

export function AuthBrand({ compact = false }: { compact?: boolean }) {
  return (
    <Link href="/" className={compact ? "auth-brand auth-brand-compact" : "auth-brand"} aria-label="Alimenta Pro home">
      <span className="auth-brand-mark" aria-hidden="true">A</span>
      <span className="auth-brand-copy"><strong>Alimenta</strong><small>PRO</small></span>
    </Link>
  );
}

export function AuthShell({
  children,
  eyebrow,
  title,
  description,
  asideTitle = "Van dossier naar onderbouwd resultaat.",
  asideDescription = "Een rustige, professionele werkplek voor cliënten, berekeningen, onderbouwing en rapportages.",
  asideFooter,
  wide = false,
}: AuthShellProps) {
  return (
    <main className="auth-experience al-hero-aura">
      <section className="auth-story" aria-label="Over Alimenta Pro">
        <AuthBrand />
        <div className="auth-story-copy">
          <p className="auth-eyebrow">Professionele alimentatiesoftware</p>
          <h1>{asideTitle}</h1>
          <p>{asideDescription}</p>
          <ul className="auth-benefits" aria-label="Voordelen">
            <li>Transparante berekeningen</li>
            <li>Professionele rapportage</li>
            <li>Veilige dossieromgeving</li>
          </ul>
        </div>
        <div className="auth-story-footer">{asideFooter ?? "Alimenta Pro · voor alimentatieprofessionals"}</div>
      </section>
      <section className="auth-content">
        <div className={wide ? "auth-panel auth-panel-wide al-surface-panel" : "auth-panel al-surface-panel"}>
          <div className="auth-mobile-brand"><AuthBrand compact /></div>
          <header className="auth-panel-header">
            <p className="auth-eyebrow">{eyebrow}</p>
            <h2>{title}</h2>
            <p>{description}</p>
          </header>
          {children}
        </div>
      </section>
    </main>
  );
}

export function AuthStatus({ children, tone = "info" }: { children: ReactNode; tone?: "info" | "error" | "success" }) {
  return (
    <div className={"auth-status auth-status-" + tone} role={tone === "error" ? "alert" : "status"} aria-live="polite">
      {children}
    </div>
  );
}
