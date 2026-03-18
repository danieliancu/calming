import AccentCard from '@/Components/AccentCard';
import AppLayout from '@/Layouts/AppLayout';
import ProfileEditModal from '@/Components/ProfileEditModal';
import SignOutAction from '@/Components/SignOutAction';
import { useAuth } from '@/contexts/AuthContext';
import { buildGuestMilestones, getGuestState } from '@/lib/guestActivity';
import { FiActivity, FiAward, FiChevronRight, ICON_BY_NAME } from '@/lib/icons';
import { Head, Link, router } from '@inertiajs/react';
import { useCallback, useEffect, useMemo, useState } from 'react';

export default function Profile({ profile, profileDetails, stats, milestones, infoLinks }) {
    const { isAuthenticated, authResolved, promptAuth, signOut } = useAuth();
    const [profileData, setProfileData] = useState(profile ?? null);
    const [profileExtra, setProfileExtra] = useState(profileDetails ?? null);
    const [editOpen, setEditOpen] = useState(false);
    const shouldOpenEdit = useMemo(() => {
        if (typeof window === 'undefined') {
            return false;
        }

        return new URLSearchParams(window.location.search).get('edit') === '1';
    }, []);

    useEffect(() => {
        if (!authResolved) {
            return;
        }

        if (!isAuthenticated) {
            return;
        }
    }, [authResolved, isAuthenticated]);

    useEffect(() => {
        if (!authResolved || !isAuthenticated || !shouldOpenEdit) {
            return;
        }

        setEditOpen(true);
    }, [authResolved, isAuthenticated, shouldOpenEdit]);

    const openJournal = () => {
        if (!isAuthenticated) {
            promptAuth();
            return;
        }
        router.visit('/profile?journal=new', { preserveState: true, preserveScroll: true });
    };

    const closeEditModal = useCallback(() => {
        setEditOpen(false);

        if (typeof window === 'undefined') {
            return;
        }

        const url = new URL(window.location.href);
        if (url.searchParams.get('edit') !== '1') {
            return;
        }

        url.searchParams.delete('edit');
        const nextSearch = url.searchParams.toString();
        window.history.replaceState(window.history.state, '', `${url.pathname}${nextSearch ? `?${nextSearch}` : ''}${url.hash}`);
    }, []);

    const handleProfileSaved = useCallback((payload) => {
        if (payload?.profile) {
            setProfileData(payload.profile);
        }
        if (payload?.details) {
            setProfileExtra(payload.details);
        }
        closeEditModal();
    }, [closeEditModal]);

    const completionValue = Math.min(profileData?.profile_completion ?? 0, 100);
    const guestState = useMemo(() => getGuestState(), []);
    const guestMilestones = useMemo(() => buildGuestMilestones(), []);
    const userMilestones = useMemo(
        () => (milestones ?? []).map((milestone) => ({
            ...milestone,
            icon: milestone.icon ?? 'FiAward',
            icon_color: milestone.icon_color ?? 'rose',
            category: milestone.category ?? 'progress',
        })),
        [milestones],
    );
    const completionTone = useMemo(() => {
        if (completionValue >= 80) {
            return 'progress-good';
        }
        if (completionValue >= 50) {
            return 'progress-mid';
        }
        return 'progress-low';
    }, [completionValue]);

    if (!authResolved) {
        return null;
    }

    if (!isAuthenticated) {
        return (
            <>
                <Head title="Profil guest - Calming" />
                <main className="profile-layout">
                    <AccentCard className="profile-card" dismissKey="guest-profile-summary">
                        <div className="profile-header">
                            <div className="profile-ident">
                                <div className="avatar">G</div>
                                <div>
                                    <div className="profile-name">Guest local</div>
                                    <div className="muted">Activitatea se pastreaza doar in acest browser pana creezi un cont.</div>
                                </div>
                            </div>
                            <button type="button" className="btn profile-edit" onClick={promptAuth}>Creeaza cont</button>
                        </div>

                        <div className="profile-progress">
                            <div className="progress-label">
                                <span>Explorare aplicatie</span>
                                <span className={`progress-value ${guestMilestones.length >= 3 ? 'progress-good' : guestMilestones.length >= 1 ? 'progress-mid' : 'progress-low'}`}>
                                    {Math.min(100, guestMilestones.length * 20)}%
                                </span>
                            </div>
                            <div className="progress-bar">
                                <span className={`progress-fill ${guestMilestones.length >= 3 ? 'progress-good' : guestMilestones.length >= 1 ? 'progress-mid' : 'progress-low'}`} style={{ width: `${Math.min(100, guestMilestones.length * 20)}%` }} />
                            </div>
                        </div>
                    </AccentCard>

                    <section className="card stats-section">
                        <div className="section-title">Sesiunea ta locala</div>
                        <div className="stats-grid">
                            <div className="stats-card">
                                <div className="stats-value">{guestState.viewedArticles.length}</div>
                                <div className="stats-label">Articole deschise</div>
                            </div>
                            <div className="stats-card">
                                <div className="stats-value">{guestState.savedArticles.length}</div>
                                <div className="stats-label">Articole salvate</div>
                            </div>
                            <div className="stats-card">
                                <div className="stats-value">{guestState.reminders.length}</div>
                                <div className="stats-label">Remindere locale</div>
                            </div>
                            <div className="stats-card">
                                <div className="stats-value">{guestState.visitedDays.length}</div>
                                <div className="stats-label">Zile cu revenire</div>
                            </div>
                        </div>
                    </section>

                    <section className="card milestones-section">
                        <div className="section-title">Repere guest</div>
                        <div className="milestones">
                            {guestMilestones.map((milestone) => (
                                <MilestoneCard key={milestone.id} milestone={milestone} />
                            ))}
                            {guestMilestones.length === 0 ? <div className="muted">Reperele apar dupa ce explorezi articole, Assistant si reminder-ele locale.</div> : null}
                        </div>
                    </section>

                    <section className="card info-section">
                        <div className="section-title">Sincronizare</div>
                        <div className="info-list">
                            <button className="info-item" type="button" onClick={promptAuth}>
                                <span>Creeaza cont pentru a sincroniza saved articles, remindere si notificari</span>
                                <FiChevronRight aria-hidden />
                            </button>
                        </div>
                    </section>
                </main>
            </>
        );
    }

    return (
        <>
            <Head title="Profil - Calming" />

            <main className="profile-layout">
                <AccentCard className="profile-card" dismissKey="profile-summary">
                    <div className="profile-header">
                        <div className="profile-ident">
                            <div className="avatar">{profileData?.avatar_initials ?? 'NA'}</div>
                            <div>
                                <div className="profile-name">
                                    {profileData?.display_name ?? 'Utilizator'}
                                    {profileData?.community_alias ? ` (${profileData.community_alias})` : ''}
                                </div>
                                <div className="muted">
                                    {profileData?.member_since ? `Membru din ${formatMemberSince(profileData.member_since)}` : 'Membru Calming'}
                                </div>
                            </div>
                        </div>
                        <button type="button" className="btn profile-edit" onClick={() => setEditOpen(true)}>Editeaza</button>
                    </div>

                    <div className="profile-progress">
                        <div className="progress-label">
                            <span>Completare profil</span>
                            <span className={`progress-value ${completionTone}`}>{completionValue}%</span>
                        </div>
                        <div className="progress-bar">
                            <span className={`progress-fill ${completionTone}`} style={{ width: `${completionValue}%` }} />
                        </div>
                    </div>
                </AccentCard>

                <div className="profile-actions">
                    <a href="#" className="list-item" onClick={(event) => { event.preventDefault(); openJournal(); }}>Adauga in jurnal</a>
                    <Link href="/journal" className="list-item profile-action primary">Jurnalul meu</Link>
                    <SignOutAction className="list-item settings-signout-card" onClick={signOut} />
                </div>

                <section className="card stats-section">
                    <div className="section-title">Statisticile tale</div>
                    <div className="stats-grid">
                        {stats.map((item) => {
                            const Icon = ICON_BY_NAME[item.icon] ?? FiActivity;
                            return (
                                <div className="stats-card" key={item.metric_key}>
                                    <div className={`stats-icon stats-icon--${item.tone}`}><Icon /></div>
                                    <div className="stats-value">{item.value}</div>
                                    <div className="stats-label">{item.label}</div>
                                </div>
                            );
                        })}
                    </div>
                </section>

                <section className="card milestones-section">
                    <div className="section-title">Repere</div>
                    <div className="milestones">
                        {userMilestones.map((milestone) => (
                            <MilestoneCard key={milestone.id} milestone={milestone} />
                        ))}
                        {userMilestones.length === 0 ? <div className="muted">Reperele apar pe masura ce folosesti jurnalul, articolele, programarile, comunitatea si Assistant.</div> : null}
                    </div>
                </section>

                <section className="card info-section">
                    <div className="section-title">Resurse</div>
                    <div className="info-list">
                        {infoLinks.map((link) => (
                            <button className="info-item" key={link.id} type="button">
                                <span>{link.label}</span>
                                <FiChevronRight aria-hidden />
                            </button>
                        ))}
                    </div>
                </section>
            </main>

            {editOpen ? <ProfileEditModal initialProfile={profileData} initialDetails={profileExtra} onClose={closeEditModal} onSaved={handleProfileSaved} /> : null}
        </>
    );
}

