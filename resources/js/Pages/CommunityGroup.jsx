import PrivateGroupModal from '@/Components/PrivateGroupModal';
import AppLayout from '@/Layouts/AppLayout';
import { useAuth } from '@/contexts/AuthContext';
import { Head, Link, router } from '@inertiajs/react';
import { useCallback, useState } from 'react';
import { FiArrowLeft, FiArrowRight, FiCalendar, FiClock, FiLock, FiShield, FiUserCheck, FiUsers } from '@/lib/icons';

export default function CommunityGroup({ group }) {
    const { isAuthenticated, isPsychAuthenticated, authResolved, promptAuth } = useAuth();
    const [showPrivateNotice, setShowPrivateNotice] = useState(false);

    const handleConversationsNav = useCallback((event) => {
        if (group.isPrivate && !group.canAccessConversations) {
            event.preventDefault();
            setShowPrivateNotice(true);
            return;
        }

        if (!authResolved) {
            event.preventDefault();
            return;
        }

        if (!isAuthenticated && !isPsychAuthenticated) {
            event.preventDefault();
            promptAuth();
            return;
        }

        router.visit(`/community/${group.slug}/conversatii`);
    }, [authResolved, group, isAuthenticated, isPsychAuthenticated, promptAuth]);

    if (!group) {
        return null;
    }

    return (
        <>
            <Head title={`${group.name} - Comunitate Calming`} />
            {showPrivateNotice ? <PrivateGroupModal groupName={group.name} onClose={() => setShowPrivateNotice(false)} /> : null}

            <div className="group-hero card">
                <div className="group-nav-bar">
                    <Link href="/community" className="group-back-link">
                        <FiArrowLeft aria-hidden /> Inapoi la comunitate
                    </Link>
                    <Link href={`/community/${group.slug}/conversatii`} onClick={handleConversationsNav} className="group-back-link">
                        Mergi la conversatii <FiArrowRight aria-hidden />
                    </Link>
                </div>

                <h1 className="group-title">
                    {group.name} {group.isPrivate ? <FiLock style={{ fontSize: '24px' }} aria-hidden /> : null}
                </h1>
                <p className="group-description">{group.description}</p>

                <div className="group-meta">
                    <div className="group-meta-item">
                        <FiCalendar aria-hidden />
                        {group.schedule ? group.schedule : <span className="pill badge-info">Fara intalniri live</span>}
                    </div>
                    {group.meetingLink ? <div className="group-meta-item"><a href={group.meetingLink} target="_blank" rel="noreferrer">Link intalnire</a></div> : null}
                    <div className="group-meta-item">
                        <FiUserCheck aria-hidden />
                        Moderator: {group.facilitator}
                        {group.isModerator ? <span className="chip chip--subtle">Tu esti moderatorul</span> : null}
                    </div>
                    <div className="group-meta-item"><FiUsers aria-hidden /> {group.memberLabel}</div>
                    <div className="group-meta-item"><FiClock aria-hidden /> activ {group.lastActive} in urma</div>
                </div>

                <div className="group-tags">
                    {group.focusAreas.map((area) => (
                        <span key={area} className="chip">{area}</span>
                    ))}
                </div>
            </div>

            <section className="card u-mt-4">
                <div className="section-title">
                    <FiShield className="section-icon" aria-hidden /> Cadru de siguranta
                </div>
                <p className="muted">{group.safetyNote}</p>
            </section>

            <section className="card group-thread-guidelines u-mt-4">
                <div className="section-title">
                    <FiShield aria-hidden /> Guideline-uri rapide
                </div>
                <ul className="group-guidelines-list muted">
                    <li>Respecta confidentialitatea si evita detalii identificabile.</li>
                    <li>Scrie la persoana intai si descrie ce ai nevoie, nu ce astepti de la ceilalti.</li>
                    <li>Daca simti ca un subiect devine dificil, ia o pauza si revino cand esti pregatit.</li>
                </ul>
            </section>
        </>
    );
}

CommunityGroup.layout = (page) => <AppLayout>{page}</AppLayout>;
