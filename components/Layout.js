import Link from "next/link";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import JournalModal from "@/components/JournalModal";
import { FiHome, FiMessageSquare, FiCalendar, FiBookOpen, FiUsers } from "react-icons/fi";

export default function Layout({ children }) {
  const router = useRouter();
  const { pathname, query } = router;
  const [theme, setTheme] = useState("light");
  const [open, setOpen] = useState(false);

  const mainLinks = [
    { href: "/", label: "Acas?" },
    { href: "/assistant", label: "Asistent" },
    { href: "/psychologists", label: "Ajutor" },
    { href: "/learn", label: "Articole" },
    { href: "/community", label: "Comunitate" },
  ];
  const iconLinks = [
    { href: "/notifications", label: "Notific?ri", icon: BellIcon },
    { href: "/profile", label: "Profil", icon: UserIcon },
    { href: "/settings", label: "Set?ri", icon: SettingsIcon },
  ];

  useEffect(() => {
    const saved = typeof window !== "undefined" && localStorage.getItem("theme");
    const next = saved || "light";
    setTheme(next);
    if (typeof document !== "undefined") {
      document.documentElement.dataset.theme = next;
      document.body?.style.removeProperty("padding-top");
    }
  }, []);

  const journalOpen = query?.journal === "new";
  useEffect(() => {
    if (journalOpen) {
      const prev = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => { document.body.style.overflow = prev; };
    }
  }, [journalOpen]);

  const closeJournal = () => {
    const nq = { ...query };
    delete nq.journal;
    router.replace({ pathname, query: nq }, undefined, { shallow: true });
  };

  return (
    <>
      <header className="site-header">
        <div className="container bar">
          <Link href="/" className="brand">
            <span className="brand-mark" />
            Calming
          </Link>
          <nav className="nav">
            {mainLinks.map((l) => (
              <Link key={l.href} href={l.href} className={`text-link ${pathname === l.href ? "active" : ""}`}>{l.label}</Link>
            ))}
            {iconLinks.map((l) => {
              const Icon = l.icon;
              return (
                <Link key={l.href} href={l.href} aria-label={l.label} className={`icon-link ${pathname === l.href ? "active" : ""}`}>
                  <Icon />
                </Link>
              );
            })}
            <button className={`hamburger`} aria-label="Deschide meniul" aria-expanded={open} onClick={() => setOpen((v) => !v)}>
              <span />
              <span />
              <span />
            </button>
          </nav>
        </div>
        <div className={`mobile-menu ${open ? "show" : ""}`}>
          {mainLinks.map((l) => (
            <Link key={l.href} href={l.href} onClick={() => setOpen(false)} className={pathname === l.href ? "active" : undefined}>{l.label}</Link>
          ))}
        </div>
      </header>

      <main className="container">{children}</main>
      {journalOpen && <JournalModal onClose={closeJournal} />}

      <Footer />
      <BottomNav />
    </>
  );
}

function BellIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M15 17h5l-1.4-1.4A2 2 0 0 1 18 14.2V11a6 6 0 1 0-12 0v3.2c0 .5-.2 1-.6 1.4L4 17h5"/>
      <path d="M9 17a3 3 0 0 0 6 0"/>
    </svg>
  );
}

function UserIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <circle cx="12" cy="8" r="4"/>
      <path d="M4 20a8 8 0 0 1 16 0"/>
    </svg>
  );
}

function SettingsIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <circle cx="12" cy="12" r="3"/>
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 5 15.4a1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09a1.65 1.65 0 0 0 1.51-1 1.65 1.65 0 0 0-.33-1.82l-.06-.06A2 2 0 1 1 7.04 2.7l.06.06c.47.47 1.16.61 1.82.33H9a1.65 1.65 0 0 0 1-1.51V1a2 2 0 1 1 4 0v.09c0 .67.39 1.26 1 1.51.66.28 1.35.14 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06c-.47.47-.61 1.16-.33 1.82V9c.75.29 1.51.68 1.51 1.6s-.76 1.31-1.51 1.4z"/>
    </svg>
  );
}

function BottomNav() {
  const { pathname } = useRouter();
  const items = [
    { href: "/", label: "Acas?", icon: FiHome },
    { href: "/assistant", label: "Asistent", icon: FiMessageSquare },
    { href: "/psychologists", label: "Ajutor", icon: FiCalendar },
    { href: "/learn", label: "Articole", icon: FiBookOpen },
    { href: "/community", label: "Comunitate", icon: FiUsers },
  ];
  return (
    <nav className="bottom-nav">
      {items.map((i) => {
        const Icon = i.icon;
        const active = pathname === i.href;
        return (
          <Link key={i.href} href={i.href} className={active ? "active" : undefined}>
            <Icon size={22} />
            <span>{i.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}

function Footer() {
  return (
    <footer className="site-footer">
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
            <li><Link href="/learn">Biblioteca</Link></li>
            <li><Link href="/community">Comunitate</Link></li>
            <li><Link href="/psychologists">Programari</Link></li>
          </ul>
        </div>
        <div>
          <div className="footer-title">Legal</div>
          <ul>
            <li><a href="#">Termeni & Confidentialitate</a></li>
            <li><a href="#">Contact</a></li>
          </ul>
        </div>
      </div>
      <div className="container footer-meta">
        <div className="muted">(c) {new Date().getFullYear()} Calming. Toate drepturile rezervate.</div>
      </div>
    </footer>
  );
}