function MilestoneCard({ milestone }) {
    const Icon = ICON_BY_NAME[milestone.icon] ?? FiAward;

    return (
        <div className="milestone-card">
            <div className={`milestone-icon milestone-icon--${milestone.icon_color ?? 'rose'}`}>
                <Icon />
            </div>
            <div className="milestone-copy">
                <div className="row gap-tight">
                    <div className="milestone-title">{milestone.title}</div>
                    <span className={`chip chip-soft chip-soft--${milestone.category ?? 'progress'}`}>{formatCategory(milestone.category)}</span>
                </div>
                <div className="milestone-description">{milestone.description}</div>
                <div className="milestone-date">{formatDate(milestone.achieved_at)}</div>
            </div>
        </div>
    );
}

function formatMemberSince(dateString) {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('ro-RO', { month: 'long', year: 'numeric' }).format(date);
}

function formatDate(dateString) {
    if (!dateString) {
        return '';
    }
    const date = new Date(dateString);
    return date.toLocaleDateString('ro-RO', { month: 'short', day: 'numeric', year: 'numeric' });
}

function formatCategory(category) {
    switch (category) {
        case 'journal':
            return 'Jurnal';
        case 'article':
            return 'Articole';
        case 'appointment':
            return 'Programari';
        case 'assistant':
            return 'Assistant';
        case 'community':
            return 'Comunitate';
        case 'profile':
            return 'Profil';
        case 'consistency':
            return 'Consecventa';
        case 'assessment':
            return 'Evaluare';
        default:
            return 'Progres';
    }
}

Profile.layout = (page) => <AppLayout>{page}</AppLayout>;
