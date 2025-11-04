import { getCurrentUserId } from "@/lib/currentUser";
import { query } from "@/lib/db";

const ALLOWED_FOCUS_TOPICS = new Set([
  "Gestionarea anxietatii",
  "Echilibru munca-viata",
  "Relatii si conexiune",
  "Stima de sine si auto-compasiune",
  "Gestionarea stresului",
  "Somn si recuperare",
  "Trauma si vindecare",
  "Claritate in obiective",
]);

const ALLOWED_GUIDANCE = new Set(["calm-empathetic", "solution-focused", "motivational"]);
const ALLOWED_CHECK_IN = new Set(["morning", "afternoon", "evening", "weekend"]);
const ALLOWED_THERAPY_STATUS = new Set(["none", "considering", "active", "completed"]);
const ALLOWED_NOTIFICATION_FREQ = new Set(["daily", "three-per-week", "weekly", "only-insights"]);
const ALLOWED_AGE_RANGES = new Set(["18-24", "25-34", "35-44", "45-54", "55+"]);

export default async function handler(req, res) {
  const userId = getCurrentUserId(req);
  if (!userId) {
    return res.status(401).json({ error: "Autentificare necesara" });
  }

  if (req.method === "GET") {
    try {
      const [profileRow] = await query(
        `SELECT display_name, avatar_initials, member_since, profile_completion, community_alias
         FROM user_profiles
         WHERE user_id = ?`,
        [userId]
      );

      const [detailsRow] = await query(
        `SELECT age_range, focus_topics, primary_goal, stress_triggers, coping_strategies,
                guidance_style, check_in_preference, therapy_status, notification_frequency
         FROM user_profile_details
         WHERE user_id = ?`,
        [userId]
      );

      return res.status(200).json({
        profile: normalizeProfileRow(profileRow),
        details: normalizeDetailsRow(detailsRow),
      });
    } catch (error) {
      console.error("Profile load failed", error);
      return res.status(500).json({ error: "Nu am putut incarca profilul." });
    }
  }

  if (req.method === "PUT") {
    try {
      const payload = req.body ?? {};
      const communityAlias = sanitizeString(payload.communityAlias).slice(0, 60);
      const ageRangeRaw = sanitizeString(payload.ageRange);
      const guidanceStyleRaw = sanitizeString(payload.guidanceStyle);
      const checkInRaw = sanitizeString(payload.checkInPreference);
      const therapyStatusRaw = sanitizeString(payload.therapyStatus);
      const notificationFrequencyRaw = sanitizeString(payload.notificationFrequency);
      const focusTopicsRaw = Array.isArray(payload.focusTopics) ? payload.focusTopics : [];
      const primaryGoalRaw = sanitizeString(payload.primaryGoal, { preserveNewLines: true }).slice(0, 600);
      const stressTriggersRaw = sanitizeString(payload.stressTriggers, { preserveNewLines: true }).slice(0, 600);
      const copingStrategiesRaw = sanitizeString(payload.copingStrategies, { preserveNewLines: true }).slice(0, 600);

      if (!communityAlias) {
        return res.status(400).json({ error: "Alege un nume care va fi folosit in comunitate." });
      }
      const sanitizedFocusTopics = focusTopicsRaw
        .map((item) => sanitizeString(item))
        .filter((item) => ALLOWED_FOCUS_TOPICS.has(item));

      const ageRange = ageRangeRaw && ALLOWED_AGE_RANGES.has(ageRangeRaw) ? ageRangeRaw : null;
      const guidanceStyle =
        guidanceStyleRaw && ALLOWED_GUIDANCE.has(guidanceStyleRaw) ? guidanceStyleRaw : null;
      const checkInPreference = checkInRaw && ALLOWED_CHECK_IN.has(checkInRaw) ? checkInRaw : null;
      const therapyStatus =
        therapyStatusRaw && ALLOWED_THERAPY_STATUS.has(therapyStatusRaw) ? therapyStatusRaw : null;
      const notificationFrequency =
        notificationFrequencyRaw && ALLOWED_NOTIFICATION_FREQ.has(notificationFrequencyRaw)
          ? notificationFrequencyRaw
          : null;

      const primaryGoal = primaryGoalRaw.length >= 10 ? primaryGoalRaw : null;
      const stressTriggers = stressTriggersRaw.length >= 5 ? stressTriggersRaw : null;
      const copingStrategies = copingStrategiesRaw.length >= 5 ? copingStrategiesRaw : null;

      const detailPayload = {
        ageRange,
        focusTopics: JSON.stringify(sanitizedFocusTopics),
        primaryGoal,
        stressTriggers,
        copingStrategies,
        guidanceStyle,
        checkInPreference,
        therapyStatus,
        notificationFrequency,
      };

      await query(
        `INSERT INTO user_profile_details
           (user_id, age_range, focus_topics, primary_goal, stress_triggers, coping_strategies,
            guidance_style, check_in_preference, therapy_status, notification_frequency, updated_at)
         VALUES
           (:userId, :ageRange, :focusTopics, :primaryGoal, :stressTriggers, :copingStrategies,
            :guidanceStyle, :checkInPreference, :therapyStatus, :notificationFrequency, NOW())
         ON DUPLICATE KEY UPDATE
           age_range = VALUES(age_range),
           focus_topics = VALUES(focus_topics),
           primary_goal = VALUES(primary_goal),
           stress_triggers = VALUES(stress_triggers),
           coping_strategies = VALUES(coping_strategies),
           guidance_style = VALUES(guidance_style),
           check_in_preference = VALUES(check_in_preference),
           therapy_status = VALUES(therapy_status),
           notification_frequency = VALUES(notification_frequency),
           updated_at = NOW()`,
        { userId, ...detailPayload }
      );

      const completionValue = computeCompletion({
        communityAlias,
        ageRange,
        focusTopics: sanitizedFocusTopics,
        primaryGoal,
        stressTriggers,
        copingStrategies,
        guidanceStyle,
        checkInPreference,
        therapyStatus,
        notificationFrequency,
      });

      await query(
        `UPDATE user_profiles
         SET community_alias = ?, profile_completion = ?
         WHERE user_id = ?`,
        [communityAlias, completionValue, userId]
      );

      const [profileRow] = await query(
        `SELECT display_name, avatar_initials, member_since, profile_completion, community_alias
         FROM user_profiles
         WHERE user_id = ?`,
        [userId]
      );

      const [detailsRow] = await query(
        `SELECT age_range, focus_topics, primary_goal, stress_triggers, coping_strategies,
                guidance_style, check_in_preference, therapy_status, notification_frequency
         FROM user_profile_details
         WHERE user_id = ?`,
        [userId]
      );

      return res.status(200).json({
        profile: normalizeProfileRow(profileRow),
        details: normalizeDetailsRow(detailsRow),
      });
    } catch (error) {
      console.error("Profile update failed", error);
      return res.status(500).json({ error: "Nu am putut salva profilul." });
    }
  }

  return res.status(405).end("Method Not Allowed");
}

