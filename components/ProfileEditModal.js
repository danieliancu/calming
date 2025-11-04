import { useMemo, useState } from "react";
import { useToast } from "@/contexts/ToastContext";

const AGE_RANGES = [
  "18-24",
  "25-34",
  "35-44",
  "45-54",
  "55+",
];

const FOCUS_TOPICS = [
  "Gestionarea anxietatii",
  "Echilibru munca-viata",
  "Relatii si conexiune",
  "Stima de sine si auto-compasiune",
  "Gestionarea stresului",
  "Somn si recuperare",
  "Trauma si vindecare",
  "Claritate in obiective",
];

const GUIDANCE_STYLES = [
  { value: "calm-empathetic", label: "Calm si empatic" },
  { value: "solution-focused", label: "Direct si orientat pe solutii" },
  { value: "motivational", label: "Motivant si pragmatic" },
];

const CHECK_IN_OPTIONS = [
  { value: "morning", label: "Dimineata (7-11)" },
  { value: "afternoon", label: "Pranz / dupa-amiaza (11-17)" },
  { value: "evening", label: "Seara (17-22)" },
  { value: "weekend", label: "Mai ales in weekend" },
];

const THERAPY_STATUS = [
  { value: "none", label: "Nu merg la terapie in prezent" },
  { value: "considering", label: "Ma gandesc sa incep" },
  { value: "active", label: "Sunt in terapie activa" },
  { value: "completed", label: "Am incheiat recent un proces terapeutic" },
];

const NOTIFICATION_FREQUENCIES = [
  { value: "daily", label: "Zilnic" },
  { value: "three-per-week", label: "De trei ori pe saptamana" },
  { value: "weekly", label: "Saptamanal" },
  { value: "only-insights", label: "Doar cand exista ceva important pentru mine" },
];

