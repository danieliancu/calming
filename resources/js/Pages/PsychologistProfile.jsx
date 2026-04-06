import AppLayout from '@/Layouts/AppLayout';
import { FiCheck, FiMail, FiMapPin, FiPhone, FiSend } from '@/lib/icons';
import { Head, Link, router } from '@inertiajs/react';

export default function PsychologistProfile({ psychologist }) {
    const displayName = formatPsychologistName(psychologist);
    const location = formatPsychologistLocation(psychologist);
    const phoneHref = psychologist.phone ? `tel:${psychologist.phone.replace(/\s+/g, '')}` : null;
    const hasOffice = Boolean(psychologist.address?.trim());
    const mapsHref = hasOffice ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(psychologist.address)}` : null;
    const emailHref = psychologist.email ? `mailto:${psychologist.email}` : null;
    const isImported = psychologist.recordType === 'import';

    return (
        <>
            <Head title={`${displayName} - Detalii specialist`} />

            <main className="psychologist-detail-page">
                <div className="journal-footer">
                    <button
                        className="profile-action secondary"
                        type="button"
                        onClick={() => {
                            if (window.history.length > 1) {
                                window.history.back();
                                return;
                            }

                            router.visit('/psychologists');
                        }}
                    >
                        &larr; Înapoi la specialiști
                    </button>
                </div>

                <section className="card psychologist-detail-card">
                    <div className="psychologist-detail-head">
                        <div>
                            <div className="section-title">{displayName}</div>
                            <div className="psychologist-detail-badges">
                                <span className={`badge ${isImported ? 'badge-info' : 'badge-success'}`}>
                                    <FiCheck size={14} aria-hidden />
                                    {isImported ? 'Specialist activ' : 'Specialist verificat'}
                                </span>
                                {psychologist.supports_online ? <span className="badge badge-info">Online</span> : null}
                                {hasOffice ? <span className="badge badge-info">Cabinet</span> : null}
                            </div>
                        </div>
                    </div>

                    {isImported ? (
                        <div className="psychologist-detail-sections">
                            <section className="psychologist-detail-section">
                                <div className="psychologist-detail-label">Detalii</div>
                                <div className="psychologist-import-grid psychologist-import-grid--details">
                                    <DetailField label="Nume" value={displayName} />
                                    <DetailField label="Telefon" value={psychologist.phone} href={phoneHref} />
                                    <DetailField label="Email" value={psychologist.email} href={emailHref} />
                                    <DetailField label="Cod personal" value={psychologist.rupaCode} />
                                    <DetailField label="Oraș" value={psychologist.city} />
                                </div>
                            </section>

                            <section className="psychologist-detail-section">
                                <div className="psychologist-detail-label">ATESTATE</div>
                                {psychologist.attestations?.length ? (
                                    <div className="psychologist-import-attestations">
                                        {psychologist.attestations.map((attestation) => (
                                            <article className="psychologist-import-attestation" key={attestation.id}>
                                                <div className="psychologist-import-grid">
                                                    <DetailField label="Specializare" value={attestation.specialization} strong />
                                                    <DetailField label="Treapta de specializare" value={attestation.professionalGrade} />
                                                    <DetailField label="Regim de practică" value={attestation.practiceRegime} />
                                                    <DetailField label="Vechime" value={attestation.experience} />
                                                    <DetailField label="Număr atestat" value={attestation.attestationNumber} />
                                                    <DetailField label="Data" value={attestation.issueDate} />
                                                    <DetailField label="Comisia de specialitate" value={attestation.specialtyCommission} />
                                                </div>
                                            </article>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="muted psychologist-detail-copy">Nu exista atestate disponibile pentru acest specialist.</div>
                                )}
                            </section>
                        </div>
                    ) : (
                        <div className="psychologist-detail-sections">
                            <section className="psychologist-detail-section">
                                <div className="psychologist-detail-label">Detalii</div>
                                <div className="psychologist-import-grid psychologist-import-grid--details">
                                    <DetailField label="Nume" value={displayName} />
                                    <DetailField label="Telefon" value={psychologist.phone} href={phoneHref} />
                                    <DetailField label="Email" value={psychologist.email} href={emailHref} />
                                    <DetailField label="Oras" value={psychologist.city} />
                                    <DetailField label="Adresa" value={psychologist.address} />
                                </div>
                            </section>

                            {psychologist.details?.length ? (
                                psychologist.details.map((item) => (
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
                                ))
                            ) : (
                                <div className="muted psychologist-detail-copy">Nu exista momentan detalii profesionale suplimentare afisabile pentru acest specialist.</div>
                            )}
                        </div>
                    )}

                    <div className="psychologist-detail-actions">
                        {!isImported ? (
                            <Link className="btn primary" href={psychologist.slug ? `/appointments?psychologist=${psychologist.slug}` : '/psychologists'}>
                                Programeaza
                            </Link>
                        ) : null}
                    </div>

                </section>
            </main>
        </>
    );
}

function DetailField({ label, value, href = null, strong = false }) {
    if (!value) {
        return null;
    }

    return (
        <div className="psychologist-import-field">
            <div className="psychologist-import-field__label">{label}</div>
            {href ? (
                <a className={`psychologist-import-field__value psychologist-import-field__link${strong ? ' psychologist-import-field__value--strong' : ''}`} href={href}>
                    {value}
                </a>
            ) : (
                <div className={`psychologist-import-field__value${strong ? ' psychologist-import-field__value--strong' : ''}`}>{value}</div>
            )}
        </div>
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
