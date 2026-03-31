import { Head, Link, useForm } from '@inertiajs/react';
import { useEffect } from 'react';

export default function Login({ status, canResetPassword, redirectTo = null }) {
    const form = useForm({
        email: '',
        password: '',
        remember: false,
        redirect_to: redirectTo,
    });

    const submit = (event) => {
        event.preventDefault();
        form.post(route('login'), {
            onFinish: () => form.reset('password'),
        });
    };

    useEffect(() => {
        document.body.classList.add('auth-page');
        return () => document.body.classList.remove('auth-page');
    }, []);

    return (
        <>
            <Head title="Autentificare - Calming" />
            <div className="auth-screen">
                <div className="auth-shell">
                    <Link href="/" className="brand"><span className="brand-mark" /> Calming</Link>
                    <section className="card auth-card">
                        <div className="section-title">Autentificare</div>
                        <p className="muted">Introdu emailul si parola contului tau pentru a continua.</p>
                        {status ? <div className="info u-mt-2">{status}</div> : null}
                        {Object.keys(form.errors).length ? <div className="error u-mt-2">{form.errors.email || form.errors.password}</div> : null}
                        <form className="auth-form u-mt-4" onSubmit={submit}>
                            <label className="auth-field">
                                <span>Email</span>
                                <input type="email" value={form.data.email} onChange={(event) => form.setData('email', event.target.value)} required autoComplete="username" />
                            </label>
                            <label className="auth-field">
                                <span>Parola</span>
                                <input type="password" value={form.data.password} onChange={(event) => form.setData('password', event.target.value)} required autoComplete="current-password" />
                            </label>
                            <label className="auth-check">
                                <input type="checkbox" checked={form.data.remember} onChange={(event) => form.setData('remember', event.target.checked)} />
                                <span>Tine-ma minte</span>
                            </label>
                            <button className="btn primary u-mt-3" type="submit" disabled={form.processing}>
                                {form.processing ? 'Se conecteaza...' : 'Conecteaza-te'}
                            </button>
                        </form>
                        <div className="auth-footer auth-footer--split u-mt-3">
                            {canResetPassword ? <Link className="link-button" href={route('password.request')}>Ai uitat parola?</Link> : null}
                            <p className="muted auth-inline-text">
                                Nu ai cont? <Link href={route('register', redirectTo ? { redirectTo } : {})}>Creează unul aici</Link>.
                            </p>
                        </div>
                    </section>
                </div>
            </div>
        </>
    );
}
