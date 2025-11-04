import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import { useCallback, useMemo, useState } from "react";
import { FiZap, FiStar, FiUsers, FiHelpCircle } from "react-icons/fi";
import { query } from "@/lib/db";
import { useAuth } from "@/contexts/AuthContext";

export default function Home({ moodOptions, faqs, recommendedArticles, communityGroups }) {
  const router = useRouter();
  const [openFaqs, setOpenFaqs] = useState({});
  const { isAuthenticated, promptAuth, userName: authUserName, userFirstName } = useAuth();
  const [quickMoodId, setQuickMoodId] = useState(null);
  const [quickNote, setQuickNote] = useState("");
  const [quickSaving, setQuickSaving] = useState(false);
  const [quickError, setQuickError] = useState(null);
  const [quickSuccess, setQuickSuccess] = useState(null);

  const greetingName = useMemo(() => {
    const sourceName = userFirstName ?? authUserName;
    if (!sourceName) {
      return null;
    }
    const trimmed = String(sourceName).trim();
    if (!trimmed) {
      return null;
    }
    const [first] = trimmed.split(/\s+/);
    return first || null;
  }, [userFirstName, authUserName]);

  const openJournal = () => {
    if (!isAuthenticated) {
      promptAuth();
      return;
    }
    router.push(
      { pathname: router.pathname, query: { ...router.query, journal: "new" } },
      undefined,
      { shallow: true }
    );
  };

  const toggleFaq = (index) => {
    setOpenFaqs((current) => ({ ...current, [index]: !current[index] }));
  };

  const handleMoodSelect = useCallback(
    (moodId) => {
      if (!isAuthenticated) {
        promptAuth();
        return;
      }
      setQuickMoodId(moodId);
      setQuickError(null);
      setQuickSuccess(null);
    },
    [isAuthenticated, promptAuth]
  );

  const handleQuickSave = useCallback(async () => {
    if (!isAuthenticated) {
      promptAuth();
      return;
    }
    if (!quickMoodId) {
      setQuickError("Selecteaza starea din lista inainte sa salvezi.");
      return;
    }
    setQuickSaving(true);
    setQuickError(null);
    setQuickSuccess(null);
    try {
      const response = await fetch("/api/journal/quick", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ moodId: quickMoodId, notes: quickNote }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.error || "Nu am putut salva nota.");
      }
      setQuickSuccess(
        <>
          Nota rapidă a fost salvată. O poți vedea în contul tău, accesând{' '}
          <Link
            href="/journal"
            style={{ color: 'var(--color-accent-content)', textDecoration: 'underline' }}
          >
            Jurnalul meu
          </Link>.
        </>
      );
      setQuickNote("");
      setQuickMoodId(null);
    } catch (error) {
      setQuickError(error.message);
    } finally {
      setQuickSaving(false);
    }
  }, [isAuthenticated, promptAuth, quickMoodId, quickNote]);

  const guardMoodCard = useCallback(
    (event) => {
      if (isAuthenticated) {
        return;
      }
      if (event.type === "keydown" && event.key !== "Enter" && event.key !== " ") {
        return;
      }
      event.preventDefault();
      event.stopPropagation();
      promptAuth();
    },
    [isAuthenticated, promptAuth]
  );

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
          <div className="hero-badge">Psihologul tău</div>
          <h1 className="hero-title">Indrumare confidentiala pentru echilibrul tau</h1>
          <p className="hero-lead u-mt-2">
            Un spatiu sigur in care poti vorbi cu un asistent AI, poti tine un jurnal al starilor si poti gasi rapid
            specialisti si resurse de incredere.
          </p>
          <div className="row hello u-mt-3">
            <Link className="btn primary" href="/assistant">
              Incepe conversatia cu un asistent AI
            </Link>
            <Link className="btn" href="/psychologists">
              Programeaza o sedinta cu un psiholog
            </Link>
          </div>
        </div>
      </section>

      <section
        className="card home-mood-card"
        onClickCapture={guardMoodCard}
        onKeyDownCapture={guardMoodCard}
      >
        <div className="section-title">
          {isAuthenticated && greetingName ? `Buna, ${greetingName}! Cum te simti azi?` : "Cum te simti azi?"}
        </div>
        <div className="row wrap mood-row u-mt-2">
          {moodOptions.map((item) => (
            <button
              key={item.id}
              type="button"
              className={`mood-button ${quickMoodId === item.id ? "sel" : ""}`}
              title={item.label}
              aria-label={`Ma simt ${item.label}`}
              aria-pressed={quickMoodId === item.id}
              onClick={() => handleMoodSelect(item.id)}
            >
              <span className="mood-emoji" aria-hidden="true">
                {item.emoji}
              </span>
              <span className="mood-label">{item.label}</span>
            </button>
          ))}
        </div>
        <div className="row u-mt-3">
          <input
            className="grow note-input"
            placeholder="Adaugă un gând dacă simți nevoia."
            value={quickNote}
            onChange={(event) => setQuickNote(event.target.value)}
            maxLength={255}
            disabled={quickSaving}
          />
          <button className="btn primary" type="button" onClick={handleQuickSave} disabled={quickSaving}>
            {quickSaving ? "Se salveaza..." : "Salveaza"}
          </button>
        </div>
        {quickError ? <div className="error u-mt-2">{quickError}</div> : null}
        {quickSuccess ? <div className="info u-mt-2">{quickSuccess}</div> : null}

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
            {recommendedArticles.map((item) => (
              <Link key={item.slug} href={`/article/${item.slug}`} className="list-item">
                {item.title}
              </Link>
            ))}
          </div>
        </section>

        <section className="card">
          <div className="section-title">
            <FiUsers className="section-icon" /> Grupuri de sprijin
          </div>
          <div className="grid u-gap-2-5">
            {communityGroups.map((group) => (
              <Link key={group.name} href="/community" className="list-item">
                {group.name}
              </Link>
            ))}
          </div>
        </section>
      </div>

      <section className="card u-span-full u-mt-4">
        <div className="section-title">
          <FiHelpCircle className="section-icon" /> Intrebari si raspunsuri
        </div>
        <div className="accordion">
          {faqs.map((item, index) => {
            const expanded = Boolean(openFaqs[index]);
            return (
              <div key={item.id} className={`acc-item ${expanded ? "open" : ""}`}>
                <button type="button" className="acc-header" aria-expanded={expanded} onClick={() => toggleFaq(index)}>
                  <span style={{ textAlign:"left" }}>{item.question}</span>
                  <span className="chev">{expanded ? "-" : "+"}</span>
                </button>
                {expanded && (
                  <div className="acc-panel">
                    <p>{item.answer}</p>
                    {item.link_href ? (
                      <div className="u-mt-2">
                        <Link href={item.link_href} className="text-link">
                          {item.link_text ?? "Vezi detalii"}
                        </Link>
                        {item.link_hint ? <span className="muted u-ml-2">{item.link_hint}</span> : null}
                      </div>
                    ) : null}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>
    </>
  );
}

export async function getServerSideProps() {
  const [moodOptions, faqs, recommendedArticles, communityGroups] = await Promise.all([
    query("SELECT id, label, emoji FROM mood_options ORDER BY id"),
    query("SELECT id, question, answer, link_href, link_text, link_hint FROM faqs ORDER BY id"),
    query(
      "SELECT slug, title, minutes FROM articles WHERE is_recommended = 1 ORDER BY id LIMIT 3"
    ),
    query(
      "SELECT name, members, last_active FROM community_groups ORDER BY members DESC LIMIT 3"
    ),
  ]);

  return {
    props: {
      moodOptions,
      faqs,
      recommendedArticles,
      communityGroups,
    },
  };
}
