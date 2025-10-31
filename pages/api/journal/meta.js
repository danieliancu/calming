import { query } from "@/lib/db";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    res.setHeader("Allow", ["GET"]);
    return res.status(405).end("Method Not Allowed");
  }

  try {
    const [moods, symptoms, contexts] = await Promise.all([
      query("SELECT id, label, emoji FROM mood_options ORDER BY id"),
      query("SELECT id, label FROM journal_symptom_tags ORDER BY label"),
      query("SELECT id, label FROM journal_context_tags ORDER BY label"),
    ]);

    return res.status(200).json({
      moods,
      symptoms,
      contexts,
    });
  } catch (error) {
    console.error("Failed to load journal metadata", error);
    return res.status(500).json({ error: "Failed to load journal metadata" });
  }
}
