import AccentCard from '@/Components/AccentCard';
import AppLayout from '@/Layouts/AppLayout';
import SignOutAction from '@/Components/SignOutAction';
import { Head, Link, router, useRemember } from '@inertiajs/react';
import { useEffect } from 'react';
import { FiCheck, FiClock, FiInfo, FiMail, FiMapPin, FiPhone, FiSearch, FiSend } from '@/lib/icons';

export default function Psychologists({ psychologists, pagination, filters, activePsychologist }) {
    const [q, setQ] = useRemember(filters?.q ?? '', 'psychologists.search');

    useEffect(() => {
        setQ(filters?.q ?? '');
    }, [filters?.q, setQ]);

    useEffect(() => {
        const timeoutId = window.setTimeout(() => {
            const nextQ = (q ?? '').trim();
            const currentQ = (filters?.q ?? '').trim();

            if (nextQ === currentQ) {
                return;
            }

            router.get(route('psychologists'), nextQ ? { q: nextQ } : {}, {
                preserveState: true,
                preserveScroll: true,
                replace: true,
            });
        }, 250);

        return () => window.clearTimeout(timeoutId);
    }, [filters?.q, q]);

    return (
        <>
            <Head title="Ajutor - Calming" />

            <div className="psychologists-intro">
                {activePsychologist ? (
                    <AccentCard dismissKey="psychologists-active-account">
                        <div className="section-title">Bine ai venit, {activePsychologist.firstName}!</div>
                        <div className="psychologists-cta-buttons">
                            <SignOutAction className="btn settings-signout-card psychologists-signout-button" onClick={() => router.post('/psychologists/signout')} />
                            <Link className="btn primary" href="/psychologists/dashboard">
                                Acceseaza contul
                            </Link>
                        </div>
                    </AccentCard>
                ) : (
                    <AccentCard dismissKey="psychologists-specialist-cta">
                        <div className="section-title">
                            <FiCheck className="section-icon" /> Rețeaua specialiștilor Calming
                        </div>
                        <div className="muted">
                            Ești profesionist și vrei să te alături comunității?
                            <Link style={{ paddingLeft: '4px', fontWeight: '800', color: 'var(--primary-600)' }} href="/psychologists/signup">Înscrie-te acum!</Link>
                        </div>
                    </AccentCard>
                )}
            </div>

            <section className="card search-card u-mt-4">
                <FiSearch className="section-icon search-card__icon" />
                <input
                    value={q}
                    onChange={(event) => setQ(event.target.value)}
                    placeholder="Caută specialiști, servicii, adrese..."
                    className="form-input search-card__input"
                />
            </section>

            <div className="grid psychologists-grid">
                {psychologists.map((p) => {
                    const displayName = formatPsychologistName(p);
                    const location = formatPsychologistLocation(p);
                    const phoneHref = p.phone ? `tel:${p.phone.replace(/\s+/g, '')}` : null;
                    const hasOffice = Boolean(p.address?.trim());
                    const mapsHref = hasOffice ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(p.address)}` : null;
                    const emailHref = p.email ? `mailto:${p.email}` : null;

                    return (
                        <div className="card" key={p.id}>
                            <div className="row psychologists-info">
                                <div className="grow">
                                    <div className="psychologists-name-row">
                                        <div className="u-text-semibold">{displayName}</div>
                                        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', width: '100%' }}>
                                            <span className={`badge ${p.validationStatus === 1 ? 'badge-success' : p.recordType === 'import' ? 'badge-info' : 'badge-muted'}`}>
                                                {p.validationStatus === 1 ? (
                                                    <>
                                                        <FiCheck size={14} aria-hidden />
                                                        Specialist verificat
                                                    </>
                                                ) : p.recordType === 'import' ? (
                                                    <>
                                                        <FiCheck size={14} aria-hidden />
                                                        Specialist activ
                                                    </>
                                                ) : (
                                                    <>
                                                        <FiClock size={14} aria-hidden />
                                                        In curs de validare
                                                    </>
                                                )}
                                            </span>
                                            {p.recordType === 'import' && location ? (
                                                <span className="psychologists-meta-item psychologists-meta-item--inline">
                                                    <FiMapPin /> {location}
                                                </span>
                                            ) : null}
                                            {p.supports_online ? (
                                                <span className="badge badge-info">Online</span>
                                            ) : null}
                                            {hasOffice ? (
                                                <span className="badge badge-info">Cabinet</span>
                                            ) : null}
                                        </div>
                                    </div>
                                    {p.specialties && p.specialties.length ? (
                                        <div className="psychologists-specialties">
                                            {p.specialties.map((label, index) => (
                                                <span className="pill pill-muted" key={`${p.id}-spec-${index}`}>
                                                    {label}
                                                </span>
                                            ))}
                                        </div>
                                    ) : null}
                                    <div className="muted psychologists-meta">
                                        {location && p.recordType !== 'import' ? (
                                            <span className="psychologists-meta-item">
                                                <FiMapPin /> {location}
                                            </span>
                                        ) : null}
                                    </div>
                                </div>
                                {p.validationStatus === 1 || p.recordType === 'import' ? (
                                    <div className="psychologists-actions">
                                        {p.slug ? (
                                            <Link className="btn icon-only" href={route('psychologists.show', p.slug)} aria-label={`Detalii despre ${displayName}`}>
                                                <FiInfo />
                                            </Link>
                                        ) : null}
                                        {phoneHref ? (
                                            <a className="btn icon-only" href={phoneHref} aria-label={`Suna ${displayName}`}>
                                                <FiPhone />
                                            </a>
                                        ) : null}
                                        {mapsHref ? (
                                            <a
                                                className="btn icon-only"
                                                href={mapsHref}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                aria-label={`Indicatii catre ${displayName}`}
                                            >
                                                <FiSend />
                                            </a>
                                        ) : null}
                                        {emailHref ? (
                                            <a className="btn icon-only" href={emailHref} aria-label={`Trimite email catre ${displayName}`}>
                                                <FiMail />
                                            </a>
                                        ) : null}
                                        {p.validationStatus === 1 ? (
                                            <Link className="btn primary" href={p.slug ? `/appointments?psychologist=${p.slug}` : '/psychologists'}>
                                                Programeaza
                                            </Link>
                                        ) : null}
                                    </div>
                                ) : null}
                            </div>
                        </div>
                    );
                })}
                {psychologists.length === 0 ? (
                    <div className="card">
                        <div className="muted">Nu am gasit specialisti care sa corespunda cautarii tale.</div>
                    </div>
                ) : null}
            </div>

            {pagination?.lastPage > 1 ? (
                <section className="card u-mt-4 psychologists-pagination">
                    <div className="psychologists-pagination__row">
                        <div className="muted psychologists-pagination__summary">
                            Afișare {pagination.from} - {pagination.to} din {pagination.total}
                        </div>
                        <div className="psychologists-pagination__controls">
                            {pagination.previousPageUrl ? (
                                <Link className="btn psychologists-pagination__button" href={pagination.previousPageUrl}>
                                    Pagina anterioară
                                </Link>
                            ) : (
                                <span className="btn disabled psychologists-pagination__button" aria-disabled="true">
                                    Pagina anterioară
                                </span>
                            )}
                            <span className="muted psychologists-pagination__page">
                                Pagina {pagination.currentPage} din {pagination.lastPage}
                            </span>
                            {pagination.nextPageUrl ? (
                                <Link className="btn psychologists-pagination__button" href={pagination.nextPageUrl}>
                                    Pagina următoare
                                </Link>
                            ) : (
                                <span className="btn disabled psychologists-pagination__button" aria-disabled="true">
                                    Pagina următoare
                                </span>
                            )}
                        </div>
                    </div>
                </section>
            ) : null}
        </>
    );
}

function normalize(value) {
    return (value || '').toString().normalize('NFD').replace(/\p{Diacritic}+/gu, '').toLowerCase();
}

function formatPsychologistName(entry) {
    return [entry.title, entry.name, entry.surname].filter(Boolean).join(' ').replace(/\s+/g, ' ').trim();
}

function formatPsychologistLocation(entry) {
    const parts = [];

    if (entry.address) {
        parts.push(entry.address);
    }

    let cityCounty = '';

    if (entry.city) {
        const cityLower = entry.city.toLowerCase();
        const isBucharest = cityLower.includes('bucuresti') || cityLower.includes('bucurești');

        if (isBucharest) {
            cityCounty = entry.county ? `${entry.city}, ${entry.county}` : entry.city;
        } else {
            cityCounty = entry.county ? `${entry.city}, judetul ${entry.county}` : entry.city;
        }
    }

    if (cityCounty) {
        parts.push(cityCounty);
    }

    return parts.join(', ') || null;
}

Psychologists.layout = (page) => <AppLayout>{page}</AppLayout>;
