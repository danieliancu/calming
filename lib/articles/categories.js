import { query } from "@/lib/db";

const NON_ALPHANUMERIC_REGEX = /[^a-z0-9\s-]/g;
const WHITESPACE_REGEX = /\s+/g;

export function slugifyCategory(value) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(NON_ALPHANUMERIC_REGEX, "")
    .trim()
    .replace(WHITESPACE_REGEX, "-");
}

export async function fetchArticleTopicsWithCounts() {
  const rows = await query(`
    SELECT t.id, t.title, COALESCE(COUNT(a.id), 0) AS article_count
    FROM article_topics t
    LEFT JOIN articles a ON a.topic_id = t.id
    GROUP BY t.id, t.title
    ORDER BY t.title
  `);

  return rows.map((row) => ({
    id: row.id,
    title: row.title,
    articleCount: Number(row.article_count ?? 0),
    slug: slugifyCategory(row.title),
  }));
}

export async function fetchCategoryBySlug(slug) {
  const topics = await fetchArticleTopicsWithCounts();
  return topics.find((topic) => topic.slug === slug) ?? null;
}

export async function fetchArticlesForCategory(topicId) {
  return query(
    `
      SELECT slug, title, tag, minutes, hero_image
      FROM articles
      WHERE topic_id = ?
      ORDER BY id
    `,
    [topicId]
  );
}
