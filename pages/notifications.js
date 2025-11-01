import Head from "next/head";
import {
  FiActivity,
  FiCalendar,
  FiMessageCircle,
  FiUsers,
  FiBookOpen,
  FiClock,
  FiHeart,
  FiBell,
  FiStar,
  FiUser,
  FiTrendingUp,
} from "react-icons/fi";
import { query } from "@/lib/db";
import { getCurrentUserId } from "@/lib/currentUser";

const ICON_MAP = {
  FiActivity,
  FiCalendar,
  FiMessageCircle,
  FiUsers,
  FiBookOpen,
  FiClock,
  FiHeart,
  FiStar,
  FiUser,
  FiTrendingUp,
};

export default function Notifications({ notifications }) {
  const now = new Date();
  const todayItems = [];
  const earlierItems = [];

  if (!notifications.length) {
    return (
      <>
        <Head>
          <title>Notificari - Calming</title>
        </Head>
        <section className="notification-page">
          <div className="card">
            <div className="section-title">Notificari</div>
            <p className="muted">Nu ai notificari noi in acest moment.</p>
          </div>
        </section>
      </>
    );
  }

  notifications.forEach((item) => {
    const createdAt = item.created_at ? new Date(item.created_at) : null;
    const data = {
      ...item,
      time: createdAt ? formatRelativeTime(createdAt, now) : null,
      tag: createdAt && isRecent(createdAt, now) ? "Nou" : null,
    };

    if (createdAt && isSameDay(createdAt, now)) {
      todayItems.push(data);
    } else {
      earlierItems.push(data);
    }
  });

  return (
    <>
      <Head>
        <title>Notificari - Calming</title>
      </Head>
      <section className="notification-page">
        <NotificationBlock title="Astazi" highlight items={todayItems} />
        <NotificationBlock title="Mai devreme" items={earlierItems} />
      </section>
    </>
  );
}

export async function getServerSideProps(context) {
  const userId = getCurrentUserId(context.req);
  const generalTemplatesPromise = query(
    `SELECT id, title, message, icon, accent, published_at
     FROM notification_templates
     WHERE audience = 'general'
     ORDER BY published_at DESC, sort_order ASC`
  );

  if (!userId) {
    const generalTemplates = await generalTemplatesPromise;
    const notifications = generalTemplates.map((item) =>
      mapTemplateToNotification(item, "general")
    );
    return {
      props: {
        notifications: normalizeNotificationDates(notifications),
      },
    };
  }

  const [generalTemplates, userRows] = await Promise.all([
    generalTemplatesPromise,
    query(
      `SELECT
         un.id,
         COALESCE(un.created_at, nt.published_at) AS created_at,
         COALESCE(un.title, nt.title) AS title,
         COALESCE(un.message, nt.message) AS message,
         COALESCE(un.icon, nt.icon) AS icon,
         COALESCE(un.accent, nt.accent) AS accent
       FROM user_notifications un
       LEFT JOIN notification_templates nt ON nt.id = un.template_id
       WHERE un.user_id = ?
       ORDER BY COALESCE(un.created_at, nt.published_at) DESC, un.id DESC`,
      [userId]
    ),
  ]);

  const combined = [
    ...generalTemplates.map((item) => mapTemplateToNotification(item, "general")),
    ...userRows.map((item) => ({
      id: `user-${item.id}`,
      title: item.title,
      message: item.message,
      icon: item.icon,
      accent: item.accent,
      created_at: item.created_at,
    })),
  ];

  combined.sort((a, b) => {
    const aTime = a.created_at ? new Date(a.created_at).getTime() : 0;
    const bTime = b.created_at ? new Date(b.created_at).getTime() : 0;
    return bTime - aTime;
  });

  return {
    props: {
      notifications: normalizeNotificationDates(combined),
    },
  };
}

function NotificationBlock({ title, items, highlight }) {
  if (!items.length) {
    return null;
  }
  return (
    <section className="notification-block">
      <h2 className={`notification-heading${highlight ? " today" : ""}`}>{title}</h2>
      <div className="notification-list">
        {items.map((item) => (
          <NotificationCard key={item.id} {...item} />
        ))}
      </div>
    </section>
  );
}

function NotificationCard({ title, message, time, tag, icon, accent }) {
  const Icon = ICON_MAP[icon] ?? FiBell;
  return (
    <article className={`notification-card${accent ? ` accent-${accent}` : ""}`}>
      <div className="notification-icon">
        <Icon size={22} aria-hidden />
      </div>
      <div className="notification-content">
        <div className="notification-header">
          <span className="notification-title">{title}</span>
          {tag ? <span className="notification-badge">{tag}</span> : null}
        </div>
        <p className="notification-body">{message}</p>
        {time ? <span className="notification-time">{time}</span> : null}
      </div>
    </article>
  );
}

function isSameDay(a, b) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

function isRecent(date, now) {
  const diffMs = now.getTime() - date.getTime();
  return diffMs <= 1000 * 60 * 60 * 12; // 12 hours
}

function formatRelativeTime(date, now) {
  const diffMs = now.getTime() - date.getTime();
  const diffMinutes = Math.round(diffMs / (1000 * 60));
  if (diffMinutes <= 0) {
    return "Acum";
  }
  if (diffMinutes < 60) {
    return `Acum ${diffMinutes} minute`;
  }
  const diffHours = Math.round(diffMinutes / 60);
  if (diffHours < 24) {
    return `Acum ${diffHours} ore`;
  }
  const diffDays = Math.round(diffHours / 24);
  if (diffDays === 1) {
    return "Ieri";
  }
  if (diffDays < 7) {
    return `Acum ${diffDays} zile`;
  }
  const diffWeeks = Math.round(diffDays / 7);
  return `Acum ${diffWeeks} saptamani`;
}

function mapTemplateToNotification(item, audience) {
  return {
    id: `template-${audience}-${item.id}`,
    title: item.title,
    message: item.message,
    icon: item.icon,
    accent: item.accent,
    created_at: item.published_at,
  };
}

function normalizeNotificationDates(items) {
  return items.map((item) => ({
    ...item,
    created_at: item.created_at
      ? item.created_at.toISOString
        ? item.created_at.toISOString()
        : item.created_at
      : null,
  }));
}
