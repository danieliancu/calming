import AppLayout from '@/Layouts/AppLayout';
import { normalizeMediaUrl } from '@/lib/mediaUrl';
import { Head, Link } from '@inertiajs/react';
import { useMemo, useState } from 'react';
import { FiArrowLeft, FiArrowRight, FiSearch } from '@/lib/icons';

export default function LearnCategory({ category, articles }) {
    const [q, setQ] = useState('');

    const filteredArticles = useMemo(() => {
        const term = q.trim().toLowerCase();
        if (!term) {
            return articles;
        }

        return articles.filter((article) => [article.title, article.category, article.tag, article.minutes?.toString()].filter(Boolean).join(' ').toLowerCase().includes(term));
    }, [articles, q]);

    return (
        <>
            <Head title={`${category.title} - Calming`} />

            <section className="card learn-category-header">
                <div className="learn-category-header__top">
                    <Link href="/learn" className="group-back-link" aria-label="Înapoi la categorii">
                        <FiArrowLeft aria-hidden />
                    </Link>
                    <div className="learn-category-header__title-wrap">
                        <div className="section-title learn-category-header__title">{category.title}</div>
                        <span className="chip">{category.articleCount} articole</span>
                    </div>
                </div>

                <div className="search-card learn-category-header__search">
                    <FiSearch className="section-icon search-card__icon" />
                    <input
                        value={q}
                        onChange={(event) => setQ(event.target.value)}
                        placeholder={`Cauta in ${category.title}`}
                        className="form-input search-card__input"
                    />
                </div>
            </section>

            <section className="card u-mt-4">
                <div className="section-title">Articole</div>

                <div className="article-grid">
                    {filteredArticles.map((article) => (
                        <Link href={`/article/${article.slug}`} key={article.slug} className="article-card">
                            <div className="thumb" aria-hidden>
                                <img src={normalizeMediaUrl(article.hero_image)} alt={article.title} />
                            </div>
                            <div className="ac-body">
                                <div className="row justify-between">
                                    <span className="chip">{article.category || article.tag}</span>
                                    <span className="muted">{article.minutes} min</span>
                                </div>
                                <div className="ac-title">{article.title}</div>
                                <div className="ac-read">
                                    Citește mai mult <FiArrowRight />
                                </div>
                            </div>
                        </Link>
                    ))}
                    {filteredArticles.length === 0 ? <div className="muted">Nu exista articole in aceasta categorie pentru cautarea curenta.</div> : null}
                </div>
            </section>
        </>
    );
}

LearnCategory.layout = (page) => <AppLayout>{page}</AppLayout>;
