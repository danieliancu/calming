import Head from "next/head";
import { FiMessageSquare } from "react-icons/fi";


export default function Assistant() {
  return (
    <>
      <Head>
        <title>Asistent AI - Calming</title>
      </Head>
      <section className="card assistant-pane">
        <div className="section-title"><FiMessageSquare className="section-icon" /> Asistent AI</div>
        <p className="muted">Companionul tau pentru suport emotional.</p>

        <div className="assistant-thread">
          <div className="assistant-bubble">
            Buna! Sunt aici sa te ascult. Cu ce te pot ajuta?
          </div>
        </div>

        <div className="row u-mt-4">
          <input
            className="grow form-input"
            placeholder="Scrie un mesaj..."
          />
          <button className="btn primary">Trimite</button>
        </div>
      </section>
    </>
  );
}
