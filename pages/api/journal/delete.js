import pool from "@/lib/db";
import { getCurrentUserId } from "@/lib/currentUser";

export default async function handler(req, res) {
  if (req.method !== "DELETE") {
    res.setHeader("Allow", ["DELETE"]);
    return res.status(405).end("Method Not Allowed");
  }

  const userId = getCurrentUserId(req);
  if (!userId) {
    return res.status(401).json({ error: "Autentificare necesara" });
  }

  const { entryId, type } = req.body ?? {};
  const id = Number(entryId);
  if (!Number.isFinite(id) || id <= 0) {
    return res.status(400).json({ error: "Intrare invalida." });
  }

  let sql;
  if (type === "quick") {
    sql = "DELETE FROM journal_quick_entries WHERE id = ? AND user_id = ?";
  } else if (type === "full") {
    sql = "DELETE FROM journal_entries WHERE id = ? AND user_id = ?";
  } else {
    return res.status(400).json({ error: "Tip de intrare necunoscut." });
  }

  try {
    const [result] = await pool.execute(sql, [id, userId]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Intrarea nu a fost gasita." });
    }
    return res.status(200).json({ success: true });
  } catch (error) {
    console.error("Delete journal entry failed", error);
    return res.status(500).json({ error: "Nu am putut sterge intrarea. Incearca din nou." });
  }
}
