import AppLayout from '@/Layouts/AppLayout';
import CareReminder from '@/Components/CareReminder';
import { apiFetch } from '@/lib/http';
import { useAuth } from '@/contexts/AuthContext';
import { Head, Link, router } from '@inertiajs/react';
import { useCallback, useMemo, useState } from 'react';
import { BellIcon, FiHelpCircle, FiStar, FiUsers, FiZap, ICON_BY_NAME } from '@/lib/icons';

const moodLabelOverrides = {
    'In regula': 'OK',
    Dezamagit: 'Trist',
    Greu: 'Copleșit',
};

export default function Home({ moodOptions, faqs, recommendedArticles, communityGroups, latestNotification }) {
    const [openFaqs, setOpenFaqs] = useState({});
    const { isAuthenticated, promptAuth, userName: authUserName, userFirstName } = useAuth();
    const [quickMoodId, setQuickMoodId] = useState(null);
    const [quickNote, setQuickNote] = useState('');
    const [quickSaving, setQuickSaving] = useState(false);
    const [quickError, setQuickError] = useState(null);
    const [quickSuccess, setQuickSuccess] = useState(null);

    const greetingName = useMemo(() => {
        const sourceName = userFirstName ?? authUserName;
        if (!sourceName) {
            return null;
        }
        const trimmed = String(sourceName).trim();
        if (!trimmed) {
            return null;
        }
        const [first] = trimmed.split(/\s+/);
        return first || null;
    }, [userFirstName, authUserName]);

    const openJournal = () => {
        if (!isAuthenticated) {
            promptAuth();
            return;
        }
        router.visit('/?journal=new', { preserveState: true, preserveScroll: true });
    };

    const openProfileJournal = useCallback(() => {
        if (!isAuthenticated) {
            promptAuth();
            return;
        }
        router.visit('/profile?journal=new', { preserveState: true, preserveScroll: true });
    }, [isAuthenticated, promptAuth]);

    const toggleFaq = (index) => {
        setOpenFaqs((current) => ({ ...current, [index]: !current[index] }));
    };

    const handleMoodSelect = useCallback((moodId) => {
        if (!isAuthenticated) {
            promptAuth();
            return;
        }
        setQuickMoodId(moodId);
        setQuickError(null);
        setQuickSuccess(null);
    }, [isAuthenticated, promptAuth]);

    const handleQuickSave = useCallback(async () => {
        if (!isAuthenticated) {
            promptAuth();
            return;
        }
        if (!quickMoodId) {
            setQuickError('Selectează starea din listă înainte să salvezi.');
            return;
        }
        setQuickSaving(true);
        setQuickError(null);
        setQuickSuccess(null);
        try {
            await apiFetch('/api/journal/quick', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ moodId: quickMoodId, notes: quickNote }),
            });
            setQuickSuccess(
                <>
                    Nota rapidă a fost salvată. O poți vedea în contul tău, accesând{' '}
                    <Link href="/journal" className="text-link" style={{ textDecoration: 'underline' }}>Jurnalul meu</Link>.
                </>,
            );
            setQuickNote('');
            setQuickMoodId(null);
        } catch (error) {
            setQuickError(error.message);
        } finally {
            setQuickSaving(false);
        }
    }, [isAuthenticated, promptAuth, quickMoodId, quickNote]);

    const guardMoodCard = useCallback((event) => {
        if (isAuthenticated) {
            return;
        }
        if (event.type === 'keydown' && event.key !== 'Enter' && event.key !== ' ') {
            return;
        }
        event.preventDefault();
        event.stopPropagation();
        promptAuth();
    }, [isAuthenticated, promptAuth]);

    const getMoodLabel = useCallback((label) => moodLabelOverrides[label] ?? label, []);
    const mobileHomeDate = useMemo(
        () => new Intl.DateTimeFormat('ro-RO', { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date()),
        [],
    );
    const mobileGreeting = useMemo(() => {
        const hour = new Date().getHours();
        if (hour < 12) {
            return 'Bună dimineața';
        }
        if (hour < 18) {
            return 'Bună ziua';
        }
        return 'Bună seara';
    }, []);
    const latestNotificationTime = useMemo(() => formatHomeNotificationTime(latestNotification?.created_at), [latestNotification?.created_at]);
    const LatestNotificationIcon = useMemo(() => ICON_BY_NAME[latestNotification?.icon] ?? BellIcon, [latestNotification?.icon]);
    const quickNoteField = isAuthenticated ? (
        <input
            className="grow note-input"
            placeholder="Adaugă un gând în jurnal."
            value={quickNote}
            onChange={(event) => setQuickNote(event.target.value)}
            maxLength={255}
            disabled={quickSaving}
        />
    ) : (
        <button type="button" className="grow note-input note-input-button" onClick={openJournal}>
            Adaugă un gând în jurnal.
        </button>
    );

    return (
        <>
            <Head title="Calming - Asistent psihologic" />

            {isAuthenticated ? (
                <section className="home-mobile-auth">
                    <div className="home-mobile-auth__intro">
                        <div className="home-mobile-auth__greeting">{`${mobileGreeting}${greetingName ? `, ${greetingName}!` : '!'}`}</div>
                        <div className="home-mobile-auth__date">{mobileHomeDate}</div>
                    </div>

                    {latestNotification ? (
                        <article className={`notification-card home-mobile-auth__notification${latestNotification.accent ? ` accent-${latestNotification.accent}` : ''}`}>
                            <div className="notification-icon">
                                <LatestNotificationIcon size={22} aria-hidden />
                            </div>
                            <div className="notification-content">
                                <div className="notification-title">{latestNotification.title}</div>
                                <p className="notification-body">{latestNotification.message}</p>
                                {latestNotificationTime ? <span className="notification-time">{latestNotificationTime}</span> : null}
                            </div>
                        </article>
                    ) : null}

                    <section className="card home-mobile-auth__card" onClickCapture={guardMoodCard} onKeyDownCapture={guardMoodCard}>
                        <div className="section-title">Cum te simți azi?</div>
                        <div className="mood-row u-mt-2">
                            {moodOptions.map((item) => (
                                <button key={item.id} type="button" className={`mood-button ${quickMoodId === item.id ? 'sel' : ''}`} title={getMoodLabel(item.label)} aria-label={`Ma simt ${getMoodLabel(item.label)}`} aria-pressed={quickMoodId === item.id} onClick={openProfileJournal}>
                                    <span className="mood-emoji" aria-hidden="true">{item.emoji}</span>
                                    <span className="mood-label">{getMoodLabel(item.label)}</span>
                                </button>
                            ))}
                        </div>
                        <div className="row u-mt-3 home-mobile-auth__note-row">
                            {quickNoteField}
                            <button className="btn primary" type="button" onClick={handleQuickSave} disabled={quickSaving}>
                                {quickSaving ? 'Se salvează...' : 'Salvează'}
                            </button>
                        </div>
                        {quickError ? <div className="error u-mt-2">{quickError}</div> : null}
                        {quickSuccess ? <div className="info u-mt-2">{quickSuccess}</div> : null}
                    </section>

                    <section className="card home-mobile-auth__card">
                        <div className="section-title"><FiZap className="section-icon" /> Acțiuni rapide</div>
                        <div className="grid grid-single u-gap-2-5">
                            <Link href="/assistant" className="list-item">Vorbește cu Asistentul</Link>
                            <Link href="/psychologists" className="list-item">Programează o ședință</Link>
                            <a href="#" className="list-item" onClick={(event) => { event.preventDefault(); openJournal(); }}>Adaugă în jurnal</a>
                        </div>
                    </section>

                    <CareReminder className="home-mobile-auth__care-card" />

                    <section className="card home-mobile-auth__card">
                        <div className="section-title"><FiStar className="section-icon" /> Recomandări pentru tine</div>
                        <div className="grid u-gap-2-5">
                            {recommendedArticles.map((item) => (
                                <Link key={item.slug} href={`/article/${item.slug}`} className="list-item">{item.title}</Link>
                            ))}
                        </div>
                    </section>

                    <section className="card home-mobile-auth__card">
                        <div className="section-title"><FiUsers className="section-icon" /> Grupuri de sprijin</div>
                        <div className="grid u-gap-2-5">
                            {communityGroups.map((group) => (
                                <Link key={group.name} href="/community" className="list-item">{group.name}</Link>
                            ))}
                        </div>
                    </section>

                    <section className="card home-mobile-auth__card">
                        <div className="section-title"><FiHelpCircle className="section-icon" /> Întrebări și răspunsuri</div>
                        <div className="accordion">
                            {faqs.map((item, index) => {
                                const expanded = Boolean(openFaqs[index]);
                                return (
                                    <div key={item.id} className={`acc-item ${expanded ? 'open' : ''}`}>
                                        <button type="button" className="acc-header" aria-expanded={expanded} onClick={() => toggleFaq(index)}>
                                            <span style={{ textAlign: 'left' }}>{item.question}</span>
                                            <span className="chev">{expanded ? '-' : '+'}</span>
                                        </button>
                                        {expanded ? (
                                            <div className="acc-panel">
                                                <p>{item.answer}</p>
                                                {item.link_href ? (
                                                    <div className="u-mt-2">
                                                        <Link href={item.link_href} className="text-link">{item.link_text ?? 'Vezi detalii'}</Link>
                                                        {item.link_hint ? <span className="muted u-ml-2">{item.link_hint}</span> : null}
                                                    </div>
                                                ) : null}
                                            </div>
                                        ) : null}
                                    </div>
                                );
                            })}
                        </div>
                    </section>
                </section>
            ) : null}

            <section className={`hero${isAuthenticated ? ' home-default-auth' : ''}`}>
                <video autoPlay muted loop playsInline src="/video/calm.mp4" className="hero-video" />
                <div className="u-relative">
                    <div className="hero-badge">Psihologul tău</div>
                    <h1 className="hero-title">Îndrumare confidențială pentru echilibrul tău</h1>
                    <p className="hero-lead u-mt-2">
                        Un spațiu sigur în care poți vorbi cu un asistent AI, poți ține un jurnal al stărilor și poți găsi rapid specialiști și resurse de încredere.
                    </p>
                    <div className="row hello u-mt-3">
                        <Link className="btn primary" href="/assistant">Începe conversația cu un asistent AI</Link>
                        <Link className="btn" href="/psychologists">Programează o ședință cu un psiholog</Link>
                    </div>
                </div>
            </section>

            <section className={`card home-mood-card${isAuthenticated ? ' home-default-auth' : ''}`} onClickCapture={guardMoodCard} onKeyDownCapture={guardMoodCard}>
                <div className="section-title">
                    {isAuthenticated && greetingName ? `Bună, ${greetingName}! Cum te simți azi?` : 'Cum te simți azi?'}
                </div>
                <div className="mood-row u-mt-2">
                    {moodOptions.map((item) => (
                        <button key={item.id} type="button" className={`mood-button ${quickMoodId === item.id ? 'sel' : ''}`} title={getMoodLabel(item.label)} aria-label={`Ma simt ${getMoodLabel(item.label)}`} aria-pressed={quickMoodId === item.id} onClick={() => handleMoodSelect(item.id)}>
                            <span className="mood-emoji" aria-hidden="true">{item.emoji}</span>
                            <span className="mood-label">{getMoodLabel(item.label)}</span>
                        </button>
                    ))}
                </div>
                <div className="row u-mt-3">
                    {quickNoteField}
                    <button className="btn primary" type="button" onClick={handleQuickSave} disabled={quickSaving}>
                        {quickSaving ? 'Se salvează...' : 'Salvează'}
                    </button>
                </div>
                {quickError ? <div className="error u-mt-2">{quickError}</div> : null}
                {quickSuccess ? <div className="info u-mt-2">{quickSuccess}</div> : null}

                <CareReminder className="note-card-spaced" />
            </section>

            <div className={`grid cols-3${isAuthenticated ? ' home-default-auth' : ''}`}>
                <section className="card">
                    <div className="section-title"><FiZap className="section-icon" /> Acțiuni rapide</div>
                    <div className="grid grid-single u-gap-2-5">
                        <Link href="/assistant" className="list-item">Vorbește cu Asistentul</Link>
                        <Link href="/psychologists" className="list-item">Programează o ședință</Link>
                        <a href="#" className="list-item" onClick={(event) => { event.preventDefault(); openJournal(); }}>Adaugă în jurnal</a>
                    </div>
                </section>

                <section className="card">
                    <div className="section-title"><FiStar className="section-icon" /> Recomandări pentru tine</div>
                    <div className="grid u-gap-2-5">
                        {recommendedArticles.map((item) => (
                            <Link key={item.slug} href={`/article/${item.slug}`} className="list-item">{item.title}</Link>
                        ))}
                    </div>
                </section>

                <section className="card">
                    <div className="section-title"><FiUsers className="section-icon" /> Grupuri de sprijin</div>
                    <div className="grid u-gap-2-5">
                        {communityGroups.map((group) => (
                            <Link key={group.name} href="/community" className="list-item">{group.name}</Link>
                        ))}
                    </div>
                </section>
            </div>

            <section className={`card u-span-full u-mt-4${isAuthenticated ? ' home-default-auth' : ''}`}>
                <div className="section-title"><FiHelpCircle className="section-icon" /> Întrebări și răspunsuri</div>
                <div className="accordion">
                    {faqs.map((item, index) => {
                        const expanded = Boolean(openFaqs[index]);
                        return (
                            <div key={item.id} className={`acc-item ${expanded ? 'open' : ''}`}>
                                <button type="button" className="acc-header" aria-expanded={expanded} onClick={() => toggleFaq(index)}>
                                    <span style={{ textAlign: 'left' }}>{item.question}</span>
                                    <span className="chev">{expanded ? '-' : '+'}</span>
                                </button>
                                {expanded ? (
                                    <div className="acc-panel">
                                        <p>{item.answer}</p>
                                        {item.link_href ? (
                                            <div className="u-mt-2">
                                                <Link href={item.link_href} className="text-link">{item.link_text ?? 'Vezi detalii'}</Link>
                                                {item.link_hint ? <span className="muted u-ml-2">{item.link_hint}</span> : null}
                                            </div>
                                        ) : null}
                                    </div>
                                ) : null}
                            </div>
                        );
                    })}
                </div>
            </section>
        </>
    );
}

function formatHomeNotificationTime(dateString) {
    if (!dateString) {
        return null;
    }

    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMinutes = Math.round(diffMs / (1000 * 60));

    if (diffMinutes <= 0) {
        return 'Acum';
    }
    if (diffMinutes < 60) {
        return `Acum ${diffMinutes} minute`;
    }

    const diffHours = Math.round(diffMinutes / 60);
    if (diffHours < 24) {
        return `Acum ${diffHours} ore`;
    }

    const diffDays = Math.round(diffHours / 24);
    if (diffDays === 1) {
        return 'Ieri';
    }

    return `Acum ${diffDays} zile`;
}

Home.layout = (page) => <AppLayout>{page}</AppLayout>;
