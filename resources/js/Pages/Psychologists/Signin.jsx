import { Head, Link, useForm, usePage } from '@inertiajs/react';
import { useEffect } from 'react';

export default function PsychologistSignin() {
    const page = usePage();
    const form = useForm({
        email: '',
        password: '',
    });
    const resendForm = useForm({
        email: '',
    });

    const submit = (event) => {
        event.preventDefault();
        form.post(route('psychologists.signin.store'));
    };

    const resendVerification = (event) => {
        event.preventDefault();
        resendForm.setData('email', form.data.email);
        resendForm.post(route('psychologists.verification.send'));
    };

    useEffect(() => {
        document.body.classList.add('auth-page');
        return () => document.body.classList.remove('auth-page');
    }, []);

    return (
        <>
            <Head title="Autentificare specialist - Calming" />
            <div className="auth-screen">
                <div className="auth-shell">
                    <Link href="/" className="brand"><span className="brand-mark" /> Calming</Link>
                    <section className="card auth-card">
                        <div className="section-title">Intra in dashboard</div>
                        <p className="muted">Introdu datele contului tau de partener. Dupa parola vei confirma accesul cu un cod de verificare pentru autentificare in doi pasi trimis pe email.</p>
                        {page.props.flash?.status ? <div className="info u-mt-2">{page.props.flash.status}</div> : null}
                        {form.errors.email ? <div className="error u-mt-2">{form.errors.email}</div> : null}
                        <form className="auth-form u-mt-4" onSubmit={submit}>
                            <label className="auth-field">
                                <span>Email profesional</span>
                                <input type="email" value={form.data.email} onChange={(event) => form.setData('email', event.target.value)} required autoComplete="email" />
                            </label>
                            <label className="auth-field">
                                <span>Parola</span>
                                <input type="password" value={form.data.password} onChange={(event) => form.setData('password', event.target.value)} required autoComplete="current-password" />
                            </label>
                            <button className="btn primary u-mt-3" type="submit" disabled={form.processing}>
                                {form.processing ? 'Se verifica...' : 'Autentificare'}
                            </button>
                        </form>
                        <form className="u-mt-4" onSubmit={resendVerification}>
                            <button className="btn" type="submit" disabled={!form.data.email || resendForm.processing} style={{ width:"100%" }}>
                                {resendForm.processing ? 'Se retrimite...' : 'Retrimite verificarea emailului'}
                            </button>
                        </form>
                        <p className="muted u-mt-3">Nu ai cont? <Link href={route('psychologists.signup')}>Inscrie-te aici</Link>.</p>
                    </section>
                </div>
            </div>
        </>
    );
}
