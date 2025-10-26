import { useEffect, useState } from "react";

const MOODS = [
  { label: "Minunat", emoji: "\u{1F60A}" },
  { label: "Bine", emoji: "\u{1F642}" },
  { label: "Ok", emoji: "\u{1F610}" },
  { label: "Greu", emoji: "\u{1F614}" },
];

const SYMPTOMS = [
  "Anxietate",
  "Atac de panica",
  "Tristete",
  "Iritabilitate",
  "Oboseala",
  "Probleme de somn",
  "Ganduri intruzive",
  "Dificultati de concentrare",
  "Lipsa de energie",
  "Retragere sociala",
];

const CONTEXT_TAGS = [
  "Munca",
  "Familie",
  "Financiar",
  "Sanatate",
  "Somn insuficient",
  "Eveniment social",
];

export default function JournalModal({ onClose }) {
  const [mood, setMood] = useState(null);
  const [level, setLevel] = useState(3);
  const [symptoms, setSymptoms] = useState([]);
  const [context, setContext] = useState([]);
  const [notes, setNotes] = useState("");

  useEffect(() => {
    const onKey = (event) => {
      if (event.key === "Escape") {
        onClose?.();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  const toggle = (list, setter, value) => {
    setter((current) =>
      current.includes(value)
        ? current.filter((item) => item !== value)
        : [...current, value]
    );
  };

  const saveEntry = () => {
    const payload = {
      mood,
      level,
      symptoms,
      context,
      notes,
    };
    console.log("journal_entry", payload);
    alert("Intrarea a fost salvata local (demo)");
    onClose?.();
  };

  return (
    <div className="modal-root" role="dialog" aria-modal="true" aria-label="Intrare jurnal">
      <div className="modal-backdrop" onClick={onClose} />
      <div className="modal-center">
        <section className="sheet">
          <div className="sheet-head">
            <div className="title">Intrare noua in Jurnal</div>
            <button type="button" className="close" aria-label="Inchide" onClick={onClose}>
              x
            </button>
          </div>

          <div className="u-mt-2">
            <div className="muted">Cum te simti?</div>
            <div className="moods u-mt-2">
              {MOODS.map((item) => (
                <button
                  key={item.label}
                  type="button"
                  className={`mood-button ${mood === item.label ? "sel" : ""}`}
                  onClick={() => setMood(item.label)}
                  title={item.label}
                  aria-pressed={mood === item.label}
                  aria-label={`Ma simt ${item.label}`}
                >
                  <span className="mood-emoji" aria-hidden="true">{item.emoji}</span>
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
              {CONTEXT_TAGS.map((tag) => (
                <button
                  type="button"
                  key={tag}
                  className={`tag ${context.includes(tag) ? "sel" : ""}`}
                  onClick={() => toggle(context, setContext, tag)}
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>

          <div className="u-mt-4">
            <div className="muted">Simptome (selecteaza tot ce se aplica)</div>
            <div className="tags u-mt-2">
              {SYMPTOMS.map((tag) => (
                <button
                  type="button"
                  key={tag}
                  className={`tag ${symptoms.includes(tag) ? "sel" : ""}`}
                  onClick={() => toggle(symptoms, setSymptoms, tag)}
                >
                  {tag}
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
              onChange={(event) => setNotes(event.target.value)}
              placeholder="Adauga detalii despre cum te simti astazi."
            />
          </div>

          <div className="actions">
            <button type="button" className="btn" onClick={onClose}>
              Renunta
            </button>
            <button type="button" className="btn primary" onClick={saveEntry}>
              Salveaza intrarea
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}
