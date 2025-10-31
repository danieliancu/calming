import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import { FiChevronRight, FiClock, FiUser, FiArrowLeft, FiBookmark, FiShare2 } from "react-icons/fi";
import { query } from "@/lib/db";

export default function Article({ article, related }) {
  const router = useRouter();

  if (!article) {
    return null;
  }

  const sections = article.body ? article.body.split(/\n{2,}/).filter(Boolean) : [];

  return (
    <>
      <Head>
        <meta charSet="utf-8" />
        <title>{`${article.title} - Calming`}</title>
      </Head>

      <article className="card article-shell">
        <div className="action-bar">
          <div>
            <button type="button" className="icon" onClick={() => router.back()} aria-label="Inapoi">
              <FiArrowLeft />
            </button>
          </div>
          <div className="row u-gap-4">
            <div className="icon">
              <FiBookmark />
            </div>
            <div className="icon">
              <FiShare2 />
            </div>
          </div>
        </div>
        <img className="article-image" src={article.hero_image} alt="Ilustratie articol" />

        <div className="article-header">
          <div className="row gap-tight u-mb-2">
            <span className="chip">{article.tag}</span>
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

        <div className="article-body">
          {sections.map((section, index) => (
            <p key={index}>{section}</p>
          ))}
        </div>
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
        <button className="btn primary pill full u-mt-4">Seteaza reminder lunar</button>
      </div>
    </>
  );
}

export async function getServerSideProps({ params }) {
  const slug = params?.slug;
  if (!slug) {
    return { notFound: true };
  }

  const rows = await query(
    "SELECT id, slug, title, tag, minutes, hero_image, author, body FROM articles WHERE slug = ? LIMIT 1",
    [slug]
  );

  if (rows.length === 0) {
    return { notFound: true };
  }

  const { id: articleId, ...article } = rows[0];

  const related = await query(
    `SELECT a.slug, a.title, a.minutes
     FROM related_articles r
     JOIN articles a ON a.id = r.related_article_id
     WHERE r.article_id = ?
     ORDER BY r.sort_order`,
    [articleId]
  );

  return {
    props: {
      article,
      related,
    },
  };
}
