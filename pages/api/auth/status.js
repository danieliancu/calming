import { getCurrentUserId } from "@/lib/currentUser";
import { query } from "@/lib/db";

export default async function handler(req, res) {
  const userId = getCurrentUserId(req);

  try {
    const [recentGeneralRow] = await query(
      `SELECT COUNT(*) AS count
       FROM notification_templates
       WHERE audience = 'general' AND published_at >= NOW() - INTERVAL 12 HOUR`
    );
    const generalCount = Number(recentGeneralRow?.count ?? 0);

    if (!userId) {
      return res.status(200).json({
        userId: null,
        initials: null,
        name: null,
        newNotifications: generalCount,
      });
    }

    const [[profileRow], [recentUserRow]] = await Promise.all([
      query(
        `SELECT p.display_name, p.avatar_initials, u.first_name
         FROM users u
         LEFT JOIN user_profiles p ON p.user_id = u.id
         WHERE u.id = ?`,
        [userId]
      ),
      query(
        `SELECT COUNT(*) AS count
         FROM user_notifications
         WHERE user_id = ? AND created_at >= NOW() - INTERVAL 12 HOUR`,
        [userId]
      ),
    ]);

    const profile = profileRow ?? null;
    const userNotificationCount = Number(recentUserRow?.count ?? 0);
    const newNotifications = generalCount + userNotificationCount;

    return res.status(200).json({
      userId,
      initials: profile?.avatar_initials ?? null,
      name: profile?.display_name ?? null,
      firstName: profile?.first_name ?? null,
      newNotifications,
    });
  } catch (error) {
    console.error("Auth status profile lookup failed", error);
    return res.status(200).json({
      userId,
      initials: null,
      name: null,
      firstName: null,
      newNotifications: 0,
    });
  }
}
