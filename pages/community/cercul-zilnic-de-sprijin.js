import Head from "next/head";
import Link from "next/link";
import { FiArrowLeft, FiArrowRight, FiChevronRight, FiCalendar, FiUsers, FiShield } from "react-icons/fi";
import { useCallback } from "react";
import { useRouter } from "next/router";
import { useAuth } from "@/contexts/AuthContext";
import { groupInfo } from "@/lib/community/dailyCircleData";

export default function DailyCircleOverview() {
  const router = useRouter();
  const { isAuthenticated, promptAuth } = useAuth();

  const handleConversationsNav = useCallback(
    (event) => {
      if (!isAuthenticated) {
        event.preventDefault();
        promptAuth();
        return;
      }
      router.push("/community/cercul-zilnic-de-sprijin/conversatii");
    },
    [isAuthenticated, promptAuth, router]
  );

  return (
    <>
      <Head>
        <title>{groupInfo.name} - Comunitate Calming</title>
      </Head>

      <div className="group-hero card">
        <div className="group-nav-bar">
          <Link href="/community" className="group-back-link">
            <FiArrowLeft aria-hidden /> Inapoi la comunitate
          </Link>          
          <Link 
            href="/community/cercul-zilnic-de-sprijin/conversatii"
            onClick={handleConversationsNav}
            className="group-back-link">
            Mergi la conversatii <FiArrowRight aria-hidden />
          </Link>                    

        </div>

        <h1 className="group-title">{groupInfo.name}</h1>
        <p className="group-description">{groupInfo.description}</p>

        <div className="group-meta">
          <div className="group-meta-item">
            <FiCalendar aria-hidden /> {groupInfo.schedule}
          </div>
          <div className="group-meta-item">
            <FiUsers aria-hidden /> Moderator: {groupInfo.facilitator}
          </div>
        </div>

        <div className="group-tags">
          {groupInfo.focusAreas.map((area) => (
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
        <p className="muted">{groupInfo.safetyNote}</p>
      </section>

      <footer
        className="site-footer u-mt-8"
        style={{ marginInline: "calc(50% - 50vw)", width: "100vw" }}
      >
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
