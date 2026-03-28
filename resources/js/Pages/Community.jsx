import AccentCard from '@/Components/AccentCard';
import PrivateGroupModal from '@/Components/PrivateGroupModal';
import AppLayout from '@/Layouts/AppLayout';
import { useAuth } from '@/contexts/AuthContext';
import { Head, router } from '@inertiajs/react';
import { useCallback, useMemo, useState } from 'react';
import { FiChevronRight, FiLock, FiSearch, FiShield, FiUsers } from '@/lib/icons';

export default function Community({ groups }) {
    const { isAuthenticated, isPsychAuthenticated, promptAuth } = useAuth();
    const [q, setQ] = useState('');
    const [privateGroup, setPrivateGroup] = useState(null);

    const filteredGroups = useMemo(() => {
        if (!q.trim()) {
            return groups;
        }

        const term = q.trim().toLowerCase();
        return groups.filter((group) => [group.name, group.memberLabel, group.lastActiveExact].filter(Boolean).join(' ').toLowerCase().includes(term));
    }, [groups, q]);

    const handleGroupAccess = useCallback((group) => {
        if (group.is_private && !group.canAccessConversations) {
            setPrivateGroup(group);
            return;
        }

        if (!isAuthenticated && !isPsychAuthenticated) {
            promptAuth();
            return;
        }

        router.visit(`/community/${group.slug}`);
    }, [isAuthenticated, isPsychAuthenticated, promptAuth]);

    const handleKeyDown = useCallback((event, group) => {
        if (event.key !== 'Enter' && event.key !== ' ') {
            return;
        }

        event.preventDefault();
        handleGroupAccess(group);
    }, [handleGroupAccess]);

    return (
        <>
            <Head title="Comunitate - Calming" />
            {privateGroup ? <PrivateGroupModal groupName={privateGroup.name} onClose={() => setPrivateGroup(null)} /> : null}

            <AccentCard dismissKey="community-safety">
                <div className="section-title">
                    <FiShield className="section-icon" /> Siguranta
                </div>
                <div className="muted">Toate conversatiile sunt moderate. Cele private nu permit accesul decat pe baza de invitatie.</div>
            </AccentCard>

            <section className="card search-card u-mt-4">
                <FiSearch className="section-icon search-card__icon" />
                <input value={q} onChange={(event) => setQ(event.target.value)} placeholder="Cauta grupuri, moderatori, membri..." className="form-input search-card__input" />
            </section>

            <section className="card u-mt-4">
                <div className="section-title">
                    <FiUsers className="section-icon" /> Grupuri de sprijin
                </div>
                <div className="grid community-group-grid">
                    {filteredGroups.map((group) => (
                        <div
                            key={group.slug}
                            className="list-item"
                            role="button"
                            tabIndex={0}
                            onClick={() => handleGroupAccess(group)}
                            onKeyDown={(event) => handleKeyDown(event, group)}
                        >
                            <div>
                                <span className="u-text-semibold">
                                    {group.name} {group.is_private ? <FiLock aria-hidden /> : null}
                                </span>
                                <div className="muted community-meta">
                                    {group.memberLabel} - ultimul mesaj acum {group.lastActiveExact}
                                </div>
                            </div>
                            <FiChevronRight className="chev" aria-hidden />
                        </div>
                    ))}
                    {filteredGroups.length === 0 ? <div className="list-item muted">Nu exista grupuri disponibile in acest moment.</div> : null}
                </div>
            </section>
        </>
    );
}

Community.layout = (page) => <AppLayout>{page}</AppLayout>;
