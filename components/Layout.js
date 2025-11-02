import Link from "next/link";
import { useRouter } from "next/router";
import { useCallback, useEffect, useMemo, useState } from "react";
import JournalModal from "@/components/JournalModal";
import AuthPromptModal from "@/components/AuthPromptModal";
import { AuthContext } from "@/contexts/AuthContext";
import { getUserIdForClient } from "@/lib/currentUser";
import { FiHome, FiMessageSquare, FiCalendar, FiBookOpen, FiUsers } from "react-icons/fi";

export default function Layout({ children }) {
  const router = useRouter();
  const { pathname, query } = router;
  const [theme, setTheme] = useState("light");
  const [menuOpen, setMenuOpen] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const fallbackUserId = (() => {
    const envValue = Number(process.env.NEXT_PUBLIC_DEFAULT_USER_ID ?? 0);
    return Number.isFinite(envValue) && envValue > 0 ? envValue : null;
  })();
  const resolveInitialUser = useCallback(() => {
    const cookieId =
      typeof window !== "undefined" ? getUserIdForClient(document.cookie) : null;
    const effectiveId = cookieId ?? fallbackUserId;
    return { id: effectiveId, initials: null, name: null, firstName: null, newNotifications: 0 };
  }, [fallbackUserId]);

  const [authUser, setAuthUser] = useState(resolveInitialUser);
  const [isHydrated, setIsHydrated] = useState(false);
  const isAuthenticated = typeof authUser.id === "number" && authUser.id > 0;

  const mainLinks = [
    { href: "/", label: "Acasa" },
    { href: "/assistant", label: "Asistent" },
    { href: "/psychologists", label: "Ajutor" },
    { href: "/learn", label: "Articole" },
    { href: "/community", label: "Comunitate" },
  ];

  const iconLinks = [
    { href: "/notifications", label: "Notificari", icon: BellIcon },
    { href: "/profile", label: "Profil", icon: UserIcon },
    { href: "/settings", label: "Setari", icon: SettingsIcon },
  ];

  useEffect(() => {
    const saved = typeof window !== "undefined" ? localStorage.getItem("theme") : null;
    const next = saved || "light";
    setTheme(next);
    if (typeof document !== "undefined") {
      document.documentElement.dataset.theme = next;
      document.body?.style.removeProperty("padding-top");
    }
  }, []);

  const closeJournal = useCallback(() => {
    const nextQuery = { ...query };
    delete nextQuery.journal;
    router.replace({ pathname, query: nextQuery }, undefined, { shallow: true });
  }, [pathname, query, router]);

  const journalOpen = query?.journal === "new";
  useEffect(() => {
    if (!journalOpen) {
      return undefined;
    }
    if (!isAuthenticated) {
      setShowAuthModal(true);
      closeJournal();
      return undefined;
    }
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [journalOpen, isAuthenticated, closeJournal]);

  const promptAuth = useCallback(() => {
    setShowAuthModal(true);
  }, []);

  useEffect(() => {
    setIsHydrated(true);
  }, []);

  const computeAuthUser = useCallback(async () => {
    try {
      const response = await fetch("/api/auth/status");
      if (!response.ok) {
        throw new Error("Failed to load auth status");
      }
      const data = await response.json();
      const id = typeof data.userId === "number" ? data.userId : null;
      const newCount = Number(data.newNotifications ?? 0) || 0;
      const firstName = data.firstName ?? null;
      return {
        id,
        initials: data.initials ?? null,
        name: data.name ?? null,
        firstName,
        newNotifications: newCount,
      };
    } catch (error) {
      console.error("Auth status error", error);
      return resolveInitialUser();
    }
  }, [resolveInitialUser]);

  const refreshAuthStatus = useCallback(async () => {
    const next = await computeAuthUser();
    setAuthUser(next);
    return next;
  }, [computeAuthUser]);

  useEffect(() => {
    let active = true;
    computeAuthUser().then((next) => {
      if (active) {
        setAuthUser(next);
      }
    });
    return () => {
      active = false;
    };
  }, [computeAuthUser]);

  const handleCloseAuth = useCallback(() => {
    setShowAuthModal(false);
  }, []);

  const signOut = useCallback(async () => {
    try {
      await fetch("/api/auth/signout", {
        method: "POST",
      });
    } catch (error) {
      console.error("Sign out failed", error);
    } finally {
      await refreshAuthStatus();
      setShowAuthModal(false);
    }
  }, [refreshAuthStatus]);

  const handleJournalSaved = useCallback(async () => {
    try {
      await refreshAuthStatus();
      await router.replace(router.asPath, undefined, { scroll: false });
    } catch (error) {
      console.error("Failed to refresh after journal save", error);
    }
  }, [refreshAuthStatus, router]);

  const {
    id: currentUserId,
    initials: currentUserInitials,
    name: currentUserName,
    firstName: currentUserFirstName,
    newNotifications: currentNewNotifications,
  } = authUser;

  const authContextValue = useMemo(
    () => ({
      isAuthenticated,
      userId: currentUserId,
      userInitials: currentUserInitials,
      userName: currentUserName,
      userFirstName: currentUserFirstName,
      newNotificationCount: currentNewNotifications,
      promptAuth,
      signOut,
      refreshAuth: refreshAuthStatus,
    }),
    [
      isAuthenticated,
      currentUserId,
      currentUserInitials,
      currentUserName,
      currentUserFirstName,
      currentNewNotifications,
      promptAuth,
      signOut,
      refreshAuthStatus,
    ]
  );

  return (
    <AuthContext.Provider value={authContextValue}>
      <header className="site-header">
        <div className="container bar">
          <Link href="/" className="brand">
            <span className="brand-mark" />
            Calming
          </Link>
          <nav className="nav">
            {mainLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`text-link ${pathname === link.href ? "active" : ""}`}
              >
                {link.label}
              </Link>
            ))}
            {iconLinks.map((link) => {
              const active = pathname === link.href;

              if (link.href === "/notifications") {
                const Icon = link.icon;
                const count = isHydrated ? currentNewNotifications ?? 0 : 0;
                const displayCount = count > 99 ? "99+" : count;
                const classes = ["icon-link"];
                if (isHydrated && count > 0) {
                  classes.push("has-badge");
                }
                if (active) {
                  classes.push("active");
                }
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    aria-label={link.label}
                    className={classes.join(" ")}
                  >
                    <Icon />
                    {isHydrated && count > 0 ? <span className="notif-badge">{displayCount}</span> : null}
                  </Link>
                );
              }

              if (link.href === "/profile" && isHydrated && isAuthenticated) {
                const initials = (currentUserInitials || link.label.slice(0, 2)).toUpperCase();
                const classes = ["icon-link", "avatar"];
                if (active) {
                  classes.push("active");
                }
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    aria-label={link.label}
                    className={classes.join(" ")}
                  >
                    <span>{initials}</span>
                  </Link>
                );
              }

              const Icon = link.icon;
              const classes = ["icon-link"];
              if (active) {
                classes.push("active");
              }
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  aria-label={link.label}
                  className={classes.join(" ")}
                >
                  <Icon />
                </Link>
              );
            })}
            <button
              className="hamburger"
              aria-label="Deschide meniul"
              aria-expanded={menuOpen}
              onClick={() => setMenuOpen((value) => !value)}
            >
              <span />
              <span />
              <span />
            </button>
          </nav>
        </div>
        <div className={`mobile-menu ${menuOpen ? "show" : ""}`}>
          {mainLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setMenuOpen(false)}
              className={pathname === link.href ? "active" : undefined}
            >
              {link.label}
            </Link>
          ))}
        </div>
      </header>

      <main className="container" style={pathname === "/assistant" ? { height: "80vh" } : undefined}>
        {children}
      </main>
      {journalOpen && isAuthenticated && <JournalModal onClose={closeJournal} onSaved={handleJournalSaved} />}
      {showAuthModal && <AuthPromptModal onClose={handleCloseAuth} />}

      {pathname !== "/assistant" && <Footer />}
      <BottomNav />
    </AuthContext.Provider>
  );
}

function BellIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M15 17h5l-1.4-1.4A2 2 0 0 1 18 14.2V11a6 6 0 1 0-12 0v3.2c0 .5-.2 1-.6 1.4L4 17h5" />
      <path d="M9 17a3 3 0 0 0 6 0" />
    </svg>
  );
}

function UserIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <circle cx="12" cy="8" r="4" />
      <path d="M4 20a8 8 0 0 1 16 0" />
    </svg>
  );
}

function SettingsIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 5 15.4a1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09a1.65 1.65 0 0 0 1.51-1 1.65 1.65 0 0 0-.33-1.82l-.06-.06A2 2 0 1 1 7.04 2.7l.06.06c.47.47 1.16.61 1.82.33H9a1.65 1.65 0 0 0 1-1.51V1a2 2 0 1 1 4 0v.09c0 .67.39 1.26 1 1.51.66.28 1.35.14 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06c-.47.47-.61 1.16-.33 1.82V9c.75.29 1.51.68 1.51 1.6s-.76 1.31-1.51 1.4z" />
    </svg>
  );
}

function BottomNav() {
  const { pathname } = useRouter();
  const items = [
    { href: "/", label: "Acasa", icon: FiHome },
    { href: "/assistant", label: "Asistent", icon: FiMessageSquare },
    { href: "/psychologists", label: "Ajutor", icon: FiCalendar },
    { href: "/learn", label: "Articole", icon: FiBookOpen },
    { href: "/community", label: "Comunitate", icon: FiUsers },
  ];
  return (
    <nav className="bottom-nav">
      {items.map((item) => {
        const Icon = item.icon;
        const active = pathname === item.href;
        return (
          <Link key={item.href} href={item.href} className={active ? "active" : undefined}>
            <Icon size={22} />
            <span>{item.label}</span>
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
  );
}
