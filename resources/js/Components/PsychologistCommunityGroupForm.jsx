import { Head, Link, useForm } from '@inertiajs/react';

function defaultFormData(group = null) {
    return {
        title: group?.title ?? '',
        description: group?.description ?? '',
        schedule: group?.schedule ?? '',
        meeting_link: group?.meeting_link ?? '',
        focus_areas: group?.focus_areas ?? '',
        access_type: group?.access_type ?? 'private',
        invite_emails: group?.invite_emails ?? '',
    };
}

export default function PsychologistCommunityGroupForm({
    title,
    heading,
    description,
    submitLabel,
    submitProcessingLabel,
    submitMethod = 'post',
    submitRoute,
    group = null,
}) {
    const form = useForm(defaultFormData(group));
    const firstError = Object.values(form.errors)[0];

    const handleSubmit = (event) => {
        event.preventDefault();
        form.transform((data) => ({
            ...data,
            invite_emails: data.access_type === 'private' ? data.invite_emails : '',
        }));

        if (submitMethod === 'put') {
            form.put(submitRoute, { preserveScroll: true });
            return;
        }

        form.post(submitRoute, { preserveScroll: true });
    };

    return (
        <>
            <Head title={title} />
            <div className="group-convo-nav">
                <Link href={route('psychologists.dashboard', { section: 'community' })} className="group-back-link">
                    &larr; Înapoi
                </Link>
            </div>
            <section className="card psych-card psych-card--form">
                <div className="section-title">{heading}</div>
                <p className="muted">{description}</p>
                {firstError ? <div className="info-banner u-mt-2">{firstError}</div> : null}
                <form className="form-grid u-mt-3" onSubmit={handleSubmit}>
                    <label className="span-2">
                        <span>Titlu</span>
                        <input value={form.data.title} onChange={(event) => form.setData('title', event.target.value)} required />
                    </label>
                    <label className="span-2">
                        <span>Descriere</span>
                        <textarea rows={4} value={form.data.description} onChange={(event) => form.setData('description', event.target.value)} placeholder="Cerc de sprijin pentru parinti care cauta strategii blande si resurse pentru echilibru emotional in familie." required />
                    </label>
                    <label>
                        <span>Întâlniri live</span>
                        <input value={form.data.schedule} onChange={(event) => form.setData('schedule', event.target.value)} placeholder="Joi, 17:30 - 18:15" />
                    </label>
                    <label>
                        <span>Link acces</span>
                        <input type="url" value={form.data.meeting_link} onChange={(event) => form.setData('meeting_link', event.target.value)} placeholder="https://zoom.us/..." />
                    </label>
                    <label>
                        <span>Tip acces</span>
                        <select value={form.data.access_type} onChange={(event) => form.setData('access_type', event.target.value)}>
                            <option value="private">Privat</option>
                            <option value="public">Public</option>
                        </select>
                    </label>
                    <label className="span-2">
                        <span>Tag-uri</span>
                        <textarea rows={5} value={form.data.focus_areas} onChange={(event) => form.setData('focus_areas', event.target.value)} placeholder={`Ritualuri de familie\nEmotii la copii\nLimite sanatoase\nSprijin reciproc`} required />
                    </label>
                    {form.data.access_type === 'private' ? (
                        <label className="span-2">
                            <span>Invitatii prin email</span>
                            <textarea rows={4} value={form.data.invite_emails} onChange={(event) => form.setData('invite_emails', event.target.value)} placeholder={`user1@example.com\nuser2@example.com`} />
                            <span className="muted">Doar utilizatorii existenti din baza noastra vor primi invitatia. Pentru celelalte adrese vei vedea mesajul „Acest email nu face parte din baza noastra de date.”</span>
                        </label>
                    ) : null}
                    <div className="row wrap">
                        <button className="btn primary" type="submit" disabled={form.processing}>
                            {form.processing ? submitProcessingLabel : submitLabel}
                        </button>
                        <Link className="btn" href={route('psychologists.dashboard', { section: 'community' })}>
                            Renunță
                        </Link>
                    </div>
                </form>
            </section>
        </>
    );
}
