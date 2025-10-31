import { clearAuthCookie } from "@/lib/auth";

export default function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).end("Method Not Allowed");
  }

  res.setHeader("Set-Cookie", clearAuthCookie());
  return res.status(200).json({ success: true });
}
