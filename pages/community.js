import Head from "next/head";
import { FiLock, FiUsers, FiChevronRight, FiSearch, FiShield } from "react-icons/fi";
import { useRouter } from "next/router";
import { useCallback, useMemo, useState } from "react";
import { query } from "@/lib/db";
import { useAuth } from "@/contexts/AuthContext";
import PrivateGroupModal from "@/components/PrivateGroupModal";
import {
  getCommunityGroupBySlug,
  getCommunityGroupSlugByName,
  getCommunityGroupSummaries,
  prepareGroupForClient,
} from "@/lib/community/communityData";

export default function Community({ groups }) {
  const router = useRouter();
  const { isAuthenticated, promptAuth } = useAuth();
  const [q, setQ] = useState("");
  const [privateGroup, setPrivateGroup] = useState(null);

  const filteredGroups = useMemo(() => {
    if (!q.trim()) {
      return groups;
    }
    const term = q.trim().toLowerCase();
    return groups.filter((group) => {
      const haystack = [group.name, group.last_active, group.members?.toString()]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return haystack.includes(term);
    });
  }, [groups, q]);


  const handleGroupAccess = useCallback(
    (group) => {
      if (group.is_private) {
        setPrivateGroup(group);
        return;
      }
      if (!isAuthenticated) {
        promptAuth();
        return;
      }
      if (group.slug) {
        router.push(`/community/${group.slug}`);
      }
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
      {privateGroup ? <PrivateGroupModal groupName={privateGroup.name} onClose={() => setPrivateGroup(null)} /> : null}
      <section className="card accent">
        <div className="section-title">
          <FiShield className="section-icon" /> Siguranta
        </div>
        <div className="muted">Toate conversatiile sunt moderate. Cele private nu permit accesul decat pe baza de invitatie.</div>
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
          {filteredGroups.map((group) => (
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
          {filteredGroups.length === 0 ? (
            <div className="list-item muted">Nu exista grupuri disponibile in acest moment.</div>
          ) : null}
        </div>
      </section>
    </>
  );
}

export async function getServerSideProps() {
  const groupsRaw = await query(
    "SELECT id, name, members, last_active, is_private FROM community_groups ORDER BY members DESC"
  );

  const templateSummaries = getCommunityGroupSummaries();
  const templateBySlug = new Map(templateSummaries.map((entry) => [entry.slug, entry]));
  const merged = new Map();

  groupsRaw.forEach((record) => {
    const slug = getCommunityGroupSlugByName(record.name);
    const template = templateBySlug.get(slug) ?? prepareGroupForClient(getCommunityGroupBySlug(slug));
    merged.set(slug, {
      id: template?.id ?? record.id,
      name: template?.name ?? record.name,
      slug,
      members: template?.members ?? record.members ?? 0,
      last_active: template?.last_active ?? record.last_active ?? "",
      is_private: template?.is_private ?? Boolean(record.is_private),
    });
  });

  templateSummaries.forEach((summary) => {
    if (!merged.has(summary.slug)) {
      merged.set(summary.slug, summary);
    }
  });

  const groups = Array.from(merged.values());

  return {
    props: {
      groups,
    },
  };
}
