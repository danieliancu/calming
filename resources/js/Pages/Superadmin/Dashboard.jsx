import AppLayout from '@/Layouts/AppLayout';
import { FiEdit2, FiPlus, FiTrash2, FiX } from '@/lib/icons';
import { Head, Link, router, useForm, usePage } from '@inertiajs/react';
import { Fragment, useState } from 'react';

function formatStatus(status) {
    if (status === 'approved') return 'APPROVED';
    if (status === 'submitted') return 'PENDING';
    if (status === 'rejected') return 'REJECTED';
    return 'DRAFT';
}

function formatDate(value) {
    if (!value) {
        return '-';
    }

    return new Intl.DateTimeFormat('ro-RO', {
        dateStyle: 'short',
        timeStyle: 'short',
    }).format(new Date(value));
}

function StatCard({ label, value, hint }) {
    return (
        <div className="superadmin-stat">
            <div className="superadmin-stat__label">{label}</div>
            <div className="superadmin-stat__value">{value}</div>
            <div className="superadmin-stat__hint">{hint}</div>
        </div>
    );
}

function DetailField({ label, value }) {
    return (
        <div className="superadmin-detail-field">
            <div className="superadmin-detail-field__label">{label}</div>
            <div className="superadmin-detail-field__value">{value || '-'}</div>
        </div>
    );
}

function formatRecipient(recipientType) {
    if (recipientType === 'guest') return 'GUEST';
    if (recipientType === 'user') return 'USER';
    return recipientType || '-';
}

