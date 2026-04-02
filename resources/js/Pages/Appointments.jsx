import AccentCard from '@/Components/AccentCard';
import AppLayout from '@/Layouts/AppLayout';
import { useAuth } from '@/contexts/AuthContext';
import { apiFetch } from '@/lib/http';
import { formatAppointmentStatus, formatPaymentStatus, partitionAppointments, REMINDER_OPTIONS } from '@/lib/appointments';
import { Head, Link, router, useForm, usePage } from '@inertiajs/react';
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
    in_person: 'În cabinet',
    both: 'Online sau în cabinet',
};

export default function Appointments({
    specialist,
    types = [],
    initialTypeId,
    requestedBooking = null,
    upcomingAppointments = [],
}) {
    const page = usePage();
    const { isAuthenticated } = useAuth();
    const initialDate = requestedBooking?.date ?? null;
    const initialTime = requestedBooking?.time ?? null;
    const initialMonthDate = parseDateString(initialDate) ?? new Date();
    const [selectedTypeId, setSelectedTypeId] = useState(initialTypeId ?? types[0]?.id ?? null);
    const [month, setMonth] = useState(initialMonthDate.getMonth());
    const [year, setYear] = useState(initialMonthDate.getFullYear());
    const [selectedDate, setSelectedDate] = useState(initialDate);
    const [time, setTime] = useState(initialTime);
    const [selectedLocation, setSelectedLocation] = useState('');
    const [availableDates, setAvailableDates] = useState([]);
    const [slots, setSlots] = useState([]);
    const [loadingAvailability, setLoadingAvailability] = useState(false);
    const [availabilityError, setAvailabilityError] = useState(null);
    const [resumeNotice, setResumeNotice] = useState(null);
    const [resumeCheckPending, setResumeCheckPending] = useState(Boolean(initialDate || initialTime));
    const days = useMemo(() => buildMonthGrid(year, month), [year, month]);
    const form = useForm({
        psychologist: specialist.slug,
        appointment_type_id: initialTypeId ?? types[0]?.id ?? '',
        date: initialDate ?? '',
        time: initialTime ?? '',
    });

    const type = types.find((item) => item.id === selectedTypeId) ?? null;
    const locationOptions = useMemo(() => buildLocationOptions(type, specialist), [specialist, type]);
    const availableDateSet = useMemo(() => new Set(availableDates), [availableDates]);
    const flashStatus = page.props.flash?.status;
    const { pendingAppointments, confirmedAppointments, historyAppointments } = partitionAppointments(upcomingAppointments);

    useEffect(() => {
        if (!locationOptions.length) {
            setSelectedLocation('');
            return;
        }

        if (!locationOptions.some((option) => option.value === selectedLocation)) {
            setSelectedLocation(locationOptions[0].value);
        }
    }, [locationOptions, selectedLocation]);

    useEffect(() => {
        if (!selectedTypeId) {
            setAvailableDates([]);
            setSlots([]);
            setSelectedDate(null);
            setTime(null);
            setResumeCheckPending(false);
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
                const selectedDateStillAvailable = selectedDate && nextAvailableDates.includes(selectedDate);
                const selectedTimeStillAvailable = time && nextSlots.some((slot) => slot.label === time);

                setAvailableDates(nextAvailableDates);
                setSlots(nextSlots);

                if (selectedDate && !selectedDateStillAvailable) {
                    if (resumeCheckPending) {
                        setResumeNotice('Slotul salvat anterior nu mai este disponibil. Alege o altă dată.');
                    }
                    setSelectedDate(null);
                    setTime(null);
                } else if (!selectedDate && nextAvailableDates.length) {
                    const firstDateInMonth = nextAvailableDates.find((entry) => {
                        const date = parseDateString(entry);
                        return date && date.getMonth() === month && date.getFullYear() === year;
                    });

                    if (firstDateInMonth) {
                        setSelectedDate(firstDateInMonth);
                    }
                }

                if (time && !selectedTimeStillAvailable) {
                    if (resumeCheckPending && selectedDateStillAvailable) {
                        setResumeNotice('Ora selectată înainte de autentificare nu mai este liberă. Alege alt slot.');
                    }
                    setTime(null);
                }

                if (resumeCheckPending && selectedDateStillAvailable && (!initialTime || selectedTimeStillAvailable)) {
                    setResumeNotice('Am restaurat selecția ta dinainte de autentificare.');
                }

                if (resumeCheckPending) {
                    setResumeCheckPending(false);
                }
            })
            .catch((error) => {
                if (!active) {
                    return;
                }

                setAvailabilityError(error.message ?? 'Nu am putut incarca disponibilitatea.');
                setAvailableDates([]);
                setSlots([]);
                setResumeCheckPending(false);
            })
            .finally(() => {
                if (active) {
                    setLoadingAvailability(false);
                }
            });

        return () => {
            active = false;
        };
    }, [initialTime, month, resumeCheckPending, selectedDate, selectedTypeId, specialist.slug, time, year]);

    const handleConfirm = () => {
        if (!selectedTypeId || !selectedDate || !time) {
            return;
        }

        if (!isAuthenticated) {
            router.visit(route('login', {
                redirectTo: buildAppointmentRedirectUrl(specialist.slug, selectedTypeId, selectedDate, time),
            }));
            return;
        }

        form.transform((data) => ({
            ...data,
            psychologist: specialist.slug,
            appointment_type_id: selectedTypeId,
            date: selectedDate,
            time,
        }));
        form.post(route('appointments.store'));
    };

    return (
        <>
            <Head title={`Programează cu ${formatPsychologistName(specialist)} - Calming`} />

            <AccentCard dismissKey={`appointments-specialist-${specialist.slug}`} showClose={false}>
                <div className="section-title">Programează cu {formatPsychologistName(specialist)}</div>
                <div className="muted">
                    {specialist.city || specialist.county
                        ? `${specialist.city ?? ''}${specialist.city && specialist.county ? ', ' : ''}${specialist.county ?? ''}`
                        : specialist.supports_online
                            ? 'Disponibil pentru ședințe online'
                            : 'Disponibil pentru programări în cabinet'}
                </div>
                <div className="row wrap u-mt-3">
                    <button className="btn" type="button" onClick={() => window.history.back()}>
                        <svg stroke="currentColor" fill="currentColor" stroke-width="0" viewBox="0 0 448 512" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg"><path d="M9.4 233.4c-12.5 12.5-12.5 32.8 0 45.3l160 160c12.5 12.5 32.8 12.5 45.3 0s12.5-32.8 0-45.3L109.2 288 416 288c17.7 0 32-14.3 32-32s-14.3-32-32-32l-306.7 0L214.6 118.6c12.5-12.5 12.5-32.8 0-45.3s-32.8-12.5-45.3 0l-160 160z"></path></svg>
                        &Icirc;napoi
                    </button>
                    {specialist.phone ? <a className="btn" href={`tel:${specialist.phone}`}>Contact</a> : null}
                </div>
            </AccentCard>

            {flashStatus ? <div className="info u-mt-4">{flashStatus}</div> : null}
            {resumeNotice ? <div className="info u-mt-4">{resumeNotice}</div> : null}

            <section className="card u-mt-4">
                <div className="section-title">Alege ședința și locația</div>
                {types.length ? (
                    <div className="grid u-gap-3">
                        <label className="appointment-select-field">
                            <span className="appointment-select-label">Tip ședință</span>
                            <select
                                className="form-input"
                                value={selectedTypeId ?? ''}
                                onChange={(event) => {
                                    const nextTypeId = Number(event.target.value);
                                    setSelectedTypeId(nextTypeId);
                                    setTime(null);
                                    form.setData('appointment_type_id', nextTypeId);
                                }}
                                style={{ backgroundColor: "var(--primary-500)", color:"#fff", cursor: 'pointer' }}
                            >
                                {types.map((entry) => (
                                    <option key={entry.id} value={entry.id}>
                                        {entry.label} - {entry.duration_minutes} min - {formatMoney(entry.price_amount, entry.currency)}
                                    </option>
                                ))}
                            </select>
                        </label>
                        <label className="appointment-select-field">
                            <span className="appointment-select-label">Locație</span>
                            <select
                                className="form-input"
                                value={selectedLocation}
                                onChange={(event) => setSelectedLocation(event.target.value)}
                                disabled={!locationOptions.length}
                                style={{ backgroundColor: "var(--primary-500)", color:"#fff", cursor: 'pointer' }}
                            >
                                {locationOptions.length ? (
                                    locationOptions.map((option) => (
                                        <option key={option.value} value={option.value}>{option.label}</option>
                                    ))
                                ) : (
                                    <option value="">Nicio locație disponibilă</option>
                                )}
                            </select>
                        </label>
                    </div>
                ) : <div className="muted">Specialistul nu a configurat inca tipuri de sedinta disponibile.</div>}
                {type ? <div style={{ marginTop:"10px", marginLeft:"10px" }} className="muted u-mt-2">{LOCATION_LABELS[type.location_mode] ?? LOCATION_LABELS.both} - {type.is_paid_online ? 'Plata online la confirmare' : 'Fără plata online'}</div> : null}
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
                <div className="row wrap appointments-summary-actions">
                    <div className="grow">
                        <div>
                            <b>{type?.label ?? 'Tip ședință'}</b> / {formatPsychologistName(specialist)}
                        </div>
                        <div className="muted">
                            {selectedDate ? formatDateString(selectedDate) : 'Selecteaza data'} {time ? `/ ${time}` : ''}
                        </div>
                        {type ? <div className="muted">{formatMoney(type.price_amount, type.currency)}</div> : null}
                        {selectedLocation ? <div className="muted">{selectedLocation}</div> : null}
                    </div>
                    <button className="btn primary" type="button" onClick={handleConfirm} disabled={!selectedTypeId || !selectedDate || !time || form.processing}>
                        {form.processing ? 'Se trimite...' : isAuthenticated ? 'Trimite cererea' : 'Continuă spre autentificare'}
                    </button>
                </div>
                {!isAuthenticated ? <div style ={{ marginTop:"10px", marginLeft:"0px" }} className="muted u-mt-2">Pentru a continua, trebuie să te autentifici.</div> : null}
            </section>

            <section className="card u-mt-4">
                <div className="section-title">Sesiuni programate</div>
                {upcomingAppointments.length ? (
                    <div className="grid">
                        <AppointmentBlock title="În asteptare" items={pendingAppointments} />
                        <AppointmentBlock title="Confirmate" items={confirmedAppointments} />
                        <AppointmentBlock title="Istoric" items={historyAppointments} />
                    </div>
                ) : <div className="muted">Nu ai programări salvate momentan.</div>}
            </section>
        </>
    );
}

