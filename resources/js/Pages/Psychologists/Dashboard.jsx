import AppLayout from '@/Layouts/AppLayout';
import SignOutAction from '@/Components/SignOutAction';
import AccentCard from '@/Components/AccentCard';
import { DEFAULT_PSYCH_DASHBOARD_SECTION, normalizePsychDashboardSection, PSYCH_DASHBOARD_MENU_ITEMS } from '@/data/psychDashboardNav';
import { Head, Link, router, useForm, usePage } from '@inertiajs/react';
import { FiEdit2, FiExternalLink, FiEye, FiPlus, FiTrash2, FiUpload } from '@/lib/icons';

function attestationDraft(attestation = {}) {
    return {
        form_key: attestation.form_key ?? `att-${Math.random().toString(36).slice(2, 10)}`,
        professional_grade_id: attestation.professional_grade_id ?? '',
        practice_regime: attestation.practice_regime ?? 'supervizare',
        license_number: attestation.license_number ?? '',
        license_issue_date: attestation.license_issue_date ?? '',
        specialty_commission: attestation.specialty_commission ?? '',
        specialization: attestation.specializations?.[0] ?? '',
    };
}

function buildValidationFormData(initialValidationDraft) {
    return {
        intent: 'draft',
        entity_type_id: initialValidationDraft?.entity_type_id ?? '',
        first_name: initialValidationDraft?.first_name ?? '',
        last_name: initialValidationDraft?.last_name ?? '',
        professional_email: initialValidationDraft?.professional_email ?? '',
        phone: initialValidationDraft?.phone ?? '',
        rupa_code: initialValidationDraft?.rupa_code ?? '',
        supports_online: Boolean(initialValidationDraft?.supports_online),
        city_mode: initialValidationDraft?.city_mode ?? 'other',
        city: initialValidationDraft?.city ?? '',
        county: initialValidationDraft?.county ?? '',
        sector: initialValidationDraft?.sector ?? '',
        address: initialValidationDraft?.address ?? '',
        competencies: initialValidationDraft?.competencies ?? '',
        public_bio: initialValidationDraft?.public_bio ?? '',
        documents: [],
        existing_documents: initialValidationDraft?.documents ?? [],
        attestations: (initialValidationDraft?.attestations?.length ? initialValidationDraft.attestations : [{}]).map(attestationDraft),
    };
}

