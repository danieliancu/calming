import Head from "next/head";
import Link from "next/link";
import { FiAward, FiArrowRight, FiArrowLeft } from "react-icons/fi";
import {
  fetchArticlesForCategory,
  fetchCategoryBySlug,
} from "@/lib/articles/categories";

export default function LearnCategory({ category, articles }) {
  return (
    <>
      <Head>
        <title>{category.title} - Calming</title>
      </Head>

      <div className="group-convo-nav">
        <Link href="/learn" className="group-back-link">
          <FiArrowLeft aria-hidden /> Inapoi
        </Link>
      </div>

      <section className="card accent">
        <div className="section-title">
          <FiAward className="section-icon" /> Profesionalism si incredere
        </div>
        <div className="muted">
          Toate articolele din Calming sunt redactate de specialisti acreditati si trec printr-o revizuire periodica
          pentru a mentine standarde ridicate.
        </div>
      </section>

      <section className="card u-mt-4">
        <div className="section-title">
          <div className="row justify-between align-center">
            <span>{category.title}</span>
            <span className="chip">{category.articleCount} articole</span>
          </div>
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
          {articles.length === 0 ? (
            <div className="muted">Nu exista articole in aceasta categorie momentan.</div>
          ) : null}
        </div>
      </section>
    </>
  );
}

export async function getServerSideProps({ params }) {
  const slug = params?.categorySlug;
  if (!slug) {
    return { notFound: true };
  }

  const category = await fetchCategoryBySlug(slug);
  if (!category) {
    return { notFound: true };
  }

  const articles = await fetchArticlesForCategory(category.id);

  return {
    props: {
      category: {
        ...category,
        articleCount: articles.length,
      },
      articles,
    },
  };
}
