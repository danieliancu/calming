import AppLayout from '@/Layouts/AppLayout';
import { FiCheck, FiInfo, FiMail, FiMapPin, FiPhone, FiSend } from '@/lib/icons';
import { Head, Link } from '@inertiajs/react';

export default function PsychologistProfile({ psychologist }) {
    const displayName = formatPsychologistName(psychologist);
    const location = formatPsychologistLocation(psychologist);
    const phoneHref = psychologist.phone ? `tel:${psychologist.phone.replace(/\s+/g, '')}` : null;
    const mapsHref = psychologist.address ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(psychologist.address)}` : null;
    const emailHref = psychologist.email ? `mailto:${psychologist.email}` : null;

    return (
        <>
            <Head title={`${displayName} - Detalii specialist`} />

            <main className="psychologist-detail-page">
                <div className="journal-footer">
                    <Link className="profile-action secondary" href="/psychologists">&larr; Inapoi la specialisti</Link>
                </div>

                <section className="card psychologist-detail-card">
                    <div className="psychologist-detail-head">
                        <div>
                            <div className="section-title">{displayName}</div>
                            <div className="psychologist-detail-badges">
                                <span className="badge badge-success">
                                    <FiCheck size={14} aria-hidden />
                                    Specialist verificat
                                </span>
                                {psychologist.supports_online ? <span className="badge badge-info">Online</span> : null}
                            </div>
                        </div>
                    </div>

                    {psychologist.details?.length ? (
                        <div className="psychologist-detail-sections">
                            {psychologist.details.map((item) => (
                                <section key={item.label} className="psychologist-detail-section">
                                    <div className="psychologist-detail-label">{item.label}</div>
                                    {item.value ? <p className="muted psychologist-detail-copy">{item.value}</p> : null}
                                    {item.values?.length ? (
                                        <div className="psychologists-specialties">
                                            {item.values.map((value) => (
                                                <span className="pill pill-muted" key={`${item.label}-${value}`}>
                                                    {value}
                                                </span>
                                            ))}
                                        </div>
                                    ) : null}
                                </section>
                            ))}
                        </div>
                    ) : (
                        <div className="muted psychologist-detail-copy">Nu exista momentan detalii profesionale suplimentare afisabile pentru acest specialist.</div>
                    )}

                    <div className="psychologist-detail-actions">
                        {phoneHref ? (
                            <a className="btn icon-only" href={phoneHref} aria-label={`Suna ${displayName}`}>
                                <FiPhone />
                            </a>
                        ) : null}
                        {mapsHref ? (
                            <a className="btn icon-only" href={mapsHref} target="_blank" rel="noopener noreferrer" aria-label={`Indicatii catre ${displayName}`}>
                                <FiSend />
                            </a>
                        ) : null}
                        {emailHref ? (
                            <a className="btn icon-only" href={emailHref} aria-label={`Trimite email catre ${displayName}`}>
                                <FiMail />
                            </a>
                        ) : null}
                        <Link className="btn primary" href={psychologist.slug ? `/appointments?psychologist=${psychologist.slug}` : '/psychologists'}>
                            Programeaza
                        </Link>
                    </div>

                    <div className="psychologists-meta">
                        {location ? (
                            <span className="psychologists-meta-item">
                                <FiMapPin /> {location}
                            </span>
                        ) : null}
                        {psychologist.details?.length ? (
                            <span className="psychologists-meta-item">
                                <FiInfo /> Informatii profesionale afisate fara identificatori numerici.
                            </span>
                        ) : null}
                    </div>
                </section>
            </main>
        </>
    );
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

PsychologistProfile.layout = (page) => <AppLayout>{page}</AppLayout>;
