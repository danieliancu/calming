import { query } from "@/lib/db";

function buildPlaceholders(values) {
  return values.map(() => "?").join(", ");
}

export async function fetchJournalEntries(userId, options = {}) {
  const limit = Number.isFinite(options.limit) && options.limit > 0 ? Number(options.limit) : 10;

  const quickEntries = await query(
    `SELECT qe.id, qe.notes, qe.created_at, mo.label AS mood_label, mo.emoji AS mood_emoji
     FROM journal_quick_entries qe
     JOIN mood_options mo ON mo.id = qe.mood_id
     WHERE qe.user_id = ?
     ORDER BY qe.created_at DESC
     LIMIT ?`,
    [userId, limit]
  );

  const regularEntries = await query(
    `SELECT je.id, je.notes, je.created_at, mo.label AS mood_label, mo.emoji AS mood_emoji
     FROM journal_entries je
     LEFT JOIN mood_options mo ON mo.id = je.mood_id
     WHERE je.user_id = ?
     ORDER BY je.created_at DESC
     LIMIT ?`,
    [userId, limit]
  );

  const entryIds = regularEntries.map((entry) => entry.id);
  const contextsByEntry = {};
  const symptomsByEntry = {};

  if (entryIds.length) {
    const placeholders = buildPlaceholders(entryIds);

    const contextRows = await query(
      `SELECT rec.entry_id, tag.label
       FROM journal_entry_contexts rec
       JOIN journal_context_tags tag ON tag.id = rec.context_id
       WHERE rec.entry_id IN (${placeholders})`,
      entryIds
    );

    contextRows.forEach((row) => {
      if (!contextsByEntry[row.entry_id]) {
        contextsByEntry[row.entry_id] = [];
      }
      contextsByEntry[row.entry_id].push(row.label);
    });

    const symptomRows = await query(
      `SELECT res.entry_id, tag.label
       FROM journal_entry_symptoms res
       JOIN journal_symptom_tags tag ON tag.id = res.symptom_id
       WHERE res.entry_id IN (${placeholders})`,
      entryIds
    );

    symptomRows.forEach((row) => {
      if (!symptomsByEntry[row.entry_id]) {
        symptomsByEntry[row.entry_id] = [];
      }
      symptomsByEntry[row.entry_id].push(row.label);
    });
  }

  const mappedFullEntries = regularEntries.map((entry) => ({
    ...entry,
    type: "full",
    contexts: contextsByEntry[entry.id] ?? [],
    symptoms: symptomsByEntry[entry.id] ?? [],
  }));

  const mappedQuickEntries = quickEntries.map((entry) => ({
    ...entry,
    type: "quick",
    contexts: [],
    symptoms: [],
  }));

  return [...mappedFullEntries, ...mappedQuickEntries]
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
    .slice(0, limit)
    .map((entry) => ({
      ...entry,
      created_at:
        entry.created_at && typeof entry.created_at.toISOString === "function"
          ? entry.created_at.toISOString()
          : entry.created_at ?? null,
    }));
}
