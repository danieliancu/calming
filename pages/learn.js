import Head from "next/head";
import Link from "next/link";
import { FiSearch, FiGrid, FiStar, FiArrowRight } from "react-icons/fi";

export default function Learn() {
  const topics = [
    { title: "Gestionarea anxietatii", count: 12 },
    { title: "Somn & relaxare", count: 9 },
    { title: "Mindfulness & respiratie", count: 15 },
    { title: "Relatii & comunicare", count: 8 },
  ];

  const articles = [
    {
      tag: "Wellness",
      slug: "exercitii-de-respiratie-pentru-calm",
      title: "Exercitii de respiratie pentru calm",
      minutes: 5,
      image: "/images/calm-breathing.svg",
    },
    {
      tag: "Mindfulness",
      slug: "cum-sa-incepi-un-jurnal-al-emotiilor",
      title: "Cum sa incepi un jurnal al emotiilor",
      minutes: 7,
      image: "/images/mindful-journal.svg",
    },
    {
      tag: "Somn",
      slug: "rutina-de-seara-in-4-pasi",
      title: "Rutina de seara in 4 pasi",
      minutes: 4,
      image: "/images/night-routine.svg",
    },
  ];

  return (
    <>
      <Head>
        <title>Articole - Calming</title>
      </Head>

      <section className="card">
        <div className="section-title"><FiSearch className="section-icon" /> Cauta</div>
        <input
          className="form-input"
          placeholder="Cauta articole, videoclipuri..."
        />
      </section>

      <section className="card u-mt-4">
        <div className="section-title"><FiGrid className="section-icon" /> Categorii</div>
        <div className="grid cols-2">
          {topics.map((t) => (
            <div key={t.title} className="list-item">
              <span>{t.title}</span>
              <span className="chip">{t.count} articole</span>
            </div>
          ))}
        </div>
      </section>

      <section className="card u-mt-4">
        <div className="section-title"><FiStar className="section-icon" /> Articole recomandate</div>
        <div className="article-grid">
          {articles.map((a) => (
            <Link href={`/article/${a.slug}`} key={a.slug} className="article-card">
              <div className="thumb" aria-hidden>
                <img src={a.image} alt={a.title} />
              </div>
              <div className="ac-body">
                <div className="row justify-between">
                  <span className="chip">{a.tag}</span>
                  <span className="muted">{a.minutes} min</span>
                </div>
                <div className="ac-title">{a.title}</div>
                <div className="ac-read">Citeste mai mult <FiArrowRight /></div>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </>
  );
}
