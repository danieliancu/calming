import Head from "next/head";
import { FiLock, FiUsers, FiChevronRight, FiSearch, FiShield } from "react-icons/fi";
import { useRouter } from "next/router";
import { useCallback, useState } from "react";
import { query } from "@/lib/db";
import { useAuth } from "@/contexts/AuthContext";

export default function Community({ groups }) {
  const router = useRouter();
  const { isAuthenticated, promptAuth } = useAuth();
  const [q, setQ] = useState("");


  const handleGroupAccess = useCallback(
    (group) => {
      const isDemoGroup = String(group.name).toLowerCase() === "cercul zilnic de sprijin";
      if (isDemoGroup) {
        router.push("/community/cercul-zilnic-de-sprijin");
        return;
      }
      if (!isAuthenticated) {
        promptAuth();
        return;
      }
      alert(`Accesezi grupul "${group.name}" (demo).`);
    },
    [isAuthenticated, promptAuth, router]
  );

  const handleKeyDown = useCallback(
    (event, group) => {
      if (event.key !== "Enter" && event.key !== " ") {
        return;
      }
      event.preventDefault();
      handleGroupAccess(group);
    },
    [handleGroupAccess]
  );

  return (
    <>
      <Head>
        <title>Comunitate - Calming</title>
      </Head>
      <section className="card accent">
        <div className="section-title">
          <FiShield className="section-icon" /> Siguranta
        </div>
        <div className="muted">Toate conversatiile sunt private si moderate.</div>
      </section>

      <section className="card u-mt-4">
        <div className="section-title">
          <FiSearch className="section-icon" /> Cauta
        </div>
        <input
          value={q}
          onChange={(event) => setQ(event.target.value)}
          placeholder="Cauta grupuri, moderatori, participanti..."
          className="form-input"
        />
      </section>      

      <section className="card u-mt-4">
        <div className="section-title">
          <FiUsers className="section-icon" /> Grupuri de sprijin
        </div>
        <div className="grid community-group-grid">
          {groups.map((group) => (
            <div
              key={group.id}
              className="list-item"
              role="button"
              tabIndex={0}
              onClick={() => handleGroupAccess(group)}
              onKeyDown={(event) => handleKeyDown(event, group)}
            >
              <div>
                <span className="u-text-semibold">
                  {group.name} {group.is_private ? <FiLock aria-hidden /> : null}
                </span>
                <div className="muted community-meta">
                  {group.members} membri - activ {group.last_active} in urma
                </div>
              </div>
              <FiChevronRight className="chev" aria-hidden />
            </div>
          ))}
          {groups.length === 0 ? (
            <div className="list-item muted">Nu exista grupuri disponibile in acest moment.</div>
          ) : null}
        </div>
      </section>
    </>
  );
}

export async function getServerSideProps() {
  const groups = await query(
    "SELECT id, name, members, last_active, is_private FROM community_groups ORDER BY members DESC"
  );
  return {
    props: {
      groups,
    },
  };
}