export default function ProfileEditModal({ initialProfile, initialDetails, onClose, onSaved }) {
  const { showToast } = useToast();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [form, setForm] = useState(() => ({
    communityAlias: initialProfile?.community_alias ?? "",
    ageRange: initialDetails?.age_range ?? "",
    focusTopics: initialDetails?.focus_topics ?? [],
    primaryGoal: initialDetails?.primary_goal ?? "",
    stressTriggers: initialDetails?.stress_triggers ?? "",
    copingStrategies: initialDetails?.coping_strategies ?? "",
    guidanceStyle: initialDetails?.guidance_style ?? "",
    checkInPreference: initialDetails?.check_in_preference ?? "",
    therapyStatus: initialDetails?.therapy_status ?? "",
    notificationFrequency: initialDetails?.notification_frequency ?? "",
  }));

  const focusTopicSet = useMemo(() => new Set(form.focusTopics ?? []), [form.focusTopics]);

  const updateField = (key) => (value) => {
    setError(null);
    setForm((current) => ({ ...current, [key]: value }));
  };

  const toggleFocusTopic = (topic) => {
    setError(null);
    setForm((current) => {
      const nextTopics = new Set(current.focusTopics ?? []);
      if (nextTopics.has(topic)) {
        nextTopics.delete(topic);
      } else {
        nextTopics.add(topic);
      }
      return { ...current, focusTopics: Array.from(nextTopics) };
    });
  };

  const handleSubmit = async (event) => {
    event?.preventDefault?.();
    if (saving) {
      return;
    }

    const alias = (form.communityAlias || "").trim();
    if (!alias) {
      setError("Alege un nume care va fi folosit in comunitate.");
      return;
    }
    if (alias.length > 60) {
      setError("Numele ales pentru comunitate trebuie sa aiba cel mult 60 de caractere.");
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const response = await fetch("/api/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          communityAlias: alias,
          ageRange: form.ageRange,
          focusTopics: form.focusTopics,
          primaryGoal: form.primaryGoal?.trim() ?? "",
          stressTriggers: form.stressTriggers?.trim() ?? "",
          copingStrategies: form.copingStrategies?.trim() ?? "",
          guidanceStyle: form.guidanceStyle,
          checkInPreference: form.checkInPreference,
          therapyStatus: form.therapyStatus,
          notificationFrequency: form.notificationFrequency,
        }),
      });

      let data = null;
      try {
        data = await response.json();
      } catch {
        data = null;
      }

      if (!response.ok) {
      setError(data?.error || "Nu am putut salva profilul. Verifica campurile si incearca din nou.");
        setSaving(false);
        return;
      }

      onSaved?.(data);
      showToast({
        message: "Profilul tau a fost actualizat.",
        actionHref: "/profile",
        actionLabel: "Vezi profilul",
      });
      onClose?.();
    } catch (err) {
      console.error("Profile update failed", err);
      setError("Nu am putut salva profilul. Verifica conexiunea si incearca din nou.");
      setSaving(false);
      return;
    }
    setSaving(false);
  };

  return (
    <div className="modal-root" role="dialog" aria-modal="true" aria-label="Editeaza profilul">
      <div className="modal-backdrop" onClick={onClose} />
      <div className="modal-center">
        <section className="sheet profile-sheet">
          <div className="sheet-head">
            <div>
              <div className="title">Editeaza profilul</div>
              <div className="muted u-mt-1">
                Completeaza detalii care il vor ajuta pe asistentul AI sa iti ofere recomandari mai bune.
              </div>
            </div>
            <button type="button" className="close" aria-label="Inchide" onClick={onClose}>
              x
            </button>
          </div>

          {error ? <div className="error">{error}</div> : null}

          <form className="profile-form" onSubmit={handleSubmit}>
            <div className="profile-section">
              <label className="profile-label" htmlFor="communityAlias">
                Nume folosit in comunitate <span className="req">*</span>
              </label>
              <input
                id="communityAlias"
                className="form-input"
                value={form.communityAlias}
                onChange={(event) => updateField("communityAlias")(event.target.value)}
                maxLength={60}
                placeholder="Ex: Luna calm, Andreea M., Traveler"
                autoFocus
              />
              <div className="profile-hint">
                Acest nume va aparea in comunitate si in discutiile grupului, nu va fi vizibila identitatea ta reala.
              </div>
            </div>

            <div className="profile-grid">
              <div>
              <label className="profile-label" htmlFor="ageRange">
                  Interval de varsta
                </label>
                <select
                  id="ageRange"
                  className="form-input"
                  value={form.ageRange}
                  onChange={(event) => updateField("ageRange")(event.target.value)}
                >
                  <option value="">Selecteaza</option>
                  {AGE_RANGES.map((item) => (
                    <option key={item} value={item}>
                      {item} ani
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="profile-label" htmlFor="guidanceStyle">
                  Cum preferi ghidajul
                </label>
                <select
                  id="guidanceStyle"
                  className="form-input"
                  value={form.guidanceStyle}
                  onChange={(event) => updateField("guidanceStyle")(event.target.value)}
                >
                  <option value="">Selecteaza</option>
                  {GUIDANCE_STYLES.map((item) => (
                    <option key={item.value} value={item.value}>
                      {item.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="profile-section">
              <div className="profile-label">
                Pe ce arii vrei sa lucram
              </div>
              <div className="tags u-mt-2">
                {FOCUS_TOPICS.map((topic) => (
                  <button
                    type="button"
                    key={topic}
                    className={`tag ${focusTopicSet.has(topic) ? "sel" : ""}`}
                    onClick={() => toggleFocusTopic(topic)}
                  >
                    {topic}
                  </button>
                ))}
              </div>
            </div>

            <div className="profile-section">
              <label className="profile-label" htmlFor="primaryGoal">
                Ce iti doresti cel mai mult sa imbunatatesti
              </label>
              <textarea
                id="primaryGoal"
                className="profile-textarea"
                rows={3}
                value={form.primaryGoal}
                onChange={(event) => updateField("primaryGoal")(event.target.value)}
                placeholder="Ex: Vreau sa gestionez mai bine anxietatea care apare la job si sa imi recapat energia."
              />
            </div>

            <div className="profile-grid">
              <div>
                <label className="profile-label" htmlFor="stressTriggers">
                  Ce declanseaza de obicei starea dificila
                </label>
                <textarea
                  id="stressTriggers"
                  className="profile-textarea"
                  rows={3}
                  value={form.stressTriggers}
                  onChange={(event) => updateField("stressTriggers")(event.target.value)}
                  placeholder="Sedinte tensionate, lipsa somnului, conflicte nerezolvate..."
                />
              </div>
              <div>
                <label className="profile-label" htmlFor="copingStrategies">
                  Ce te ajuta deja
                </label>
                <textarea
                  id="copingStrategies"
                  className="profile-textarea"
                  rows={3}
                  value={form.copingStrategies}
                  onChange={(event) => updateField("copingStrategies")(event.target.value)}
                  placeholder="Plimbari, exercitii de respiratie, discutii cu o persoana de incredere..."
                />
              </div>
            </div>

            <div className="profile-grid">
              <div>
                <label className="profile-label" htmlFor="checkInPreference">
                  Cand preferi check-in-urile
                </label>
                <select
                  id="checkInPreference"
                  className="form-input"
                  value={form.checkInPreference}
                  onChange={(event) => updateField("checkInPreference")(event.target.value)}
                >
                  <option value="">Selecteaza</option>
                  {CHECK_IN_OPTIONS.map((item) => (
                    <option key={item.value} value={item.value}>
                      {item.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="profile-label" htmlFor="notificationFrequency">
                  Cat de des vrei noutatile
                </label>
                <select
                  id="notificationFrequency"
                  className="form-input"
                  value={form.notificationFrequency}
                  onChange={(event) => updateField("notificationFrequency")(event.target.value)}
                >
                  <option value="">Selecteaza</option>
                  {NOTIFICATION_FREQUENCIES.map((item) => (
                    <option key={item.value} value={item.value}>
                      {item.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="profile-section">
              <label className="profile-label" htmlFor="therapyStatus">
                Situatia ta legata de terapie
              </label>
              <select
                id="therapyStatus"
                className="form-input"
                value={form.therapyStatus}
                onChange={(event) => updateField("therapyStatus")(event.target.value)}
              >
                <option value="">Selecteaza</option>
                {THERAPY_STATUS.map((item) => (
                  <option key={item.value} value={item.value}>
                    {item.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="actions">
              <button type="button" className="btn" onClick={onClose} disabled={saving}>
                Renunta
              </button>
              <button type="submit" className="btn primary" disabled={saving}>
                {saving ? "Se salveaza..." : "Salveaza profilul"}
              </button>
            </div>
          </form>
        </section>
      </div>
    </div>
  );
}
