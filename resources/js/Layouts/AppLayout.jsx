import AuthPromptModal from '@/Components/AuthPromptModal';
import JournalModal from '@/Components/JournalModal';
import { AuthContext } from '@/contexts/AuthContext';
import { ToastContext } from '@/contexts/ToastContext';
import { DEFAULT_PSYCH_DASHBOARD_SECTION, normalizePsychDashboardSection, PSYCH_DASHBOARD_MENU_ITEMS } from '@/data/psychDashboardNav';
import { buildGuestNotifications, recordGuestSectionVisit } from '@/lib/guestActivity';
import { apiFetch } from '@/lib/http';
import { subscribeNotificationSync } from '@/lib/notificationSync';
import { BellIcon, FiBookOpen, FiCalendar, FiHome, FiMessageSquare, FiUsers, FiX, SettingsIcon, UserIcon } from '@/lib/icons';
import { Link, router, usePage } from '@inertiajs/react';
import { useCallback, useEffect, useMemo, useState } from 'react';

export default function AppLayout({ children }) {
    const page = usePage();
    const { url } = page;
    const sharedAuthUser = page.props.auth?.user ?? null;
    const sharedPsychUser = page.props.psychAuth?.user ?? null;
    const sharedSuperUser = page.props.superAuth?.user ?? null;
    const notificationsEnabled = Boolean(page.props.preferences?.notifications_enabled ?? true);
    const currentPath = useMemo(() => url.split('?')[0], [url]);
    const search = useMemo(() => new URLSearchParams(url.split('?')[1] ?? ''), [url]);
    const pathname = currentPath;
    const isCommunityInner = pathname.startsWith('/community/') && pathname !== '/community';
    const isCommunityRoute = pathname === '/community' || pathname.startsWith('/community/');
    const isPsychDashboard = pathname.startsWith('/psychologists/dashboard');
    const isSuperadminDashboard = pathname.startsWith('/superadmin/');
    const activePsychDashboardSection = useMemo(() => normalizePsychDashboardSection(search.get('section')), [search]);
    const hideFooter = pathname === '/assistant' || isCommunityInner || isPsychDashboard || isSuperadminDashboard;
    const [theme, setTheme] = useState('light');
    const [menuOpen, setMenuOpen] = useState(false);
    const [showAuthModal, setShowAuthModal] = useState(false);
    const [authModalMode, setAuthModalMode] = useState('user');
    const [toastState, setToastState] = useState(null);
    const [authUser, setAuthUser] = useState(() => ({
        id: sharedAuthUser?.id ?? null,
        initials: null,
        name: sharedAuthUser?.name ?? null,
        firstName: sharedAuthUser?.first_name ?? sharedAuthUser?.name?.split?.(' ')?.[0] ?? null,
        newNotifications: 0,
    }));
    const [authResolved, setAuthResolved] = useState(true);
    const [isHydrated, setIsHydrated] = useState(false);
    const [guestNotificationCount, setGuestNotificationCount] = useState(0);
    const isAuthenticated = typeof authUser.id === 'number' && authUser.id > 0;
    const isPsychAuthenticated = typeof sharedPsychUser?.id === 'number' && sharedPsychUser.id > 0;
    const isSuperAuthenticated = typeof sharedSuperUser?.id === 'number' && sharedSuperUser.id > 0;
    const specialistFirstName = useMemo(() => {
        const source = sharedPsychUser?.first_name ?? sharedPsychUser?.name ?? '';
        const trimmed = String(source).trim();
        if (!trimmed) {
            return 'Specialiști';
        }
        return trimmed.split(/\s+/)[0] || 'Specialiști';
    }, [sharedPsychUser?.first_name, sharedPsychUser?.name]);

    const mainLinks = [
        { href: '/', label: 'Acasă' },
        { href: '/assistant', label: 'Asistent' },
        { href: '/psychologists', label: 'Ajutor' },
        { href: '/learn', label: 'Articole' },
        { href: '/community', label: 'Comunitate' },
        isPsychAuthenticated
            ? { href: '/psychologists/dashboard', label: specialistFirstName, key: 'specialists', className: 'text-link--specialist' }
            : { label: 'Specialiști', key: 'specialists', action: 'specialist-modal' },
    ];

    const profileLink = { href: '/profile', label: 'Profil', icon: UserIcon, key: 'profile' };

    const iconLinks = [
        { href: '/notifications', label: 'Notificări', icon: BellIcon },
        profileLink,
        { href: '/settings', label: 'Setări', icon: SettingsIcon },
    ];

    const closeJournal = useCallback(() => {
        const nextParams = new URLSearchParams(search);
        nextParams.delete('journal');
        const qs = nextParams.toString();
        router.visit(qs ? `${pathname}?${qs}` : pathname, {
            preserveState: true,
            preserveScroll: true,
            replace: true,
        });
    }, [pathname, search]);

    const journalOpen = search.get('journal') === 'new';

    useEffect(() => {
        const saved = typeof window !== 'undefined' ? localStorage.getItem('theme') : null;
        const next = saved || page.props.preferences?.theme || 'light';
        setTheme(next);
        if (typeof document !== 'undefined') {
            document.documentElement.dataset.theme = next;
            document.body?.style.removeProperty('padding-top');
        }
    }, [page.props.preferences?.theme]);

    useEffect(() => {
        if (typeof document === 'undefined') {
            return;
        }

        document.body.classList.toggle('community-page', isCommunityInner);
        document.body.classList.toggle('assistant-page', pathname === '/assistant');
        return () => {
            document.body.classList.remove('community-page');
            document.body.classList.remove('assistant-page');
        };
    }, [isCommunityInner, pathname]);

    useEffect(() => {
        if (isAuthenticated || typeof window === 'undefined') {
            return;
        }

        if (pathname === '/learn' || pathname.startsWith('/article/')) {
            recordGuestSectionVisit('learn');
        } else if (pathname === '/assistant') {
            recordGuestSectionVisit('assistant');
        } else if (pathname.startsWith('/community')) {
            recordGuestSectionVisit('community');
        } else if (pathname === '/psychologists') {
            recordGuestSectionVisit('psychologists');
        } else if (pathname === '/notifications') {
            recordGuestSectionVisit('notifications');
        } else {
            recordGuestSectionVisit('home');
        }
    }, [isAuthenticated, pathname]);

    useEffect(() => {
        if (!journalOpen) {
            return undefined;
        }

        if (!authResolved) {
            return undefined;
        }

        if (!isAuthenticated) {
            setShowAuthModal(true);
            closeJournal();
            return undefined;
        }

        const previous = document.body.style.overflow;
        document.body.style.overflow = 'hidden';

        return () => {
            document.body.style.overflow = previous;
        };
    }, [authResolved, closeJournal, isAuthenticated, journalOpen]);

    const promptAuth = useCallback(() => {
        setAuthModalMode('user');
        setShowAuthModal(true);
    }, []);

    const promptSpecialistAuth = useCallback(() => {
        setAuthModalMode('specialist');
        setShowAuthModal(true);
        setMenuOpen(false);
    }, []);

    const hideToast = useCallback(() => {
        setToastState(null);
    }, []);

    const showToast = useCallback((payload = {}) => {
        const duration = Math.max(2000, Math.min(payload.duration ?? 6000, 15000));
        setToastState({
            id: Date.now(),
            message: payload.message ?? '',
            actionLabel: payload.actionLabel ?? null,
            actionHref: payload.actionHref ?? null,
            duration,
        });
    }, []);

    useEffect(() => {
        if (!toastState) {
            return undefined;
        }

        const timer = setTimeout(hideToast, toastState.duration);
        return () => clearTimeout(timer);
    }, [toastState, hideToast]);

    useEffect(() => {
        setIsHydrated(true);
    }, []);

    const computeAuthUser = useCallback(async () => {
        try {
            const data = await apiFetch('/api/auth/status');
            return {
                id: typeof data.userId === 'number' ? data.userId : null,
                initials: data.initials ?? null,
                name: data.name ?? null,
                firstName: data.firstName ?? null,
                newNotifications: Number(data.newNotifications ?? 0) || 0,
            };
        } catch (error) {
            console.error('Auth status error', error);
            return {
                id: page.props.auth?.user?.id ?? null,
                initials: null,
                name: page.props.auth?.user?.name ?? null,
                firstName: page.props.auth?.user?.name?.split?.(' ')?.[0] ?? null,
                newNotifications: 0,
            };
        }
    }, [page.props.auth?.user?.id, page.props.auth?.user?.name]);

    const refreshAuthStatus = useCallback(async () => {
        const next = await computeAuthUser();
        setAuthUser(next);
        setAuthResolved(true);
        return next;
    }, [computeAuthUser]);

    const refreshNotificationBadge = useCallback(async () => {
        if (!notificationsEnabled) {
            setGuestNotificationCount(0);
            setAuthUser((current) => ({ ...current, newNotifications: 0 }));
            return;
        }

        if (isAuthenticated) {
            await refreshAuthStatus();
            return;
        }

        try {
            const data = await apiFetch('/api/notifications/bootstrap');
            const merged = buildGuestNotifications(data.publicNotifications ?? []);
            setGuestNotificationCount(merged.filter((item) => !item.is_read && Boolean(item.is_new)).length);
        } catch {
            setGuestNotificationCount(0);
        }
    }, [isAuthenticated, notificationsEnabled, refreshAuthStatus]);

    useEffect(() => {
        let active = true;
        setAuthResolved(false);
        computeAuthUser().then((next) => {
            if (active) {
                setAuthUser(next);
                setAuthResolved(true);
            }
        });
        return () => {
            active = false;
        };
    }, [computeAuthUser]);

    useEffect(() => {
        let active = true;

        const run = () => {
            if (!active) {
                return;
            }

            refreshNotificationBadge().catch(() => {
                if (active && !isAuthenticated) {
                    setGuestNotificationCount(0);
                }
            });
        };

        run();

        const intervalId = window.setInterval(() => {
            if (document.visibilityState === 'visible') {
                run();
            }
        }, 5000);

        const handleVisibilityChange = () => {
            if (document.visibilityState === 'visible') {
                run();
            }
        };

        const unsubscribe = subscribeNotificationSync(() => {
            run();
        });

        document.addEventListener('visibilitychange', handleVisibilityChange);

        return () => {
            active = false;
            window.clearInterval(intervalId);
            document.removeEventListener('visibilitychange', handleVisibilityChange);
            unsubscribe();
        };
    }, [isAuthenticated, pathname, refreshNotificationBadge]);

    const handleCloseAuth = useCallback(() => {
        setShowAuthModal(false);
    }, []);

    const signOut = useCallback(async () => {
        try {
            await apiFetch('/api/auth/signout', {
                method: 'POST',
            });
        } catch (error) {
            console.error('Sign out failed', error);
        } finally {
            await refreshAuthStatus();
            setShowAuthModal(false);
            router.visit('/');
        }
    }, [refreshAuthStatus]);

    const handlePsychDashboardSectionChange = useCallback((nextSection) => {
        const target = normalizePsychDashboardSection(nextSection);
        const nextSearch = new URLSearchParams(search);
        if (target === DEFAULT_PSYCH_DASHBOARD_SECTION) {
            nextSearch.delete('section');
        } else {
            nextSearch.set('section', target);
        }
        const query = nextSearch.toString();
        setMenuOpen(false);
        router.visit(query ? `/psychologists/dashboard?${query}` : '/psychologists/dashboard', {
            preserveState: true,
            preserveScroll: true,
            replace: true,
        });
    }, [search]);

    const handlePsychDashboardSignOut = useCallback(() => {
        setMenuOpen(false);
        router.post(route('psychologists.signout'));
    }, []);

    const handleJournalSaved = useCallback(async () => {
        try {
            await refreshAuthStatus();
            router.reload({ preserveScroll: true, preserveState: true });
            if (pathname !== '/journal') {
                showToast({
                    message: 'Nota a fost salvata.',
                    actionHref: '/journal',
                    actionLabel: 'Vezi jurnalul',
                });
            }
        } catch (error) {
            console.error('Failed to refresh after journal save', error);
        }
    }, [pathname, refreshAuthStatus, showToast]);

    const authContextValue = useMemo(
        () => ({
            isAuthenticated,
            isSuperAuthenticated,
            isPsychAuthenticated,
            authResolved,
            userId: authUser.id,
            userInitials: authUser.initials,
            userName: authUser.name,
            userFirstName: authUser.firstName,
            psychUserId: sharedPsychUser?.id ?? null,
            psychUserName: sharedPsychUser?.name ?? null,
            newNotificationCount: authUser.newNotifications,
            promptAuth,
            signOut,
            refreshAuth: refreshAuthStatus,
        }),
        [authResolved, authUser, isAuthenticated, isPsychAuthenticated, isSuperAuthenticated, promptAuth, refreshAuthStatus, sharedPsychUser?.id, sharedPsychUser?.name, signOut],
    );

    const toastContextValue = useMemo(
        () => ({
            showToast,
        }),
        [showToast],
    );

    return (
        <ToastContext.Provider value={toastContextValue}>
            <AuthContext.Provider value={authContextValue}>
                <header className={`site-header${isPsychDashboard ? ' site-header--psych' : ''}`}>
                    <div className="container bar">
                        <Link href={isPsychDashboard ? '/psychologists/dashboard' : '/'} className="brand">
                            <span className="brand-mark" />
                            Calming
                        </Link>
                        {isPsychDashboard ? (
                            <>
                                <div className="dashboard-header-title">Dashboard Specialiști</div>
                                <button className="hamburger" aria-label="Deschide meniul" aria-expanded={menuOpen} onClick={() => setMenuOpen((value) => !value)}>
                                    <span />
                                    <span />
                                    <span />
                                </button>
                            </>
                        ) : (
                            <>
                                <nav className="nav">
                                    {mainLinks.map((link) => (
                                        link.action === 'specialist-modal' ? (
                                            <button
                                                key={link.key}
                                                type="button"
                                                className="text-link"
                                                onClick={promptSpecialistAuth}
                                            >
                                                {link.label}
                                            </button>
                                        ) : (
                                            <Link
                                                key={link.key ?? link.href}
                                                href={link.href}
                                                className={`text-link ${link.className ?? ''} ${(pathname === link.href || (link.href === '/psychologists/dashboard' && isPsychDashboard) || (link.href === '/community' && isCommunityRoute)) ? 'active' : ''}`}
                                            >
                                                {link.label}
                                            </Link>
                                        )
                                    ))}
                                    {iconLinks.map((link) => {
                                        const active = pathname === link.href;

                                        if (link.href === '/notifications') {
                                            const Icon = link.icon;
                                            const count = notificationsEnabled
                                                ? (isHydrated ? (isAuthenticated ? authUser.newNotifications ?? 0 : guestNotificationCount) : 0)
                                                : 0;
                                            const displayCount = count > 99 ? '99+' : count;
                                            const classes = ['icon-link'];
                                            if (notificationsEnabled && isHydrated && count > 0) {
                                                classes.push('has-badge');
                                            }
                                            if (active) {
                                                classes.push('active');
                                            }
                                            return (
                                                <Link key={link.href} href={link.href} aria-label={link.label} className={classes.join(' ')}>
                                                    <Icon />
                                                    {isHydrated && count > 0 ? <span className="notif-badge">{displayCount}</span> : null}
                                                </Link>
                                            );
                                        }

                                        if (link.href === '/profile' && !isAuthenticated) {
                                            const Icon = link.icon;
                                            return (
                                                <a
                                                    key={link.key ?? link.href}
                                                    href={pathname}
                                                    aria-label={link.label}
                                                    className="icon-link"
                                                    onClick={(event) => {
                                                        event.preventDefault();
                                                        promptAuth();
                                                    }}
                                                >
                                                    <Icon />
                                                </a>
                                            );
                                        }

                                        if (link.href === '/profile' && isHydrated && isAuthenticated) {
                                            const initials = (authUser.initials || authUser.firstName || link.label.slice(0, 2)).toUpperCase();
                                            const classes = ['icon-link', 'avatar'];
                                            if (active) {
                                                classes.push('active');
                                            }
                                            return (
                                                <Link key={link.href} href={link.href} aria-label={link.label} className={classes.join(' ')}>
                                                    <span>{initials}</span>
                                                </Link>
                                            );
                                        }

                                        const Icon = link.icon;
                                        const classes = ['icon-link'];
                                        if (active) {
                                            classes.push('active');
                                        }
                                        return (
                                            <Link key={link.key ?? link.href} href={link.href} aria-label={link.label} className={classes.join(' ')}>
                                                <Icon />
                                            </Link>
                                        );
                                    })}
                                </nav>
                                <button className="hamburger" aria-label="Deschide meniul" aria-expanded={menuOpen} onClick={() => setMenuOpen((value) => !value)}>
                                    <span />
                                    <span />
                                    <span />
                                </button>
                            </>
                        )}
                    </div>
                    {isPsychDashboard ? (
                        <div className={`mobile-menu mobile-menu--dashboard ${menuOpen ? 'show' : ''}`}>
                            {PSYCH_DASHBOARD_MENU_ITEMS.map((item) => {
                                const Icon = item.icon;

                                return (
                                    <button
                                        key={item.key}
                                        type="button"
                                        className={`psych-menu__link ${activePsychDashboardSection === item.key ? 'active' : ''}`}
                                        onClick={() => handlePsychDashboardSectionChange(item.key)}
                                    >
                                        <span className="icon-shell">
                                            <Icon size={18} />
                                        </span>
                                        {item.label}
                                    </button>
                                );
                            })}
                            <Link href="/" className="psych-menu__link mobile-menu__website" onClick={() => setMenuOpen(false)}>
                                Website
                            </Link>
                            <button type="button" className="psych-menu__link danger" onClick={handlePsychDashboardSignOut}>
                                Sign out
                            </button>
                        </div>
                    ) : (
                        <div className={`mobile-menu ${menuOpen ? 'show' : ''}`}>
                            {mainLinks.map((link) => (
                                link.action === 'specialist-modal' ? (
                                    <button key={link.key} type="button" onClick={promptSpecialistAuth}>
                                        {link.label}
                                    </button>
                                ) : (
                                    <Link
                                        key={link.key ?? link.href}
                                        href={link.href}
                                        onClick={() => setMenuOpen(false)}
                                        className={`${link.className ?? ''} ${pathname === link.href || (link.href === '/psychologists/dashboard' && isPsychDashboard) || (link.href === '/community' && isCommunityRoute) ? 'active' : ''}`.trim() || undefined}
                                    >
                                        {link.label}
                                    </Link>
                                )
                            ))}
                        </div>
                    )}
                </header>

                <main className={`container${isCommunityInner ? ' community-container' : ''}`} style={pathname === '/assistant' ? { height: '80vh' } : undefined}>
                    {children}
                </main>

                {journalOpen && isAuthenticated ? <JournalModal onClose={closeJournal} onSaved={handleJournalSaved} /> : null}
                {showAuthModal ? <AuthPromptModal onClose={handleCloseAuth} mode={authModalMode} /> : null}

                {!hideFooter ? <Footer /> : null}
                {pathname !== '/assistant' && !isCommunityInner ? <BottomNav /> : null}

                {toastState && toastState.message ? (
                    <div className="toast-container" role="status" aria-live="polite">
                        <div className="toast-shell">
                            <span className="toast-message">{toastState.message}</span>
                            <div className="toast-actions">
                                {toastState.actionHref ? (
                                    <Link href={toastState.actionHref} className="toast-link" onClick={hideToast}>
                                        {toastState.actionLabel ?? 'Vezi jurnalul'}
                                    </Link>
                                ) : null}
                                <button type="button" className="toast-close" aria-label="Inchide notificarea" onClick={hideToast}>
                                    x
                                </button>
                            </div>
                        </div>
                    </div>
                ) : null}
            </AuthContext.Provider>
        </ToastContext.Provider>
    );
}

