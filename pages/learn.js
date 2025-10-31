import Head from "next/head";
import Link from "next/link";
import { FiSearch, FiGrid, FiStar, FiArrowRight } from "react-icons/fi";
import { query } from "@/lib/db";

export default function Learn({ topics, articles }) {
  return (
    <>
      <Head>
        <title>Articole - Calming</title>
      </Head>

      <section className="card">
        <div className="section-title">
          <FiSearch className="section-icon" /> Cauta
        </div>
        <input className="form-input" placeholder="Cauta articole, videoclipuri..." />
      </section>

      <section className="card u-mt-4">
        <div className="section-title">
          <FiGrid className="section-icon" /> Categorii
        </div>
        <div className="grid cols-2">
          {topics.map((topic) => (
            <div key={topic.id} className="list-item">
              <span>{topic.title}</span>
              <span className="chip">{topic.article_count} articole</span>
            </div>
          ))}
          {topics.length === 0 ? <div className="muted">Nu exista categorii configurate.</div> : null}
        </div>
      </section>

      <section className="card u-mt-4">
        <div className="section-title">
          <FiStar className="section-icon" /> Articole recomandate
        </div>
        <div className="article-grid">
          {articles.map((article) => (
            <Link href={`/article/${article.slug}`} key={article.slug} className="article-card">
              <div className="thumb" aria-hidden>
                <img src={article.hero_image} alt={article.title} />
              </div>
              <div className="ac-body">
                <div className="row justify-between">
                  <span className="chip">{article.tag}</span>
                  <span className="muted">{article.minutes} min</span>
                </div>
                <div className="ac-title">{article.title}</div>
                <div className="ac-read">
                  Citeste mai mult <FiArrowRight />
                </div>
              </div>
            </Link>
          ))}
          {articles.length === 0 ? <div className="muted">Nu exista articole recomandate momentan.</div> : null}
        </div>
      </section>
    </>
  );
}

export async function getServerSideProps() {
  const [topics, articles] = await Promise.all([
    query("SELECT id, title, article_count FROM article_topics ORDER BY title"),
    query(
      "SELECT slug, title, tag, minutes, hero_image FROM articles WHERE is_recommended = 1 ORDER BY id"
    ),
  ]);

  return {
    props: {
      topics,
      articles,
    },
  };
}
