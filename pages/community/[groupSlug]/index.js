import Head from "next/head";
import Link from "next/link";
import { FiArrowLeft, FiArrowRight, FiCalendar, FiUsers, FiShield, FiLock, FiUserCheck, FiClock } from "react-icons/fi";
import { useCallback, useState } from "react";
import { useRouter } from "next/router";
import { useAuth } from "@/contexts/AuthContext";
import {
  getCommunityGroupBySlug,
  getCommunityGroupSlugs,
  prepareGroupForClient,
} from "@/lib/community/communityData";
import PrivateGroupModal from "@/components/PrivateGroupModal";

export default function CommunityGroupOverview({ group }) {
  const router = useRouter();
  const { isAuthenticated, promptAuth } = useAuth();
  const [showPrivateNotice, setShowPrivateNotice] = useState(false);

  const handleConversationsNav = useCallback(
    (event) => {
      if (group.isPrivate) {
        event.preventDefault();
        setShowPrivateNotice(true);
        return;
      }
      if (!isAuthenticated) {
        event.preventDefault();
        promptAuth();
        return;
      }
      router.push(`/community/${group.slug}/conversatii`);
    },
    [group.slug, isAuthenticated, promptAuth, router]
  );

  return (
    <>
      <Head>
        <title>{group.name} - Comunitate Calming</title>
      </Head>
      {showPrivateNotice ? (
        <PrivateGroupModal groupName={group.name} onClose={() => setShowPrivateNotice(false)} />
      ) : null}

      <div className="group-hero card">
        <div className="group-nav-bar">
          <Link href="/community" className="group-back-link">
            <FiArrowLeft aria-hidden /> Inapoi la comunitate
          </Link>
          <Link href={`/community/${group.slug}/conversatii`} onClick={handleConversationsNav} className="group-back-link">
            Mergi la conversatii <FiArrowRight aria-hidden />
          </Link>
        </div>

        <h1 className="group-title">
          {group.name} {group.isPrivate ? <FiLock style={{ fontSize: "24px" }} aria-hidden /> : null}
        </h1>
        <p className="group-description">{group.description}</p>

        <div className="group-meta">
          <div className="group-meta-item">
            <FiCalendar aria-hidden /> {group.schedule}
          </div>
          <div className="group-meta-item">
            <FiUserCheck aria-hidden /> Moderator: {group.facilitator}
          </div>
          <div className="group-meta-item">
            <FiUsers aria-hidden /> {group.members} membri
          </div>
          <div className="group-meta-item">
            <FiClock aria-hidden /> activ {group.lastActive} in urma
          </div>          
        </div>

        <div className="group-tags">
          {group.focusAreas.map((area) => (
            <span key={area} className="chip">
              {area}
            </span>
          ))}
        </div>
      </div>

      <section className="card u-mt-4">
        <div className="section-title">
          <FiShield className="section-icon" aria-hidden /> Cadru de siguranta
        </div>
        <p className="muted">{group.safetyNote}</p>
      </section>

      
          <section className="card group-thread-guidelines u-mt-4">
            <div className="section-title">
              <FiShield aria-hidden /> Guideline-uri rapide
            </div>
            <ul className="group-guidelines-list muted">
              <li>Respecta confidentialitatea si evita detalii identificabile.</li>
              <li>Scrie la persoana intai si descrie ce ai nevoie, nu ce astepti de la ceilalti.</li>
              <li>Daca simti ca un subiect devine dificil, ia o pauza si revino cand esti pregatit.</li>
            </ul>
          </section>

      <footer className="site-footer u-mt-8" style={{ marginInline: "calc(50% - 50vw)", width: "100vw" }}>
        <div className="container footer-grid">
          <div>
            <div className="brand footer-brand">
              <span className="brand-mark brand-mark--sm" /> Calming
            </div>
            <div className="muted">Indrumare confidentiala pentru echilibrul tau.</div>
          </div>
          <div>
            <div className="footer-title">Platforma</div>
            <ul>
              <li>
                <Link href="/learn">Biblioteca</Link>
              </li>
              <li>
                <Link href="/community">Comunitate</Link>
              </li>
              <li>
                <Link href="/psychologists">Programari</Link>
              </li>
            </ul>
          </div>
          <div>
            <div className="footer-title">Legal</div>
            <ul>
              <li>
                <a href="#">Termeni &amp; Confidentialitate</a>
              </li>
              <li>
                <a href="#">Contact</a>
              </li>
            </ul>
          </div>
        </div>
        <div className="container footer-meta">
          <div className="muted">(c) {new Date().getFullYear()} Calming. Toate drepturile rezervate.</div>
        </div>
      </footer>
    </>
  );
}

export async function getStaticPaths() {
  const slugs = getCommunityGroupSlugs();
  return {
    paths: slugs.map((slug) => ({ params: { groupSlug: slug } })),
    fallback: false,
  };
}

export async function getStaticProps({ params }) {
  const group = getCommunityGroupBySlug(params.groupSlug);
  if (!group) {
    return { notFound: true };
  }

  return {
    props: {
      group: prepareGroupForClient(group),
    },
  };
}
