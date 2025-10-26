import Head from "next/head";
import { useState } from "react";
import Link from "next/link";
import {FiLock, FiSearch } from "react-icons/fi";
import { AiFillStar } from "react-icons/ai";
const data = [
  {
    name: "Dr. Andreea Ionescu",
    specialty: "Psihoterapie cognitiv-comportamentala",
    rating: 5,
    distance: "2.3 km",
  },
  {
    name: "Mihai Popescu",
    specialty: "Psiholog clinician",
    rating: 5,
    distance: "3.1 km",
  },
  {
    name: "Ioana Radu",
    specialty: "Consiliere anxietate & stres",
    rating: 5,
    distance: "3.8 km",
  },
];

export default function Psychologists() {
  const [q, setQ] = useState("");
  const list = data.filter((p) =>
    normalize(`${p.name} ${p.specialty}`).includes(normalize(q))
  );
  return (
    <>
      <Head>
        <title>Ajutor - Calming</title>
      </Head>

      <section className="card accent">
        <div className="section-title"><FiLock className="section-icon" /> Parteneri verificati</div>
        <div className="muted">Toti specialistii sunt verificati de reteaua Calming.</div>
      </section>

      <section className="card u-mt-4">
        <div className="section-title"><FiSearch className="section-icon" /> Cauta</div>
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Cauta specialisti, servicii..."
          className="form-input"
        />
      </section>

      <div className="grid psychologists-grid">
        {list.map((p) => (
          <div className="card" key={p.name}>
            <div className="row">
              <div className="grow">
                <div className="u-text-semibold">{p.name}</div>
                <div className="muted psychologists-meta">{p.specialty}</div>
                <div className="muted psychologists-meta">
                  {p.distance} <AiFillStar /> {p.rating}
                </div>
              </div>
              <Link className="btn primary" href="/appointments">
                Programeaza
              </Link>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}

function normalize(s) {
  return (s || "")
    .toString()
    .normalize("NFD")
    .replace(/\p{Diacritic}+/gu, "")
    .toLowerCase();
}


