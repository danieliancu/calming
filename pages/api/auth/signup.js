import pool from "@/lib/db";
import { createAuthCookie } from "@/lib/auth";
import bcrypt from "bcryptjs";

function normalizeString(value) {
  return (value ?? "").toString().trim();
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).end("Method Not Allowed");
  }

  const {
    firstName: rawFirstName,
    lastName: rawLastName,
    email: rawEmail,
    phone: rawPhone,
    password: rawPassword,
  } = req.body ?? {};

  const password = (rawPassword ?? "").toString();
  const passwordTrimmed = password.trim();

  const firstName = normalizeString(rawFirstName);
  const lastName = normalizeString(rawLastName);
  const email = normalizeString(rawEmail).toLowerCase();
  const phone = normalizeString(rawPhone) || null;

  if (!firstName || !lastName || !email || !passwordTrimmed) {
    return res.status(400).json({ error: "Completeaza prenumele, numele, emailul si parola." });
  }

  if (passwordTrimmed.length < 8) {
    return res.status(400).json({ error: "Parola trebuie sa aiba cel putin 8 caractere." });
  }

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const [existing] = await connection.execute("SELECT id FROM users WHERE email = ?", [email]);
    if (existing.length > 0) {
      await connection.rollback();
      return res.status(409).json({ error: "Exista deja un cont asociat acestui email." });
    }

    const passwordHash = await bcrypt.hash(passwordTrimmed, 10);

    const [result] = await connection.execute(
      "INSERT INTO users (first_name, last_name, email, password_hash, phone, city, country) VALUES (?, ?, ?, ?, ?, NULL, NULL)",
      [firstName, lastName, email, passwordHash, phone]
    );
    const userId = result.insertId;

    const displayName = `${firstName} ${lastName}`.trim();
    const initials = `${firstName.charAt(0) || ""}${lastName.charAt(0) || ""}`.toUpperCase().slice(0, 2) || "NA";
    const memberSince = new Date().toISOString().slice(0, 10);

    await connection.execute(
      "INSERT INTO user_profiles (user_id, display_name, member_since, avatar_initials, profile_completion) VALUES (?, ?, ?, ?, ?)",
      [userId, displayName || email, memberSince, initials, 40]
    );

    await connection.commit();

    res.setHeader("Set-Cookie", createAuthCookie(userId));
    return res.status(201).json({ userId });
  } catch (error) {
    await connection.rollback();
    console.error("Signup error", error);
    return res.status(500).json({ error: "Nu am putut crea contul. Incearca din nou." });
  } finally {
    connection.release();
  }
}
