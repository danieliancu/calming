import { query } from "@/lib/db";

const templateCache = new Map();

async function getTemplateId(templateKey) {
  if (templateCache.has(templateKey)) {
    return templateCache.get(templateKey);
  }
  const rows = await query("SELECT id FROM milestone_templates WHERE template_key = ?", [templateKey]);
  const id = rows?.[0]?.id ?? null;
  templateCache.set(templateKey, id);
  return id;
}

async function hasMilestone(userId, templateId) {
  if (!templateId) {
    return true;
  }
  const rows = await query(
    "SELECT id FROM user_milestones WHERE user_id = ? AND template_id = ? LIMIT 1",
    [userId, templateId]
  );
  return rows.length > 0;
}

async function recordMilestone(userId, templateId) {
  if (!templateId) {
    return false;
  }
  await query(
    "INSERT INTO user_milestones (user_id, template_id, achieved_at) VALUES (?, ?, ?)",
    [userId, templateId, new Date()]
  );
  return true;
}

async function collectJournalDates(userId) {
  const rows = await query(
    `SELECT day_value
     FROM (
       SELECT DATE(created_at) AS day_value
       FROM journal_entries
       WHERE user_id = ?
       UNION
       SELECT DATE(created_at) AS day_value
       FROM journal_quick_entries
       WHERE user_id = ?
     ) AS days
     ORDER BY day_value DESC`,
    [userId, userId]
  );
  const normalize = (value) => {
    if (!value) {
      return null;
    }
    if (value instanceof Date) {
      const clone = new Date(value);
      clone.setUTCHours(0, 0, 0, 0);
      return clone.toISOString().slice(0, 10);
    }
    return value.toString().slice(0, 10);
  };
  const daySet = new Set();
  rows.forEach((row) => {
    const key = normalize(row.day_value);
    if (key) {
      daySet.add(key);
    }
  });
  return daySet;
}

function computeCurrentStreak(daySet) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  let streak = 0;
  const format = (date) => {
    const copy = new Date(date);
    copy.setUTCHours(0, 0, 0, 0);
    return copy.toISOString().slice(0, 10);
  };
  let cursor = new Date(today);
  while (daySet.has(format(cursor))) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}

async function countJournalEntries(userId) {
  const [row] = await query(
    `SELECT
        (SELECT COUNT(*) FROM journal_entries WHERE user_id = :userId) AS full_entries,
        (SELECT COUNT(*) FROM journal_quick_entries WHERE user_id = :userId) AS quick_entries`,
    { userId }
  );
  const fullEntries = Number(row?.full_entries ?? 0);
  const quickEntries = Number(row?.quick_entries ?? 0);
  return {
    total: fullEntries + quickEntries,
    full: fullEntries,
    quick: quickEntries,
  };
}

async function countJournalEntriesLastDays(userId, days) {
  const safeDays = Math.max(1, Math.min(Number(days) || 7, 90));
  const [row] = await query(
    `SELECT COUNT(*) AS entries
     FROM (
       SELECT created_at FROM journal_entries WHERE user_id = ? AND created_at >= NOW() - INTERVAL ${safeDays} DAY
       UNION ALL
       SELECT created_at FROM journal_quick_entries WHERE user_id = ? AND created_at >= NOW() - INTERVAL ${safeDays} DAY
     ) AS recent_entries`,
    [userId, userId]
  );
  return Number(row?.entries ?? 0);
}

async function ensureMilestone(userId, templateKey, condition) {
  const templateId = await getTemplateId(templateKey);
  if (!templateId) {
    return false;
  }
  if (await hasMilestone(userId, templateId)) {
    return false;
  }
  const achieved = await condition();
  if (!achieved) {
    return false;
  }
  await recordMilestone(userId, templateId);
  return true;
}

export async function handleJournalMilestones(userId) {
  try {
    const [counts, daySet] = await Promise.all([countJournalEntries(userId), collectJournalDates(userId)]);
    const streak = computeCurrentStreak(daySet);
    const lastSevenDays = await countJournalEntriesLastDays(userId, 7);

    await ensureMilestone(userId, "journal_first", () => counts.total > 0);

    const streakMilestones = [
      { key: "streak_3", min: 3 },
      { key: "streak_7", min: 7 },
      { key: "streak_30", min: 30 },
      { key: "streak_90", min: 90 },
    ];
    for (const item of streakMilestones) {
      // eslint-disable-next-line no-await-in-loop
      await ensureMilestone(userId, item.key, () => streak >= item.min);
    }

    await ensureMilestone(userId, "journal_five_week", () => lastSevenDays >= 5);
  } catch (error) {
    console.error("Failed to evaluate journal milestones", error);
  }
}
