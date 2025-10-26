import Head from "next/head";
import {
  FiActivity,
  FiAward,
  FiCalendar,
  FiChevronRight,
  FiHeart,
  FiTrendingUp,
} from "react-icons/fi";

const stats = [
  {
    label: "Intrari in jurnal",
    value: "45",
    icon: <FiActivity />,
    tone: "rose",
  },
  {
    label: "Zile bune",
    value: "28/30",
    icon: <FiHeart />,
    tone: "teal",
  },
  {
    label: "Nivel mediu stres",
    value: "2.3/10",
    icon: <FiTrendingUp />,
    tone: "amber",
  },
  {
    label: "Zile active",
    value: "87",
    icon: <FiCalendar />,
    tone: "indigo",
  },
];

const milestones = [
  {
    title: "Serie de 30 de zile",
    description: "Ai inregistrat starea de spirit 30 de zile la rand",
    date: "Oct 15, 2025",
  },
  {
    title: "Prima evaluare emotionala",
    description: "Ai finalizat prima reflectie lunara asupra emotiilor",
    date: "Sep 20, 2025",
  },
  {
    title: "Membru al comunitatii",
    description: "Te-ai alaturat primului grup de sprijin",
    date: "Sep 1, 2025",
  },
];

const infoLinks = [
  "Despre tine",
  "Istoric emotional",
  "Sesiuni programate",
  "Tratament in curs",
];

export default function Profile() {
  return (
    <>
      <Head>
        <title>Profil - Calming</title>
      </Head>

      <main className="profile-layout">
        <section className="card accent profile-card">
          <div className="profile-header">
            <div className="avatar">SM</div>
            <div>
              <div className="profile-name">Sarah Mitchell</div>
              <div className="muted">Membru din septembrie 2025</div>
            </div>
          </div>

          <div className="profile-progress">
            <div className="progress-label">
              <span>Completare profil</span>
              <span className="progress-value">85%</span>
            </div>
            <div className="progress-bar">
              <span className="progress-fill progress-fill--85" />
            </div>
          </div>
        </section>

        <section className="card stats-section">
          <div className="section-title">Statisticile tale</div>
          <div className="stats-grid">
            {stats.map((item) => (
              <div className="stats-card" key={item.label}>
                <div className={`stats-icon stats-icon--${item.tone}`}>
                  {item.icon}
                </div>
                <div className="stats-value">{item.value}</div>
                <div className="stats-label">{item.label}</div>
              </div>
            ))}
          </div>
        </section>

        <section className="card milestones-section">
          <div className="section-title">Repere</div>
          <div className="milestones">
            {milestones.map((milestone) => (
              <div className="milestone-card" key={milestone.title}>
                <div className="milestone-icon">
                  <FiAward />
                </div>
                <div>
                  <div className="milestone-title">{milestone.title}</div>
                  <div className="milestone-description">
                    {milestone.description}
                  </div>
                  <div className="milestone-date">{milestone.date}</div>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="card info-section">
          <div className="section-title">Resurse pentru echilibru</div>
          <div className="info-list">
            {infoLinks.map((label) => (
              <button className="info-item" key={label} type="button">
                <span>{label}</span>
                <FiChevronRight aria-hidden />
              </button>
            ))}
          </div>
        </section>
      </main>

      
    </>
  );
}