function BottomNav() {
    const { url } = usePage();
    const pathname = url.split('?')[0];
    const isCommunityRoute = pathname === '/community' || pathname.startsWith('/community/');
    const items = [
        { href: '/', label: 'Acasă', icon: FiHome },
        { href: '/assistant', label: 'Asistent', icon: FiMessageSquare },
        { href: '/psychologists', label: 'Ajutor', icon: FiCalendar },
        { href: '/learn', label: 'Articole', icon: FiBookOpen },
        { href: '/community', label: 'Comunitate', icon: FiUsers },
    ];

    return (
        <nav className="bottom-nav">
            {items.map((item) => {
                const Icon = item.icon;
                const active = pathname === item.href || (item.href === '/community' && isCommunityRoute);
                return (
                    <Link key={item.href} href={item.href} className={active ? 'active' : undefined}>
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
                    <div className="muted">Îndrumare confidențială pentru echilibrul tău.</div>
                </div>
                <div>
                    <div className="footer-title">Platforma</div>
                    <ul>
                        <li><Link href="/learn">Biblioteca</Link></li>
                        <li><Link href="/community">Comunitate</Link></li>
                        <li><Link href="/psychologists">Programări</Link></li>
                        <li><a href="mailto:contact@calming.ro">Contact</a></li>
                    </ul>
                </div>
                <div>
                    <div className="footer-title">Legal</div>
                    <ul>
                        <li><Link href={route('legal.show', 'termeni-si-conditii')}>Termeni și Condiții</Link></li>
                        <li><Link href={route('legal.show', 'confidentialitate')}>Confidențialitate</Link></li>
                        <li><Link href={route('legal.show', 'cookies')}>Cookies</Link></li>
                    </ul>
                </div>
            </div>
            <div className="container footer-meta">
                <div className="muted">(c) {new Date().getFullYear()} Calming. Toate drepturile rezervate.</div>
            </div>
        </footer>
    );
}