function sanitizeString(value, { preserveNewLines = false } = {}) {
  if (typeof value !== "string") {
    return "";
  }
  let next = value.trim();
  if (!preserveNewLines) {
    next = next.replace(/\s+/g, " ");
  } else {
    next = next.replace(/\r/g, "").replace(/\t/g, " ");
  }
  return next;
}

function normalizeProfileRow(row) {
  if (!row) {
    return null;
  }
  return {
    ...row,
    member_since:
      row.member_since && typeof row.member_since.toISOString === "function"
        ? row.member_since.toISOString()
        : row.member_since ?? null,
  };
}

function normalizeDetailsRow(row) {
  if (!row) {
    return null;
  }
  return {
    ...row,
    focus_topics: parseFocusTopics(row.focus_topics),
  };
}

function parseFocusTopics(rawValue) {
  if (!rawValue) {
    return [];
  }
  if (Array.isArray(rawValue)) {
    return rawValue;
  }
  try {
    const parsed = JSON.parse(rawValue);
    return Array.isArray(parsed) ? parsed.filter((item) => ALLOWED_FOCUS_TOPICS.has(item)) : [];
  } catch {
    return [];
  }
}

function computeCompletion(values) {
  const checks = [
    hasText(values.communityAlias),
    hasText(values.ageRange),
    Array.isArray(values.focusTopics) && values.focusTopics.length > 0,
    hasText(values.primaryGoal, 10),
    hasText(values.stressTriggers, 5),
    hasText(values.copingStrategies, 5),
    hasText(values.guidanceStyle),
    hasText(values.checkInPreference),
    hasText(values.therapyStatus),
    hasText(values.notificationFrequency),
  ];

  const filled = checks.filter(Boolean).length;
  return Math.min(100, Math.round((filled / checks.length) * 100));
}

function hasText(value, minLength = 1) {
  if (typeof value !== "string") {
    return false;
  }
  return value.trim().length >= minLength;
}
