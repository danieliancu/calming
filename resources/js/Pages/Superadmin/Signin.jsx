import AppLayout from '@/Layouts/AppLayout';
import { Head, useForm, usePage } from '@inertiajs/react';

export default function SuperadminSignin() {
    const page = usePage();
    const form = useForm({
        username: '',
        password: '',
    });

    const submit = (event) => {
        event.preventDefault();
        form.post(route('superadmin.signin.store'));
    };

    return (
        <>
            <Head title="Superadmin Sign In - Calming" />
            <section className="card psych-card superadmin-auth">
                <div className="section-title">Superadmin</div>
                <p className="muted u-mt-2">Autentificare pentru validarea psihologilor si aprobarea articolelor.</p>
                {page.props.flash?.status ? <div className="info u-mt-3">{page.props.flash.status}</div> : null}
                {Object.keys(form.errors).length ? <div className="error u-mt-3">{Object.values(form.errors)[0]}</div> : null}

                <form className="form-grid u-mt-4" onSubmit={submit}>
                    <label>
                        <span>Username</span>
                        <input value={form.data.username} onChange={(event) => form.setData('username', event.target.value)} required />
                    </label>
                    <label>
                        <span>Parola</span>
                        <input type="password" value={form.data.password} onChange={(event) => form.setData('password', event.target.value)} required />
                    </label>
                    <div className="validation-actions superadmin-auth__actions">
                        <button className="btn primary" type="submit" disabled={form.processing}>
                            {form.processing ? 'Se autentifica...' : 'Intra in dashboard'}
                        </button>
                    </div>
                </form>
            </section>
        </>
    );
}

SuperadminSignin.layout = (page) => <AppLayout>{page}</AppLayout>;
