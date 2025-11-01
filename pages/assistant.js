import Head from "next/head";
import { FiMessageSquare } from "react-icons/fi";
import { useCallback, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";

export default function Assistant() {
  const { isAuthenticated, promptAuth } = useAuth();
  useEffect(() => {
    document.body.classList.add("assistant-page");
    return () => {
      document.body.classList.remove("assistant-page");
    };
  }, []);

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

  const demoThread = [
    {
      from: "ai",
      text: "Buna! Sunt aici sa te ascult. Cu ce te pot ajuta astazi?",
    },
    {
      from: "user",
      text: "Salut. Am avut o saptamana destul de plina si simt ca imi e greu sa imi pastrez energia.",
    },
    {
      from: "ai",
      text: "Inteleg. Ce situatii sau evenimente din aceasta saptamana te-au consumat cel mai mult?",
    },
    {
      from: "user",
      text: "Mai multe sedinte la job au fost tensionate. Am incercat sa raman calm, dar am ajuns epuizat.",
    },
    {
      from: "ai",
      text: "Cum iti raspunde corpul cand ajungi in acele sedinte? Observi semne fizice sau ganduri recurente?",
    },
    {
      from: "user",
      text: "Inima imi bate mai repede si am senzatia ca nu pot respira adanc. Mintea mea tot repeta ca nu fac destul.",
    },
    {
      from: "ai",
      text: "Multumesc ca impartasesti asta. Putem explora impreuna cateva tehnici de respiratie si mesaje de auto-compasiune?",
    },
    {
      from: "user",
      text: "Da, mi-ar prinde bine. Vreau sa ma simt mai ancorat in astfel de momente.",
    },
    {
      from: "ai",
      text: 'Perfect. Inainte sa intri in urmatoarea sedinta, ai putea incerca un exercitiu scurt de respiratie 4-4-4-4 si o fraza precum "Fac tot ce pot in acest moment". Cum suna pentru tine?',
    },
    {
      from: "user",
      text: "Pare util, imi place ca e simplu. O sa incerc si revin cu impresii.",
    },
    {
      from: "ai",
      text: "Astept sa aud cum a mers. Sunt aici pentru tine ori de cate ori ai nevoie.",
    },
    {
      from: "user",
      text: "Multumesc. Revin mai tarziu cu noutati, deja simplul fapt ca am discutat ma linisteste.",
    },
    {
      from: "ai",
      text: "Ma bucur sa aud asta. Ia-ti timpul de care ai nevoie si scrie-mi cand esti pregatit.",
    },
  ];

  return (
    <>
      <Head>
        <title>Asistent AI - Calming</title>
      </Head>
      <div className="assistant-wrapper">
        <section className="card assistant-pane">
          <header className="assistant-header">
            <div className="section-title">
              <FiMessageSquare className="section-icon" /> Asistent AI
            </div>
            <span className="muted">Companionul tau pentru suport emotional. 
            {!isAuthenticated ? (
              <span className="muted"> Conversatia nu se salveaza pana nu te conectezi la contul tau.</span>
            ) : (
              <span className="muted"> Mesajele tale sunt confidențiale. Vor fi folosite de AI pentru a-ți crea un profil.</span>
            )}
            </span>
          </header>

          <div className="assistant-body">
            <div className="assistant-thread" role="log" aria-live="polite">
              {demoThread.map((entry, index) => (
                <div
                  key={`${entry.from}-${index}`}
                  className={`assistant-bubble assistant-bubble--${entry.from}`}
                >
                  {entry.text}
                </div>
              ))}
            </div>

            <form className="assistant-form row u-mt-4" onSubmit={handleSend}>
              <input className="grow form-input" placeholder="Scrie un mesaj..." />
              <button className="btn primary" type="submit">
                Trimite
              </button>
            </form>
          </div>
        </section>
      </div>
    </>
  );
}