export default function PsychologistDashboard({
    initialProfile,
    initialValidationStatus,
    approvalStatus,
    reviewerNotes,
    validationMessages = [],
    canManageContent,
    initialValidationDraft,
    validationCatalog,
    initialArticles = [],
    initialGroups = [],
    initialAppointments = [],
}) {
    const page = usePage();
    const search = new URLSearchParams(page.url.split('?')[1] ?? '');
    const activeMenu = normalizePsychDashboardSection(search.get('section'));
    const signoutForm = useForm({});
    const validationForm = useForm(buildValidationFormData(initialValidationDraft));
    const displayName = [initialProfile.title, initialProfile.name, initialProfile.surname].filter(Boolean).join(' ');
    const isValidated = Number(initialValidationStatus) === 1;
    const flashStatus = page.props.flash?.status;
    const reviewStatus = approvalStatus ?? 'draft';

    const gradeCodeById = Object.fromEntries(validationCatalog.grades.map((item) => [String(item.id), item.code]));
    const roleIdByNormalizedLabel = Object.fromEntries(validationCatalog.roles.map((item) => [item.label.toLowerCase(), item.id]));
    const fallbackRoleId = validationCatalog.roles.find((item) => item.code === 'alta_specializare')?.id ?? '';

    const updateDashboardSection = (nextSection) => {
        const target = normalizePsychDashboardSection(nextSection);
        const nextSearch = new URLSearchParams(search);
        if (target === DEFAULT_PSYCH_DASHBOARD_SECTION) {
            nextSearch.delete('section');
        } else {
            nextSearch.set('section', target);
        }
        const query = nextSearch.toString();
        router.visit(query ? `${route('psychologists.dashboard')}?${query}` : route('psychologists.dashboard'), {
            preserveState: true,
            preserveScroll: true,
            replace: true,
        });
    };

    const setAttestationField = (index, field, value) => {
        validationForm.setData('attestations', validationForm.data.attestations.map((item, itemIndex) => {
            if (itemIndex !== index) {
                return item;
            }

            const next = { ...item, [field]: value };
            const gradeCode = gradeCodeById[String(next.professional_grade_id)] ?? '';
            if (gradeCode === 'specialist' || gradeCode === 'principal') {
                next.practice_regime = 'autonom';
            } else if (!next.practice_regime) {
                next.practice_regime = 'supervizare';
            }

            return next;
        }));
    };

    const addAttestation = () => {
        validationForm.setData('attestations', [...validationForm.data.attestations, attestationDraft()]);
    };

    const removeAttestation = (index) => {
        validationForm.setData('attestations', validationForm.data.attestations.filter((_, itemIndex) => itemIndex !== index));
    };

    const appendDocuments = (files) => {
        if (!files.length) {
            return;
        }

        validationForm.setData('documents', [...validationForm.data.documents, ...files]);
    };

    const removePendingDocument = (index) => {
        validationForm.setData('documents', validationForm.data.documents.filter((_, itemIndex) => itemIndex !== index));
    };

    const submitValidation = (event, intent = 'draft') => {
        event.preventDefault();
        validationForm.setData('intent', intent);
        validationForm.transform((data) => ({
            ...data,
            intent,
            entity_type_id: data.entity_type_id || null,
            rupa_code: data.rupa_code || null,
            city: data.city_mode === 'bucuresti' ? 'Bucuresti' : (data.city || null),
            county: data.county || null,
            sector: data.city_mode === 'bucuresti' ? (data.sector || null) : null,
            address: data.address || null,
            phone: data.phone || null,
            competencies: data.competencies || null,
            public_bio: data.public_bio || null,
            attestations: data.attestations.map((item) => ({
                professional_role_id: Number(roleIdByNormalizedLabel[item.specialization.trim().toLowerCase()] || fallbackRoleId || 0) || null,
                professional_grade_id: item.professional_grade_id ? Number(item.professional_grade_id) : null,
                practice_regime: item.practice_regime || 'supervizare',
                license_number: item.license_number || null,
                license_issue_date: item.license_issue_date || null,
                specialty_commission: item.specialty_commission || null,
                specialization: item.specialization,
            })),
        }));
        validationForm.post(route('psychologists.validation.update'), {
            preserveScroll: true,
            forceFormData: true,
        });
    };

    const deleteArticle = (articleId) => {
        if (!window.confirm('Esti sigur ca vrei sa stergi acest articol?')) {
            return;
        }

        router.delete(route('psychologists.articles.destroy', articleId), {
            preserveScroll: true,
        });
    };

    const deleteCommunityGroup = (groupId) => {
        if (!window.confirm('Esti sigur ca vrei sa stergi acest grup?')) {
            return;
        }

        router.delete(route('psychologists.community.destroy', groupId), {
            preserveScroll: true,
        });
    };

    return (
        <>
            <Head title="Dashboard specialist - Calming" />
            <div className="psych-wrapper">
                {!isValidated ? (
                    <AccentCard className="profile-card" dismissKey="psych-dashboard-validation-intro">
                        <div>
                            <p className="muted">Calming Partners</p>
                            <p>
                                Bine ai revenit, {initialProfile.name || 'partener'}! Completeaza profilul profesional si atestatele pentru obtinerea validarii. Pana la aprobare, poti accesa dashboard-ul, dar nu poti publica articole sau crea grupuri.
                            </p>
                        </div>
                    </AccentCard>
                ) : null}

                <div className="psych-dashboard">
                    <aside className="psych-menu">
                        <div className="psych-menu__header">
                            <div className="brand-sm">Calming Partners</div>
                            <div className="muted small">{displayName || 'Partener fara nume'}</div>
                        </div>
                        <nav className="psych-menu__nav">
                            {PSYCH_DASHBOARD_MENU_ITEMS.map((item) => {
                                const Icon = item.icon;
                                return (
                                    <button key={item.key} className={`psych-menu__link ${item.key === activeMenu ? 'active' : ''}`} type="button" onClick={() => updateDashboardSection(item.key)}>
                                        <span className="icon-shell"><Icon size={18} /></span>
                                        <span>{item.label}</span>
                                    </button>
                                );
                            })}
                        </nav>
                        <Link className="psych-menu__link" href="/">
                            <span className="icon-shell"><FiExternalLink size={18} /></span>
                            <span>Website</span>
                        </Link>
                        <SignOutAction className="psych-menu__link settings-signout-card" onClick={() => signoutForm.post(route('psychologists.signout'))} />
                    </aside>

                    <div className="psych-content">
                        {activeMenu === 'validation' ? (
                            <section className="card psych-card">
                                <div className={`section-title${isValidated ? ' success' : ''}`}>{isValidated ? 'Partener validat' : 'Validare partener'}</div>
                                <div className="info u-mt-3">
                                    Status curent validare: {reviewStatus === 'approved' ? 'aprobat' : reviewStatus === 'submitted' ? 'in review' : reviewStatus}.
                                </div>
                                {validationMessages.map((message) => (
                                    <div key={message.id} className="info u-mt-3">
                                        <strong>Mesaj superadmin:</strong> {message.message}
                                    </div>
                                ))}
                                {reviewStatus === 'rejected' && reviewerNotes ? <div className="error u-mt-3">{reviewerNotes}</div> : null}

                                {flashStatus ? <div className="info u-mt-3">{flashStatus}</div> : null}
                                {Object.keys(validationForm.errors).length ? <div className="error u-mt-3">{Object.values(validationForm.errors)[0]}</div> : null}

                                <form className="u-mt-4 validation-stack" onSubmit={(event) => submitValidation(event, 'draft')}>
                                    <div className="card subtle validation-panel">
                                        <div className="section-title validation-panel__title">Date Generale de Practică</div>
                                        <div className="form-grid">
                                            <label>
                                                <span>Nume (conform CI)</span>
                                                <input value={validationForm.data.last_name} onChange={(event) => validationForm.setData('last_name', event.target.value)} required />
                                            </label>
                                            <label>
                                                <span>Prenume (conform CI)</span>
                                                <input value={validationForm.data.first_name} onChange={(event) => validationForm.setData('first_name', event.target.value)} required />
                                            </label>
                                            <label>
                                                <span>Email Profesional</span>
                                                <input type="email" value={validationForm.data.professional_email} onChange={(event) => validationForm.setData('professional_email', event.target.value)} required />
                                            </label>
                                            <label>
                                                <span>Număr telefon</span>
                                                <input value={validationForm.data.phone} onChange={(event) => validationForm.setData('phone', event.target.value)}/>
                                            </label>
                                            <label>
                                                <span>Cod Personal RUPA</span>
                                                <input value={validationForm.data.rupa_code} onChange={(event) => validationForm.setData('rupa_code', event.target.value)} />
                                            </label>
                                            <label>
                                                <span>Localitate</span>
                                                <select value={validationForm.data.city_mode} onChange={(event) => validationForm.setData('city_mode', event.target.value)}>
                                                    <option value="bucuresti">București</option>
                                                    <option value="other">Altă localitate</option>
                                                </select>
                                            </label>
                                            {validationForm.data.city_mode === 'other' ? (
                                                <label>
                                                    <span>Altă localitate</span>
                                                    <input value={validationForm.data.city} onChange={(event) => validationForm.setData('city', event.target.value)} />
                                                </label>
                                            ) : null}
                                            <label>
                                                <span>{validationForm.data.city_mode === 'bucuresti' ? 'Sector' : 'Județ'}</span>
                                                {validationForm.data.city_mode === 'bucuresti' ? (
                                                    <select value={validationForm.data.sector} onChange={(event) => validationForm.setData('sector', event.target.value)}>
                                                        <option value="">Selectează</option>
                                                        <option value="Sector 1">Sector 1</option>
                                                        <option value="Sector 2">Sector 2</option>
                                                        <option value="Sector 3">Sector 3</option>
                                                        <option value="Sector 4">Sector 4</option>
                                                        <option value="Sector 5">Sector 5</option>
                                                        <option value="Sector 6">Sector 6</option>
                                                    </select>
                                                ) : (
                                                    <input value={validationForm.data.county} onChange={(event) => validationForm.setData('county', event.target.value)} />
                                                )}
                                            </label>
                                            <label>
                                                <span>Ofer si sedinte online</span>
                                                <select value={validationForm.data.supports_online ? 'da' : 'nu'} onChange={(event) => validationForm.setData('supports_online', event.target.value === 'da')}>
                                                    <option value="da">Da</option>
                                                    <option value="nu">Nu</option>
                                                </select>
                                            </label>
                                            <label className="span-2">
                                                <span>Adresă</span>
                                                <input value={validationForm.data.address} onChange={(event) => validationForm.setData('address', event.target.value)} />
                                            </label>
                                            <label className="checkbox-field">
                                                <input type="checkbox" checked={validationForm.data.supports_online} onChange={(event) => validationForm.setData('supports_online', event.target.checked)} />
                                                <span>Ofer și ședințe online</span>
                                            </label>
                                        </div>
                                    </div>

                                    <div className="validation-section-head">
                                        <div>
                                            <div className="section-title validation-panel__title">Atestate de Liberă Practică</div>
                                        </div>
                                        <button className="btn" type="button" onClick={addAttestation}>
                                            <FiPlus size={16} />
                                            <span>Adaugă alt atestat</span>
                                        </button>
                                    </div>

                                    {validationForm.data.attestations.map((attestation, index) => {
                                        const gradeCode = gradeCodeById[String(attestation.professional_grade_id)] ?? '';
                                        const regimeLocked = gradeCode === 'specialist' || gradeCode === 'principal';

                                        return (
                                            <div key={attestation.form_key} className="card subtle validation-panel">
                                                <div className="validation-attestation-head">
                                                    <div>
                                                        <div className="section-title validation-panel__title">Atestat {index + 1}</div>
                                                    </div>
                                                    {validationForm.data.attestations.length > 1 ? (
                                                        <button className="btn icon-only" type="button" onClick={() => removeAttestation(index)} aria-label={`Sterge atestatul ${index + 1}`}>
                                                            <FiTrash2 size={16} />
                                                        </button>
                                                    ) : null}
                                                </div>

                                                <div className="form-grid">
                                                    <label>
                                                        <span>Specializare</span>
                                                        <input value={attestation.specialization} onChange={(event) => setAttestationField(index, 'specialization', event.target.value)} required />
                                                    </label>
                                                    <label>
                                                        <span>Treaptă de Specializare</span>
                                                        <select value={attestation.professional_grade_id} onChange={(event) => setAttestationField(index, 'professional_grade_id', event.target.value)} required>
                                                            <option value="">Selectează</option>
                                                            {validationCatalog.grades.map((item) => (
                                                                <option key={item.id} value={item.id}>{item.label}</option>
                                                            ))}
                                                        </select>
                                                    </label>
                                                    <label>
                                                        <span>Regim de practică</span>
                                                        <select
                                                            value={regimeLocked ? 'autonom' : attestation.practice_regime}
                                                            onChange={(event) => setAttestationField(index, 'practice_regime', event.target.value)}
                                                            disabled={regimeLocked}
                                                        >
                                                            <option value="supervizare">Sub supervizare</option>
                                                            <option value="autonom">Autonom</option>
                                                        </select>
                                                    </label>
                                                    <label>
                                                        <span>Număr Certificat / Serie</span>
                                                        <input value={attestation.license_number} onChange={(event) => setAttestationField(index, 'license_number', event.target.value)} />
                                                    </label>
                                                    <label>
                                                        <span>Data Emiterii</span>
                                                        <input type="date" value={attestation.license_issue_date} onChange={(event) => setAttestationField(index, 'license_issue_date', event.target.value)} />
                                                    </label>
                                                    <label>
                                                        <span>Comisia de Specialitate</span>
                                                        <input value={attestation.specialty_commission} onChange={(event) => setAttestationField(index, 'specialty_commission', event.target.value)} />
                                                    </label>
                                                </div>
                                            </div>
                                        );
                                    })}

                                    <div className="card subtle validation-panel">
                                        <div className="section-title validation-panel__title">Profil Profesional & Competențe</div>
                                        <div className="form-grid">
                                            <label className="span-2">
                                                <span>Competențe și Formări</span>
                                                <textarea
                                                    value={validationForm.data.competencies}
                                                    onChange={(event) => validationForm.setData('competencies', event.target.value)}
                                                    placeholder='Ex: "Formare în Terapie Cognitiv-Comportamentală", "Expertiză în adicții"'
                                                />
                                            </label>
                                            <label className="span-2">
                                                <span>Observații Clinice / Descriere</span>
                                                <textarea
                                                    value={validationForm.data.public_bio}
                                                    onChange={(event) => validationForm.setData('public_bio', event.target.value)}
                                                    placeholder="Bio-ul care apare pe profilul public"
                                                />
                                            </label>
                                            <label className="span-2">
                                                <span>Încărcare Documente (opțional)</span>
                                                <input
                                                    type="file"
                                                    multiple
                                                    onChange={(event) => {
                                                        appendDocuments(Array.from(event.target.files ?? []));
                                                        event.target.value = '';
                                                    }}
                                                />
                                            </label>
                                        </div>

                                        {validationForm.data.documents.length ? (
                                            <div className="validation-documents">
                                                {validationForm.data.documents.map((document, index) => (
                                                    <div key={`${document.name}-${index}`} className="list-item">
                                                        <span className="row">
                                                            <FiUpload size={16} />
                                                            <span>{document.name}</span>
                                                        </span>
                                                        <button className="btn icon-only" type="button" onClick={() => removePendingDocument(index)} aria-label={`Elimină ${document.name}`}>
                                                            <FiTrash2 size={16} />
                                                        </button>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : null}

                                        {validationForm.data.existing_documents.length ? (
                                            <div className="validation-documents">
                                                {validationForm.data.existing_documents.map((document) => (
                                                    <a key={document.id} className="list-item" href={document.url} target="_blank" rel="noreferrer">
                                                        <span className="row">
                                                            <FiUpload size={16} />
                                                            <span>{document.name}</span>
                                                        </span>
                                                        <span className="muted">{document.mime_type || 'document'}</span>
                                                    </a>
                                                ))}
                                            </div>
                                        ) : null}
                                    </div>

                                    <div className="validation-actions">
                                        <button className="btn primary" type="submit" disabled={validationForm.processing}>
                                            {validationForm.processing ? 'Se salvează...' : 'Salvează'}
                                        </button>
                                        <button className="btn btn-success" type="button" onClick={(event) => submitValidation(event, 'submit')} disabled={validationForm.processing}>
                                            Cerere validare
                                        </button>
                                    </div>
                                </form>
                            </section>
                        ) : null}

                        {activeMenu === 'articles' ? (
                            <section className="card psych-card">
                                <div className="psych-section-head">
                                    <div>
                                        <div className="section-title">Articolele mele</div>
                                        <p className="muted">Publica resurse originale pentru biblioteca Calming.</p>
                                    </div>
                                    <Link className={`btn btn-success${canManageContent ? '' : ' disabled'}`} href={canManageContent ? route('psychologists.articles.create') : '#'} onClick={(event) => { if (!canManageContent) { event.preventDefault(); } }}>
                                        Adauga
                                    </Link>
                                </div>
                                {!canManageContent ? <div className="info u-mt-3">Publicarea de articole este activa doar dupa aprobarea validarii profesionale.</div> : null}
                                {flashStatus ? <div className="info u-mt-3">{flashStatus}</div> : null}
                                {initialArticles.length ? (
                                    <ul className="simple-list u-mt-3">
                                        {initialArticles.map((item) => (
                                            <li key={item.id} className="simple-list__item">
                                                <div>
                                                    <div className="u-text-semibold">{item.title}</div>
                                                    <div className="simple-list__meta">
                                                        {`${item.tag || 'Fara tag'} - ${item.minutes ? `${item.minutes} min` : 'Durata indisponibila'} - ${item.title}`}
                                                        <span className={`status-pill ${item.isValid ? 'status-pill--valid' : 'status-pill--pending'}`}>
                                                            {item.isValid ? 'Articol validat' : 'Asteapta validare'}
                                                        </span>
                                                    </div>
                                                </div>
                                                <div className="article-list-actions">
                                                    <div className="article-actions">
                                                        <Link
                                                            href={item.slug ? `/article/${item.slug}` : '#'}
                                                            className="icon-btn"
                                                            aria-label="Vezi articolul"
                                                            onClick={(event) => {
                                                                if (!item.slug) {
                                                                    event.preventDefault();
                                                                }
                                                            }}
                                                        >
                                                            <FiEye />
                                                        </Link>
                                                        <Link href={canManageContent ? route('psychologists.articles.edit', item.id) : '#'} className={`icon-btn${canManageContent ? '' : ' disabled'}`} aria-label="Editeaza articolul" onClick={(event) => { if (!canManageContent) { event.preventDefault(); } }}>
                                                            <FiEdit2 />
                                                        </Link>
                                                        <button className="icon-btn danger" type="button" onClick={() => deleteArticle(item.id)} aria-label="Sterge articolul" disabled={!canManageContent}>
                                                            <FiTrash2 />
                                                        </button>
                                                    </div>
                                                </div>
                                            </li>
                                        ))}
                                    </ul>
                                ) : <div className="muted u-mt-3">Nu ai articole publicate inca.</div>}
                            </section>
                        ) : null}

                        {activeMenu === 'community' ? (
                            <section className="card psych-card">
                                <div className="psych-section-head">
                                    <div>
                                        <div className="section-title">Grupurile mele de sprijin</div>
                                        <p className="muted">Coordoneaza grupuri private sau publice pentru comunitatea ta.</p>
                                    </div>
                                    <Link className={`btn btn-success${canManageContent ? '' : ' disabled'}`} href={canManageContent ? route('psychologists.community.create') : '#'} onClick={(event) => { if (!canManageContent) { event.preventDefault(); } }}>
                                        Adauga
                                    </Link>
                                </div>
                                {!canManageContent ? <div className="info u-mt-3">Gestionarea grupurilor este disponibila doar dupa aprobarea validarii profesionale.</div> : null}
                                {initialGroups.length ? (
                                    <ul className="simple-list u-mt-3">
                                        {initialGroups.map((group) => (
                                            <li key={group.id} className="simple-list__item">
                                                <div>
                                                    <div className="u-text-semibold">{group.name}</div>
                                                    <div className="simple-list__meta">
                                                        {group.members ?? 0} membri · {group.is_private ? 'Privat' : 'Public'}
                                                        <span className={`status-pill ${(group.last_active ?? '').toLowerCase() === 'acum' ? 'status-pill--valid' : 'status-pill--pending'}`}>
                                                            Activ {group.last_active ?? 'recent'}
                                                        </span>
                                                    </div>
                                                </div>
                                                <div className="article-list-actions">
                                                    <div className="article-actions">
                                                        <Link className="icon-btn" href={`/community/${group.slug}`} aria-label="Vezi grupul">
                                                            <FiEye />
                                                        </Link>
                                                        <Link className={`icon-btn${canManageContent ? '' : ' disabled'}`} href={canManageContent ? route('psychologists.community.edit', group.id) : '#'} aria-label="Editeaza grupul" onClick={(event) => { if (!canManageContent) { event.preventDefault(); } }}>
                                                            <FiEdit2 />
                                                        </Link>
                                                        <button className="icon-btn danger" type="button" onClick={() => deleteCommunityGroup(group.id)} aria-label="Sterge grupul" disabled={!canManageContent}>
                                                            <FiTrash2 />
                                                        </button>
                                                    </div>
                                                    <Link className={`btn${canManageContent ? '' : ' disabled'}`} href={canManageContent ? `/community/${group.slug}/conversatii` : '#'} onClick={(event) => { if (!canManageContent) { event.preventDefault(); } }}>Conversatii</Link>
                                                </div>
                                            </li>
                                        ))}
                                    </ul>
                                ) : <div className="muted u-mt-3">Nu ai creat inca niciun grup.</div>}
                            </section>
                        ) : null}

                        {activeMenu === 'schedule' ? (
                            <section className="card psych-card">
                                <div className="psych-section-head">
                                    <div>
                                        <div className="section-title">Programarile mele</div>
                                        <p className="muted">Vizualizeaza sesiunile confirmate si gestioneaza disponibilitatile.</p>
                                    </div>
                                </div>
                                {initialAppointments.length ? (
                                    <ul className="simple-list u-mt-3">
                                        {initialAppointments.map((appointment) => (
                                            <li key={appointment.id} className="simple-list__item">
                                                <div>
                                                    <div className="u-text-semibold">{appointment.client}</div>
                                                    <div className="simple-list__meta">{appointment.date} · {appointment.slot} · {appointment.status}</div>
                                                </div>
                                                <span className="muted">{appointment.type}</span>
                                            </li>
                                        ))}
                                    </ul>
                                ) : <div className="muted u-mt-3">Nu exista programari inregistrate.</div>}
                            </section>
                        ) : null}
                    </div>
                </div>
            </div>
        </>
    );
}

PsychologistDashboard.layout = (page) => <AppLayout>{page}</AppLayout>;
