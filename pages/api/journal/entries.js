import pool from "@/lib/db";
import { getCurrentUserId } from "@/lib/currentUser";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).end("Method Not Allowed");
  }

  const currentUserId = getCurrentUserId(req);
  if (!currentUserId) {
    return res.status(401).json({ error: "Autentificare necesara" });
  }

  const { moodId = null, intensity = null, notes = "", symptomIds = [], contextIds = [] } = req.body ?? {};

  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();
    const [result] = await connection.execute(
      "INSERT INTO journal_entries (user_id, mood_id, intensity, notes) VALUES (?, ?, ?, ?)",
      [currentUserId, moodId, intensity, notes]
    );
    const entryId = result.insertId;

    if (Array.isArray(contextIds) && contextIds.length > 0) {
      const rows = contextIds.map((contextId) => [entryId, contextId]);
      await connection.query(
        "INSERT INTO journal_entry_contexts (entry_id, context_id) VALUES ?",
        [rows]
      );
    }

    if (Array.isArray(symptomIds) && symptomIds.length > 0) {
      const rows = symptomIds.map((symptomId) => [entryId, symptomId]);
      await connection.query(
        "INSERT INTO journal_entry_symptoms (entry_id, symptom_id) VALUES ?",
        [rows]
      );
    }

    await connection.commit();
    return res.status(201).json({ id: entryId });
  } catch (error) {
    await connection.rollback();
    console.error("Failed to save journal entry", error);
    return res.status(500).json({ error: "Failed to save journal entry" });
  } finally {
    connection.release();
  }
}
