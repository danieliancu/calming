import { getCurrentUserId } from "@/lib/currentUser";
import { query } from "@/lib/db";

export default async function handler(req, res) {
  const userId = getCurrentUserId(req);
  if (!userId) {
    return res
      .status(200)
      .json({ userId: null, initials: null, name: null, newNotifications: 0 });
  }

  try {
    const [profileRow] = await query(
      "SELECT display_name, avatar_initials FROM user_profiles WHERE user_id = ?",
      [userId]
    );
    const [countRow] = await query(
      "SELECT COUNT(*) AS count FROM notifications WHERE user_id = ? AND created_at >= NOW() - INTERVAL 12 HOUR",
      [userId]
    );

    const profile = profileRow ?? null;
    const newNotifications = Number(countRow?.count ?? 0);

    return res.status(200).json({
      userId,
      initials: profile?.avatar_initials ?? null,
      name: profile?.display_name ?? null,
      newNotifications,
    });
  } catch (error) {
    console.error("Auth status profile lookup failed", error);
    return res.status(200).json({
      userId,
      initials: null,
      name: null,
      newNotifications: 0,
    });
  }
}
