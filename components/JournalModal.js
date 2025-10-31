import { useEffect, useState } from "react";

export default function JournalModal({ onClose, onSaved }) {
  const [moods, setMoods] = useState([]);
  const [symptoms, setSymptoms] = useState([]);
  const [contexts, setContexts] = useState([]);
  const [selectedMoodId, setSelectedMoodId] = useState(null);
  const [level, setLevel] = useState(3);
  const [selectedSymptoms, setSelectedSymptoms] = useState([]);
  const [selectedContexts, setSelectedContexts] = useState([]);
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [formError, setFormError] = useState(null);

  useEffect(() => {
    const onKey = (event) => {
      if (event.key === "Escape") {
        onClose?.();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  useEffect(() => {
    let cancelled = false;
    const loadMeta = async () => {
      try {
        const response = await fetch("/api/journal/meta");
        if (!response.ok) {
          throw new Error("Failed to load journal metadata");
        }
        const data = await response.json();
        if (!cancelled) {
          setMoods(data.moods ?? []);
          setSymptoms(data.symptoms ?? []);
          setContexts(data.contexts ?? []);
          setLoading(false);
        }
      } catch (err) {
        if (!cancelled) {
          console.error(err);
          setError("Nu am putut incarca optiunile de jurnal.");
          setLoading(false);
        }
      }
    };
    loadMeta();
    return () => {
      cancelled = true;
    };
  }, []);

  const toggleSelection = (setter) => (value) => {
    setFormError(null);
    setter((current) =>
      current.includes(value)
        ? current.filter((item) => item !== value)
        : [...current, value]
    );
  };

  const toggleContext = toggleSelection(setSelectedContexts);
  const toggleSymptom = toggleSelection(setSelectedSymptoms);

  const saveEntry = async () => {
    if (!selectedMoodId) {
      setFormError("Selecteaza emoji-ul care descrie cel mai bine starea ta.");
      return;
    }

    setSaving(true);
    setFormError(null);
    try {
      const response = await fetch("/api/journal/entries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          moodId: selectedMoodId,
          intensity: level,
          notes,
          contextIds: selectedContexts,
          symptomIds: selectedSymptoms,
        }),
      });
      if (!response.ok) {
        throw new Error("Failed to save entry");
      }
      setSaving(false);
      const closeResult = onClose?.();
      if (closeResult && typeof closeResult.then === "function") {
        try {
          await closeResult;
        } catch (closeError) {
          console.error("Journal modal close failed", closeError);
        }
      }
      const refreshResult = onSaved?.();
      if (refreshResult && typeof refreshResult.then === "function") {
        refreshResult.catch((err) => {
          console.error("Journal refresh failed", err);
        });
      }
    } catch (err) {
      console.error(err);
      setFormError("Nu am putut salva nota. Incearca din nou.");
      setSaving(false);
    }
  };

  return (
    <div className="modal-root" role="dialog" aria-modal="true" aria-label="Nota completa in jurnal">
      <div className="modal-backdrop" onClick={onClose} />
      <div className="modal-center">
        <section className="sheet">
          <div className="sheet-head">
            <div className="title">Nota completa in jurnal</div>
            <button type="button" className="close" aria-label="Inchide" onClick={onClose}>
              x
            </button>
          </div>

          {formError ? <div className="error u-mt-2">{formError}</div> : null}

          {loading ? (
            <div className="u-mt-2 muted">Se incarca optiunile...</div>
          ) : error ? (
            <div className="u-mt-2 error">{error}</div>
          ) : (
            <>
              <div className="u-mt-2">
                <div className="muted">Cum te simti?</div>
                <div className="moods u-mt-2">
                  {moods.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      className={`mood-button ${selectedMoodId === item.id ? "sel" : ""}`}
                      onClick={() => {
                        setSelectedMoodId(item.id);
                        setFormError(null);
                      }}
                      title={item.label}
                      aria-pressed={selectedMoodId === item.id}
                      aria-label={`Ma simt ${item.label}`}
                    >
                      <span className="mood-emoji" aria-hidden="true">
                        {item.emoji}
                      </span>
                      <span className="mood-label">{item.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="range-section">
                <div className="muted">Nivel intensitate</div>
                <div className="row u-mt-2">
                  <div className="range-wrap grow">
                    <input
                      className="range"
                      type="range"
                      min="0"
                      max="10"
                      value={level}
                      onChange={(event) => setLevel(Number(event.target.value))}
                    />
                    <div className="scale">
                      <span>Mic</span>
                      <span>Sever</span>
                    </div>
                  </div>
                  <div className="bubble">{level}/10</div>
                </div>
              </div>

              <div className="u-mt-4">
                <div className="muted">Context (optional)</div>
                <div className="tags u-mt-2">
                  {contexts.map((tag) => (
                    <button
                      type="button"
                      key={tag.id}
                      className={`tag ${selectedContexts.includes(tag.id) ? "sel" : ""}`}
                      onClick={() => toggleContext(tag.id)}
                    >
                      {tag.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="u-mt-4">
                <div className="muted">Simptome (selecteaza tot ce se aplica)</div>
                <div className="tags u-mt-2">
                  {symptoms.map((tag) => (
                    <button
                      type="button"
                      key={tag.id}
                      className={`tag ${selectedSymptoms.includes(tag.id) ? "sel" : ""}`}
                      onClick={() => toggleSymptom(tag.id)}
                    >
                      {tag.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="u-mt-4">
                <div className="muted">Note (optional)</div>
              <textarea
                className="journal-notes u-mt-2"
                rows={5}
                value={notes}
                onChange={(event) => {
                  setNotes(event.target.value);
                }}
                placeholder="Adauga detalii despre cum te simti astazi."
              />
            </div>

              <div className="actions">
                <button type="button" className="btn" onClick={onClose}>
                  Renunta
                </button>
                <button type="button" className="btn primary" onClick={saveEntry} disabled={saving}>
                  {saving ? "Se salveaza..." : "Salveaza intrarea"}
                </button>
              </div>
              
            </>
          )}
        </section>
      </div>
    </div>
  );
}

