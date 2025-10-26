import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import { FiChevronRight, FiClock, FiUser, FiArrowLeft, FiBookmark, FiShare2 } from "react-icons/fi";

const RELATED = [
  { title: "Intelegerea rezultatelor mamografiei", minutes: 4, slug: "exercitii-de-respiratie-pentru-calm" },
  { title: "Cand sa iti vezi medicul", minutes: 3, slug: "cum-sa-incepi-un-jurnal-al-emotiilor" },
  { title: "Checklist pentru autoexaminare lunara", minutes: 5, slug: "rutina-de-seara-in-4-pasi" },
];

export default function Article() {
  const router = useRouter();
  const title = formatTitle(router.query.slug);

  return (
    <>
      <Head>
        <meta charSet="utf-8" />
        <title>{`${title} - Calming`}</title>
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
        <img className="article-image" src="/images/calm-breathing.svg" alt="Ilustratie articol" />

        <div className="article-header">
          <div className="row gap-tight u-mb-2">
            <span className="chip">Wellness</span>
            <span className="muted article-meta">
              <FiClock /> 5 min
            </span>
          </div>
          <h1 className="article-title">{title}</h1>
          <div className="article-author">
            <div className="icon">
              <FiUser />
            </div>
            <div>
              <div className="muted">Dr Sarah Mitchell</div>
              <div>Specialist Psihologie</div>
            </div>
          </div>
        </div>

        <div className="article-body">
          <h3 className="article-h3">Procesul in trei pasi</h3>
          <p>
            O autoexaminare constienta implica trei pozitii: in fata oglinzii, intins pe spate si la dus. Fiecare
            pozitie te ajuta sa observi diferente si sa detectezi la timp schimbarile.
          </p>
          <div className="article-alert">
            <div className="alert-title">Retine</div>
            <p>
              Majoritatea schimbarilor nu sunt motive de alarma. Totusi, daca observi ceva neobisnuit, cel mai bine este
              sa consulti un specialist.
            </p>
          </div>
          <ol className="steps">
            <li>Inspira pe nas numarand pana la 4.</li>
            <li>Tine-ti respiratia pana la 7.</li>
            <li>Expira usor pe gura numarand pana la 8.</li>
          </ol>
        </div>
      </article>

      <div className="article-rec">
        <h3 className="h3">Alte articole</h3>
        <div className="related">
          {RELATED.map((item) => (
            <Link key={item.slug} href={`/article/${item.slug}`} className="ra-item">
              <div>
                <div className="ra-title">{item.title}</div>
                <div className="muted u-mt-1"><FiClock /> {item.minutes} min</div>
              </div>
              <FiChevronRight className="chev" aria-hidden />
            </Link>
          ))}
        </div>
        <button className="btn primary pill full u-mt-4">Seteaza reminder lunar</button>
      </div>
    </>
  );
}

function formatTitle(slug) {
  if (!slug) {
    return "Ghid respiratie";
  }
  const text = decodeURIComponent(slug);
  const words = text.split("-").map((word) => (word ? word[0].toUpperCase() + word.slice(1) : word));
  return words.join(" ");
}
