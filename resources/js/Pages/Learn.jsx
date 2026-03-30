import AccentCard from '@/Components/AccentCard';
import AppLayout from '@/Layouts/AppLayout';
import { normalizeMediaUrl } from '@/lib/mediaUrl';
import { Head, Link } from '@inertiajs/react';
import { useMemo, useState } from 'react';
import { FiArrowRight, FiAward, FiGrid, FiSearch, FiStar } from '@/lib/icons';

export default function Learn({ topics, articles }) {
    const [q, setQ] = useState('');

    const filteredTopics = useMemo(() => {
        const term = q.trim().toLowerCase();
        if (!term) {
            return topics;
        }

        return topics.filter((topic) => [topic.title, topic.articleCount?.toString()].filter(Boolean).join(' ').toLowerCase().includes(term));
    }, [q, topics]);

    const filteredArticles = useMemo(() => {
        const term = q.trim().toLowerCase();
        if (!term) {
            return articles;
        }

        return articles.filter((article) => [article.title, article.category, article.tag, article.minutes?.toString()].filter(Boolean).join(' ').toLowerCase().includes(term));
    }, [articles, q]);

    return (
        <>
            <Head title="Articole - Calming" />

            <AccentCard dismissKey="learn-professionalism">
                <div className="section-title">
                    <FiAward className="section-icon" /> Profesionalism si incredere
                </div>
                <div className="muted">
                    Toate articolele sunt redactate de specialisti acreditati din reteaua Calming si sunt revizuite constant de echipa editoriala pentru acuratete.
                </div>
            </AccentCard>

            <section className="card search-card u-mt-4">
                <FiSearch className="section-icon search-card__icon" />
                <input
                    value={q}
                    onChange={(event) => setQ(event.target.value)}
                    placeholder="Cauta in categorii si articole"
                    className="form-input search-card__input"
                />
            </section>

            <section className="card u-mt-4">
                <div className="section-title">
                    <FiGrid className="section-icon" /> Categorii
                </div>
                <div className="grid cols-2">
                    {filteredTopics.map((topic) => (
                        <Link href={`/learn/${topic.slug}`} key={topic.id} className="list-item">
                            <span>{topic.title}</span>
                            <span className="chip">{topic.articleCount} articole</span>
                        </Link>
                    ))}
                    {filteredTopics.length === 0 ? <div className="muted">Nu exista categorii configurate.</div> : null}
                </div>
            </section>

            <section className="card u-mt-4">
                <div className="section-title">
                    <FiStar className="section-icon" /> Articole recomandate
                </div>
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
                                    Citeste mai mult <FiArrowRight />
                                </div>
                            </div>
                        </Link>
                    ))}
                    {filteredArticles.length === 0 ? <div className="muted">Nu exista articole recomandate momentan.</div> : null}
                </div>
            </section>
        </>
    );
}

Learn.layout = (page) => <AppLayout>{page}</AppLayout>;
