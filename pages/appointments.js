import Head from "next/head";
import { useCallback, useMemo, useState } from "react";
import { query } from "@/lib/db";
import { useAuth } from "@/contexts/AuthContext";

export default function Appointments({ types, timeSlots, psychologists }) {
  const today = new Date();
  const [selectedTypeId, setSelectedTypeId] = useState(types[0]?.id ?? null);
  const [selectedDoctorId, setSelectedDoctorId] = useState(psychologists[0]?.id ?? null);
  const [month, setMonth] = useState(today.getMonth());
  const [year, setYear] = useState(today.getFullYear());
  const [date, setDate] = useState(null);
  const [time, setTime] = useState(null);
  const { isAuthenticated, promptAuth } = useAuth();

  const days = useMemo(() => buildMonthGrid(year, month), [year, month]);

  const typeLabel = types.find((item) => item.id === selectedTypeId)?.label ?? "Tip sedinta";
  const doctor = psychologists.find((item) => item.id === selectedDoctorId) ?? null;

  const handleConfirm = useCallback(() => {
    if (!isAuthenticated) {
      promptAuth();
      return;
    }
    alert("Programarea ta a fost trimisa (demo).");
  }, [isAuthenticated, promptAuth]);

  return (
    <>
      <Head>
        <title>Programeaza o sedinta - Calming</title>
      </Head>

      <section className="card accent">
        <div className="section-title">Tip sedinta</div>
        <div className="row wrap">
          {types.map((entry) => (
            <button
              key={entry.id}
              className={`btn ${entry.id === selectedTypeId ? "primary" : ""}`}
              onClick={() => setSelectedTypeId(entry.id)}
            >
              {entry.label}
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
          {timeSlots.map((slot) => (
            <button
              key={slot.id}
              className={`btn ${slot.slot === time ? "primary" : ""}`}
              onClick={() => setTime(slot.slot)}
            >
              {slot.slot}
            </button>
          ))}
        </div>
      </section>

      <section className="card u-mt-4">
        <div className="row">
          <div className="grow">
            <div>
              <b>{typeLabel}</b>
              {doctor ? ` / ${doctor.full_name}` : ""}
            </div>
            <div className="muted">
              {date ? formatDate(date) : "Selecteaza data"} {time ? `/ ${time}` : ""}
            </div>
          </div>
          <button className="btn primary" type="button" onClick={handleConfirm}>
            Confirma programarea
          </button>
        </div>
      </section>
    </>
  );
}

export async function getServerSideProps() {
  const [types, timeSlots, psychologists] = await Promise.all([
    query("SELECT id, label FROM appointment_types ORDER BY id"),
    query("SELECT id, slot FROM appointment_time_slots ORDER BY slot"),
    query("SELECT id, full_name, specialty FROM psychologists ORDER BY rating DESC, full_name ASC"),
  ]);

  return {
    props: {
      types,
      timeSlots,
      psychologists,
    },
  };
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
