import AccentCard from '@/Components/AccentCard';
import AppLayout from '@/Layouts/AppLayout';
import { useAuth } from '@/contexts/AuthContext';
import { apiFetch } from '@/lib/http';
import { Head, Link, router, useForm } from '@inertiajs/react';
import { useEffect, useMemo, useState } from 'react';

const MONTHS = [
    'ianuarie',
    'februarie',
    'martie',
    'aprilie',
    'mai',
    'iunie',
    'iulie',
    'august',
    'septembrie',
    'octombrie',
    'noiembrie',
    'decembrie',
];

const WEEKDAYS = ['luni', 'marti', 'miercuri', 'joi', 'vineri', 'sambata', 'duminica'];
const WEEKDAYS_SHORT = ['Lu', 'Ma', 'Mi', 'Jo', 'Vi', 'Sa', 'Du'];
const LOCATION_LABELS = {
    online: 'Online',
    in_person: 'In cabinet',
    both: 'Online sau in cabinet',
};

export default function Appointments({ specialist, types = [], initialTypeId, upcomingAppointments = [] }) {
    const today = new Date();
    const { isAuthenticated, promptAuth } = useAuth();
    const [selectedTypeId, setSelectedTypeId] = useState(initialTypeId ?? types[0]?.id ?? null);
    const [month, setMonth] = useState(today.getMonth());
    const [year, setYear] = useState(today.getFullYear());
    const [selectedDate, setSelectedDate] = useState(null);
    const [time, setTime] = useState(null);
    const [availableDates, setAvailableDates] = useState([]);
    const [slots, setSlots] = useState([]);
    const [loadingAvailability, setLoadingAvailability] = useState(false);
    const [availabilityError, setAvailabilityError] = useState(null);
    const days = useMemo(() => buildMonthGrid(year, month), [year, month]);
    const form = useForm({
        psychologist: specialist.slug,
        appointment_type_id: initialTypeId ?? types[0]?.id ?? '',
        date: '',
        time: '',
    });

    const type = types.find((item) => item.id === selectedTypeId) ?? null;
    const availableDateSet = useMemo(() => new Set(availableDates), [availableDates]);

    useEffect(() => {
        if (!selectedTypeId) {
            setAvailableDates([]);
            setSlots([]);
            setSelectedDate(null);
            setTime(null);
            return;
        }

        let active = true;
        setLoadingAvailability(true);
        setAvailabilityError(null);

        apiFetch(`/appointments/availability?psychologist=${encodeURIComponent(specialist.slug)}&type=${selectedTypeId}&month=${formatMonthParam(year, month)}${selectedDate ? `&date=${selectedDate}` : ''}`)
            .then((payload) => {
                if (!active) {
                    return;
                }

                const nextAvailableDates = payload?.availableDates ?? [];
                const nextSlots = payload?.slots ?? [];
                setAvailableDates(nextAvailableDates);
                setSlots(nextSlots);

                if (selectedDate && !nextAvailableDates.includes(selectedDate)) {
                    setSelectedDate(null);
                    setTime(null);
                } else if (!selectedDate && nextAvailableDates.length) {
                    const firstDateInMonth = nextAvailableDates.find((entry) => {
                        const date = new Date(`${entry}T00:00:00`);
                        return date.getMonth() === month && date.getFullYear() === year;
                    });

                    if (firstDateInMonth) {
                        setSelectedDate(firstDateInMonth);
                    }
                }

                if (time && !nextSlots.some((slot) => slot.label === time)) {
                    setTime(null);
                }
            })
            .catch((error) => {
                if (!active) {
                    return;
                }

                setAvailabilityError(error.message ?? 'Nu am putut incarca disponibilitatea.');
                setAvailableDates([]);
                setSlots([]);
            })
            .finally(() => {
                if (active) {
                    setLoadingAvailability(false);
                }
            });

        return () => {
            active = false;
        };
    }, [selectedTypeId, specialist.slug, month, year, selectedDate, time]);

    const handleConfirm = () => {
        if (!selectedTypeId || !selectedDate || !time) {
            return;
        }

        if (!isAuthenticated) {
            promptAuth();
            return;
        }

        form
            .transform((data) => ({
                ...data,
                psychologist: specialist.slug,
                appointment_type_id: selectedTypeId,
                date: selectedDate,
                time,
            }))
            .post(route('appointments.store'));
    };

    return (
        <>
            <Head title={`Programeaza cu ${formatPsychologistName(specialist)} - Calming`} />

            <AccentCard dismissKey={`appointments-specialist-${specialist.slug}`}>
                <div className="section-title">Programeaza cu {formatPsychologistName(specialist)}</div>
                <div className="muted">
                    {specialist.city || specialist.county
                        ? `${specialist.city ?? ''}${specialist.city && specialist.county ? ', ' : ''}${specialist.county ?? ''}`
                        : specialist.supports_online
                            ? 'Disponibil pentru sedinte online'
                            : 'Disponibil pentru programari in cabinet'}
                </div>
                <div className="row wrap u-mt-3">
                    <Link className="btn" href="/psychologists">Inapoi la specialisti</Link>
                    {specialist.phone ? <a className="btn" href={`tel:${specialist.phone}`}>Contact</a> : null}
                </div>
            </AccentCard>

            <section className="card u-mt-4">
                <div className="section-title">Tip sedinta</div>
                {types.length ? (
                    <div className="row wrap">
                        {types.map((entry) => (
                            <button
                                key={entry.id}
                                className={`btn ${entry.id === selectedTypeId ? 'primary' : ''}`}
                                onClick={() => {
                                    setSelectedTypeId(entry.id);
                                    setTime(null);
                                    form.setData('appointment_type_id', entry.id);
                                }}
                                type="button"
                            >
                                {entry.label} · {entry.duration_minutes} min
                            </button>
                        ))}
                    </div>
                ) : <div className="muted">Specialistul nu a configurat inca tipuri de sedinta disponibile.</div>}
                {type ? <div className="muted u-mt-2">{LOCATION_LABELS[type.location_mode] ?? LOCATION_LABELS.both}</div> : null}
            </section>

            <section className="card u-mt-4">
                <div className="section-title">Alege data</div>
                <div className="row u-mb-2">
                    <button className="btn" onClick={() => goPrevMonth(setMonth, setYear, month, year)} type="button">
                        &lt;
                    </button>
                    <div className="grow u-text-center u-text-semibold">
                        {MONTHS[month]} {year}
                    </div>
                    <button className="btn" onClick={() => goNextMonth(setMonth, setYear, month, year)} type="button">
                        &gt;
                    </button>
                </div>
                <div className="calendar">
                    {WEEKDAYS_SHORT.map((day) => (
                        <div key={day} className="cal-h">
                            {day}
                        </div>
                    ))}
                    {days.map((day, index) => {
                        const dateKey = toDateKey(day);
                        const isCurrentMonth = day.getMonth() === month;
                        const isAvailable = availableDateSet.has(dateKey);
                        const isPast = startOfDay(day) < startOfDay(new Date());

                        return (
                            <button
                                key={index}
                                className={`cal-d ${isSameDayString(selectedDate, dateKey) ? 'sel' : ''} ${!isCurrentMonth ? 'mut' : ''} ${isAvailable ? 'has-availability' : ''}`}
                                onClick={() => {
                                    if (!isAvailable || isPast || !isCurrentMonth) {
                                        return;
                                    }
                                    setSelectedDate(dateKey);
                                    setTime(null);
                                }}
                                type="button"
                                disabled={!isAvailable || isPast || !isCurrentMonth}
                            >
                                {day.getDate()}
                            </button>
                        );
                    })}
                </div>
                {loadingAvailability ? <div className="muted u-mt-2">Se incarca disponibilitatea...</div> : null}
                {availabilityError ? <div className="error u-mt-2">{availabilityError}</div> : null}
            </section>

            <section className="card u-mt-4">
                <div className="section-title">Alege ora</div>
                {selectedDate ? (
                    slots.length ? (
                        <div className="row wrap">
                            {slots.map((slot) => (
                                <button
                                    key={slot.starts_at}
                                    className={`btn ${slot.label === time ? 'primary' : ''}`}
                                    onClick={() => setTime(slot.label)}
                                    type="button"
                                >
                                    {slot.label}
                                </button>
                            ))}
                        </div>
                    ) : <div className="muted">Nu exista sloturi disponibile pentru data selectata.</div>
                ) : <div className="muted">Selecteaza mai intai o data disponibila.</div>}
            </section>

            <section className="card u-mt-4">
                <div className="row wrap">
                    <div className="grow">
                        <div>
                            <b>{type?.label ?? 'Tip sedinta'}</b> / {formatPsychologistName(specialist)}
                        </div>
                        <div className="muted">
                            {selectedDate ? formatDateString(selectedDate) : 'Selecteaza data'} {time ? `/ ${time}` : ''}
                        </div>
                    </div>
                    <button className="btn primary" type="button" onClick={handleConfirm} disabled={!selectedTypeId || !selectedDate || !time || form.processing}>
                        {form.processing ? 'Se salveaza...' : 'Confirma programarea'}
                    </button>
                </div>
                {!isAuthenticated ? <div className="muted u-mt-2">Pentru confirmare este necesar sa fii autentificat.</div> : null}
            </section>

            <section className="card u-mt-4">
                <div className="section-title">Programarile mele</div>
                {upcomingAppointments.length ? (
                    <div className="grid">
                        {upcomingAppointments.map((appointment) => (
                            <div key={appointment.id} className="list-item">
                                <div>
                                    <div className="u-text-semibold">{appointment.type}</div>
                                    <div className="simple-list__meta">{appointment.psychologist_name} · {appointment.scheduled_for}</div>
                                    <div className="simple-list__meta">{formatAppointmentStatus(appointment.status)}</div>
                                </div>
                                <div className="row wrap">
                                    {appointment.psychologist_slug ? <Link className="btn" href={`/appointments?psychologist=${appointment.psychologist_slug}`}>Vezi</Link> : null}
                                    {appointment.can_cancel ? (
                                        <button
                                            type="button"
                                            className="btn"
                                            onClick={() => router.post(route('appointments.cancel', appointment.id))}
                                        >
                                            Anuleaza
                                        </button>
                                    ) : null}
                                </div>
                            </div>
                        ))}
                    </div>
                ) : <div className="muted">Nu ai programari salvate momentan.</div>}
            </section>
        </>
    );
}

