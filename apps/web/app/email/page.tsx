"use client";
import { useState } from "react";
import { getAccessToken } from "@/lib/api/client";

export default function EmailPage() {
  const [status, setStatus] = useState<string>("");

  const connectGoogle = async () => {
    setStatus("Připojování...");
    try {
      const res = await fetch("/api/email/auth-url", { headers: { Authorization: `Bearer ${getAccessToken()}` } });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        setStatus("Google OAuth není nakonfigurováno – zkontroluj .env");
      }
    } catch {
      setStatus("Chyba připojení");
    }
  };

  return (
    <div style={{ maxWidth: 600, margin: "40px auto", padding: 20 }}>
      <h1 style={{ fontSize: 24, marginBottom: 16 }}>Gmail</h1>
      <button onClick={connectGoogle} style={{ padding: "8px 16px", cursor: "pointer" }}>Připojit Gmail</button>
      {status && <p style={{ marginTop: 16 }}>{status}</p>}
    </div>
  );
}
