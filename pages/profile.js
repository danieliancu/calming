import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import { useEffect } from "react";
import { FiActivity, FiAward, FiCalendar, FiChevronRight, FiHeart, FiTrendingUp, FiLogOut } from "react-icons/fi";
import { query } from "@/lib/db";
import { getCurrentUserId } from "@/lib/currentUser";
import { useAuth } from "@/contexts/AuthContext";
import { fetchJournalEntries } from "@/lib/journal";

const ICON_MAP = {
  FiActivity,
  FiHeart,
  FiTrendingUp,
  FiCalendar,
};

export default function Profile({ profile, stats, milestones, infoLinks, journalEntries }) {
  const router = useRouter();
  const { isAuthenticated, promptAuth, signOut } = useAuth();
  const safeJournalEntries = journalEntries ?? [];
  const previewEntries = safeJournalEntries.slice(0, 5);

  const openJournal = () => {
    if (!isAuthenticated) {
      promptAuth();
      return;
    }
    router.push(
      { pathname: router.pathname, query: { ...router.query, journal: "new" } },
      undefined,
      { shallow: true }
    );
  };  

  useEffect(() => {
    if (!isAuthenticated) {
      promptAuth();
    }
  }, [isAuthenticated, promptAuth]);

  if (!isAuthenticated) {
    return (
      <>
        <Head>
          <title>Profil - Calming</title>
        </Head>
        <section className="card accent u-mt-4">
          <div className="section-title">Conecteaza-te pentru a-ti vedea profilul</div>
          <p className="muted">
            Statisticile, reperele si resursele personale devin disponibile imediat ce te conectezi la contul tau.
          </p>
          <button className="btn primary u-mt-3" type="button" onClick={promptAuth}>
            Intra in cont
          </button>
        </section>
      </>
    );
  }

  return (
    <>
      <Head>
        <title>Profil - Calming</title>
      </Head>

      <main className="profile-layout">
        <section className="card accent profile-card">
          <div className="profile-header">
            <div className="avatar">{profile?.avatar_initials ?? "NA"}</div>
            <div>
              <div className="profile-name">{profile?.display_name ?? "Utilizator"}</div>
              <div className="muted">
                {profile?.member_since ? `Membru din ${formatMemberSince(profile.member_since)}` : "Membru Calming"}
              </div>
            </div>
          </div>

          <div className="profile-progress">
            <div className="progress-label">
              <span>Completare profil</span>
              <span className="progress-value">{profile?.profile_completion ?? 0}%</span>
            </div>
            <div className="progress-bar">
              <span
                className="progress-fill"
                style={{ width: `${Math.min(profile?.profile_completion ?? 0, 100)}%` }}
              />
            </div>
          </div>
        </section>

        <div className="profile-actions">
            <a
              href="#"
              className="list-item"
              onClick={(event) => {
                event.preventDefault();
                openJournal();
              }}
            >
              Adauga in jurnal
            </a>          
          <Link href="/journal" className="list-item profile-action primary">
            Jurnalul meu
          </Link>
          <button
            type="button"
            className="list-item settings-signout-card"
            onClick={signOut}
            onKeyDown={(event) => {
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                signOut();
              }
            }}
          >
            <FiLogOut size={18} />
            <span>Iesi din cont</span>
          </button>
        </div>



        <section className="card stats-section">
          <div className="section-title">Statisticile tale</div>
          <div className="stats-grid">
            {stats.map((item) => {
              const Icon = ICON_MAP[item.icon] ?? FiActivity;
              return (
                <div className="stats-card" key={item.metric_key}>
                  <div className={`stats-icon stats-icon--${item.tone}`}>
                    <Icon />
                  </div>
                  <div className="stats-value">{item.value}</div>
                  <div className="stats-label">{item.label}</div>
                </div>
              );
            })}
            {stats.length === 0 ? <div className="muted">Nu exista statistici inca.</div> : null}
          </div>
        </section>

        <section className="card milestones-section">
          <div className="section-title">Repere</div>
          <div className="milestones">
            {milestones.map((milestone) => (
              <div className="milestone-card" key={milestone.id}>
                <div className="milestone-icon">
                  <FiAward />
                </div>
                <div>
                  <div className="milestone-title">{milestone.title}</div>
                  <div className="milestone-description">{milestone.description}</div>
                  <div className="milestone-date">{formatDate(milestone.achieved_at)}</div>
                </div>
              </div>
            ))}
            {milestones.length === 0 ? <div className="muted">Inca nu ai repere inregistrate.</div> : null}
          </div>
        </section>

        <section className="card info-section">
          <div className="section-title">Resurse</div>
          <div className="info-list">
            {infoLinks.map((link) => (
              <button className="info-item" key={link.id} type="button">
                <span>{link.label}</span>
                <FiChevronRight aria-hidden />
              </button>
            ))}
            {infoLinks.length === 0 ? <div className="muted">Adauga resurse pentru a le accesa rapid.</div> : null}
          </div>
        </section>
      </main>
    </>
  );
}

