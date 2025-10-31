import Head from "next/head";
import { useRouter } from "next/router";
import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";

export default function Login() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [forgotLoading, setForgotLoading] = useState(false);
  const [info, setInfo] = useState(null);
  const [error, setError] = useState(null);
  const { refreshAuth } = useAuth();

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError(null);
    setInfo(null);
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email, password }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.error || "Nu am putut autentifica utilizatorul.");
      }
      await refreshAuth();
      await router.push("/profile");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleForgot = async () => {
    if (!email) {
      setError("Introdu emailul pentru a primi instructiunile de resetare.");
      return;
    }
    setForgotLoading(true);
    setError(null);
    setInfo(null);
    try {
      const response = await fetch("/api/auth/forgot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.error || "Nu am putut trimite emailul.");
      }
      setInfo(data.message || "Ti-am trimis un email cu instructiuni.");
    } catch (err) {
      setError(err.message);
    } finally {
      setForgotLoading(false);
    }
  };

  return (
    <>
      <Head>
        <title>Autentificare - Calming</title>
      </Head>
      <section className="card auth-card">
        <div className="section-title">Autentificare</div>
        <p className="muted">Introdu emailul si parola contului tau pentru a continua.</p>
        {error ? <div className="error u-mt-2">{error}</div> : null}
        {info ? <div className="info u-mt-2">{info}</div> : null}
        <form className="auth-form u-mt-4" onSubmit={handleSubmit}>
          <label className="auth-field">
            <span>Email</span>
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
              autoComplete="email"
            />
          </label>
          <label className="auth-field">
            <span>Parola</span>
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
              autoComplete="current-password"
              minLength={8}
            />
          </label>
          <button className="btn primary u-mt-3" type="submit" disabled={loading}>
            {loading ? "Se conecteaza..." : "Conecteaza-te"}
          </button>
        </form>
        <div className="auth-footer u-mt-3">
          <button
            type="button"
            className="link-button"
            onClick={handleForgot}
            disabled={forgotLoading}
          >
            {forgotLoading ? "Se trimite emailul..." : "Ai uitat parola?"}
          </button>
        </div>
      </section>
    </>
  );
}
