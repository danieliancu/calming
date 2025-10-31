import pool from "@/lib/db";
import { getCurrentUserId } from "@/lib/currentUser";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).end("Method Not Allowed");
  }

  const userId = getCurrentUserId(req);
  if (!userId) {
    return res.status(401).json({ error: "Autentificare necesara" });
  }

  const { moodId, notes = "" } = req.body ?? {};
  const parsedMoodId = Number(moodId);
  if (!Number.isFinite(parsedMoodId) || parsedMoodId <= 0) {
    return res.status(400).json({ error: "Selecteaza starea din lista." });
  }

  const trimmedNotes = notes?.toString().trim().slice(0, 255) || null;

  try {
    const [result] = await pool.execute(
      "INSERT INTO journal_quick_entries (user_id, mood_id, notes) VALUES (?, ?, ?)",
      [userId, parsedMoodId, trimmedNotes]
    );

    const insertedId = result.insertId;
    const [rows] = await pool.query(
      `SELECT qe.id, qe.notes, qe.created_at, mo.label AS mood_label, mo.emoji AS mood_emoji
       FROM journal_quick_entries qe
       JOIN mood_options mo ON mo.id = qe.mood_id
       WHERE qe.id = ?`,
      [insertedId]
    );

    return res.status(201).json({ entry: rows?.[0] ?? { id: insertedId } });
  } catch (error) {
    console.error("Quick journal save failed", error);
    if (error?.code === "ER_NO_REFERENCED_ROW_2") {
      return res.status(400).json({ error: "Starea selectata nu este valida." });
    }
    return res.status(500).json({ error: "Nu am putut salva nota. Incearca din nou." });
  }
}
