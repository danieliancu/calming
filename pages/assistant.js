import Head from "next/head";
import { FiMessageSquare } from "react-icons/fi";
import { useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";

export default function Assistant() {
  const { isAuthenticated, promptAuth } = useAuth();

  const handleSend = useCallback(
    (event) => {
      event.preventDefault();
      if (!isAuthenticated) {
        promptAuth();
        return;
      }
      alert("Mesaj trimis catre asistent (demo).");
    },
    [isAuthenticated, promptAuth]
  );

  return (
    <>
      <Head>
        <title>Asistent AI - Calming</title>
      </Head>
      <section className="card assistant-pane">
        <div className="section-title">
          <FiMessageSquare className="section-icon" /> Asistent AI
        </div>
        <span className="muted">Companionul tau pentru suport emotional. </span>
        {!isAuthenticated ? (
          <span className="muted">
            Conversatia nu se salveaza pana nu te conectezi la contul tau.
          </span>
        ) : (
          <span className="muted">
            Mesajele tale vor fi asociate contului tau si vor fi folosite pentru a te ajuta in drumul tau.
          </span>
        )}

        <div className="assistant-thread">
          <div className="assistant-bubble">Buna! Sunt aici sa te ascult. Cu ce te pot ajuta?</div>
        </div>

        <form className="row u-mt-4" onSubmit={handleSend}>
          <input className="grow form-input" placeholder="Scrie un mesaj..." />
          <button className="btn primary" type="submit">
            Trimite
          </button>
        </form>
      </section>
    </>
  );
}
