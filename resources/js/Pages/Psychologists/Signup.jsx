import { Head, Link, useForm, usePage } from '@inertiajs/react';
import { useEffect } from 'react';

export default function PsychologistSignup() {
    const page = usePage();
    const form = useForm({
        first_name: '',
        last_name: '',
        email: '',
        password: '',
        password_confirmation: '',
    });

    const submit = (event) => {
        event.preventDefault();
        form.post(route('psychologists.signup.store'));
    };

    useEffect(() => {
        document.body.classList.add('auth-page');
        return () => document.body.classList.remove('auth-page');
    }, []);

    return (
        <>
            <Head title="Inscriere specialist - Calming" />
            <div className="auth-screen">
                <div className="auth-shell">
                    <Link href="/" className="brand"><span className="brand-mark" /> Calming</Link>
                    <section className="card auth-card">
                        <div className="section-title">Inscriere partener</div>
                        <p className="muted">Completeaza detaliile pentru a intra in reteaua Calming. Dupa acest pas iti confirmi emailul profesional, apoi continui cu validarea si autentificarea in doi pasi.</p>
                        {page.props.flash?.status ? <div className="info u-mt-2">{page.props.flash.status}</div> : null}
                        {Object.keys(form.errors).length ? <div className="error u-mt-2">{Object.values(form.errors)[0]}</div> : null}
                        <form className="auth-form u-mt-4" onSubmit={submit}>
                            <label className="auth-field">
                                <span>Prenume</span>
                                <input value={form.data.first_name} onChange={(event) => form.setData('first_name', event.target.value)} required autoComplete="given-name" />
                            </label>
                            <label className="auth-field">
                                <span>Nume</span>
                                <input value={form.data.last_name} onChange={(event) => form.setData('last_name', event.target.value)} required autoComplete="family-name" />
                            </label>
                            <label className="auth-field">
                                <span>Email profesional</span>
                                <input type="email" value={form.data.email} onChange={(event) => form.setData('email', event.target.value)} required autoComplete="email" />
                            </label>
                            <label className="auth-field">
                                <span>Parola</span>
                                <input type="password" value={form.data.password} onChange={(event) => form.setData('password', event.target.value)} required autoComplete="new-password" />
                            </label>
                            <label className="auth-field">
                                <span>Repeta parola</span>
                                <input type="password" value={form.data.password_confirmation} onChange={(event) => form.setData('password_confirmation', event.target.value)} required autoComplete="new-password" />
                            </label>
                            <button className="btn primary u-mt-3" type="submit" disabled={form.processing}>
                                {form.processing ? 'Se creeaza contul...' : 'Creeaza contul si trimite verificarea'}
                            </button>
                        </form>
                        <p className="muted u-mt-3">Ai deja cont? <Link href={route('psychologists.signin')}>Autentifica-te</Link>.</p>
                    </section>
                </div>
            </div>
        </>
    );
}
