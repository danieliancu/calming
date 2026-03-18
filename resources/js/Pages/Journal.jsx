import AccentCard from '@/Components/AccentCard';
import AppLayout from '@/Layouts/AppLayout';
import { useAuth } from '@/contexts/AuthContext';
import { apiFetch } from '@/lib/http';
import { Head, Link, router } from '@inertiajs/react';
import { useEffect, useState } from 'react';

export default function JournalPage({ entries, startDate }) {
    const { isAuthenticated, authResolved, promptAuth } = useAuth();
    const [items, setItems] = useState(entries ?? []);
    const [deleteError, setDeleteError] = useState(null);
    const [deletingKey, setDeletingKey] = useState(null);

    useEffect(() => {
        if (!authResolved) {
            return;
        }

        if (!isAuthenticated) {
            promptAuth();
        }
    }, [authResolved, isAuthenticated, promptAuth]);

    useEffect(() => {
        setItems(entries ?? []);
    }, [entries]);

    const handleDelete = async (entry) => {
        if (!entry?.id) {
            return;
        }
        const key = `${entry.type}-${entry.id}`;
        const confirmed = window.confirm('Esti sigur ca vrei sa stergi aceasta nota din jurnal?');
        if (!confirmed) {
            return;
        }

        setDeletingKey(key);
        setDeleteError(null);
        try {
            await apiFetch('/api/journal/delete', {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ entryId: entry.id, type: entry.type }),
            });
            setItems((current) => current.filter((item) => !(item.type === entry.type && item.id === entry.id)));
        } catch (error) {
            console.error('Delete journal entry error', error);
            setDeleteError(error.message || 'Nu am putut sterge nota.');
        } finally {
            setDeletingKey(null);
        }
    };

    if (!authResolved) {
        return null;
    }

    if (!isAuthenticated) {
        return (
            <>
                <Head title="Jurnal - Calming" />
                <AccentCard className="u-mt-4" dismissKey="journal-auth-prompt">
                    <div className="section-title">Conecteaza-te pentru a-ti vedea jurnalul</div>
                    <p className="muted">Autentifica-te pentru a revizui notele rapide si intrarile complete inregistrate in contul tau.</p>
                    <button className="btn primary u-mt-3" type="button" onClick={promptAuth}>Intra in cont</button>
                </AccentCard>
            </>
        );
    }

    return (
        <>
            <Head title="Jurnalul meu - Calming" />

            <main className="journal-page">
                <AccentCard className="journal-header" dismissKey="journal-header">
                    <div>
                        <h1 className="section-title">Jurnalul meu</h1>
                        <p className="muted">
                            {startDate ? `Ai inceput acest jurnal in data de ${formatDate(startDate)}.` : 'Inca nu ai intrari in jurnal.'} Pentru a adauga o nota noua, apasa{' '}
                            <Link style={{ textDecoration: 'underline' }} className="text-link" href="/journal?journal=new">aici</Link>.
                        </p>
                    </div>
                </AccentCard>

                <div className="journal-footer">
                    <Link className="profile-action secondary" href="/profile">&larr; Inapoi la profil</Link>
                </div>

                {deleteError ? <div className="error">{deleteError}</div> : null}

                <section className="card journal-section">
                    {items.length ? (
                        <ul className="journal-list">
                            {items.map((entry) => {
                                const key = `${entry.type}-${entry.id}`;
                                return (
                                    <li key={key} className="journal-item">
                                        <div className="journal-icon" aria-hidden="true">
                                            {entry.mood_emoji || '🙂'}
                                            <span className="journal-mood">{entry.mood_label || 'Stare neidentificata'}</span>
                                        </div>
                                        <div className="journal-body">
                                            <div className="journal-meta">
                                                <div>
                                                    <span className="journal-date">{formatDateTime(entry.created_at)}</span>
                                                    <span className="journal-type">{entry.type === 'quick' ? 'Nota rapida' : ''}</span>
                                                </div>
                                                <div className="journal-actions">
                                                    <button type="button" className="journal-delete" onClick={() => handleDelete(entry)} disabled={deletingKey === key}>
                                                        {deletingKey === key ? 'Se sterge...' : 'Sterge'}
                                                    </button>
                                                </div>
                                            </div>
                                            {entry.notes ? <div className="journal-notes">{entry.notes}</div> : null}
                                            {entry.contexts?.length ? <div className="journal-tags"><span className="label">Context:</span><span>{entry.contexts.join(', ')}</span></div> : null}
                                            {entry.symptoms?.length ? <div className="journal-tags"><span className="label">Simptome:</span><span>{entry.symptoms.join(', ')}</span></div> : null}
                                        </div>
                                    </li>
                                );
                            })}
                        </ul>
                    ) : (
                        <div className="muted">Nu exista inregistrari in jurnal in acest moment.</div>
                    )}
                </section>
            </main>
        </>
    );
}

function formatDate(dateString) {
    if (!dateString) {
        return '';
    }
    return new Date(dateString).toLocaleDateString('ro-RO', { day: 'numeric', month: 'long', year: 'numeric' });
}

function formatDateTime(dateString) {
    if (!dateString) {
        return '';
    }
    return new Date(dateString).toLocaleString('ro-RO', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

JournalPage.layout = (page) => <AppLayout>{page}</AppLayout>;