function AppointmentBlock({ title, items }) {
    if (!items.length) {
        return null;
    }

    return (
        <div className="u-mb-2">
            <div className="u-text-semibold u-mb-2">{title}</div>
            <div className="grid">
                {items.map((appointment) => (
                    <div key={appointment.id} className="list-item">
                        <div className="grow">
                            <div className="u-text-semibold">{appointment.type}</div>
                            <div className="simple-list__meta">{appointment.psychologist_name} · {appointment.scheduled_for}</div>
                            <div className="simple-list__meta">{formatAppointmentStatus(appointment.status)} · {formatPaymentStatus(appointment.payment_status)}</div>
                            {appointment.expires_at && appointment.status === 'pending' ? <div className="simple-list__meta">Expira la {appointment.expires_at}</div> : null}
                            {appointment.status === 'confirmed' ? (
                                <label className="u-mt-2" style={{ display: 'grid', gap: '0.35rem', maxWidth: '220px' }}>
                                    <span className="muted">Reminder email</span>
                                    <select
                                        defaultValue={appointment.reminder_minutes ? String(appointment.reminder_minutes) : 'none'}
                                        onChange={(event) => router.post(route('appointments.reminder', appointment.id), {
                                            minutes_before: event.target.value === 'none' ? null : event.target.value,
                                        }, {
                                            preserveScroll: true,
                                        })}
                                    >
                                        {REMINDER_OPTIONS.map((option) => (
                                            <option key={option.value} value={option.value}>{option.label}</option>
                                        ))}
                                    </select>
                                </label>
                            ) : null}
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
        </div>
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

function buildAppointmentRedirectUrl(slug, typeId, date, time) {
    const params = new URLSearchParams({
        psychologist: slug,
        type: String(typeId),
        date,
        time,
    });

    return `/appointments?${params.toString()}`;
}

function formatPsychologistName(entry) {
    return [entry.title, entry.name, entry.surname].filter(Boolean).join(' ').replace(/\s+/g, ' ').trim();
}

function buildLocationOptions(type, specialist) {
    if (!type) {
        return [];
    }

    const options = [];
    const addressLabel = specialist?.address?.trim() || [specialist?.city, specialist?.county].filter(Boolean).join(', ') || 'În cabinet';
    const supportsOnline = Boolean(specialist?.supports_online);

    if ((type.location_mode === 'in_person' || type.location_mode === 'both') && addressLabel) {
        options.push({ value: addressLabel, label: addressLabel });
    }

    if ((type.location_mode === 'online' || type.location_mode === 'both') && supportsOnline) {
        options.push({ value: 'Online', label: 'Online' });
    }

    return options;
}

function formatDateString(value) {
    const date = parseDateString(value);
    if (!date) {
        return value;
    }

    const weekday = WEEKDAYS[(date.getDay() + 6) % 7];
    return `${weekday}, ${date.getDate()} ${MONTHS[date.getMonth()]}`;
}

function parseDateString(value) {
    if (!value) {
        return null;
    }

    const date = new Date(`${value}T00:00:00`);
    return Number.isNaN(date.getTime()) ? null : date;
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

function formatMoney(value, currency = 'RON') {
    return new Intl.NumberFormat('ro-RO', {
        style: 'currency',
        currency: currency || 'RON',
        minimumFractionDigits: 2,
    }).format(Number(value || 0));
}

Appointments.layout = (page) => <AppLayout>{page}</AppLayout>;
