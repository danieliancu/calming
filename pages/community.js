import Head from "next/head";
import { FiLock, FiUsers, FiChevronRight } from "react-icons/fi";

const GROUPS = [
  { name: "Cercul zilnic de sprijin", members: 234, last: "2m" },
  { name: "Mindfulness si autoingrijire", members: 189, last: "1h" },
  { name: "Gestionarea stresului", members: 156, last: "15m" },
];

export default function Community() {
  return (
    <>
      <Head>
        <title>Comunitate - Calming</title>
      </Head>
      <section className="card accent">
        <div className="section-title">
          <FiLock className="section-icon" /> Siguranta
        </div>
        <div className="muted">Toate conversatiile sunt private si moderate.</div>
      </section>

      <section className="card u-mt-4">
        <div className="section-title">
          <FiUsers className="section-icon" /> Grupuri de sprijin
        </div>
        <div className="grid community-group-grid">
          {GROUPS.map((group) => (
            <div key={group.name} className="list-item">
              <div>
                <span className="u-text-semibold">{group.name} <FiLock /></span>
                <div className="muted community-meta">
                  {group.members} membri • activ {group.last} in urma
                </div>
              </div>
              <FiChevronRight className="chev" aria-hidden />
            </div>
          ))}
        </div>
      </section>
    </>
  );
}