export async function getServerSideProps(context) {
  const userId = getCurrentUserId(context.req);
  if (!userId) {
    return {
      props: {
        profile: null,
        stats: [],
        milestones: [],
        infoLinks: [],
        journalEntries: [],
      },
    };
  }

  const [profile] = await query(
    `SELECT up.display_name, up.avatar_initials, up.member_since, up.profile_completion
     FROM user_profiles up
     WHERE up.user_id = ?`,
    [userId]
  );

  const [entryCountsRow] = await query(
    `SELECT
        (SELECT COUNT(*) FROM journal_entries WHERE user_id = :userId) AS full_entries,
        (SELECT COUNT(*) FROM journal_quick_entries WHERE user_id = :userId) AS quick_entries`,
    { userId }
  );

  const totalEntries =
    Number(entryCountsRow?.full_entries ?? 0) + Number(entryCountsRow?.quick_entries ?? 0);

  const [goodDaysRow] = await query(
    `SELECT COUNT(*) AS good_days
     FROM (
       SELECT DATE(je.created_at) AS day_value
       FROM journal_entries je
       JOIN mood_options mo ON mo.id = je.mood_id
       WHERE je.user_id = :userId AND mo.label IN ('Minunat', 'Bine')
       UNION
       SELECT DATE(jq.created_at) AS day_value
       FROM journal_quick_entries jq
       JOIN mood_options mo ON mo.id = jq.mood_id
       WHERE jq.user_id = :userId AND mo.label IN ('Minunat', 'Bine')
     ) AS good_days`,
    { userId }
  );
  const goodDays = Number(goodDaysRow?.good_days ?? 0);

  const [stressAverageRow] = await query(
    `SELECT AVG(score) AS avg_stress
     FROM (
       SELECT
        CASE
          WHEN mo.label = 'Minunat' THEN 1
          WHEN mo.label = 'Bine' THEN 2
          WHEN mo.label IN ('Ok', 'In regula') THEN 3
          WHEN mo.label = 'Obosit' THEN 4
          WHEN mo.label = 'Greu' THEN 5
          WHEN mo.label = 'Suparat' THEN 6
          ELSE 3
        END AS score
       FROM journal_entries je
       LEFT JOIN mood_options mo ON mo.id = je.mood_id
       WHERE je.user_id = :userId
       UNION ALL
       SELECT
        CASE
          WHEN mo.label = 'Minunat' THEN 1
          WHEN mo.label = 'Bine' THEN 2
          WHEN mo.label IN ('Ok', 'In regula') THEN 3
          WHEN mo.label = 'Obosit' THEN 4
          WHEN mo.label = 'Greu' THEN 5
          WHEN mo.label = 'Suparat' THEN 6
          ELSE 3
        END AS score
       FROM journal_quick_entries jq
       JOIN mood_options mo ON mo.id = jq.mood_id
       WHERE jq.user_id = :userId
     ) AS stress_scores`,
    { userId }
  );
  const averageStress = Number(stressAverageRow?.avg_stress ?? 0);
  const stressMetric = (() => {
    if (!Number.isFinite(averageStress) || averageStress <= 0) {
      return { value: "?", label: "Nivel mediu stres: ?", icon: "FiTrendingUp" };
    }
    const scale = [
      { max: 1.5, emoji: "😊", label: "Nivel mediu stres: Foarte bine" },
      { max: 2.5, emoji: "🙂", label: "Nivel mediu stres: Bine" },
      { max: 3.5, emoji: "😐", label: "Nivel mediu stres: OK" },
      { max: 4.5, emoji: "😔", label: "Nivel mediu stres: Obosit" },
      { max: 5.5, emoji: "😣", label: "Nivel mediu stres: Greu" },
      { max: Infinity, emoji: "😞", label: "Nivel mediu stres: Foarte greu" },
    ];
    const match = scale.find((item) => averageStress <= item.max) ?? scale[scale.length - 1];
    return { value: match.emoji, label: match.label, icon: "FiTrendingUp" };
  })();

  const [activeDaysRow] = await query(
    `SELECT COUNT(*) AS active_days
     FROM (
       SELECT DATE(created_at) AS day_value
       FROM journal_entries
       WHERE user_id = :userId
       UNION
       SELECT DATE(created_at) AS day_value
       FROM journal_quick_entries
       WHERE user_id = :userId
     ) AS active_days`,
    { userId }
  );
  const activeDays = Number(activeDaysRow?.active_days ?? 0);

  const computedStats = [
    {
      metric_key: "journal_entries",
      label: "Intrari in jurnal",
      value: `${totalEntries}`,
      tone: "rose",
      icon: "FiActivity",
      sort_order: 10,
    },
    {
      metric_key: "good_days",
      label: "Zile bune",
      value: `${goodDays} zile`,
      tone: "teal",
      icon: "FiHeart",
      sort_order: 20,
    },
    {
      metric_key: "stress_level",
      label: stressMetric.label,
      value: stressMetric.value,
      tone: "amber",
      icon: stressMetric.icon,
      sort_order: 30,
    },
    {
      metric_key: "active_days",
      label: "Zile active",
      value: `${activeDays} zile`,
      tone: "indigo",
      icon: "FiCalendar",
      sort_order: 40,
    },
  ];

  await Promise.all(
    computedStats.map((item) =>
      query(
        `INSERT INTO user_stats (user_id, metric_key, label, value, tone, icon, sort_order)
         VALUES (:userId, :metricKey, :label, :value, :tone, :icon, :sortOrder)
         ON DUPLICATE KEY UPDATE
           label = VALUES(label),
           value = VALUES(value),
           tone = VALUES(tone),
           icon = VALUES(icon),
           sort_order = VALUES(sort_order)`,
        {
          userId,
          metricKey: item.metric_key,
          label: item.label,
          value: item.value,
          tone: item.tone,
          icon: item.icon,
          sortOrder: item.sort_order,
        }
      )
    )
  );

  const stats = await query(
    `SELECT metric_key, label, value, tone, icon
     FROM user_stats
     WHERE user_id = ?
     ORDER BY sort_order, id`,
    [userId]
  );

  const milestones = await query(
    `SELECT
       um.id,
       mt.title AS title,
       mt.description AS description,
       um.achieved_at
     FROM user_milestones um
     JOIN milestone_templates mt ON mt.id = um.template_id
     WHERE um.user_id = ?
     ORDER BY um.achieved_at DESC, um.id DESC`,
    [userId]
  );

  const resourceTemplates = await query(
    `SELECT id, label
     FROM resource_templates
     ORDER BY sort_order, id`
  );

  const infoLinks = resourceTemplates.map((template) => ({
    id: `template-${template.id}`,
    label: template.label,
  }));

  const journalEntries = await fetchJournalEntries(userId, { limit: 10 });

  const profileData = profile
    ? {
        ...profile,
        member_since:
          profile.member_since && typeof profile.member_since.toISOString === "function"
            ? profile.member_since.toISOString()
            : profile.member_since ?? null,
      }
    : null;

  const milestonesData = milestones.map((item) => ({
    ...item,
    achieved_at:
      item.achieved_at && typeof item.achieved_at.toISOString === "function"
        ? item.achieved_at.toISOString()
        : item.achieved_at ?? null,
  }));

  return {
    props: {
      profile: profileData,
      stats,
      milestones: milestonesData,
      infoLinks,
      journalEntries,
    },
  };
}

function formatMemberSince(dateString) {
  const date = new Date(dateString);
  const formatter = new Intl.DateTimeFormat("ro-RO", { month: "long", year: "numeric" });
  return formatter.format(date);
}

function formatDate(dateString) {
  if (!dateString) {
    return "";
  }
  const date = new Date(dateString);
  return date.toLocaleDateString("ro-RO", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatDateTime(dateString) {
  if (!dateString) {
    return "";
  }
  const date = new Date(dateString);
  return date.toLocaleString("ro-RO", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
