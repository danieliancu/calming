import { query } from "@/lib/db";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    res.setHeader("Allow", ["GET"]);
    return res.status(405).end("Method Not Allowed");
  }

  try {
    const [moods, symptoms, contexts, moodSymptomRows] = await Promise.all([
      query("SELECT id, label, emoji FROM mood_options ORDER BY id"),
      query("SELECT id, label FROM journal_symptom_tags ORDER BY label"),
      query("SELECT id, label FROM journal_context_tags ORDER BY label"),
      query(
        `SELECT msl.mood_id, tag.id AS symptom_id, tag.label
         FROM mood_symptom_links msl
         JOIN journal_symptom_tags tag ON tag.id = msl.symptom_id
         ORDER BY msl.mood_id, tag.label`
      ),
    ]);

    const moodSymptoms = {};
    moodSymptomRows.forEach((row) => {
      if (!moodSymptoms[row.mood_id]) {
        moodSymptoms[row.mood_id] = [];
      }
      moodSymptoms[row.mood_id].push({ id: row.symptom_id, label: row.label });
    });

    return res.status(200).json({
      moods,
      symptoms,
      contexts,
      moodSymptoms,
    });
  } catch (error) {
    console.error("Failed to load journal metadata", error);
    return res.status(500).json({ error: "Failed to load journal metadata" });
  }
}