export default function SuperadminDashboard({
    superadmin,
    stats,
    validationApplications = [],
    pendingArticles = [],
    categories = [],
    notificationTemplates = [],
    notificationEvents = [],
    notificationSummary = {},
}) {
    const page = usePage();
    const [activeTab, setActiveTab] = useState('specialists');
    const [profileOpen, setProfileOpen] = useState(false);
    const [expandedApplications, setExpandedApplications] = useState([]);
    const [messageModal, setMessageModal] = useState({ open: false, applicationId: null, specialistName: '' });
    const [categoryModal, setCategoryModal] = useState({ open: false, mode: 'create', category: null });
    const [notificationModal, setNotificationModal] = useState({ open: false, template: null });
    const profileForm = useForm({
        username: superadmin?.username ?? '',
        current_password: '',
        password: '',
        password_confirmation: '',
    });
    const messageForm = useForm({
        message: '',
    });
    const categoryForm = useForm({
        name: '',
        slug: '',
    });
    const notificationForm = useForm({
        default_title: '',
        default_body: '',
        audience: 'general',
        actor_type: 'both',
        category: 'product',
        icon: 'FiBell',
        icon_color: 'peach',
        priority: 3,
        cta_kind: '',
        cta_label: '',
        deep_link: '',
        is_repeatable: false,
        is_active: true,
    });
    const signoutForm = useForm({});
    const notificationOptions = {
        audience: ['general', 'authenticated'],
        actorType: ['guest', 'user', 'both'],
        categories: ['reminder', 'assistant', 'community', 'article', 'appointment', 'journal', 'milestone', 'profile', 'product', 'stats'],
        icons: ['FiBell', 'FiBookOpen', 'FiBookmark', 'FiCalendar', 'FiClock', 'FiHeart', 'FiMapPin', 'FiMessageCircle', 'FiMessageSquare', 'FiTrendingUp', 'FiUser', 'FiUsers', 'FiAward'],
        iconColors: ['rose', 'mint', 'lilac', 'amber', 'sky', 'peach', 'coral', 'indigo'],
        priorities: [1, 2, 3, 4, 5],
        ctaKinds: ['', 'open', 'save', 'snooze', 'disable'],
    };

    const submitProfile = (event) => {
        event.preventDefault();
        profileForm.post(route('superadmin.profile.update'), {
            preserveScroll: true,
            onSuccess: () => {
                profileForm.setData('current_password', '');
                profileForm.setData('password', '');
                profileForm.setData('password_confirmation', '');
                setProfileOpen(false);
            },
        });
    };

    const toggleApplication = (applicationId) => {
        setExpandedApplications((current) => (
            current.includes(applicationId)
                ? current.filter((id) => id !== applicationId)
                : [...current, applicationId]
        ));
    };

    const openMessageModal = (application) => {
        messageForm.setData('message', application.latest_message ?? '');
        messageForm.clearErrors();
        setMessageModal({
            open: true,
            applicationId: application.id,
            specialistName: application.name,
        });
    };

    const closeMessageModal = () => {
        if (messageForm.processing) {
            return;
        }

        setMessageModal({ open: false, applicationId: null, specialistName: '' });
        messageForm.setData('message', '');
        messageForm.clearErrors();
    };

    const submitMessage = (event) => {
        event.preventDefault();

        if (!messageModal.applicationId) {
            return;
        }

        messageForm.post(route('superadmin.validation.messages.store', messageModal.applicationId), {
            preserveScroll: true,
            onSuccess: () => {
                closeMessageModal();
            },
        });
    };

    const openCategoryModal = (category = null) => {
        categoryForm.clearErrors();
        categoryForm.setData({
            name: category?.name ?? '',
            slug: category?.slug ?? '',
        });
        setCategoryModal({
            open: true,
            mode: category ? 'edit' : 'create',
            category,
        });
    };

    const closeCategoryModal = () => {
        if (categoryForm.processing) {
            return;
        }

        setCategoryModal({ open: false, mode: 'create', category: null });
        categoryForm.clearErrors();
    };

    const openNotificationModal = (template) => {
        notificationForm.clearErrors();
        notificationForm.setData({
            default_title: template?.title ?? '',
            default_body: template?.body ?? '',
            audience: template?.audience ?? 'general',
            actor_type: template?.actor_type ?? 'both',
            category: template?.category ?? 'product',
            icon: template?.icon ?? 'FiBell',
            icon_color: template?.icon_color ?? 'peach',
            priority: template?.priority ?? 3,
            cta_kind: template?.cta_kind ?? '',
            cta_label: template?.cta_label ?? '',
            deep_link: template?.deep_link ?? '',
            is_repeatable: Boolean(template?.is_repeatable),
            is_active: Boolean(template?.is_active ?? true),
        });
        setNotificationModal({ open: true, template });
    };

    const closeNotificationModal = () => {
        if (notificationForm.processing) {
            return;
        }

        setNotificationModal({ open: false, template: null });
        notificationForm.clearErrors();
    };

    const submitNotification = (event) => {
        event.preventDefault();

        if (!notificationModal.template) {
            return;
        }

        notificationForm.transform((data) => ({
            ...data,
            is_repeatable: data.is_repeatable ? 1 : 0,
            is_active: data.is_active ? 1 : 0,
        })).put(route('superadmin.notification-templates.update', notificationModal.template.id), {
            preserveScroll: true,
            onSuccess: () => closeNotificationModal(),
        });
    };

    const submitCategory = (event) => {
        event.preventDefault();

        if (categoryModal.mode === 'edit' && categoryModal.category) {
            categoryForm.put(route('superadmin.article-categories.update', categoryModal.category.id), {
                preserveScroll: true,
                onSuccess: () => closeCategoryModal(),
            });
            return;
        }

        categoryForm.post(route('superadmin.article-categories.store'), {
            preserveScroll: true,
            onSuccess: () => closeCategoryModal(),
        });
    };

    const deleteCategory = (categoryId) => {
        if (!window.confirm('Esti sigur ca vrei sa stergi aceasta categorie?')) {
            return;
        }

        router.delete(route('superadmin.article-categories.destroy', categoryId), {
            preserveScroll: true,
        });
    };

    const deleteValidationMessage = (applicationId, messageId) => {
        if (!window.confirm('Esti sigur ca vrei sa stergi acest mesaj?')) {
            return;
        }

        router.delete(route('superadmin.validation.messages.destroy', { applicationId, messageId }), {
            preserveScroll: true,
        });
    };

    return (
        <>
            <Head title="Dashboard Superadmin - Calming" />
            <div className="superadmin-shell">
                <section className="superadmin-hero">
                    <div>
                        <div className="superadmin-kicker">Operations Console</div>
                        <h1>Superadmin Dashboard</h1>
                        <p>Vedere tabelara pentru review operational, specialisti si articole.</p>
                    </div>
                    <div className="superadmin-hero__actions">
                        <Link className="btn btn-compact superadmin-pill-compact" href="/" style={{ height:"30px" }}>
                            Website
                        </Link>
                        <button className="btn btn-compact superadmin-pill-compact" type="button" onClick={() => setProfileOpen(true)}  style={{ height:"30px" }}>
                            Profil superadmin
                        </button>
                        <button className="btn danger btn-compact superadmin-pill-compact" type="button" onClick={() => signoutForm.post(route('superadmin.signout'))} style={{ height:"30px" }}>
                            Sign out
                        </button>
                    </div>
                </section>

                {page.props.flash?.status ? <div className="info u-mb-3">{page.props.flash.status}</div> : null}

                <section className="superadmin-stats">
                    <StatCard label="TOTAL SPECIALISTI" value={stats?.specialists_total ?? 0} hint={`${stats?.specialists_approved ?? 0} aprobati`} />
                    <StatCard label="TOTAL USERS" value={stats?.users_total ?? 0} hint="conturi user active" />
                    <StatCard label="VALIDARI PENDING" value={stats?.validation_pending ?? 0} hint="cereri de verificat" />
                    <StatCard label="ARTICOLE PENDING" value={stats?.articles_pending ?? 0} hint="articole in review" />
                </section>

                <div className="superadmin-grid">
                    <div className="superadmin-main superadmin-main--full">
                        <section className="superadmin-panel">
                            <div className="superadmin-panel__head">
                                <div>
                                    <div className="superadmin-panel__eyebrow">Review Queue</div>
                                    <h2>Inbox operational</h2>
                                </div>
                                <div className="superadmin-tabs">
                                    <button type="button" className={`superadmin-tab ${activeTab === 'specialists' ? 'active' : ''}`} onClick={() => setActiveTab('specialists')}>
                                        Specialisti
                                    </button>
                                    <button type="button" className={`superadmin-tab ${activeTab === 'articles' ? 'active' : ''}`} onClick={() => setActiveTab('articles')}>
                                        Articole
                                    </button>
                                    <button type="button" className={`superadmin-tab ${activeTab === 'categories' ? 'active' : ''}`} onClick={() => setActiveTab('categories')}>
                                        Categorii
                                    </button>
                                    <button type="button" className={`superadmin-tab ${activeTab === 'notifications' ? 'active' : ''}`} onClick={() => setActiveTab('notifications')}>
                                        Notificari
                                    </button>
                                </div>
                            </div>

                            {activeTab === 'specialists' ? (
                                validationApplications.length ? (
                                    <div className="superadmin-table-wrap">
                                        <table className="superadmin-table">
                                            <thead>
                                                <tr>
                                                    <th />
                                                    <th>ID</th>
                                                    <th>Specialist</th>
                                                    <th>Contact</th>
                                                    <th>Status</th>
                                                    <th>Trimisa</th>
                                                    <th>Actiuni</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {validationApplications.map((application) => (
                                                    <Fragment key={application.id}>
                                                        <tr key={`row-${application.id}`}>
                                                            <td>
                                                                <button className="superadmin-caret" type="button" aria-label="Arata detalii" aria-expanded={expandedApplications.includes(application.id)} onClick={() => toggleApplication(application.id)}>
                                                                    {expandedApplications.includes(application.id) ? '▾' : '▸'}
                                                                </button>
                                                            </td>
                                                            <td>#{application.id}</td>
                                                            <td>
                                                                <div className="superadmin-cell-title">{application.name}</div>
                                                                <div className="superadmin-cell-subtle">{application.entity_type_label || 'Tip entitate nespecificat'}</div>
                                                            </td>
                                                            <td>
                                                                <div>{application.email}</div>
                                                                <div className="superadmin-cell-subtle">{application.phone || '-'}</div>
                                                            </td>
                                                            <td>
                                                                <span className={`status-pill ${application.status === 'approved' ? 'status-pill--valid' : application.status === 'rejected' ? 'status-pill--danger' : 'status-pill--pending'}`}>
                                                                    {formatStatus(application.status)}
                                                                </span>
                                                            </td>
                                                            <td>{formatDate(application.submitted_at)}</td>
                                                            <td>
                                                                <div className="superadmin-actions">
                                                                    <button className="status-pill status-pill--valid superadmin-pill-compact" type="button" onClick={() => router.post(route('superadmin.validation.approve', application.id), {}, { preserveScroll: true })}>
                                                                        Approve
                                                                    </button>
                                                                    <button
                                                                        className="status-pill status-pill--pending superadmin-pill-compact"
                                                                        type="button"
                                                                        onClick={() => openMessageModal(application)}
                                                                    >
                                                                        Mesaj
                                                                    </button>
                                                                </div>
                                                            </td>
                                                        </tr>
                                                        {expandedApplications.includes(application.id) ? (
                                                        <tr key={`detail-${application.id}`} className="superadmin-table__detail-row">
                                                            <td colSpan="7">
                                                                <div className="superadmin-form-review">
                                                                    <div className="superadmin-form-review__section">
                                                                        <div className="superadmin-form-review__title">Mesaj specialist</div>
                                                                        {application.messages?.length ? (
                                                                            <div className="validation-documents">
                                                                                {application.messages.map((message) => (
                                                                                    <div key={message.id} className="list-item">
                                                                                        <div>
                                                                                            <div>{message.message}</div>
                                                                                            <div className="superadmin-cell-subtle">{formatDate(message.created_at)}</div>
                                                                                        </div>
                                                                                        <button
                                                                                            className="btn icon-only danger"
                                                                                            type="button"
                                                                                            aria-label="Sterge mesajul"
                                                                                            onClick={() => deleteValidationMessage(application.id, message.id)}
                                                                                        >
                                                                                            <FiTrash2 size={14} />
                                                                                        </button>
                                                                                    </div>
                                                                                ))}
                                                                            </div>
                                                                        ) : <div className="muted">Nu exista mesaj trimis pentru acest specialist.</div>}
                                                                    </div>

                                                                    <div className="superadmin-form-review__section">
                                                                        <div className="superadmin-form-review__title">Date generale de practica</div>
                                                                        <div className="superadmin-detail-grid">
                                                                            <DetailField label="Nume" value={application.name} />
                                                                            <DetailField label="Email profesional" value={application.email} />
                                                                            <DetailField label="Telefon" value={application.phone} />
                                                                            <DetailField label="Cod RUPA" value={application.rupa_code} />
                                                                            <DetailField label="Localitate" value={application.city_mode === 'bucuresti' ? 'Bucuresti' : application.city} />
                                                                            <DetailField label={application.city_mode === 'bucuresti' ? 'Sector' : 'Judet'} value={application.city_mode === 'bucuresti' ? application.sector : application.county} />
                                                                            <DetailField label="Adresa" value={application.address} />
                                                                            <DetailField label="Online" value={application.supports_online ? 'Da' : 'Nu'} />
                                                                        </div>
                                                                    </div>

                                                                    <div className="superadmin-form-review__section">
                                                                        <div className="superadmin-form-review__title">Atestate de libera practica</div>
                                                                        {application.attestations?.length ? (
                                                                            <table className="superadmin-subtable">
                                                                                <thead>
                                                                                    <tr>
                                                                                        <th>Specializare</th>
                                                                                        <th>Treapta</th>
                                                                                        <th>Regim</th>
                                                                                        <th>Certificat</th>
                                                                                        <th>Data emiterii</th>
                                                                                        <th>Comisia</th>
                                                                                    </tr>
                                                                                </thead>
                                                                                <tbody>
                                                                                    {application.attestations.map((attestation) => (
                                                                                        <tr key={attestation.id}>
                                                                                            <td>{attestation.specializations?.join(', ') || '-'}</td>
                                                                                            <td>{attestation.professional_grade || '-'}</td>
                                                                                            <td>{attestation.practice_regime || '-'}</td>
                                                                                            <td>{attestation.license_number || '-'}</td>
                                                                                            <td>{formatDate(attestation.license_issue_date)}</td>
                                                                                            <td>{attestation.specialty_commission || '-'}</td>
                                                                                        </tr>
                                                                                    ))}
                                                                                </tbody>
                                                                            </table>
                                                                        ) : <div className="muted">Nu exista atestate salvate.</div>}
                                                                    </div>

                                                                    <div className="superadmin-form-review__section">
                                                                        <div className="superadmin-form-review__title">Profil profesional si competente</div>
                                                                        <div className="superadmin-detail-grid">
                                                                            <DetailField label="Competente si formari" value={application.competencies} />
                                                                            <DetailField label="Observatii / bio public" value={application.public_bio} />
                                                                            <DetailField label="Reviewer notes" value={application.reviewer_notes} />
                                                                            <DetailField label="Reviewed at" value={formatDate(application.reviewed_at)} />
                                                                        </div>
                                                                    </div>

                                                                    <div className="superadmin-form-review__section">
                                                                        <div className="superadmin-form-review__title">Documente</div>
                                                                        {application.documents?.length ? (
                                                                            <div className="superadmin-documents">
                                                                                {application.documents.map((document) => (
                                                                                    <a key={document.id} href={document.url} target="_blank" rel="noreferrer" className="superadmin-document">
                                                                                        <span>{document.name}</span>
                                                                                        <span className="superadmin-cell-subtle">{document.mime_type || 'document'}</span>
                                                                                    </a>
                                                                                ))}
                                                                            </div>
                                                                        ) : <div className="muted">Nu exista documente incarcate.</div>}
                                                                    </div>
                                                                </div>
                                                            </td>
                                                        </tr>
                                                        ) : null}
                                                    </Fragment>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                ) : <div className="muted">Nu exista cereri de validare in asteptare.</div>
                            ) : activeTab === 'articles' ? (
                                pendingArticles.length ? (
                                    <div className="superadmin-table-wrap">
                                        <table className="superadmin-table">
                                            <thead>
                                                <tr>
                                                    <th>ID</th>
                                                    <th>Articol</th>
                                                    <th>Autor</th>
                                                    <th>Topic</th>
                                                    <th>Actualizat</th>
                                                    <th>Status</th>
                                                    <th>Actiuni</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {pendingArticles.map((article) => (
                                                    <tr key={article.id}>
                                                        <td>#{article.id}</td>
                                                        <td>
                                                            <div className="superadmin-cell-title">{article.title}</div>
                                                            <div className="superadmin-cell-subtle">{article.body_preview || '-'}</div>
                                                        </td>
                                                        <td>{article.author_name}</td>
                                                        <td>
                                                            <div>{article.topic_name || '-'}</div>
                                                            <div className="superadmin-cell-subtle">{article.tag || '-'}</div>
                                                        </td>
                                                        <td>{formatDate(article.updated_at)}</td>
                                                        <td><span className="status-pill status-pill--pending">PENDING</span></td>
                                                        <td>
                                                            <div className="superadmin-actions superadmin-actions--inline">
                                                                <Link className="status-pill status-pill--pending superadmin-pill-compact" href={article.slug ? `/article/${article.slug}` : '#'} target="_blank">
                                                                    Preview
                                                                </Link>
                                                                <button className="status-pill status-pill--valid superadmin-pill-compact" type="button" onClick={() => router.post(route('superadmin.articles.approve', article.id), {}, { preserveScroll: true })}>
                                                                    Approve
                                                                </button>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                ) : <div className="muted">Nu exista articole in asteptare.</div>
                            ) : activeTab === 'categories' ? (
                                <div className="superadmin-table-wrap">
                                    <div className="superadmin-panel__head">
                                        <div>
                                            <div className="superadmin-panel__eyebrow">Taxonomy</div>
                                            <h2>Categorii articole</h2>
                                        </div>
                                        <button className="btn btn-compact superadmin-pill-compact" type="button" onClick={() => openCategoryModal()}>
                                            <FiPlus size={12} />
                                            <span>Adauga</span>
                                        </button>
                                    </div>
                                    <table className="superadmin-table">
                                        <thead>
                                            <tr>
                                                <th>ID</th>
                                                <th>Nume</th>
                                                <th>Slug</th>
                                                <th>Articole</th>
                                                <th>Actiuni</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {categories.map((category) => (
                                                <tr key={category.id}>
                                                    <td>#{category.id}</td>
                                                    <td>{category.name}</td>
                                                    <td>{category.slug}</td>
                                                    <td>{category.article_count}</td>
                                                    <td>
                                                        <div className="superadmin-actions superadmin-actions--inline">
                                                            <button className="status-pill status-pill--pending" type="button" onClick={() => openCategoryModal(category)}>
                                                                <span>Edit</span>
                                                            </button>
                                                            <button className="status-pill status-pill--danger" type="button" onClick={() => deleteCategory(category.id)}>
                                                                <span>Sterge</span>
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            ) : (
                                <div className="superadmin-table-wrap">
                                    <div className="superadmin-panel__head">
                                        <div>
                                            <div className="superadmin-panel__eyebrow">Notification Center</div>
                                            <h2>Catalog si livrari notificari</h2>
                                        </div>
                                    </div>

                                    <section className="superadmin-stats" style={{ marginBottom: '20px' }}>
                                        <StatCard label="TEMPLATE-URI" value={notificationSummary?.templates_total ?? 0} hint="definitii active in sistem" />
                                        <StatCard label="LIVRARI TOTAL" value={notificationSummary?.deliveries_total ?? 0} hint="instante create" />
                                        <StatCard label="USER / GUEST" value={`${notificationSummary?.deliveries_user ?? 0} / ${notificationSummary?.deliveries_guest ?? 0}`} hint="distributie actori" />
                                        <StatCard label="UNREAD" value={notificationSummary?.unread_total ?? 0} hint={`${notificationSummary?.repeatable_total ?? 0} template-uri repeatable`} />
                                    </section>

                                    <div className="superadmin-panel__head">
                                        <div>
                                            <div className="superadmin-panel__eyebrow">Templates</div>
                                            <h2>Configurare logica notificari</h2>
                                        </div>
                                    </div>
                                    <table className="superadmin-table">
                                        <thead>
                                            <tr>
                                                <th>Key</th>
                                                <th>Titlu</th>
                                                <th>Categorie</th>
                                                <th>Apare la</th>
                                                <th>CTA / Link</th>
                                                <th>Frecventa</th>
                                                <th>Ultima livrare</th>
                                                <th>Actiuni</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {notificationTemplates.map((template) => (
                                                <tr key={template.id}>
                                                    <td>
                                                        <div className="superadmin-cell-title">{template.key}</div>
                                                        <div className="superadmin-cell-subtle">{template.icon} / {template.icon_color || '-'}</div>
                                                    </td>
                                                    <td>
                                                        <div className="superadmin-cell-title">{template.title}</div>
                                                        <div className="superadmin-cell-subtle">{template.body}</div>
                                                    </td>
                                                    <td>
                                                        <div>{template.category}</div>
                                                        <div className="superadmin-cell-subtle">priority {template.priority}</div>
                                                    </td>
                                                    <td>
                                                        <div>{template.actor_type}</div>
                                                        <div className="superadmin-cell-subtle">{template.audience}</div>
                                                    </td>
                                                    <td>
                                                        <div>{template.cta_kind || '-'}</div>
                                                        <div className="superadmin-cell-subtle">{template.cta_label || '-'} {template.deep_link ? `| ${template.deep_link}` : ''}</div>
                                                    </td>
                                                    <td>
                                                        <div>Total: {template.frequency_total}</div>
                                                        <div className="superadmin-cell-subtle">User {template.frequency_user} / Guest {template.frequency_guest}{template.is_repeatable ? ' / repeatable' : ''}</div>
                                                    </td>
                                                    <td>
                                                        {template.latest_delivery ? (
                                                            <>
                                                                <div>{formatDate(template.latest_delivery.published_at)}</div>
                                                                <div className="superadmin-cell-subtle">{formatRecipient(template.latest_delivery.recipient_type)} | {template.latest_delivery.title}</div>
                                                            </>
                                                        ) : (
                                                            <span className="muted">Fara livrari</span>
                                                        )}
                                                    </td>
                                                    <td>
                                                        <button className="status-pill status-pill--pending superadmin-pill-compact" type="button" onClick={() => openNotificationModal(template)}>
                                                            <FiEdit2 size={12} />
                                                            <span>Edit</span>
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>

                                    <div className="superadmin-panel__head" style={{ marginTop: '24px' }}>
                                        <div>
                                            <div className="superadmin-panel__eyebrow">Deliveries</div>
                                            <h2>Ultimele notificari generate</h2>
                                        </div>
                                    </div>
                                    <table className="superadmin-table">
                                        <thead>
                                            <tr>
                                                <th>ID</th>
                                                <th>Titlu</th>
                                                <th>La cine apare</th>
                                                <th>Status</th>
                                                <th>Trigger</th>
                                                <th>Legaturi</th>
                                                <th>Publicata</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {notificationEvents.map((item) => (
                                                <tr key={item.id}>
                                                    <td>#{item.id}</td>
                                                    <td>
                                                        <div className="superadmin-cell-title">{item.title}</div>
                                                        <div className="superadmin-cell-subtle">{item.body}</div>
                                                    </td>
                                                    <td>
                                                        <div>{formatRecipient(item.recipient_type)}</div>
                                                        <div className="superadmin-cell-subtle">{item.appears_for}</div>
                                                    </td>
                                                    <td>
                                                        <span className={`status-pill ${item.status === 'read' ? 'status-pill--valid' : item.status === 'archived' ? 'status-pill--danger' : 'status-pill--pending'}`}>
                                                            {(item.status || 'unread').toUpperCase()}
                                                        </span>
                                                    </td>
                                                    <td>
                                                        <div>{item.trigger_type || '-'}</div>
                                                        <div className="superadmin-cell-subtle">{item.trigger_id || '-'}</div>
                                                    </td>
                                                    <td>
                                                        <div>{item.cta_kind || '-'}</div>
                                                        <div className="superadmin-cell-subtle">{item.dedupe_key || '-'}</div>
                                                    </td>
                                                    <td>
                                                        <div>{formatDate(item.published_at)}</div>
                                                        <div className="superadmin-cell-subtle">{item.read_at ? `read ${formatDate(item.read_at)}` : 'necitita'}</div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </section>
                    </div>
                </div>
            </div>

            {profileOpen ? (
                <div className="modal-root" role="dialog" aria-modal="true" aria-label="Profil superadmin">
                    <div className="modal-backdrop" onClick={() => setProfileOpen(false)} />
                    <div className="modal-center">
                        <section className="card psych-card superadmin-modal">
                            <div className="row" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
                                <div>
                                    <div className="superadmin-panel__eyebrow">Identity</div>
                                    <h2 className="u-m-0">Profil superadmin</h2>
                                </div>
                                <button type="button" className="close" aria-label="Inchide" onClick={() => setProfileOpen(false)}>
                                    <FiX />
                                </button>
                            </div>

                            {Object.keys(profileForm.errors).length ? <div className="error u-mt-3">{Object.values(profileForm.errors)[0]}</div> : null}

                            <form className="superadmin-profile u-mt-4" onSubmit={submitProfile}>
                                <label>
                                    <span>Username</span>
                                    <input value={profileForm.data.username} onChange={(event) => profileForm.setData('username', event.target.value)} required />
                                </label>
                                <label>
                                    <span>Parola curenta</span>
                                    <input type="password" value={profileForm.data.current_password} onChange={(event) => profileForm.setData('current_password', event.target.value)} required />
                                </label>
                                <label>
                                    <span>Parola noua</span>
                                    <input type="password" value={profileForm.data.password} onChange={(event) => profileForm.setData('password', event.target.value)} />
                                </label>
                                <label>
                                    <span>Confirma parola</span>
                                    <input type="password" value={profileForm.data.password_confirmation} onChange={(event) => profileForm.setData('password_confirmation', event.target.value)} />
                                </label>
                                <div className="validation-actions">
                                    <button className="btn primary btn-compact superadmin-pill-compact" type="button" onClick={() => setProfileOpen(false)} style={{ height:"30px" }}>
                                        Inchide
                                    </button>
                                <button className="btn primary btn-compact superadmin-pill-compact" type="submit" disabled={profileForm.processing} style={{ height:"30px" }}>
                                    {profileForm.processing ? 'Se salveaza...' : 'Update credentials'}
                                </button>
                                </div>
                            </form>
                        </section>
                    </div>
                </div>
            ) : null}

            {messageModal.open ? (
                <div className="modal-root" role="dialog" aria-modal="true" aria-label="Mesaj pentru specialist">
                    <div className="modal-backdrop" onClick={closeMessageModal} />
                    <div className="modal-center">
                        <section className="card psych-card superadmin-modal">
                            <div className="row" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
                                <div>
                                    <div className="superadmin-panel__eyebrow">Mesaj</div>
                                    <h2 className="u-m-0">{messageModal.specialistName}</h2>
                                </div>
                                <button type="button" className="close" aria-label="Inchide" onClick={closeMessageModal}>
                                    <FiX />
                                </button>
                            </div>

                            {Object.keys(messageForm.errors).length ? <div className="error u-mt-3">{Object.values(messageForm.errors)[0]}</div> : null}

                            <form className="superadmin-profile u-mt-4" onSubmit={submitMessage}>
                                <label>
                                    <span>Mesaj pentru specialist</span>
                                    <textarea
                                        className="superadmin-message-textarea"
                                        value={messageForm.data.message}
                                        onChange={(event) => messageForm.setData('message', event.target.value)}
                                        required
                                    />
                                </label>
                                <div className="validation-actions">
                                    <button className="btn primary btn-compact superadmin-pill-compact" type="button" onClick={closeMessageModal} style={{ height:"30px", background:"grey" }}>
                                        Inchide
                                    </button>
                                    <button className="btn primary btn-compact superadmin-pill-compact" type="submit" disabled={messageForm.processing} style={{ height:"30px" }}>
                                        {messageForm.processing ? 'Se trimite...' : 'Trimite'}
                                    </button>
                                </div>
                            </form>
                        </section>
                    </div>
                </div>
            ) : null}

            {categoryModal.open ? (
                <div className="modal-root" role="dialog" aria-modal="true" aria-label="Categorie articol">
                    <div className="modal-backdrop" onClick={closeCategoryModal} />
                    <div className="modal-center">
                        <section className="card psych-card superadmin-modal">
                            <div className="row" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
                                <div>
                                    <div className="superadmin-panel__eyebrow">Categorie</div>
                                    <h2 className="u-m-0">{categoryModal.mode === 'edit' ? 'Editeaza categorie' : 'Adauga categorie'}</h2>
                                </div>
                                <button type="button" className="close" aria-label="Inchide" onClick={closeCategoryModal}>
                                    <FiX />
                                </button>
                            </div>

                            {Object.keys(categoryForm.errors).length ? <div className="error u-mt-3">{Object.values(categoryForm.errors)[0]}</div> : null}

                            <form className="superadmin-profile u-mt-4" onSubmit={submitCategory}>
                                <label>
                                    <span>Nume</span>
                                    <input value={categoryForm.data.name} onChange={(event) => categoryForm.setData('name', event.target.value)} required />
                                </label>
                                <label>
                                    <span>Slug</span>
                                    <input value={categoryForm.data.slug} onChange={(event) => categoryForm.setData('slug', event.target.value)} />
                                </label>
                                <div className="validation-actions">
                                    <button className="btn primary btn-compact superadmin-pill-compact" type="button" onClick={closeCategoryModal} style={{ height:"30px", background:"grey" }}>
                                        Inchide
                                    </button>
                                    <button className="btn primary btn-compact superadmin-pill-compact" type="submit" disabled={categoryForm.processing} style={{ height:"30px" }}>
                                        {categoryForm.processing ? 'Se salveaza...' : categoryModal.mode === 'edit' ? 'Salveaza' : 'Adauga'}
                                    </button>
                                </div>
                            </form>
                        </section>
                    </div>
                </div>
            ) : null}

            {notificationModal.open ? (
                <div className="modal-root" role="dialog" aria-modal="true" aria-label="Template notificare">
                    <div className="modal-backdrop" onClick={closeNotificationModal} />
                    <div className="modal-center">
                        <section className="card psych-card superadmin-modal">
                            <div className="row" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
                                <div>
                                    <div className="superadmin-panel__eyebrow">Template notificare</div>
                                    <h2 className="u-m-0">{notificationModal.template?.key}</h2>
                                    <div className="superadmin-cell-subtle">Campurile controlate folosesc dropdown-uri ca sa ramai in setul valid al template-ului.</div>
                                </div>
                                <button type="button" className="close" aria-label="Inchide" onClick={closeNotificationModal}>
                                    <FiX />
                                </button>
                            </div>

                            {Object.keys(notificationForm.errors).length ? <div className="error u-mt-3">{Object.values(notificationForm.errors)[0]}</div> : null}

                            <form className="superadmin-profile u-mt-4" onSubmit={submitNotification}>
                                <label>
                                    <span>Key</span>
                                    <input value={notificationModal.template?.key ?? ''} disabled />
                                </label>
                                <label>
                                    <span>Titlu</span>
                                    <input value={notificationForm.data.default_title} onChange={(event) => notificationForm.setData('default_title', event.target.value)} required />
                                </label>
                                <label>
                                    <span>Text</span>
                                    <textarea className="superadmin-message-textarea" value={notificationForm.data.default_body} onChange={(event) => notificationForm.setData('default_body', event.target.value)} required />
                                </label>
                                <label>
                                    <span>Audience</span>
                                    <select value={notificationForm.data.audience} onChange={(event) => notificationForm.setData('audience', event.target.value)}>
                                        {notificationOptions.audience.map((option) => <option key={option} value={option}>{option}</option>)}
                                    </select>
                                </label>
                                <label>
                                    <span>Actor type</span>
                                    <select value={notificationForm.data.actor_type} onChange={(event) => notificationForm.setData('actor_type', event.target.value)}>
                                        {notificationOptions.actorType.map((option) => <option key={option} value={option}>{option}</option>)}
                                    </select>
                                </label>
                                <label>
                                    <span>Categorie</span>
                                    <select value={notificationForm.data.category} onChange={(event) => notificationForm.setData('category', event.target.value)}>
                                        {notificationOptions.categories.map((option) => <option key={option} value={option}>{option}</option>)}
                                    </select>
                                </label>
                                <label>
                                    <span>Icon</span>
                                    <select value={notificationForm.data.icon} onChange={(event) => notificationForm.setData('icon', event.target.value)}>
                                        {notificationOptions.icons.map((option) => <option key={option} value={option}>{option}</option>)}
                                    </select>
                                </label>
                                <label>
                                    <span>Culoare icon</span>
                                    <select value={notificationForm.data.icon_color} onChange={(event) => notificationForm.setData('icon_color', event.target.value)}>
                                        {notificationOptions.iconColors.map((option) => <option key={option} value={option}>{option}</option>)}
                                    </select>
                                </label>
                                <label>
                                    <span>Priority</span>
                                    <select value={notificationForm.data.priority} onChange={(event) => notificationForm.setData('priority', Number(event.target.value))}>
                                        {notificationOptions.priorities.map((option) => <option key={option} value={option}>{option}</option>)}
                                    </select>
                                </label>
                                <label>
                                    <span>CTA kind</span>
                                    <select value={notificationForm.data.cta_kind} onChange={(event) => notificationForm.setData('cta_kind', event.target.value)}>
                                        {notificationOptions.ctaKinds.map((option) => <option key={option} value={option}>{option || 'none'}</option>)}
                                    </select>
                                </label>
                                <label>
                                    <span>CTA label</span>
                                    <input value={notificationForm.data.cta_label} onChange={(event) => notificationForm.setData('cta_label', event.target.value)} />
                                </label>
                                <label>
                                    <span>Deep link</span>
                                    <input value={notificationForm.data.deep_link} onChange={(event) => notificationForm.setData('deep_link', event.target.value)} />
                                </label>
                                <label>
                                    <span>Repeatable</span>
                                    <select value={notificationForm.data.is_repeatable ? '1' : '0'} onChange={(event) => notificationForm.setData('is_repeatable', event.target.value === '1')}>
                                        <option value="0">false</option>
                                        <option value="1">true</option>
                                    </select>
                                </label>
                                <label>
                                    <span>Activ</span>
                                    <select value={notificationForm.data.is_active ? '1' : '0'} onChange={(event) => notificationForm.setData('is_active', event.target.value === '1')}>
                                        <option value="1">true</option>
                                        <option value="0">false</option>
                                    </select>
                                </label>
                                <div className="validation-actions">
                                    <button className="btn primary btn-compact superadmin-pill-compact" type="button" onClick={closeNotificationModal} style={{ height:"30px", background:"grey" }}>
                                        Inchide
                                    </button>
                                    <button className="btn primary btn-compact superadmin-pill-compact" type="submit" disabled={notificationForm.processing} style={{ height:"30px" }}>
                                        {notificationForm.processing ? 'Se salveaza...' : 'Salveaza'}
                                    </button>
                                </div>
                            </form>
                        </section>
                    </div>
                </div>
            ) : null}
        </>
    );
}

SuperadminDashboard.layout = (page) => <AppLayout>{page}</AppLayout>;
