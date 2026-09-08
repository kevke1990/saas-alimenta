import Link from "next/link";

export default function VerifyEmailPage() {
  return (
    <main style={{ maxWidth: 640, margin: "80px auto", padding: 24 }}>
      <h1>E-mailadres bevestigen</h1>
      <p>Je verificatielink wordt verwerkt. Als de link geldig is, is je e-mailadres bevestigd.</p>
      <p><Link href="/">Ga naar Alimenta Pro</Link></p>
    </main>
  );
}
