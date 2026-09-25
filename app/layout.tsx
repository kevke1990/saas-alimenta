import "./globals.css";
import "./alimenta-public.css";
import "./contrast-accessibility.css";
import "./design-tokens.css";
import "./auth.css";
import "./portal-premium.css";
import "./merelo-app-theme.css";
import type { Viewport } from "next";

export const viewport: Viewport = { width: "device-width", initialScale: 1, viewportFit: "cover", themeColor: "#163C3A" };
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Merelo",
  manifest: "/manifest.webmanifest",
  description: "Alimentatie inzichtelijk. Bereken, begrijp en spreek af vanuit één professionele werkplek.",
  applicationName: "Merelo",
  referrer: "strict-origin-when-cross-origin"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <html lang="nl"><body>{process.env.DEMO_MODE === "true" ? <div style={{position:"sticky",top:0,zIndex:9999,background:"#163C3A",color:"white",padding:"8px 12px",textAlign:"center",fontSize:13}}>DEMO RELEASE CANDIDATE — fictieve gegevens — niet gebruiken voor echte dossiers</div> : null}{children}<script dangerouslySetInnerHTML={{__html:'if("serviceWorker" in navigator){window.addEventListener("load",()=>navigator.serviceWorker.register("/sw.js").catch(()=>{}))'}} /></body></html>;
}
