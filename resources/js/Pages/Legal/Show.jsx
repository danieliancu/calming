import AppLayout from '@/Layouts/AppLayout';
import { Head, Link } from '@inertiajs/react';

export default function LegalShow({ eyebrow = 'Legal', title, description, updatedAt, sections = [], company, navItems = [] }) {
    return (
        <>
            <Head title={`${title} - Calming`}>
                <meta name="description" content={description} />
                <meta property="og:title" content={`${title} - Calming`} />
                <meta property="og:description" content={description} />
            </Head>

            <section className="legal-page">
                <div className="legal-hero card">
                    <div className="legal-eyebrow">{eyebrow}</div>
                    <h1 className="legal-title">{title}</h1>
                    <p className="legal-description">{description}</p>
                    <div className="legal-meta">Ultima actualizare: {updatedAt}</div>
                </div>

                <div className="legal-layout">
                    <article className="card legal-content">
                        {sections.map((section) => (
                            <section key={section.heading} className="legal-section">
                                <h2>{section.heading}</h2>
                                {section.paragraphs.map((paragraph) => (
                                    <p key={paragraph}>{paragraph}</p>
                                ))}
                            </section>
                        ))}
                    </article>

                    <aside className="card legal-sidebar">
                        <div className="footer-title">Navigare</div>
                        <ul className="legal-nav">
                            {navItems.map((item) => (
                                <li key={item.href}><Link href={item.href}>{item.label}</Link></li>
                            ))}
                        </ul>
                    </aside>
                </div>
            </section>
        </>
    );
}

LegalShow.layout = (page) => <AppLayout>{page}</AppLayout>;
