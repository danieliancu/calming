import AccentCard from '@/Components/AccentCard';
import AppLayout from '@/Layouts/AppLayout';
import { FiLock, FiTrash2, FiUser } from '@/lib/icons';
import { Head, Link, useForm, usePage } from '@inertiajs/react';

export default function AccountPage() {
    const page = usePage();
    const authUser = page.props.auth?.user;
    const accountStatus = page.props.flash?.status;
    const accountForm = useForm({
        name: authUser?.name ?? '',
        email: authUser?.email ?? '',
    });
    const passwordForm = useForm({
        current_password: '',
        password: '',
        password_confirmation: '',
    });
    const deleteForm = useForm({
        password: '',
    });

    return (
        <>
            <Head title="Contul meu - Calming" />

            <main className="journal-page" style={{ marginTop:"-30px" }}>
                <AccentCard className="journal-header" dismissKey="account-header">
                    <div>
                        <h1 className="section-title">Contul meu</h1>
                        <p className="muted">Gestioneaza datele de profil, parola si accesul la contul tau.</p>
                    </div>
                </AccentCard>

                <div className="journal-footer">
                    <Link className="profile-action secondary" href="/profile">&larr; Înapoi la profil</Link>
                </div>

                <section className="card">
                    <div className="section-title">Cont</div>
                    {accountStatus ? <div className="info u-mb-3">{accountStatus}</div> : null}

                    <div className="account-panels">
                        <form className="card subtle stack gap-3" onSubmit={(event) => {
                            event.preventDefault();
                            accountForm.patch(route('profile.update'), {
                                preserveScroll: true,
                            });
                        }}>
                            <div className="settings-item">
                                <div className="settings-leading">
                                    <span className="settings-icon-bubble"><FiUser /></span>
                                    <div className="settings-item-content">
                                        <span className="settings-item-title">Date profil</span>
                                        <span className="settings-item-muted">Actualizează numele și adresa de email asociate contului.</span>
                                    </div>
                                </div>
                            </div>
                            <label className="account-field">
                                <span className="profile-label">Nume</span>
                                <input className="form-input" value={accountForm.data.name} onChange={(event) => accountForm.setData('name', event.target.value)} />
                            </label>
                            <label className="account-field">
                                <span className="profile-label">Email</span>
                                <input className="form-input" type="email" value={accountForm.data.email} onChange={(event) => accountForm.setData('email', event.target.value)} />
                            </label>
                            {renderErrors(accountForm.errors)}
                            <div className="row wrap gap-2 account-action-row">
                                <button className="btn primary" type="submit" disabled={accountForm.processing}>
                                    {accountForm.processing ? 'Se salveaza...' : 'Salveaza datele'}
                                </button>
                            </div>
                        </form>

                        <form className="card subtle stack gap-3" onSubmit={(event) => {
                            event.preventDefault();
                            passwordForm.put(route('password.update'), {
                                preserveScroll: true,
                                onSuccess: () => passwordForm.reset(),
                            });
                        }}>
                            <div className="settings-item">
                                <div className="settings-leading">
                                    <span className="settings-icon-bubble"><FiLock /></span>
                                    <div className="settings-item-content">
                                        <span className="settings-item-title">Securitate</span>
                                        <span className="settings-item-muted">Schimba parola pentru a pastra accesul la cont in siguranta.</span>
                                    </div>
                                </div>
                            </div>
                            <label className="account-field">
                                <span className="profile-label">Parola curenta</span>
                                <input className="form-input" type="password" value={passwordForm.data.current_password} onChange={(event) => passwordForm.setData('current_password', event.target.value)} />
                            </label>
                            <label className="account-field">
                                <span className="profile-label">Parola noua</span>
                                <input className="form-input" type="password" value={passwordForm.data.password} onChange={(event) => passwordForm.setData('password', event.target.value)} />
                            </label>
                            <label className="account-field">
                                <span className="profile-label">Confirma parola noua</span>
                                <input className="form-input" type="password" value={passwordForm.data.password_confirmation} onChange={(event) => passwordForm.setData('password_confirmation', event.target.value)} />
                            </label>
                            {renderErrors(passwordForm.errors)}
                            <div className="row wrap gap-2 account-action-row">
                                <button className="btn primary" type="submit" disabled={passwordForm.processing}>
                                    {passwordForm.processing ? 'Se actualizează...' : 'Actualizează parola'}
                                </button>
                            </div>
                        </form>

                        <form className="card subtle stack gap-3" onSubmit={(event) => {
                            event.preventDefault();
                            deleteForm.delete(route('profile.destroy'), {
                                preserveScroll: true,
                            });
                        }}>
                            <div className="settings-item">
                                <div className="settings-leading">
                                    <span className="settings-icon-bubble settings-icon-bubble--danger"><FiTrash2 /></span>
                                    <div className="settings-item-content">
                                        <span className="settings-item-title">Șterge contul</span>
                                        <span className="settings-item-muted">Aceasta actiune este permanenta si va elimina accesul la profil.</span>
                                    </div>
                                </div>
                            </div>
                            <label className="account-field">
                                <span className="profile-label">Confirma cu parola curenta</span>
                                <input className="form-input" type="password" value={deleteForm.data.password} onChange={(event) => deleteForm.setData('password', event.target.value)} />
                            </label>
                            {renderErrors(deleteForm.errors)}
                            <div className="row wrap gap-2 account-action-row">
                                <button className="btn danger account-delete-button" type="submit" disabled={deleteForm.processing}>
                                    {deleteForm.processing ? 'Se șterge...' : 'Șterge contul'}
                                </button>
                            </div>
                        </form>
                    </div>
                </section>
            </main>
        </>
    );
}

function renderErrors(errors) {
    const messages = Object.values(errors ?? {});
    if (!messages.length) {
        return null;
    }

    return <div className="error">{messages[0]}</div>;
}

AccountPage.layout = (page) => <AppLayout>{page}</AppLayout>;
