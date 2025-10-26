import Head from "next/head";
import { useMemo, useState } from "react";

const TYPES = ["Consultatie", "Evaluare", "Follow-up", "Consiliere online"];
const TIMES = ["09:00", "10:00", "11:00", "14:00", "15:00", "16:00"];

export default function Appointments() {
  const today = new Date();
  const [type, setType] = useState(TYPES[0]);
  const [doctor, setDoctor] = useState(null);
  const [month, setMonth] = useState(today.getMonth());
  const [year, setYear] = useState(today.getFullYear());
  const [date, setDate] = useState(null);
  const [time, setTime] = useState(null);

  const days = useMemo(() => buildMonthGrid(year, month), [year, month]);

  return (
    <>
      <Head>
        <title>Programeaza o sedinta - Calming</title>
      </Head>

      <section className="card accent">
        <div className="section-title">Tip sedinta</div>
        <div className="row wrap">
          {TYPES.map((entry) => (
            <button
              key={entry}
              className={`btn ${entry === type ? "primary" : ""}`}
              onClick={() => setType(entry)}
            >
              {entry}
            </button>
          ))}
        </div>
      </section>

      <section className="card u-mt-4">
        <div className="section-title">Alege data</div>
        <div className="row u-mb-2">
          <button className="btn" onClick={() => goPrevMonth(setMonth, setYear, month, year)}>
            &lt;
          </button>
          <div className="grow u-text-center u-text-semibold">
            {MONTHS[month]} {year}
          </div>
          <button className="btn" onClick={() => goNextMonth(setMonth, setYear, month, year)}>
            &gt;
          </button>
        </div>
        <div className="calendar">
          {WEEKDAYS_SHORT.map((day) => (
            <div key={day} className="cal-h">
              {day}
            </div>
          ))}
          {days.map((day, index) => (
            <button
              key={index}
              className={`cal-d ${isSameDay(date, day) ? "sel" : ""} ${day.getMonth() !== month ? "mut" : ""}`}
              onClick={() => setDate(day)}
            >
              {day.getDate()}
            </button>
          ))}
        </div>
      </section>

      <section className="card u-mt-4">
        <div className="section-title">Alege ora</div>
        <div className="row wrap">
          {TIMES.map((slot) => (
            <button
              key={slot}
              className={`btn ${slot === time ? "primary" : ""}`}
              onClick={() => setTime(slot)}
            >
              {slot}
            </button>
          ))}
        </div>
      </section>

      <section className="card u-mt-4">
        <div className="row">
          <div className="grow">
            <div>
              <b>{type}</b>
              {doctor ? ` / ${doctor.name}` : ""}
            </div>
            <div className="muted">
              {date ? formatDate(date) : "Selecteaza data"} {time ? `/ ${time}` : ""}
            </div>
          </div>
          <button className="btn primary">Confirma programarea</button>
        </div>
      </section>
    </>
  );
}

const MONTHS = [
  "ianuarie",
  "februarie",
  "martie",
  "aprilie",
  "mai",
  "iunie",
  "iulie",
  "august",
  "septembrie",
  "octombrie",
  "noiembrie",
  "decembrie",
];

const WEEKDAYS = ["luni", "marti", "miercuri", "joi", "vineri", "sambata", "duminica"];
const WEEKDAYS_SHORT = ["Lu", "Ma", "Mi", "Jo", "Vi", "Sa", "Du"];

function goNextMonth(setMonth, setYear, month, year) {
  if (month === 11) {
    setMonth(0);
    setYear(year + 1);
  } else {
    setMonth(month + 1);
  }
}

function goPrevMonth(setMonth, setYear, month, year) {
  if (month === 0) {
    setMonth(11);
    setYear(year - 1);
  } else {
    setMonth(month - 1);
  }
}

function buildMonthGrid(year, month) {
  const firstDay = new Date(year, month, 1);
  const start = new Date(firstDay);
  const offset = (firstDay.getDay() + 6) % 7; // Monday index
  start.setDate(firstDay.getDate() - offset);

  const cells = [];
  for (let index = 0; index < 42; index += 1) {
    const item = new Date(start);
    item.setDate(start.getDate() + index);
    cells.push(item);
  }
  return cells;
}

function isSameDay(a, b) {
  if (!a || !b) {
    return false;
  }
  return a.toDateString() === b.toDateString();
}

function formatDate(date) {
  const weekday = WEEKDAYS[(date.getDay() + 6) % 7];
  return `${weekday}, ${date.getDate()} ${MONTHS[date.getMonth()]}`;
}
