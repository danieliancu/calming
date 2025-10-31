import Head from "next/head";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { getCurrentUserId } from "@/lib/currentUser";
import { fetchJournalEntries } from "@/lib/journal";

export default function JournalPage({ entries }) {
  const { isAuthenticated, promptAuth } = useAuth();
  const [items, setItems] = useState(entries ?? []);
  const [deleteError, setDeleteError] = useState(null);
  const [deletingKey, setDeletingKey] = useState(null);

  useEffect(() => {
    if (!isAuthenticated) {
      promptAuth();
    }
  }, [isAuthenticated, promptAuth]);

  useEffect(() => {
    setItems(entries ?? []);
  }, [entries]);

  const handleDelete = async (entry) => {
    if (!entry?.id) {
      return;
    }
    const key = `${entry.type}-${entry.id}`;
    const confirmed = window.confirm("Esti sigur ca vrei sa stergi aceasta nota din jurnal?");
    if (!confirmed) {
      return;
    }

    setDeletingKey(key);
    setDeleteError(null);
    try {
      const response = await fetch("/api/journal/delete", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ entryId: entry.id, type: entry.type }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data?.error || "Nu am putut sterge nota.");
      }
      setItems((current) => current.filter((item) => !(item.type === entry.type && item.id === entry.id)));
    } catch (error) {
      console.error("Delete journal entry error", error);
      setDeleteError(error.message || "Nu am putut sterge nota.");
    } finally {
      setDeletingKey(null);
    }
  };

  if (!isAuthenticated) {
    return (
      <>
        <Head>
          <title>Jurnal - Calming</title>
        </Head>
        <section className="card accent u-mt-4">
          <div className="section-title">Conecteaza-te pentru a-ti vedea jurnalul</div>
          <p className="muted">
            Autentifica-te pentru a revizui notele rapide si intrarile complete inregistrate in contul tau.
          </p>
          <button className="btn primary u-mt-3" type="button" onClick={promptAuth}>
            Intra in cont
          </button>
        </section>
      </>
    );
  }

  return (
    <>
      <Head>
        <title>Jurnalul meu - Calming</title>
      </Head>

      <main className="journal-page">
        <section className="card accent journal-header">
          <div>
            <h1 className="section-title">Jurnalul meu</h1>
            <p className="muted">
              Revizuieste notele rapide si intrarile complete inregistrate recent. Pentru a adauga o nota noua, apasa{" "}
              <Link style={{ textDecoration:"underline" }} className="text-link" href={{ pathname: "/journal", query: { journal: "new" } }}>
                aici
              </Link>
              .
            </p>
          </div>
        </section>

        <div className="journal-footer">
          <Link className="profile-action secondary" href="/profile">
            &larr; Inapoi la profil
          </Link>
        </div>

        {deleteError ? <div className="error">{deleteError}</div> : null}

        <section className="card journal-section">
          {items.length ? (
            <ul className="journal-list">
              {items.map((entry) => {
                const key = `${entry.type}-${entry.id}`;
                return (
                  <li key={key} className="journal-item">
                    <div className="journal-icon" aria-hidden="true">
                      {entry.mood_emoji || "??"}
                      <span className="journal-mood">{entry.mood_label || "Stare neidentificata"}</span>
                    </div>
                    <div className="journal-body">
                      <div className="journal-meta">
                        <div>
                          <span className="journal-type">
                            {entry.type === "quick" ? "Nota rapida" : "Nota completa"}
                          </span>
                          <span className="journal-date">{formatDateTime(entry.created_at)}</span>
                        </div>
                        <div className="journal-actions">
                          <button
                            type="button"
                            className="journal-delete"
                            onClick={() => handleDelete(entry)}
                            disabled={deletingKey === key}
                          >
                            {deletingKey === key ? "Se sterge..." : "Sterge"}
                          </button>
                      </div>
                      </div>
                      {entry.notes ? <div className="journal-notes">{entry.notes}</div> : null}
                      {entry.contexts?.length ? (
                        <div className="journal-tags">
                          <span className="label">Context:</span>
                          <span>{entry.contexts.join(", ")}</span>
                        </div>
                      ) : null}
                      {entry.symptoms?.length ? (
                        <div className="journal-tags">
                          <span className="label">Simptome:</span>
                          <span>{entry.symptoms.join(", ")}</span>
                        </div>
                      ) : null}

                    </div>
                  </li>
                );
              })}
            </ul>
          ) : (
            <div className="muted">Nu exista inregistrari in jurnal in acest moment.</div>
          )}
        </section>


      </main>
    </>
  );
}

export async function getServerSideProps(context) {
  const userId = getCurrentUserId(context.req);
  if (!userId) {
    return {
      props: {
        entries: [],
      },
    };
  }

  const entries = await fetchJournalEntries(userId, { limit: 50 });
  return {
    props: {
      entries,
    },
  };
}

function formatDateTime(dateString) {
  if (!dateString) {
    return "";
  }
  const date = new Date(dateString);
  return date.toLocaleString("ro-RO", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
