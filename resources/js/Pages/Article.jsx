import AppLayout from '@/Layouts/AppLayout';
import { useAuth } from '@/contexts/AuthContext';
import { recordGuestArticleView } from '@/lib/guestActivity';
import { apiFetch } from '@/lib/http';
import { Head, Link, router } from '@inertiajs/react';
import { FiArrowLeft, FiBookmark, FiBookmarkFilled, FiChevronRight, FiClock, FiCopy, FiFacebook, FiLinkedin, FiShare2, FiTiktok, FiUser, FiWhatsapp, FiX } from '@/lib/icons';
import { useEffect, useMemo, useRef, useState } from 'react';

function hasHtmlContent(value) {
    return /<\/?[a-z][\s\S]*>/i.test(value ?? '');
}

function stripHtml(value) {
    return (value ?? '').replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
}

function truncateText(value, maxLength = 160) {
    if (!value || value.length <= maxLength) {
        return value;
    }

    return `${value.slice(0, maxLength - 1).trimEnd()}…`;
}

export default function Article({ article, related }) {
    const { isAuthenticated, promptAuth, refreshAuth } = useAuth();
    const [saved, setSaved] = useState(Boolean(article?.is_saved));
    const [busy, setBusy] = useState(false);
    const [shareOpen, setShareOpen] = useState(false);
    const [copyState, setCopyState] = useState('idle');
    const shareRef = useRef(null);

    useEffect(() => {
        if (article?.id) {
            recordGuestArticleView({ id: article.id, slug: article.slug, title: article.title });
        }
    }, [article?.id, article?.slug, article?.title]);

    useEffect(() => {
        if (!shareOpen) {
            return undefined;
        }

        const handlePointerDown = (event) => {
            if (shareRef.current && !shareRef.current.contains(event.target)) {
                setShareOpen(false);
            }
        };

        document.addEventListener('mousedown', handlePointerDown);

        return () => document.removeEventListener('mousedown', handlePointerDown);
    }, [shareOpen]);

    if (!article) {
        return null;
    }

    const articleUrl = typeof window !== 'undefined'
        ? window.location.href
        : route('article.show', article.slug);

    const shareTargets = useMemo(() => ([
        {
            id: 'facebook',
            label: 'Facebook',
            href: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(articleUrl)}`,
            icon: FiFacebook,
        },
        {
            id: 'whatsapp',
            label: 'WhatsApp',
            href: `https://wa.me/?text=${encodeURIComponent(`${article.title} ${articleUrl}`)}`,
            icon: FiWhatsapp,
        },
        {
            id: 'linkedin',
            label: 'LinkedIn',
            href: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(articleUrl)}`,
            icon: FiLinkedin,
        },
        {
            id: 'tiktok',
            label: 'TikTok',
            href: 'https://www.tiktok.com/upload',
            icon: FiTiktok,
        },
    ]), [article.title, articleUrl]);

    const articleDescription = truncateText(
        stripHtml(article.excerpt || article.summary || article.body || 'Îndrumare confidențială pentru echilibrul tău.'),
        170,
    );

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

        if (!isAuthenticated) {
            promptAuth();
            return;
        }

        setBusy(true);
        try {
            if (saved) {
                await apiFetch(`/api/articles/${article.id}/save`, { method: 'DELETE' });
                setSaved(false);
            } else {
                await apiFetch(`/api/articles/${article.id}/save`, { method: 'POST' });
                setSaved(true);
                await refreshAuth();
            }
        } catch (error) {
            console.error('Article save failed', error);
        } finally {
            setBusy(false);
        }
    };

    const handleBookmarkClick = () => {
        if (!saved) {
            return;
        }

        router.visit(route('favorite-articles'));
    };

    const handleShareToggle = async () => {
        if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
            try {
                await navigator.share({
                    title: article.title,
                    text: article.title,
                    url: articleUrl,
                });
                return;
            } catch (error) {
                if (error?.name !== 'AbortError') {
                    console.error('Share failed', error);
                }
            }
        }

        setShareOpen((current) => !current);
    };

    const handleCopyLink = async () => {
        try {
            await navigator.clipboard.writeText(articleUrl);
            setCopyState('copied');
            window.setTimeout(() => setCopyState('idle'), 1800);
        } catch (error) {
            console.error('Copy failed', error);
            setCopyState('error');
            window.setTimeout(() => setCopyState('idle'), 1800);
        }
    };

    return (
        <>
            <Head title={`${article.title} - Calming`}>
                <meta name="description" content={articleDescription} />
                <meta property="og:title" content={`${article.title} - Calming`} />
                <meta property="og:description" content={articleDescription} />
                <meta property="og:type" content="article" />
                <meta property="og:image" content={article.hero_image} />
                <meta property="og:url" content={articleUrl} />
                <meta name="twitter:card" content="summary_large_image" />
                <meta name="twitter:title" content={`${article.title} - Calming`} />
                <meta name="twitter:description" content={articleDescription} />
                <meta name="twitter:image" content={article.hero_image} />
            </Head>

            <article className="card article-shell">
                <div className="action-bar">
                    <div>
                        <button type="button" className="icon" onClick={() => router.visit('/learn')} aria-label="Inapoi">
                            <FiArrowLeft />
                        </button>
                    </div>
                    <div className="row u-gap-4">
                        <button
                            type="button"
                            className={`icon ${saved ? 'icon-active' : ''}`}
                            onClick={handleBookmarkClick}
                            aria-label={saved ? 'Deschide articolele favorite' : 'Articol nesalvat'}
                        >
                            {saved ? <FiBookmarkFilled /> : <FiBookmark />}
                        </button>
                        <div className="article-share" ref={shareRef}>
                            <button type="button" className="icon" onClick={handleShareToggle} aria-label="Distribuie articolul" aria-expanded={shareOpen}>
                                <FiShare2 />
                            </button>
                            {shareOpen ? (
                                <div className="article-share-menu">
                                    <div className="article-share-head">
                                        <strong>Distribuie articolul</strong>
                                        <button type="button" className="article-share-close" onClick={() => setShareOpen(false)} aria-label="Inchide">
                                            <FiX />
                                        </button>
                                    </div>
                                    <div className="article-share-list">
                                        {shareTargets.map((target) => {
                                            const Icon = target.icon;
                                            return (
                                                <a
                                                    key={target.id}
                                                    className="article-share-link"
                                                    href={target.href}
                                                    target="_blank"
                                                    rel="noreferrer"
                                                >
                                                    <Icon />
                                                    <span>{target.label}</span>
                                                </a>
                                            );
                                        })}
                                        <button type="button" className="article-share-link article-share-link--copy" onClick={handleCopyLink}>
                                            <FiCopy />
                                            <span>{copyState === 'copied' ? 'Link copiat' : copyState === 'error' ? 'Nu s-a copiat' : 'Copiaza linkul'}</span>
                                        </button>
                                    </div>
                                </div>
                            ) : null}
                        </div>
                    </div>
                </div>
                <img className="article-image" src={article.hero_image} alt="Ilustratie articol" />

                <div className="article-header">
                    <div className="row gap-tight u-mb-2">
                        <span className="chip">{article.category || article.tag}</span>
                        <span className="muted article-meta" style={{ display:"flex", alignItems:"center", gap:"5px" }}>
                            <FiClock /> {article.minutes} min
                        </span>
                    </div>
                    <h1 className="article-title">{article.title}</h1>
                    <div className="article-author">
                        <div className="icon" style={{ background:"rgba(74, 144, 226, 0.12)" }}>
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
                                <div className="muted u-mt-1" style={{ display:"flex", alignItems:"center", gap:"5px" }}>
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
                        {saved ? 'Articol salvat' : 'Salveaza articolul'}
                    </button>
                </div>
            </div>
        </>
    );
}

Article.layout = (page) => <AppLayout>{page}</AppLayout>;
