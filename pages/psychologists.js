import Head from "next/head";
import { useMemo, useState } from "react";
import Link from "next/link";
import { FiLock, FiCheck, FiSearch } from "react-icons/fi";
import { AiFillStar } from "react-icons/ai";
import { query } from "@/lib/db";

export default function Psychologists({ psychologists }) {
  const [q, setQ] = useState("");

  const list = useMemo(() => {
    const term = normalize(q);
    if (!term) {
      return psychologists;
    }
    return psychologists.filter((p) => normalize(`${p.full_name} ${p.specialty}`).includes(term));
  }, [psychologists, q]);

  return (
    <>
      <Head>
        <title>Ajutor - Calming</title>
      </Head>

      <section className="card accent">
        <div className="section-title">
          <FiCheck className="section-icon" /> Parteneri verificati
        </div>
        <div className="muted">Toti specialistii sunt verificati de reteaua Calming.</div>
      </section>

      <section className="card u-mt-4">
        <div className="section-title">
          <FiSearch className="section-icon" /> Cauta
        </div>
        <input
          value={q}
          onChange={(event) => setQ(event.target.value)}
          placeholder="Cauta specialisti, servicii..."
          className="form-input"
        />
      </section>

      <div className="grid psychologists-grid">
        {list.map((p) => (
          <div className="card" key={p.id}>
            <div className="row">
              <div className="grow">
                <div className="u-text-semibold">{p.full_name}</div>
                <div className="muted psychologists-meta">{p.specialty}</div>
                <div className="muted psychologists-meta">
                  {Number(p.distance_km).toFixed(1)} km <AiFillStar /> {Number(p.rating).toFixed(1)}
                </div>
              </div>
              <Link className="btn primary" href="/appointments">
                Programeaza
              </Link>
            </div>
          </div>
        ))}
        {list.length === 0 ? (
          <div className="card">
            <div className="muted">Nu am gasit specialisti care sa corespunda cautarii tale.</div>
          </div>
        ) : null}
      </div>
    </>
  );
}

export async function getServerSideProps() {
  const psychologists = await query(
    "SELECT id, full_name, specialty, rating, distance_km FROM psychologists ORDER BY rating DESC, full_name ASC"
  );
  return {
    props: {
      psychologists,
    },
  };
}

function normalize(value) {
  return (value || "")
    .toString()
    .normalize("NFD")
    .replace(/\p{Diacritic}+/gu, "")
    .toLowerCase();
}