function goNextMonth(setMonth, setYear, month, year) {
    if (month === 11) {
        setMonth(0);
        setYear(year + 1);
        return;
    }

    setMonth(month + 1);
}

function goPrevMonth(setMonth, setYear, month, year) {
    if (month === 0) {
        setMonth(11);
        setYear(year - 1);
        return;
    }

    setMonth(month - 1);
}

function buildMonthGrid(year, month) {
    const firstDay = new Date(year, month, 1);
    const start = new Date(firstDay);
    const offset = (firstDay.getDay() + 6) % 7;
    start.setDate(firstDay.getDate() - offset);
    const cells = [];

    for (let index = 0; index < 42; index += 1) {
        const item = new Date(start);
        item.setDate(start.getDate() + index);
        cells.push(item);
    }

    return cells;
}

function formatPsychologistName(entry) {
    return [entry.title, entry.name, entry.surname].filter(Boolean).join(' ').replace(/\s+/g, ' ').trim();
}

function formatDateString(value) {
    const date = new Date(`${value}T00:00:00`);
    const weekday = WEEKDAYS[(date.getDay() + 6) % 7];
    return `${weekday}, ${date.getDate()} ${MONTHS[date.getMonth()]}`;
}

function toDateKey(date) {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function startOfDay(date) {
    return new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
}

function isSameDayString(a, b) {
    return Boolean(a) && a === b;
}

function formatMonthParam(year, month) {
    return `${year}-${String(month + 1).padStart(2, '0')}`;
}

function formatAppointmentStatus(status) {
    switch (status) {
        case 'scheduled':
            return 'Confirmata';
        case 'cancelled_by_user':
            return 'Anulata de tine';
        case 'cancelled_by_psychologist':
            return 'Anulata de specialist';
        case 'completed':
            return 'Finalizata';
        case 'no_show':
            return 'Neonorata';
        default:
            return status;
    }
}

Appointments.layout = (page) => <AppLayout>{page}</AppLayout>;
