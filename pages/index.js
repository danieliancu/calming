import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import { useState } from "react";
import { FiZap, FiStar, FiUsers, FiHelpCircle } from "react-icons/fi";
import { FaStar } from "react-icons/fa"

const FAQS = [
  {
    q: "Cum incepe o conversatie cu Asistentul AI?",
    a: (
      <p>
        Deschide <Link href="/assistant">Asistentul</Link> si scrie intrebarea sau subiectul tau. Asistentul este
        disponibil permanent.
      </p>
    ),
  },
  {
    q: "Cum adaug o intrare de jurnal?",
    a: (
      <p>
        De pe orice pagina apasa &quot;Jurnalul tau&quot; sau deschide meniul jurnalului; se deschide o fereastra unde poti
        completa starea, contextul si notele.
      </p>
    ),
  },
  {
    q: "Pot deschide jurnalul din alte pagini?",
    a: (
      <p>
        Da. Jurnalul se deschide ca modal peste orice pagina. Il poti inchide din X sau cu tasta Esc, revenind exact
        unde erai.
      </p>
    ),
  },
  {
    q: "Se salveaza datele jurnalului?",
    a: (
      <p>
        In aceasta versiune demo, salvarea este locala (apare o confirmare). Nu trimitem date pe server.
      </p>
    ),
  },
  {
    q: "Ce este Comunitatea?",
    a: (
      <p>
        In <Link href="/community">Comunitate</Link> gasesti grupuri tematice (sprijin zilnic, mindfulness, gestionarea
        stresului) unde poti urmari discutii.
      </p>
    ),
  },
  {
    q: "Primesc notificari si remindere?",
    a: (
      <p>
        Vezi <Link href="/notifications">Notificari</Link> pentru exemple de remindere (ex: &quot;Reminder jurnal&quot;).
      </p>
    ),
  },
  {
    q: "Unde imi gestionez profilul si setarile?",
    a: (
      <p>
        Din coltul de sus poti accesa <Link href="/profile">Profil</Link> si <Link href="/settings">Setari</Link> pentru
        informatii personale si preferinte.
      </p>
    ),
  },
  {
    q: "Cum folosesc rapid functiile cheie?",
    a: (
      <p>
        In &quot;Actiuni rapide&quot; pe prima pagina ai scurtaturi catre Asistent, Programari si Jurnalul tau.
      </p>
    ),
  },
];

const MOOD_OPTIONS = [
  { label: "Minunat", emoji: "\u{1F60A}" },
  { label: "Bine", emoji: "\u{1F642}" },
  { label: "Ok", emoji: "\u{1F610}" },
  { label: "Greu", emoji: "\u{1F614}" },
];

export default function Home() {
  const router = useRouter();
  const [openFaqs, setOpenFaqs] = useState({});

  const openJournal = () => {
    router.push(
      { pathname: router.pathname, query: { ...router.query, journal: "new" } },
      undefined,
      { shallow: true }
    );
  };

  const toggleFaq = (index) => {
    setOpenFaqs((current) => ({ ...current, [index]: !current[index] }));
  };

  return (
    <>
      <Head>
        <meta charSet="utf-8" />
        <title>Calming - Asistent psihologic</title>
        <meta name="description" content="Platforma de wellness mental cu asistent psihologic AI" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <section className="hero">
        <video autoPlay muted loop playsInline src="/video/calm.mp4" className="hero-video" />
        <div className="u-relative">
          <div className="hero-badge">Psiholog AI</div>
          <h1 className="hero-title">Îndrumare confidențială pentru echilibrul tău</h1>
          <p className="hero-lead u-mt-2">
            Un spatiu sigur in care poti vorbi cu un asistent AI, poti tine un jurnal al starilor si poti gasi rapid
            specialisti si resurse de incredere.
          </p>
          <div className="row hello u-mt-3">
            <Link className="btn primary" href="/assistant">
              Incepe conversatia
            </Link>
            <Link className="btn" href="/psychologists">
              Programeaza o sedinta
            </Link>
          </div>
        </div>
      </section>

        <section className="card home-mood-card">
          <div className="section-title">Cum te simti azi?</div>
          <div className="row wrap u-mt-2">
            {MOOD_OPTIONS.map((item) => (
              <button
                key={item.label}
                type="button"
                className="mood-button"
                title={item.label}
                aria-label={`Ma simt ${item.label}`}
              >
                <span className="mood-emoji" aria-hidden="true">{item.emoji}</span>
                <span className="mood-label">{item.label}</span>
              </button>
            ))}
          </div>
          <div className="row u-mt-3">
            <input className="grow note-input" placeholder="Noteaza pe scurt ce simti." />
            <button className="btn primary">Salveaza</button>
          </div>

          <div className="note-card note-card-spaced">
            <div className="note-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
              </svg>
            </div>
            <div>
              <div className="u-text-semibold">Aminteste-ti sa ai grija de tine astazi.</div>
              <div className="muted note-subtext">
                Starea ta de bine conteaza, iar tu nu esti singur in aceasta calatorie.
              </div>
            </div>
          </div>
        </section>

      <div className="grid cols-3">
        <section className="card">
          <div className="section-title">
            <FiZap className="section-icon" /> Actiuni rapide
          </div>
          <div className="grid grid-single u-gap-2-5">
            <Link href="/assistant" className="list-item">
              Vorbeste cu Asistentul
            </Link>
            <Link href="/psychologists" className="list-item">
              Programeaza o sedinta
            </Link>
            <a
              href="#"
              className="list-item"
              onClick={(event) => {
                event.preventDefault();
                openJournal();
              }}
            >
              Adauga in jurnal
            </a>
          </div>
        </section>

        <section className="card">
          <div className="section-title">
            <FiStar className="section-icon" /> Recomandari pentru tine
          </div>
          <div className="grid u-gap-2-5">
            <Link href="/article/exercitii-de-respiratie-pentru-calm" className="list-item">
              Respiratie 4-7-8 - exercitiu ghidat (5 min)
            </Link>
            <Link href="/article/cum-sa-incepi-un-jurnal-al-emotiilor" className="list-item">
              Jurnalul recunostintei - 3 idei rapide
            </Link>
            <Link href="/article/rutina-de-seara-in-4-pasi" className="list-item">
              Cum sa-ti structurezi ziua pentru calm
            </Link>
          </div>
        </section>

        <section className="card">
          <div className="section-title">
            <FiUsers className="section-icon" /> Grupuri de sprijin
          </div>
          <div className="grid u-gap-2-5">
            <Link href="/community" className="list-item">
              Cercul zilnic de sprijin
            </Link>
            <Link href="/community" className="list-item">
              Mindfulness si autoingrijire
            </Link>
            <Link href="/community" className="list-item">
              Gestionarea stresului
            </Link>
          </div>
        </section>
      </div>

      <section className="card u-span-full u-mt-4">
        <div className="section-title">
          <FiHelpCircle className="section-icon" /> Intrebari si raspunsuri
        </div>
        <div className="accordion">
          {FAQS.map((item, index) => {
            const expanded = Boolean(openFaqs[index]);
            return (
              <div key={item.q} className={`acc-item ${expanded ? "open" : ""}`}>
                <button type="button" className="acc-header" aria-expanded={expanded} onClick={() => toggleFaq(index)}>
                  <span>{item.q}</span>
                  <span className="chev">{expanded ? "-" : "+"}</span>
                </button>
                {expanded && <div className="acc-panel">{item.a}</div>}
              </div>
            );
          })}
        </div>
      </section>
    </>
  );
}
