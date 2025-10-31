import { query } from "@/lib/db";
import { createAuthCookie } from "@/lib/auth";
import bcrypt from "bcryptjs";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).end("Method Not Allowed");
  }

  const email = (req.body?.email ?? "").toString().trim().toLowerCase();
  const password = (req.body?.password ?? "").toString();
  if (!email || !password) {
    return res.status(400).json({ error: "Completeaza emailul si parola." });
  }

  try {
    const users = await query("SELECT id, first_name, last_name, password_hash FROM users WHERE email = ?", [email]);
    if (users.length === 0) {
      return res.status(401).json({ error: "Credentiale invalide." });
    }

    const user = users[0];
    const isValid = await bcrypt.compare(password, user.password_hash || "");
    if (!isValid) {
      return res.status(401).json({ error: "Credentiale invalide." });
    }

    res.setHeader("Set-Cookie", createAuthCookie(user.id));
    return res.status(200).json({
      userId: user.id,
      name: `${user.first_name} ${user.last_name}`.trim(),
    });
  } catch (error) {
    console.error("Login error", error);
    return res.status(500).json({ error: "Nu am putut autentifica utilizatorul. Incearca din nou." });
  }
}
