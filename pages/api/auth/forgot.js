import nodemailer from "nodemailer";
import { query } from "@/lib/db";

const {
  SMTP_HOST,
  SMTP_PORT,
  SMTP_USER,
  SMTP_PASS,
  EMAIL_FROM,
  APP_URL,
} = process.env;

function ensureMailerConfigured() {
  if (!SMTP_HOST || !SMTP_PORT || !SMTP_USER || !SMTP_PASS) {
    throw new Error("Configuratia SMTP lipseste. Completeaza variabilele de mediu aferente.");
  }
}

function buildTransporter() {
  const port = Number(SMTP_PORT ?? 587);
  return nodemailer.createTransport({
    host: SMTP_HOST,
    port,
    secure: port === 465,
    auth: {
      user: SMTP_USER,
      pass: SMTP_PASS,
    },
  });
}

function composeResetLink(email) {
  const baseUrl = APP_URL || "http://localhost:3000";
  const params = new URLSearchParams({ email });
  return `${baseUrl.replace(/\/$/, "")}/reset-password?${params.toString()}`;
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).end("Method Not Allowed");
  }

  const email = (req.body?.email ?? "").toString().trim().toLowerCase();
  if (!email) {
    return res.status(400).json({ error: "Te rugam sa introduci adresa de email." });
  }

  try {
    ensureMailerConfigured();
  } catch (error) {
    console.error("Forgot password configuration error", error);
    return res.status(500).json({ error: "Serviciul de email nu este configurat corect." });
  }

  try {
    const users = await query("SELECT id, first_name FROM users WHERE email = ?", [email]);
    if (users.length === 0) {
      // Don't reveal whether the email exists.
      return res
        .status(200)
        .json({ message: "Daca adresa exista, vei primi un email cu instructiuni." });
    }

    const user = users[0];
    const transporter = buildTransporter();
    const resetLink = composeResetLink(email);
    const fromAddress = EMAIL_FROM || SMTP_USER;

    await transporter.sendMail({
      from: fromAddress,
      to: email,
      subject: "Resetare parola Calming",
      text: [
        `Buna ${user.first_name || ""},`,
        "",
        "Ai solicitat resetarea parolei pentru contul tau Calming.",
        "Apasa pe linkul de mai jos pentru a-ti seta o parola noua:",
        resetLink,
        "",
        "Daca nu tu ai facut aceasta cerere, poti ignora acest mesaj.",
        "",
        "Cu drag,",
        "Echipa Calming",
      ].join("\n"),
      html: `
        <p>Buna ${user.first_name || ""},</p>
        <p>Ai solicitat resetarea parolei pentru contul tau Calming.</p>
        <p>
          <a href="${resetLink}" style="display:inline-block;padding:10px 16px;background:#4a90e2;color:#ffffff;border-radius:6px;text-decoration:none;">
            Reseteaza parola
          </a>
        </p>
        <p>Daca nu tu ai facut aceasta cerere, poti ignora acest mesaj.</p>
        <p>Cu drag,<br />Echipa Calming</p>
      `,
    });

    return res
      .status(200)
      .json({ message: "Ti-am trimis un email cu instructiuni pentru resetarea parolei." });
  } catch (error) {
    console.error("Forgot password error", error);
    return res.status(500).json({ error: "Nu am putut trimite emailul. Incearca din nou." });
  }
}
