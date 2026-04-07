import AppLayout from '@/Layouts/AppLayout';
import AccentCard from '@/Components/AccentCard';
import { DEFAULT_PSYCH_DASHBOARD_SECTION, normalizePsychDashboardSection, PSYCH_DASHBOARD_MENU_ITEMS } from '@/data/psychDashboardNav';
import { apiFetch } from '@/lib/http';
import { Head, Link, router, useForm, usePage } from '@inertiajs/react';
import { FiChevronRight, FiCopy, FiEdit2, FiExternalLink, FiEye, FiPlus, FiTrash2, FiUpload, FiX } from '@/lib/icons';
import { useEffect, useState } from 'react';

const AVAILABILITY_CALENDAR_DATE_KEY = 'psych-dashboard:selected-specific-date';

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
    appointmentTypes = [],
    availabilityRules = [],
    availabilityExceptions = [],
    initialAppointments = [],
}) {
    const page = usePage();
    const search = new URLSearchParams(page.url.split('?')[1] ?? '');
    const activeMenu = normalizePsychDashboardSection(search.get('section'));
    const signoutForm = useForm({});
    const deleteAccountForm = useForm({});
    const validationForm = useForm(buildValidationFormData(initialValidationDraft));
    const displayName = [initialProfile.title, initialProfile.name, initialProfile.surname].filter(Boolean).join(' ');
    const isValidated = Number(initialValidationStatus) === 1;
    const flashStatus = page.props.flash?.status;
    const reviewStatus = approvalStatus ?? 'draft';
    const [showNewAppointmentTypeForm, setShowNewAppointmentTypeForm] = useState(false);
    const [expandedAppointmentTypes, setExpandedAppointmentTypes] = useState([]);
    const today = new Date();
    const initialSpecificDate = readStoredSpecificDate() ?? formatDateInput(today);
    const initialSpecificDateObject = parseDateInput(initialSpecificDate) ?? today;
    const [availabilityMonth, setAvailabilityMonth] = useState(initialSpecificDateObject.getMonth());
    const [availabilityYear, setAvailabilityYear] = useState(initialSpecificDateObject.getFullYear());
    const [selectedSpecificDate, setSelectedSpecificDate] = useState(initialSpecificDate);
    const [copyMenuWeekday, setCopyMenuWeekday] = useState(null);
    const [copyTargets, setCopyTargets] = useState({});
    const [deleteAccountOpen, setDeleteAccountOpen] = useState(false);

    const gradeCodeById = Object.fromEntries(validationCatalog.grades.map((item) => [String(item.id), item.code]));
    const roleIdByNormalizedLabel = Object.fromEntries(validationCatalog.roles.map((item) => [item.label.toLowerCase(), item.id]));
    const fallbackRoleId = validationCatalog.roles.find((item) => item.code === 'alta_specializare')?.id ?? '';
    const weeklyAvailability = WEEKDAY_OPTIONS.map((day) => ({
        ...day,
        rules: availabilityRules.filter((item) => Number(item.weekday) === Number(day.value)),
    }));
    const calendarDays = buildMonthGrid(availabilityYear, availabilityMonth);
    const selectedDateObject = parseDateInput(selectedSpecificDate);
    const selectedDateWeekday = selectedDateObject ? getWeekdayValue(selectedDateObject) : null;
    const selectedDateBlockedIntervals = availabilityExceptions
        .filter((item) => item.date === selectedSpecificDate && item.is_available === false && item.start_time && item.end_time)
        .map((item) => `${item.start_time}-${item.end_time}`);
    const selectedDateWeeklyRules = selectedDateWeekday === null
        ? []
        : availabilityRules
            .filter((item) => Number(item.weekday) === selectedDateWeekday)
            .filter((item) => !selectedDateBlockedIntervals.includes(`${item.start_time}-${item.end_time}`))
            .sort((left, right) => String(left.start_time ?? '').localeCompare(String(right.start_time ?? '')));
    const selectedDateExceptions = availabilityExceptions
        .filter((item) => item.date === selectedSpecificDate && item.is_available !== false)
        .sort((left, right) => String(left.start_time ?? '').localeCompare(String(right.start_time ?? '')));

    useEffect(() => {
        if (typeof window === 'undefined' || !selectedSpecificDate) {
            return;
        }

        window.localStorage.setItem(AVAILABILITY_CALENDAR_DATE_KEY, selectedSpecificDate);
    }, [selectedSpecificDate]);

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

    const deleteValidationMessage = (messageId) => {
        router.delete(route('psychologists.validation.messages.destroy', messageId), {
            preserveScroll: true,
        });
    };

    const submitScheduleForm = (event, submit) => {
        event.preventDefault();
        const formData = new FormData(event.currentTarget);
        submit(normalizeSchedulePayload(formData), {
            preserveScroll: true,
        });
    };

    const autosaveScheduleForm = (event, submit) => {
        const form = event.currentTarget.form;
        if (!form) {
            return;
        }

        const formData = new FormData(form);
        submit(normalizeSchedulePayload(formData), {
            preserveScroll: true,
            preserveState: true,
        });
    };

    const deleteScheduleItem = (href, message = null) => {
        if (message && !window.confirm(message)) {
            return;
        }

        router.delete(href, {
            preserveScroll: true,
        });
    };

    const toggleAppointmentType = (typeId) => {
        setExpandedAppointmentTypes((current) => (
            current.includes(typeId)
                ? current.filter((item) => item !== typeId)
                : [...current, typeId]
        ));
    };

    const toggleCopyMenu = (weekday) => {
        setCopyMenuWeekday((current) => current === weekday ? null : weekday);
        setCopyTargets(
            Object.fromEntries(
                WEEKDAY_OPTIONS
                    .filter((item) => item.value !== String(weekday))
                    .map((item) => [item.value, false])
            )
        );
    };

    const shiftAvailabilityMonth = (delta) => {
        const next = new Date(availabilityYear, availabilityMonth + delta, 1);
        setAvailabilityMonth(next.getMonth());
        setAvailabilityYear(next.getFullYear());
    };

    const handleCopyAvailability = async (sourceWeekday) => {
        const sourceRules = availabilityRules.filter((item) => Number(item.weekday) === Number(sourceWeekday));
        const targetWeekdays = Object.entries(copyTargets)
            .filter(([, checked]) => checked)
            .map(([weekday]) => Number(weekday));

        if (targetWeekdays.length === 0) {
            setCopyMenuWeekday(null);
            return;
        }

        for (const targetWeekday of targetWeekdays) {
            const targetRules = availabilityRules.filter((item) => Number(item.weekday) === targetWeekday);

            for (const rule of targetRules) {
                await apiFetch(route('psychologists.availability-rules.destroy', rule.id), {
                    method: 'DELETE',
                });
            }

            for (const rule of sourceRules) {
                await apiFetch(route('psychologists.availability-rules.store'), {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        weekday: targetWeekday,
                        start_time: rule.start_time,
                        end_time: rule.end_time,
                        interval_minutes: rule.interval_minutes,
                        is_active: rule.is_active,
                    }),
                });
            }
        }

        setCopyMenuWeekday(null);
        router.reload({ preserveScroll: true, preserveState: false });
    };

    const addWeeklyAvailabilitySlot = async (weekday) => {
        await apiFetch(route('psychologists.availability-rules.store'), {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                weekday: Number(weekday),
                start_time: '09:00',
                end_time: '17:00',
                interval_minutes: 60,
                is_active: true,
            }),
        });

        router.reload({ preserveScroll: true, preserveState: false });
    };

    const addSpecificDateAvailabilitySlot = async () => {
        if (!selectedSpecificDate) {
            return;
        }

        const existingItems = availabilityExceptions
            .filter((item) => item.date === selectedSpecificDate && item.is_available !== false)
            .sort((left, right) => String(left.start_time ?? '').localeCompare(String(right.start_time ?? '')));
        const lastItem = existingItems.at(-1);
        const startTime = lastItem?.end_time || '09:00';
        const endTime = lastItem?.end_time ? addMinutesToTime(lastItem.end_time, 180) : '12:00';

        await apiFetch(route('psychologists.availability-exceptions.store'), {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                date: selectedSpecificDate,
                is_available: true,
                start_time: startTime,
                end_time: endTime,
                interval_minutes: 60,
                note: null,
            }),
        });

        router.reload({ preserveScroll: true, preserveState: false });
    };

    const createSpecificDateOverrideFromWeeklyRule = async (rule, overrides = {}) => {
        if (!selectedSpecificDate) {
            return;
        }

        await apiFetch(route('psychologists.availability-exceptions.store'), {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                date: selectedSpecificDate,
                is_available: true,
                start_time: overrides.start_time ?? rule.start_time,
                end_time: overrides.end_time ?? rule.end_time,
                interval_minutes: rule.interval_minutes || 60,
                note: null,
            }),
        });

        router.reload({ preserveScroll: true, preserveState: false });
    };

    const removeSpecificDateInterval = async (item, inherited = false) => {
        if (!selectedSpecificDate) {
            return;
        }

        if (inherited) {
            await apiFetch(route('psychologists.availability-exceptions.store'), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    date: selectedSpecificDate,
                    is_available: false,
                    start_time: item.start_time,
                    end_time: item.end_time,
                    interval_minutes: item.interval_minutes || 60,
                    note: null,
                }),
            });
        } else {
            await apiFetch(route('psychologists.availability-exceptions.destroy', item.id), {
                method: 'DELETE',
            });
        }

        router.reload({ preserveScroll: true, preserveState: false });
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
                                Bine ai revenit, {initialProfile.name || 'partener'}! Completează profilul profesional și atestatele pentru obținerea validării. Până la aprobare, poti accesa dashboard-ul, dar nu poți publica articole sau crea grupuri.
                            </p>
                        </div>
                    </AccentCard>
                ) : null}

                <div className="psych-dashboard">
                    <aside className="psych-menu">
                        <div className="psych-menu__header">
                            <div className="brand-sm">Calming Partners</div>
                            <div className="muted small">{displayName || 'Partener fără nume'}</div>
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
                        <button
                            type="button"
                            className="psych-menu__link settings-signout-card"
                            style={{ background: '#facc15', color: '#422006', borderColor: '#eab308' }}
                            onClick={() => signoutForm.post(route('psychologists.signout'))}
                        >
                            <span>Iesire cont</span>
                        </button>
                        <button
                            type="button"
                            className="psych-menu__link settings-signout-card"
                            style={{ background: '#dc2626', color: '#fff', borderColor: '#b91c1c' }}
                            onClick={() => setDeleteAccountOpen(true)}
                        >
                            <span>Stergere cont</span>
                        </button>
                    </aside>

                    <div className="psych-content">
                        {activeMenu === 'validation' ? (
                            <section className="card psych-card">
                                <div className={`section-title${isValidated ? ' success' : ''}`}>{isValidated ? 'Partener validat' : 'Validare partener'}</div>
                                <div className="info u-mt-3">
                                    Status curent validare: {reviewStatus === 'approved' ? 'aprobat' : reviewStatus === 'submitted' ? 'în așteptare' : reviewStatus === 'draft' ? 'în așteptare' : reviewStatus}.
                                </div>
                                {validationMessages.map((message) => (
                                    <div key={message.id} className="warning u-mt-3 list-item validation-message-card">
                                        <div>
                                            <strong>Mesaj Calming:</strong> {message.message}
                                        </div>
                                        <button
                                            className="icon-btn plain validation-message-dismiss"
                                            type="button"
                                            aria-label="Închide mesajul"
                                            onClick={() => deleteValidationMessage(message.id)}
                                        >
                                            <FiX size={14} />
                                        </button>
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
                                                <span>Ofer și ședințe online</span>
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
                                                        <button className="btn icon-only" type="button" onClick={() => removeAttestation(index)} aria-label={`Șterge atestatul ${index + 1}`}>
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
                                                        <span>Număr Atestat</span>
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
                                            {reviewStatus === 'approved' ? 'Retrimitere cerere validare' : reviewStatus === 'submitted' ? 'Cerere validare trimisă' : 'Cerere validare'}
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
                                        <p className="muted">Publică text original pentru secțiunea de articole Calming.</p>
                                    </div>
                                    <Link className={`btn btn-success${canManageContent ? '' : ' disabled'}`} href={canManageContent ? route('psychologists.articles.create') : '#'} onClick={(event) => { if (!canManageContent) { event.preventDefault(); } }}>
                                        Adaugă
                                    </Link>
                                </div>
                                {!canManageContent ? <div className="info u-mt-3">Publicarea de articole este activă doar după aprobarea validării profesionale.</div> : null}
                                {flashStatus ? <div className="info u-mt-3">{flashStatus}</div> : null}
                                {initialArticles.length ? (
                                    <ul className="simple-list u-mt-3">
                                        {initialArticles.map((item) => (
                                            <li key={item.id} className="simple-list__item">
                                                <div>
                                                    <div className="u-text-semibold">{item.title}</div>
                                                    <div className="simple-list__meta">
                                                        {`${item.tag || 'Fără tag'} - ${item.minutes ? `${item.minutes} min` : 'Durată indisponibilă'} - ${item.title}`}
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
                                                        <Link href={canManageContent ? route('psychologists.articles.edit', item.id) : '#'} className={`icon-btn${canManageContent ? '' : ' disabled'}`} aria-label="Editează articolul" onClick={(event) => { if (!canManageContent) { event.preventDefault(); } }}>
                                                            <FiEdit2 />
                                                        </Link>
                                                        <button className="icon-btn danger" type="button" onClick={() => deleteArticle(item.id)} aria-label="Șterge articolul" disabled={!canManageContent}>
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
                                        <p className="muted">Coordonează grupuri private sau publice pentru comunitatea ta.</p>
                                    </div>
                                    <Link className={`btn btn-success${canManageContent ? '' : ' disabled'}`} href={canManageContent ? route('psychologists.community.create') : '#'} onClick={(event) => { if (!canManageContent) { event.preventDefault(); } }}>
                                        Adaugă
                                    </Link>
                                </div>
                                {!canManageContent ? <div className="info u-mt-3">Gestionarea grupurilor este disponibilă doar după aprobarea validării profesionale.</div> : null}
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
                                                        <span className={`status-pill ${group.validation_status === 'approved' ? 'status-pill--valid' : 'status-pill--pending'}`}>
                                                            {group.validation_status === 'approved' ? 'Aprobat' : 'In review'}
                                                        </span>
                                                    </div>
                                                </div>
                                                <div className="article-list-actions">
                                                    <div className="article-actions">
                                                        <Link className="icon-btn" href={`/community/${group.slug}`} aria-label="Vezi grupul">
                                                            <FiEye />
                                                        </Link>
                                                        <Link className={`icon-btn${canManageContent ? '' : ' disabled'}`} href={canManageContent ? route('psychologists.community.edit', group.id) : '#'} aria-label="Editează grupul" onClick={(event) => { if (!canManageContent) { event.preventDefault(); } }}>
                                                            <FiEdit2 />
                                                        </Link>
                                                        <button className="icon-btn danger" type="button" onClick={() => deleteCommunityGroup(group.id)} aria-label="Șterge grupul" disabled={!canManageContent}>
                                                            <FiTrash2 />
                                                        </button>
                                                    </div>
                                                    <Link className={`btn${canManageContent ? '' : ' disabled'}`} href={canManageContent ? `/community/${group.slug}/conversatii` : '#'} onClick={(event) => { if (!canManageContent) { event.preventDefault(); } }}>Conversatii</Link>
                                                </div>
                                            </li>
                                        ))}
                                    </ul>
                                ) : <div className="muted u-mt-3">Nu ai creat încă niciun grup.</div>}
                            </section>
                        ) : null}

                        {activeMenu === 'schedule' ? (
                            <section className="card psych-card">
                                {!canManageContent ? <div className="info u-mt-3">Administrarea programărilor și a disponibilității este activă după aprobarea validării profesionale.</div> : null}
                                {flashStatus ? <div className="info u-mt-3">{flashStatus}</div> : null}

                                <div className="u-mt-4">
                                    <div className="section-title" style={{ marginBottom:"0" }}>Tipuri de ședință</div>
                                    <p className="muted">Configurează oferta publică afișată clienților pentru rezervări noi.</p>
                                    <form className="card subtle u-mt-3" onSubmit={(event) => submitScheduleForm(event, (payload, options) => router.post(route('psychologists.appointment-types.store'), payload, options))}>
                                        <div className="row wrap" style={{ alignItems: 'center', justifyContent: 'space-between', gap: '0.75rem' }}>
                                            <div className="row wrap" style={{ alignItems: 'center', gap: '0.75rem' }}>
                                                <button
                                                    className="superadmin-caret"
                                                    type="button"
                                                    aria-label={showNewAppointmentTypeForm ? 'Ascunde formularul' : 'Arata formularul'}
                                                    aria-expanded={showNewAppointmentTypeForm}
                                                    onClick={() => setShowNewAppointmentTypeForm((current) => !current)}
                                                >
                                                    <FiChevronRight
                                                        aria-hidden
                                                        style={{
                                                            transform: showNewAppointmentTypeForm ? 'rotate(90deg)' : 'rotate(0deg)',
                                                            transition: 'transform 0.2s ease',
                                                        }}
                                                    />
                                                </button>
                                                <div className="u-text-semibold">Adaugă tip nou de ședință</div>
                                            </div>
                                        </div>
                                        {showNewAppointmentTypeForm ? (
                                            <>
                                                <div className="form-grid u-mt-3">
                                                    <label>
                                                        <span>Denumire</span>
                                                        <input name="label" required />
                                                    </label>
                                                    <label>
                                                        <span>Durata (minute)</span>
                                                        <input name="duration_minutes" type="number" min="15" max="240" step="5" defaultValue="50" required />
                                                    </label>
                                                    <label>
                                                        <span>Pret</span>
                                                        <input name="price_amount" type="number" min="0" step="0.01" defaultValue="220" required />
                                                    </label>
                                                    <label>
                                                        <span>Desfasurare</span>
                                                        <select name="location_mode" defaultValue="both">
                                                            <option value="online">Online</option>
                                                            <option value="in_person">În cabinet</option>
                                                            <option value="both">Online sau în cabinet</option>
                                                        </select>
                                                    </label>
                                                    <label>
                                                        <span>Moneda</span>
                                                        <input name="currency" defaultValue="RON" maxLength="3" required />
                                                    </label>
                                                    <label className="checkbox-field">
                                                        <input name="is_active" type="checkbox" defaultChecked />
                                                        <span>Activ pentru rezervari noi</span>
                                                    </label>
                                                    <label className="checkbox-field">
                                                        <input name="is_paid_online" type="checkbox" defaultChecked />
                                                        <span>Plata online in platforma</span>
                                                    </label>
                                                </div>
                                                <div className="validation-actions">
                                                    <button className="btn btn-success" type="submit" disabled={!canManageContent}>Adaugă tip nou de ședință</button>
                                                </div>
                                            </>
                                        ) : null}
                                    </form>
                                    {appointmentTypes.length ? (
                                        <div className="grid u-gap-3 u-mt-3">
                                            {appointmentTypes.map((item) => (
                                                <form key={item.id} className="card subtle" onSubmit={(event) => submitScheduleForm(event, (payload, options) => router.put(route('psychologists.appointment-types.update', item.id), payload, options))}>
                                                    <div className="row wrap" style={{ alignItems: 'center', justifyContent: 'space-between', gap: '0.75rem' }}>
                                                        <div className="row wrap" style={{ alignItems: 'center', gap: '0.75rem' }}>
                                                            <button
                                                                className="superadmin-caret"
                                                                type="button"
                                                                aria-label={expandedAppointmentTypes.includes(item.id) ? 'Ascunde detalii' : 'Arata detalii'}
                                                                aria-expanded={expandedAppointmentTypes.includes(item.id)}
                                                                onClick={() => toggleAppointmentType(item.id)}
                                                            >
                                                                <FiChevronRight
                                                                    aria-hidden
                                                                    style={{
                                                                        transform: expandedAppointmentTypes.includes(item.id) ? 'rotate(90deg)' : 'rotate(0deg)',
                                                                        transition: 'transform 0.2s ease',
                                                                    }}
                                                                />
                                                            </button>
                                                            <div className="u-text-semibold">{item.label}</div>
                                                        </div>
                                                        <span className={`status-pill ${item.is_active ? 'status-pill--valid' : 'status-pill--pending'}`}>
                                                            {item.is_active ? 'Vizibil' : 'Ascuns'}
                                                        </span>
                                                    </div>
                                                    {expandedAppointmentTypes.includes(item.id) ? (
                                                        <>
                                                            <div className="form-grid u-mt-3">
                                                                <label>
                                                                    <span>Denumire</span>
                                                                    <input name="label" defaultValue={item.label} required />
                                                                </label>
                                                                <label>
                                                                    <span>Durata (minute)</span>
                                                                    <input name="duration_minutes" type="number" min="15" max="240" step="5" defaultValue={item.duration_minutes} required />
                                                                </label>
                                                                <label>
                                                                    <span>Pret</span>
                                                                    <input name="price_amount" type="number" min="0" step="0.01" defaultValue={item.price_amount} required />
                                                                </label>
                                                                <label>
                                                                    <span>Desfasurare</span>
                                                                    <select name="location_mode" defaultValue={item.location_mode}>
                                                                        <option value="online">Online</option>
                                                                        <option value="in_person">În cabinet</option>
                                                                        <option value="both">Online sau în cabinet</option>
                                                                    </select>
                                                                </label>
                                                                <label>
                                                                    <span>Moneda</span>
                                                                    <input name="currency" defaultValue={item.currency} maxLength="3" required />
                                                                </label>
                                                                <label className="checkbox-field">
                                                                    <input name="is_active" type="checkbox" defaultChecked={item.is_active} />
                                                                    <span>Activ</span>
                                                                </label>
                                                                <label className="checkbox-field">
                                                                    <input name="is_paid_online" type="checkbox" defaultChecked={item.is_paid_online} />
                                                                    <span>Plata online</span>
                                                                </label>
                                                            </div>
                                                            <div className="row wrap u-mt-3">
                                                                <span className="muted">{formatLocationModeLabel(item.location_mode)} · {formatMoney(item.price_amount, item.currency)} · {item.is_paid_online ? 'Plată online activă' : 'Plată în afara platformei'}</span>
                                                            </div>
                                                            <div className="validation-actions">
                                                                <button className="btn primary" type="submit" disabled={!canManageContent}>Salveaza</button>
                                                                <button className="btn" type="button" disabled={!canManageContent} onClick={() => deleteScheduleItem(route('psychologists.appointment-types.destroy', item.id), 'Ești sigur că vrei să ștergi acest tip de ședință?')}>
                                                                    Șterge
                                                                </button>
                                                            </div>
                                                        </>
                                                    ) : null}
                                                </form>
                                            ))}
                                        </div>
                                    ) : <div className="muted u-mt-3">Nu există tipuri de ședință configurate.</div>}
                                </div>

                                <div className="u-mt-5">
                                    <div className="section-title" style={{ marginTop:"20px", display:"inline-block", marginBottom:0 }}>Disponibilitate</div>
                                    <p className="muted">Programul saptamanal si ajustarile pentru zile specifice sunt administrate aici, cat mai simplu.</p>

                                    <div className="card subtle u-mt-3">
                                        <div className="section-title" style={{ marginBottom: '0.35rem' }}>Program saptamanal</div>
                                        <div className="muted">Apasa pe `Copy` pentru a duplica intervalele unei zile catre alte zile.</div>

                                        <div className="u-mt-3" style={{ display: 'grid', gap: '0.75rem' }}>
                                            {weeklyAvailability.map((day) => (
                                                <div key={day.value} style={{ position: 'relative', border: '1px solid rgba(15, 23, 42, 0.08)', borderRadius: '16px', padding: '1rem', background: '#fff' }}>
                                                    <div style={{ display: 'grid', gap: '0.75rem' }}>
                                                        <div
                                                            className="row wrap"
                                                            style={{ alignItems: 'center', gap: '0.75rem' }}
                                                        >
                                                            <div style={{ width: '74px', flexShrink: 0 }}>
                                                                <span className="status-pill status-pill--valid">{day.label}</span>
                                                            </div>

                                                            <div className="grow">
                                                                {day.rules.length ? (
                                                                    <form
                                                                        onSubmit={(event) => submitScheduleForm(event, (payload, options) => router.put(route('psychologists.availability-rules.update', day.rules[0].id), payload, options))}
                                                                        style={{ display: 'grid', gap: '0.5rem' }}
                                                                    >
                                                                        <input type="hidden" name="weekday" value={day.value} />
                                                                        <input type="hidden" name="interval_minutes" value={day.rules[0].interval_minutes} />
                                                                        <input type="hidden" name="is_active" value="1" />
                                                                        <div className="row wrap" style={{ alignItems: 'center', gap: '0.5rem' }}>
                                                                            <input className="schedule-time-input" name="start_time" type="time" defaultValue={day.rules[0].start_time} required style={{ maxWidth: '140px' }} onChange={(event) => autosaveScheduleForm(event, (payload, options) => router.put(route('psychologists.availability-rules.update', day.rules[0].id), payload, options))} />
                                                                            <span className="muted">-</span>
                                                                            <input className="schedule-time-input" name="end_time" type="time" defaultValue={day.rules[0].end_time} required style={{ maxWidth: '140px' }} onChange={(event) => autosaveScheduleForm(event, (payload, options) => router.put(route('psychologists.availability-rules.update', day.rules[0].id), payload, options))} />
                                                                            <button
                                                                                className="icon-btn plain danger"
                                                                                type="button"
                                                                                disabled={!canManageContent}
                                                                                onClick={() => deleteScheduleItem(route('psychologists.availability-rules.destroy', day.rules[0].id))}
                                                                                title="Șterge intervalul"
                                                                                aria-label="Șterge intervalul"
                                                                            >
                                                                                <FiX />
                                                                            </button>
                                                                        </div>
                                                                    </form>
                                                                ) : (
                                                                    <div className="muted" style={{ paddingTop: '0.15rem' }}>Indisponibil</div>
                                                                )}
                                                            </div>

                                                            <div className="row wrap" style={{ gap: '0.5rem' }}>
                                                                <button
                                                                    className="icon-btn"
                                                                    type="button"
                                                                    disabled={!canManageContent}
                                                                    onClick={() => addWeeklyAvailabilitySlot(day.value)}
                                                                    title="Adaugă interval"
                                                                    aria-label="Adaugă interval"
                                                                >
                                                                    <FiPlus />
                                                                </button>
                                                                <button
                                                                    className="icon-btn"
                                                                    type="button"
                                                                    disabled={!canManageContent}
                                                                    onClick={() => toggleCopyMenu(day.value)}
                                                                    title="Copiaza intervalele"
                                                                    aria-label="Copiaza intervalele"
                                                                >
                                                                    <FiCopy />
                                                                </button>
                                                            </div>
                                                        </div>

                                                        {day.rules.slice(1).map((rule) => (
                                                            <div key={rule.id} style={{ paddingLeft: '85px' }}>
                                                                <form
                                                                    onSubmit={(event) => submitScheduleForm(event, (payload, options) => router.put(route('psychologists.availability-rules.update', rule.id), payload, options))}
                                                                    style={{ display: 'grid', gap: '0.5rem' }}
                                                                >
                                                                    <input type="hidden" name="weekday" value={day.value} />
                                                                    <input type="hidden" name="interval_minutes" value={rule.interval_minutes} />
                                                                    <input type="hidden" name="is_active" value="1" />
                                                                    <div className="row wrap" style={{ alignItems: 'center', gap: '0.5rem' }}>
                                                                        <input className="schedule-time-input" name="start_time" type="time" defaultValue={rule.start_time} required style={{ maxWidth: '140px' }} onChange={(event) => autosaveScheduleForm(event, (payload, options) => router.put(route('psychologists.availability-rules.update', rule.id), payload, options))} />
                                                                        <span className="muted">-</span>
                                                                        <input className="schedule-time-input" name="end_time" type="time" defaultValue={rule.end_time} required style={{ maxWidth: '140px' }} onChange={(event) => autosaveScheduleForm(event, (payload, options) => router.put(route('psychologists.availability-rules.update', rule.id), payload, options))} />
                                                                        <button
                                                                            className="icon-btn plain danger"
                                                                            type="button"
                                                                            disabled={!canManageContent}
                                                                            onClick={() => deleteScheduleItem(route('psychologists.availability-rules.destroy', rule.id))}
                                                                            title="Șterge intervalul"
                                                                            aria-label="Șterge intervalul"
                                                                        >
                                                                            <FiX />
                                                                        </button>
                                                                    </div>
                                                                </form>
                                                            </div>
                                                        ))}
                                                    </div>

                                                    {copyMenuWeekday === day.value ? (
                                                        <div className="card subtle" style={{ marginTop: '0.75rem', padding: '1rem', maxWidth: '280px' }}>
                                                            <div className="muted" style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Copy times to...</div>
                                                            <div style={{ display: 'grid', gap: '0.5rem', marginTop: '0.75rem' }}>
                                                                {WEEKDAY_OPTIONS.map((option) => (
                                                                    <label key={option.value} className="copy-checkbox-row" style={{ opacity: option.value === day.value ? 0.55 : 1 }}>
                                                                        <span>{option.label}</span>
                                                                        <input
                                                                            type="checkbox"
                                                                            checked={option.value === day.value ? false : Boolean(copyTargets[option.value])}
                                                                            disabled={option.value === day.value}
                                                                            onChange={(event) => setCopyTargets((current) => ({ ...current, [option.value]: event.target.checked }))}
                                                                        />
                                                                    </label>
                                                                ))}
                                                            </div>
                                                            <div className="validation-actions" style={{ marginTop: '1rem' }}>
                                                                <button className="btn primary" type="button" disabled={!canManageContent} onClick={() => handleCopyAvailability(day.value)}>Apply</button>
                                                            </div>
                                                        </div>
                                                    ) : null}
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="card subtle u-mt-4">
                                        <div className="row wrap" style={{ alignItems: 'center', justifyContent: 'space-between', gap: '0.75rem' }}>
                                            <div>
                                            <div className="section-title" style={{ marginBottom: '0.35rem' }}>Ajustare ore pentru zile specifice</div>
                                            <div className="muted">Selectează o dată din calendar și definește ore speciale sau blocări pentru acea zi.</div>
                                            </div>
                                            <div className="row wrap" style={{ gap: '0.5rem' }}>
                                                <button className="btn" type="button" onClick={() => shiftAvailabilityMonth(-1)}>&lt;</button>
                                                <div className="u-text-semibold" style={{ minWidth: '170px', textAlign: 'center' }}>{formatCalendarMonth(availabilityYear, availabilityMonth)}</div>
                                                <button className="btn" type="button" onClick={() => shiftAvailabilityMonth(1)}>&gt;</button>
                                            </div>
                                        </div>

                                        <div className="u-mt-3" style={{ display: 'grid', gridTemplateColumns: 'repeat(7, minmax(0, 1fr))', gap: '0.5rem' }}>
                                            {CALENDAR_WEEKDAYS.map((day) => (
                                                <div key={day} className="muted" style={{ textAlign: 'center', fontSize: '0.75rem', textTransform: 'uppercase' }}>{day}</div>
                                            ))}
                                            {calendarDays.map((day, index) => {
                                                const dateKey = formatDateInput(day);
                                                const isCurrentMonth = day.getMonth() === availabilityMonth;
                                                const isSelected = selectedSpecificDate === dateKey;
                                                const hasAdjustments = availabilityExceptions.some((item) => item.date === dateKey);

                                                return (
                                                    <button
                                                        key={`${dateKey}-${index}`}
                                                        type="button"
                                                        className={`btn ${isSelected ? 'primary' : ''}`}
                                                        style={{ opacity: isCurrentMonth ? 1 : 0.4, minHeight: '44px', borderRadius: '999px', position: 'relative' }}
                                                        onClick={() => setSelectedSpecificDate(dateKey)}
                                                    >
                                                        {day.getDate()}
                                                        {hasAdjustments ? <span style={{ position: 'absolute', top: '6px', right: '8px', width: '8px', height: '8px', borderRadius: '999px', background: 'var(--primary-600)' }} /> : null}
                                                    </button>
                                                );
                                            })}
                                        </div>

                                        <div className="u-mt-4">
                                            <div className="row wrap" style={{ alignItems: 'center', justifyContent: 'space-between', gap: '0.75rem' }}>
                                                <div>
                                                    <div className="u-text-semibold">{formatSelectedDateLabel(selectedSpecificDate)}</div>
                                                    <div className="muted">Ore specifice pentru data selectată.</div>
                                                </div>
                                                <button className="icon-btn" type="button" disabled={!canManageContent} onClick={addSpecificDateAvailabilitySlot} title="Adaugă interval" aria-label="Adaugă interval">
                                                    <FiPlus />
                                                </button>
                                            </div>

                                            {selectedDateExceptions.length ? (
                                                <div className="u-mt-3" style={{ display: 'grid', gap: '0.75rem' }}>
                                                    {selectedDateExceptions.map((item) => (
                                                        <form key={item.id} className="card subtle" onSubmit={(event) => submitScheduleForm(event, (payload, options) => router.put(route('psychologists.availability-exceptions.update', item.id), payload, options))}>
                                                            <input type="hidden" name="date" value={item.date} />
                                                            <div className="row wrap" style={{ alignItems: 'center', gap: '0.5rem' }}>
                                                                <input type="hidden" name="is_available" value="1" />
                                                                <input className="schedule-time-input" name="start_time" type="time" defaultValue={item.start_time} style={{ maxWidth: '140px' }} onChange={(event) => autosaveScheduleForm(event, (payload, options) => router.put(route('psychologists.availability-exceptions.update', item.id), payload, options))} />
                                                                <span className="muted">-</span>
                                                                <input className="schedule-time-input" name="end_time" type="time" defaultValue={item.end_time} style={{ maxWidth: '140px' }} onChange={(event) => autosaveScheduleForm(event, (payload, options) => router.put(route('psychologists.availability-exceptions.update', item.id), payload, options))} />
                                                                <input name="interval_minutes" type="hidden" value={item.interval_minutes || ''} />
                                                                <button className="icon-btn plain danger" type="button" disabled={!canManageContent} onClick={() => removeSpecificDateInterval(item)} title="Șterge intervalul" aria-label="Șterge intervalul"><FiX /></button>
                                                            </div>
                                                            <input type="hidden" name="note" value={item.note ?? ''} />
                                                        </form>
                                                    ))}
                                                </div>
                                            ) : selectedDateWeeklyRules.length ? (
                                                <div className="u-mt-3" style={{ display: 'grid', gap: '0.75rem' }}>
                                                    {selectedDateWeeklyRules.map((item) => (
                                                        <form key={`weekly-${item.id}`} className="card subtle" style={{ opacity: 0.88 }}>
                                                            <div className="row wrap" style={{ alignItems: 'center', gap: '0.5rem' }}>
                                                                <input
                                                                    className="schedule-time-input"
                                                                    type="time"
                                                                    defaultValue={item.start_time}
                                                                    style={{ maxWidth: '140px' }}
                                                                    onChange={(event) => createSpecificDateOverrideFromWeeklyRule(item, { start_time: event.target.value })}
                                                                />
                                                                <span className="muted">-</span>
                                                                <input
                                                                    className="schedule-time-input"
                                                                    type="time"
                                                                    defaultValue={item.end_time}
                                                                    style={{ maxWidth: '140px' }}
                                                                    onChange={(event) => createSpecificDateOverrideFromWeeklyRule(item, { end_time: event.target.value })}
                                                                />
                                                                <button
                                                                    className="icon-btn plain danger"
                                                                    type="button"
                                                                    disabled={!canManageContent}
                                                                    onClick={() => removeSpecificDateInterval(item, true)}
                                                                    title="Șterge intervalul"
                                                                    aria-label="Șterge intervalul"
                                                                >
                                                                    <FiX />
                                                                </button>
                                                            </div>
                                                            <div className="muted u-mt-2">Interval preluat din Program săptămânal. Prima modificare îl transformă în override pentru această zi.</div>
                                                        </form>
                                                    ))}
                                                </div>
                                            ) : <div className="muted u-mt-3">Nu există intervale salvate pentru această zi.</div>}
                                        </div>
                                    </div>
                                </div>

                                <div className="u-mt-5">
                                    <div className="section-title">Programări reale</div>
                                    {initialAppointments.length ? (
                                        <div className="grid u-gap-3 u-mt-3">
                                            {initialAppointments.map((appointment) => (
                                                <form key={appointment.id} className="card subtle" onSubmit={(event) => submitScheduleForm(event, (payload, options) => router.post(route('psychologists.appointments.status', appointment.id), payload, options))}>
                                                    <div className="row wrap">
                                                        <div className="grow">
                                                            <div className="u-text-semibold">{appointment.client}</div>
                                                            <div className="simple-list__meta">{appointment.date} · {appointment.slot}</div>
                                                            <div className="simple-list__meta">{appointment.type} · {formatLocationModeLabel(appointment.location_mode)}</div>
                                                            <div className="simple-list__meta">{formatMoney(appointment.price_total, appointment.currency)} · {formatPaymentStatusLabel(appointment.payment_status)}</div>
                                                            {appointment.expires_at && appointment.status === 'pending' ? <div className="simple-list__meta">Expiră la {appointment.expires_at}</div> : null}
                                                        </div>
                                                        <span className={`status-pill ${appointment.status === 'confirmed' ? 'status-pill--valid' : appointment.status === 'pending' ? 'status-pill--pending' : 'status-pill--danger'}`}>
                                                            {formatAppointmentStatusLabel(appointment.status)}
                                                        </span>
                                                    </div>
                                                    <div className="form-grid u-mt-3">
                                                        <label>
                                                            <span>Status</span>
                                                            <select name="status" defaultValue={appointment.status}>
                                                                {APPOINTMENT_STATUS_OPTIONS.map((option) => (
                                                                    <option key={option.value} value={option.value}>{option.label}</option>
                                                                ))}
                                                            </select>
                                                        </label>
                                                        <label>
                                                            <span>Reminder email</span>
                                                            <select
                                                                name="psychologist_reminder_minutes"
                                                                defaultValue={appointment.psychologist_reminder_minutes ? String(appointment.psychologist_reminder_minutes) : 'none'}
                                                                onChange={(event) => router.post(route('psychologists.appointments.reminder', appointment.id), {
                                                                    minutes_before: event.target.value === 'none' ? null : event.target.value,
                                                                }, {
                                                                    preserveScroll: true,
                                                                })}
                                                            >
                                                                {REMINDER_OPTIONS.map((option) => (
                                                                    <option key={option.value} value={option.value}>{option.label}</option>
                                                                ))}
                                                            </select>
                                                        </label>
                                                    </div>
                                                    <div className="validation-actions">
                                                        <button className="btn primary" type="submit" disabled={!canManageContent || !appointment.can_manage}>Actualizează statusul</button>
                                                    </div>
                                                </form>
                                            ))}
                                        </div>
                                    ) : <div className="muted u-mt-3">Nu există programări înregistrate.</div>}
                                </div>
                            </section>
                        ) : null}
                    </div>
                </div>
            </div>
            {deleteAccountOpen ? (
                <div className="modal-root" role="dialog" aria-modal="true" aria-label="Stergere cont specialist">
                    <div className="modal-backdrop" onClick={() => !deleteAccountForm.processing && setDeleteAccountOpen(false)} />
                    <div className="modal-center">
                        <section className="card psych-card superadmin-modal">
                            <div className="row" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
                                <div>
                                    <h2 className="u-m-0">Esti sigur ca vrei sa renunti la cont?</h2>
                                </div>
                                <button type="button" className="close" aria-label="Inchide" onClick={() => setDeleteAccountOpen(false)} disabled={deleteAccountForm.processing}>
                                    <FiX />
                                </button>
                            </div>
                            <p className="muted u-mt-3">
                                Aceasta actiune iti va elmina datele personale din lista de psihologi verificati.
                            </p>
                            <div className="validation-actions u-mt-4">
                                <button className="btn" type="button" onClick={() => setDeleteAccountOpen(false)} disabled={deleteAccountForm.processing}>
                                    Inchide
                                </button>
                                <button
                                    className="btn danger"
                                    type="button"
                                    disabled={deleteAccountForm.processing}
                                    onClick={() => deleteAccountForm.delete(route('psychologists.account.destroy'))}
                                >
                                    {deleteAccountForm.processing ? 'Se sterge...' : 'Stergere cont'}
                                </button>
                            </div>
                        </section>
                    </div>
                </div>
            ) : null}
        </>
    );
}

const WEEKDAY_OPTIONS = [
    { value: '0', label: 'Luni' },
    { value: '1', label: 'Marti' },
    { value: '2', label: 'Miercuri' },
    { value: '3', label: 'Joi' },
    { value: '4', label: 'Vineri' },
    { value: '5', label: 'Sambata' },
    { value: '6', label: 'Duminica' },
];

const APPOINTMENT_STATUS_OPTIONS = [
    { value: 'confirmed', label: 'Confirmata' },
    { value: 'declined_by_psychologist', label: 'Respinsa de specialist' },
    { value: 'cancelled_by_psychologist', label: 'Anulata de specialist' },
    { value: 'completed', label: 'Finalizata' },
    { value: 'no_show', label: 'Neonorata' },
];
const REMINDER_OPTIONS = [
    { value: '1440', label: '24h inainte' },
    { value: '120', label: '2h inainte' },
    { value: '30', label: '30m inainte' },
    { value: 'none', label: 'Fără reminder' },
];

const CALENDAR_WEEKDAYS = ['Du', 'Lu', 'Ma', 'Mi', 'Jo', 'Vi', 'Sa'];

function buildMonthGrid(year, month) {
    const firstDay = new Date(year, month, 1);
    const start = new Date(firstDay);
    start.setDate(firstDay.getDate() - firstDay.getDay());
    const cells = [];

    for (let index = 0; index < 42; index += 1) {
        const item = new Date(start);
        item.setDate(start.getDate() + index);
        cells.push(item);
    }

    return cells;
}

function formatDateInput(date) {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function parseDateInput(value) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(String(value ?? ''))) {
        return null;
    }

    const [year, month, day] = value.split('-').map(Number);
    const date = new Date(year, (month || 1) - 1, day || 1);

    return Number.isNaN(date.getTime()) ? null : date;
}

function readStoredSpecificDate() {
    if (typeof window === 'undefined') {
        return null;
    }

    const value = window.localStorage.getItem(AVAILABILITY_CALENDAR_DATE_KEY);

    return parseDateInput(value) ? value : null;
}

function getWeekdayValue(date) {
    const weekday = date.getDay();

    return weekday === 0 ? 6 : weekday - 1;
}

function formatCalendarMonth(year, month) {
    return new Intl.DateTimeFormat('ro-RO', { month: 'long', year: 'numeric' }).format(new Date(year, month, 1));
}

function formatSelectedDateLabel(value) {
    if (!value) {
        return 'Selecteaza o data';
    }

    const [year, month, day] = value.split('-').map(Number);
    const date = new Date(year, (month || 1) - 1, day || 1);

    return new Intl.DateTimeFormat('ro-RO', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }).format(date);
}

function addMinutesToTime(value, minutesToAdd) {
    const [hours, minutes] = String(value ?? '09:00').split(':').map((item) => Number(item));
    const totalMinutes = Math.min((hours * 60) + minutes + minutesToAdd, (23 * 60) + 59);
    const nextHours = Math.floor(totalMinutes / 60);
    const nextMinutes = totalMinutes % 60;

    return `${String(nextHours).padStart(2, '0')}:${String(nextMinutes).padStart(2, '0')}`;
}

function normalizeSchedulePayload(formData) {
    const payload = {};

    for (const [key, value] of formData.entries()) {
        payload[key] = typeof value === 'string' ? value.trim() : value;
    }

    if ('duration_minutes' in payload) {
        payload.duration_minutes = Number(payload.duration_minutes);
    }

    if ('price_amount' in payload) {
        payload.price_amount = Number(payload.price_amount);
    }

    if ('interval_minutes' in payload) {
        payload.interval_minutes = payload.interval_minutes === '' ? null : Number(payload.interval_minutes);
    }

    if ('weekday' in payload) {
        payload.weekday = Number(payload.weekday);
    }

    if ('is_available' in payload) {
        payload.is_available = payload.is_available === '1';
    }

    if ('is_active' in payload) {
        payload.is_active = true;
    } else {
        payload.is_active = false;
    }

    if ('is_paid_online' in payload) {
        payload.is_paid_online = true;
    } else if ('price_amount' in payload) {
        payload.is_paid_online = false;
    }

    if (payload.note === '') {
        payload.note = null;
    }

    if (payload.start_time === '') {
        payload.start_time = null;
    }

    if (payload.end_time === '') {
        payload.end_time = null;
    }

    return payload;
}

function formatLocationModeLabel(value) {
    switch (value) {
        case 'online':
            return 'Online';
        case 'in_person':
            return 'În cabinet';
        case 'both':
            return 'Online sau în cabinet';
        default:
            return value || 'Nespecificat';
    }
}

function formatAppointmentStatusLabel(value) {
    switch (value) {
        case 'pending':
            return 'În așteptare';
        case 'confirmed':
            return 'Confirmată';
        case 'declined_by_psychologist':
            return 'Respinsă de specialist';
        case 'cancelled_by_user':
            return 'Anulată de client';
        case 'cancelled_by_psychologist':
            return 'Anulată de specialist';
        case 'completed':
            return 'Finalizată';
        case 'no_show':
            return 'Neonorată';
        case 'expired':
            return 'Expirată';
        default:
            return value;
    }
}

function formatPaymentStatusLabel(value) {
    switch (value) {
        case 'authorization_pending':
            return 'Plata in pregatire';
        case 'authorized':
            return 'Plata autorizata';
        case 'captured':
            return 'Plata capturata';
        case 'voided':
            return 'Autorizare anulata';
        case 'refunded':
            return 'Refund procesat';
        case 'not_required':
            return 'Fără plată online';
        default:
            return value || 'Fără plată';
    }
}

function formatMoney(value, currency = 'RON') {
    return new Intl.NumberFormat('ro-RO', {
        style: 'currency',
        currency: currency || 'RON',
        minimumFractionDigits: 2,
    }).format(Number(value || 0));
}

PsychologistDashboard.layout = (page) => <AppLayout>{page}</AppLayout>;
