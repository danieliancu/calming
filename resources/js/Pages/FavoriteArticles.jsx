import AppLayout from '@/Layouts/AppLayout';
import { useAuth } from '@/contexts/AuthContext';
import { apiFetch } from '@/lib/http';
import { FiArrowLeft, FiX } from '@/lib/icons';
import { normalizeMediaUrl } from '@/lib/mediaUrl';
import { Head, Link } from '@inertiajs/react';
import { useEffect, useState } from 'react';

export default function FavoriteArticles({ articles = [] }) {
    const { isAuthenticated, authResolved, promptAuth } = useAuth();
    const [savedArticles, setSavedArticles] = useState(articles);
    const [busyArticleId, setBusyArticleId] = useState(null);

    useEffect(() => {
        if (!authResolved) {
            return;
        }

        if (!isAuthenticated) {
            promptAuth();
        }
    }, [authResolved, isAuthenticated, promptAuth]);

    useEffect(() => {
        setSavedArticles(articles);
    }, [articles]);

    const handleUnsave = async (event, articleId) => {
        event.preventDefault();
        event.stopPropagation();

        if (busyArticleId === articleId) {
            return;
        }

        setBusyArticleId(articleId);

        try {
            await apiFetch(`/api/articles/${articleId}/save`, { method: 'DELETE' });
            setSavedArticles((current) => current.filter((article) => article.id !== articleId));
        } catch (error) {
            console.error('Favorite article unsave failed', error);
        } finally {
            setBusyArticleId(null);
        }
    };

    if (!authResolved) {
        return null;
    }

    if (!isAuthenticated) {
        return null;
    }

    return (
        <>
            <Head title="Articole favorite - Calming" />

            <main className="favorite-articles-page">
                <div className="favorite-articles-nav">
                    <Link className="assistant-back-link" href="/profile">
                        <FiArrowLeft aria-hidden /> Înapoi
                    </Link>
                    <div className="favorite-articles-title">Articole favorite</div>
                </div>

                <section className="card favorite-articles-summary">
                    <div className="muted">
                        {savedArticles.length === 1 ? 'Ai 1 articol salvat.' : `Ai ${savedArticles.length} articole salvate.`}
                    </div>
                </section>

                <section className="favorite-articles-list">
                    {savedArticles.map((article) => (
                        <article key={article.id} className="card favorite-article-card">
                            <button
                                type="button"
                                className="favorite-article-remove"
                                aria-label={`Desalvează articolul ${article.title}`}
                                title="Desalvează articolul"
                                onClick={(event) => handleUnsave(event, article.id)}
                                disabled={busyArticleId === article.id}
                            >
                                <FiX aria-hidden />
                            </button>
                            <Link href={`/article/${article.slug}`} className="favorite-article-link">
                                <img className="favorite-article-image" src={normalizeMediaUrl(article.hero_image)} alt={`Ilustrație pentru ${article.title}`} />
                                <div className="favorite-article-copy">
                                    <div className="favorite-article-heading">{article.title}</div>
                                    <div className="muted">{article.author}</div>
                                </div>
                            </Link>
                        </article>
                    ))}
                </section>
            </main>
        </>
    );
}

FavoriteArticles.layout = (page) => <AppLayout>{page}</AppLayout>;
