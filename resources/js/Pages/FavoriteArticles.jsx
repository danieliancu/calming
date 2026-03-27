import AppLayout from '@/Layouts/AppLayout';
import { useAuth } from '@/contexts/AuthContext';
import { FiArrowLeft } from '@/lib/icons';
import { Head, Link } from '@inertiajs/react';
import { useEffect } from 'react';

export default function FavoriteArticles({ articles = [] }) {
    const { isAuthenticated, authResolved, promptAuth } = useAuth();

    useEffect(() => {
        if (!authResolved) {
            return;
        }

        if (!isAuthenticated) {
            promptAuth();
        }
    }, [authResolved, isAuthenticated, promptAuth]);

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
                        <FiArrowLeft aria-hidden /> Inapoi
                    </Link>
                    <div className="favorite-articles-title">Articole favorite</div>
                </div>

                <section className="card favorite-articles-summary">
                    <div className="section-title">Articole favorite</div>
                    <div className="muted">
                        {articles.length === 1 ? 'Ai 1 articol salvat.' : `Ai ${articles.length} articole salvate.`}
                    </div>
                </section>

                <section className="favorite-articles-list">
                    {articles.map((article) => (
                        <Link key={article.id} href={`/article/${article.slug}`} className="card favorite-article-card">
                            <img className="favorite-article-image" src={article.hero_image} alt={`Ilustratie pentru ${article.title}`} />
                            <div className="favorite-article-copy">
                                <div className="favorite-article-heading">{article.title}</div>
                                <div className="muted">{article.author}</div>
                            </div>
                        </Link>
                    ))}
                    {articles.length === 0 ? (
                        <section className="card">
                            <div className="muted">Nu ai inca articole salvate.</div>
                        </section>
                    ) : null}
                </section>
            </main>
        </>
    );
}

FavoriteArticles.layout = (page) => <AppLayout>{page}</AppLayout>;
