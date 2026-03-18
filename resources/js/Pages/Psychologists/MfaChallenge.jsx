import { Head, Link, useForm, usePage } from '@inertiajs/react';
import { useEffect } from 'react';

export default function PsychologistMfaChallenge({ maskedEmail, purpose = 'login' }) {
    const page = usePage();
    const form = useForm({
        code: '',
    });
    const resendForm = useForm({});

    const submit = (event) => {
        event.preventDefault();
        form.post(route('psychologists.mfa.verify'));
    };

    const resend = (event) => {
        event.preventDefault();
        resendForm.post(route('psychologists.mfa.resend'));
    };

    useEffect(() => {
        document.body.classList.add('auth-page');
        return () => document.body.classList.remove('auth-page');
    }, []);

    return (
        <>
            <Head title="Confirmare autentificare in doi pasi - Calming" />
            <div className="auth-screen">
                <div className="auth-shell">
                    <Link href="/" className="brand"><span className="brand-mark" /> Calming</Link>
                    <section className="card auth-card">
                        <div className="section-title">Confirmare autentificare in doi pasi</div>
                        <p className="muted">
                            Am trimis un cod de 6 cifre pe <strong>{maskedEmail}</strong> pentru {purpose === 'login' ? 'autentificare' : 'confirmarea accesului'}.
                        </p>
                        {page.props.flash?.status ? <div className="info u-mt-2">{page.props.flash.status}</div> : null}
                        {form.errors.code ? <div className="error u-mt-2">{form.errors.code}</div> : null}
                        <form className="auth-form u-mt-4" onSubmit={submit}>
                            <label className="auth-field">
                                <span>Cod de verificare</span>
                                <input
                                    value={form.data.code}
                                    onChange={(event) => form.setData('code', event.target.value.replace(/\D/g, '').slice(0, 6))}
                                    inputMode="numeric"
                                    autoComplete="one-time-code"
                                    placeholder="123456"
                                    required
                                />
                            </label>
                            <button className="btn primary u-mt-3" type="submit" disabled={form.processing}>
                                {form.processing ? 'Se confirma...' : 'Confirma codul'}
                            </button>
                        </form>
                        <form className="u-mt-2" onSubmit={resend}>
                            <button className="btn" type="submit" disabled={resendForm.processing}>
                                {resendForm.processing ? 'Se trimite...' : 'Trimite cod nou'}
                            </button>
                        </form>
                    </section>
                </div>
            </div>
        </>
    );
}
