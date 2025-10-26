import Head from "next/head";
import {
  FiCalendar,
  FiMessageCircle,
  FiUsers,
  FiBookOpen,
  FiClock,
  FiHeart,
} from "react-icons/fi";

const TODAY = [
  {
    title: "Reminder autoexaminare",
    message: "Este momentul pentru autoexaminarea lunara.",
    time: "Acum 2 ore",
    tag: "Nou",
    icon: FiCalendar,
    accent: "rose",
  },
  {
    title: "Asistent AI",
    message: "Am pregatit recomandari personalizate pentru tine.",
    time: "Acum 5 ore",
    tag: "Nou",
    icon: FiMessageCircle,
    accent: "violet",
  },
];

const EARLIER = [
  {
    title: "Actualizare comunitate",
    message: "Postare noua in Cercul zilnic de sprijin.",
    time: "Ieri",
    icon: FiUsers,
    accent: "white",
  },
  {
    title: "Articol nou",
    message: "Intelege mai bine cum poti gestiona starile dificile.",
    time: "Acum 2 zile",
    icon: FiBookOpen,
    accent: "white",
  },
  {
    title: "Reminder programare",
    message: "Sedinta ta este programata pe 25 octombrie la ora 10:00.",
    time: "Acum 3 zile",
    icon: FiClock,
    accent: "white",
  },
  {
    title: "Verificare zilnica",
    message: "Cum te simti astazi? Ia un moment sa notezi in jurnal.",
    time: "Acum 1 saptamana",
    icon: FiHeart,
    accent: "white",
  },
];

export default function Notifications() {
  return (
    <>
      <Head>
        <title>Notificari - Calming</title>
      </Head>
      <section className="notification-page">
        <NotificationBlock title="Astazi" highlight items={TODAY} />
        <NotificationBlock title="Mai devreme" items={EARLIER} />
      </section>
    </>
  );
}

function NotificationBlock({ title, items, highlight }) {
  return (
    <section className="notification-block">
      <h2 className={`notification-heading${highlight ? " today" : ""}`}>{title}</h2>
      <div className="notification-list">
        {items.map((item) => (
          <NotificationCard key={item.title} {...item} />
        ))}
      </div>
    </section>
  );
}

function NotificationCard({ title, message, time, tag, icon: Icon, accent }) {
  return (
    <article className={`notification-card${accent ? ` accent-${accent}` : ""}`}>
      <div className="notification-icon">
        <Icon size={22} aria-hidden />
      </div>
      <div className="notification-content">
        <div className="notification-header">
          <span className="notification-title">{title}</span>
          {tag && <span className="notification-badge">{tag}</span>}
        </div>
        <p className="notification-body">{message}</p>
        {time && <span className="notification-time">{time}</span>}
      </div>
    </article>
  );
}
