import { Head, Link, useForm } from '@inertiajs/react';
import { useEffect } from 'react';

export default function ForgotPassword({ status }) {
    const form = useForm({
        email: '',
    });

    const submit = (event) => {
        event.preventDefault();
        form.post(route('password.email'));
    };

    useEffect(() => {
        document.body.classList.add('auth-page');
        return () => document.body.classList.remove('auth-page');
    }, []);

    return (
        <>
            <Head title="Recuperare parola - Calming" />
            <div className="auth-screen auth-screen--recovery">
                <div className="auth-shell">
                    <div>
                        <Link href="/" className="brand"><span className="brand-mark" /> Calming</Link>
                        <section className="card auth-card auth-card--recovery">
                            <div className="section-title">Trimite link de resetare</div>
                            <p className="muted">
                                După trimitere, verifică inboxul și folderul spam.
                            </p>
                            {status ? <div className="info u-mt-3">{status}</div> : null}
                            {form.errors.email ? <div className="error u-mt-3">{form.errors.email}</div> : null}
                            <form className="auth-form u-mt-4" onSubmit={submit}>
                                <label className="auth-field">
                                    <span>Email</span>
                                    <input
                                        type="email"
                                        value={form.data.email}
                                        onChange={(event) => form.setData('email', event.target.value)}
                                        required
                                        autoFocus
                                        autoComplete="email"
                                        placeholder="nume@exemplu.ro"
                                    />
                                </label>
                                <button className="btn primary u-mt-2" type="submit" disabled={form.processing}>
                                    {form.processing ? 'Se trimite...' : 'Trimite emailul de resetare'}
                                </button>
                            </form>
                            <div className="auth-footer auth-footer--split u-mt-4">
                                <p className="small-text">Ti-ai amintit parola?</p>
                                <Link className="link-button" href={route('login')}>
                                    Înapoi la autentificare
                                </Link>
                            </div>
                        </section>
                    </div>
                </div>
            </div>
        </>
    );
}
