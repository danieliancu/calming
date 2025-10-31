import Head from "next/head";
import { useRouter } from "next/router";
import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";

const initialForm = {
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  password: "",
};

export default function Signup() {
  const router = useRouter();
  const [form, setForm] = useState(initialForm);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { refreshAuth } = useAuth();

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.error || "Nu am putut crea contul.");
      }
      await refreshAuth();
      await router.push("/profile");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Head>
        <title>Inregistrare - Calming</title>
      </Head>
      <section className="card auth-card">
        <div className="section-title">Creeaza un cont Calming</div>
        <p className="muted">
          Completeaza detaliile de mai jos pentru a salva jurnalul, programarile si notificarile in contul tau.
        </p>
        {error ? <div className="error u-mt-2">{error}</div> : null}
        <form className="auth-form u-mt-4" onSubmit={handleSubmit}>
          <label className="auth-field">
            <span>Prenume</span>
            <input
              name="firstName"
              value={form.firstName}
              onChange={handleChange}
              required
              autoComplete="given-name"
            />
          </label>
          <label className="auth-field">
            <span>Nume</span>
            <input
              name="lastName"
              value={form.lastName}
              onChange={handleChange}
              required
              autoComplete="family-name"
            />
          </label>
          <label className="auth-field">
            <span>Email</span>
            <input
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              required
              autoComplete="email"
            />
          </label>
          <label className="auth-field">
            <span>Parola</span>
            <input
              type="password"
              name="password"
              value={form.password}
              onChange={handleChange}
              required
              minLength={8}
              autoComplete="new-password"
            />
          </label>
          <label className="auth-field">
            <span>Telefon (optional)</span>
            <input
              name="phone"
              value={form.phone}
              onChange={handleChange}
              autoComplete="tel"
            />
          </label>
          <button className="btn primary u-mt-3" type="submit" disabled={loading}>
            {loading ? "Se creeaza contul..." : "Creeaza cont"}
          </button>
        </form>
      </section>
    </>
  );
}
