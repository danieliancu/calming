import AppLayout from '@/Layouts/AppLayout';
import { useAuth } from '@/contexts/AuthContext';
import { clearGuestArticleReminder, recordGuestArticleView, setGuestArticleReminder, toggleGuestSavedArticle } from '@/lib/guestActivity';
import { apiFetch } from '@/lib/http';
import { Head, Link, router } from '@inertiajs/react';
import { FiArrowLeft, FiBookmark, FiChevronRight, FiClock, FiShare2, FiUser } from '@/lib/icons';
import { useEffect, useMemo, useState } from 'react';

function hasHtmlContent(value) {
    return /<\/?[a-z][\s\S]*>/i.test(value ?? '');
}

export default function Article({ article, related }) {
    const { isAuthenticated, promptAuth, refreshAuth } = useAuth();
    const [saved, setSaved] = useState(Boolean(article?.is_saved));
    const [reminderFrequency, setReminderFrequency] = useState(article?.reminder_frequency ?? null);
    const [busy, setBusy] = useState(false);

    useEffect(() => {
        if (article?.id) {
            recordGuestArticleView({ id: article.id, slug: article.slug, title: article.title });
        }
    }, [article?.id, article?.slug, article?.title]);

    const reminderLabel = useMemo(() => reminderFrequency ? `Reminder ${reminderFrequency}` : 'Seteaza reminder lunar', [reminderFrequency]);

    if (!article) {
        return null;
    }

    const renderBody = () => {
        if (!article.body) {
            return null;
        }

        if (hasHtmlContent(article.body)) {
            return <div className="article-body rich-content" dangerouslySetInnerHTML={{ __html: article.body }} />;
        }

        const sections = article.body.split(/\n{2,}/).filter(Boolean);

        return (
            <div className="article-body">
                {sections.map((section, index) => (
                    <p key={index}>{section}</p>
                ))}
            </div>
        );
    };

    const handleSave = async () => {
        if (busy) {
            return;
        }

        setBusy(true);
        try {
            if (isAuthenticated) {
                if (saved) {
                    await apiFetch(`/api/articles/${article.id}/save`, { method: 'DELETE' });
                    setSaved(false);
                } else {
                    await apiFetch(`/api/articles/${article.id}/save`, { method: 'POST' });
                    setSaved(true);
                    await refreshAuth();
                }
            } else {
                setSaved(toggleGuestSavedArticle({ id: article.id, slug: article.slug, title: article.title }, !saved));
            }
        } catch (error) {
            if (!isAuthenticated && !saved) {
                promptAuth();
            }
        } finally {
            setBusy(false);
        }
    };

    const handleReminder = async () => {
        if (busy) {
            return;
        }

        setBusy(true);
        try {
            if (isAuthenticated) {
                if (reminderFrequency) {
                    await apiFetch(`/api/articles/${article.id}/reminder`, { method: 'DELETE' });
                    setReminderFrequency(null);
                } else {
                    const payload = await apiFetch(`/api/articles/${article.id}/reminder`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ frequency: 'monthly' }),
                    });
                    setReminderFrequency(payload.frequency ?? 'monthly');
                    setSaved(true);
                    await refreshAuth();
                }
            } else {
                if (reminderFrequency) {
                    clearGuestArticleReminder(article.id);
                    setReminderFrequency(null);
                } else {
                    setGuestArticleReminder({ id: article.id, slug: article.slug, title: article.title }, 'monthly');
                    toggleGuestSavedArticle({ id: article.id, slug: article.slug, title: article.title }, true);
                    setSaved(true);
                    setReminderFrequency('monthly');
                }
            }
        } catch (error) {
            if (!isAuthenticated) {
                promptAuth();
            }
        } finally {
            setBusy(false);
        }
    };

    return (
        <>
            <Head title={`${article.title} - Calming`} />

            <article className="card article-shell">
                <div className="action-bar">
                    <div>
                        <button type="button" className="icon" onClick={() => router.visit('/learn')} aria-label="Inapoi">
                            <FiArrowLeft />
                        </button>
                    </div>
                    <div className="row u-gap-4">
                        <button type="button" className={`icon ${saved ? 'icon-active' : ''}`} onClick={handleSave} aria-label="Salveaza articolul">
                            <FiBookmark />
                        </button>
                        <div className="icon">
                            <FiShare2 />
                        </div>
                    </div>
                </div>
                <img className="article-image" src={article.hero_image} alt="Ilustratie articol" />

                <div className="article-header">
                    <div className="row gap-tight u-mb-2">
                        <span className="chip">{article.category || article.tag}</span>
                        <span className="muted article-meta">
                            <FiClock /> {article.minutes} min
                        </span>
                    </div>
                    <h1 className="article-title">{article.title}</h1>
                    <div className="article-author">
                        <div className="icon">
                            <FiUser />
                        </div>
                        <div>
                            <div className="muted">{article.author}</div>
                            <div>Specialist Psihologie</div>
                        </div>
                    </div>
                </div>

                {renderBody()}
            </article>

            <div className="article-rec">
                <h3 className="h3">Alte articole</h3>
                <div className="related">
                    {related.map((item) => (
                        <Link key={item.slug} href={`/article/${item.slug}`} className="ra-item">
                            <div>
                                <div className="ra-title">{item.title}</div>
                                <div className="muted u-mt-1">
                                    <FiClock /> {item.minutes} min
                                </div>
                            </div>
                            <FiChevronRight className="chev" aria-hidden />
                        </Link>
                    ))}
                    {related.length === 0 ? <div className="muted">Nu exista recomandari suplimentare.</div> : null}
                </div>
                <div className="grid grid-single u-gap-2-5 u-mt-4">
                    <button className="btn primary pill full" type="button" onClick={handleSave} disabled={busy}>
                        {saved ? 'Articol salvat' : 'Save article'}
                    </button>
                    <button className="btn pill full" type="button" onClick={handleReminder} disabled={busy}>
                        {reminderLabel}
                    </button>
                </div>
            </div>
        </>
    );
}

Article.layout = (page) => <AppLayout>{page}</AppLayout>;
