import AppLayout from '@/Layouts/AppLayout';
import SignOutAction from '@/Components/SignOutAction';
import { useAuth } from '@/contexts/AuthContext';
import { Head } from '@inertiajs/react';
import { useEffect, useState } from 'react';
import { FiBell, FiChevronRight, FiDatabase, FiFileText, FiGlobe, FiHelpCircle, FiLock, FiMoon } from '@/lib/icons';

function Toggle({ checked, onChange, id }) {
    return (
        <button type="button" className={`toggle${checked ? ' checked' : ''}`} role="switch" aria-checked={checked} aria-labelledby={id} onClick={() => onChange(!checked)}>
            <span className="toggle-track">
                <span className="toggle-thumb" />
            </span>
        </button>
    );
}

export default function Settings() {
    const [theme, setTheme] = useState('light');
    const [notificationsEnabled, setNotificationsEnabled] = useState(true);
    const { isAuthenticated, promptAuth, signOut } = useAuth();

    useEffect(() => {
        const storedTheme = localStorage.getItem('theme') || 'light';
        setTheme(storedTheme);
        document.documentElement.dataset.theme = storedTheme;

        const storedNotifications = localStorage.getItem('notifications-enabled');
        if (storedNotifications) {
            setNotificationsEnabled(storedNotifications === 'on');
        }
    }, []);

    const applyTheme = (value) => {
        setTheme(value);
        document.documentElement.dataset.theme = value;
        localStorage.setItem('theme', value);
    };

    const toggleNotifications = (nextState) => {
        setNotificationsEnabled(nextState);
        localStorage.setItem('notifications-enabled', nextState ? 'on' : 'off');
    };

    return (
        <>
            <Head title="Setari - Calming" />

            <main className="settings-main">
                <div className="card">
                    <span className="section-title">Preferinte</span>
                    <div className="grid community-group-grid">
                        <div className="list-item">
                            <div className="settings-leading">
                                <span className="settings-icon-bubble"><FiGlobe /></span>
                                <div className="settings-item-content">
                                    <span className="settings-item-title">Limba</span>
                                    <span className="settings-item-muted">Romana</span>
                                </div>
                            </div>
                            <FiChevronRight className="settings-chevron" aria-hidden />
                        </div>

                        <div className="list-item">
                            <div className="settings-leading">
                                <span className="settings-icon-bubble"><FiBell /></span>
                                <div className="settings-item-content">
                                    <span className="settings-item-title" id="notifications-label">Notificari</span>
                                    <span className="settings-item-muted">{notificationsEnabled ? 'Activate' : 'Dezactivate'}</span>
                                </div>
                            </div>
                            <Toggle checked={notificationsEnabled} onChange={toggleNotifications} id="notifications-label" />
                        </div>

                        <div className="list-item">
                            <div className="settings-leading">
                                <span className="settings-icon-bubble"><FiMoon /></span>
                                <div className="settings-item-content">
                                    <span className="settings-item-title" id="theme-label">Mod intunecat</span>
                                    <span className="settings-item-muted">{theme === 'dark' ? 'Pornit' : 'Oprit'}</span>
                                </div>
                            </div>
                            <Toggle checked={theme === 'dark'} onChange={(value) => applyTheme(value ? 'dark' : 'light')} id="theme-label" />
                        </div>
                    </div>
                </div>

                <div className="card">
                    <span className="section-title">Confidentialitate &amp; Securitate</span>
                    <div className="grid community-group-grid">
                        <div className="list-item">
                            <div className="settings-leading">
                                <span className="settings-icon-bubble"><FiLock /></span>
                                <div className="settings-item-content">
                                    <span className="settings-item-title">Setari confidentialitate</span>
                                </div>
                            </div>
                            <FiChevronRight className="settings-chevron" aria-hidden />
                        </div>

                        <div className="list-item">
                            <div className="settings-leading">
                                <span className="settings-icon-bubble"><FiDatabase /></span>
                                <div className="settings-item-content">
                                    <span className="settings-item-title">Date si stocare</span>
                                </div>
                            </div>
                            <FiChevronRight className="settings-chevron" aria-hidden />
                        </div>
                    </div>
                </div>

                <div className="card">
                    <span className="section-title">Suport</span>
                    <div className="grid community-group-grid">
                        <div className="list-item">
                            <div className="settings-leading">
                                <span className="settings-icon-bubble"><FiHelpCircle /></span>
                                <div className="settings-item-content">
                                    <span className="settings-item-title">Centru de ajutor</span>
                                </div>
                            </div>
                            <FiChevronRight className="settings-chevron" aria-hidden />
                        </div>

                        <div className="list-item">
                            <div className="settings-leading">
                                <span className="settings-icon-bubble"><FiFileText /></span>
                                <div className="settings-item-content">
                                    <span className="settings-item-title">Termeni &amp; Politici</span>
                                </div>
                            </div>
                            <FiChevronRight className="settings-chevron" aria-hidden />
                        </div>
                    </div>
                </div>

                <div className="settings-version">Calming v1.0.0</div>

                {isAuthenticated ? (
                    <SignOutAction className="settings-card settings-signout-card" onClick={signOut} />
                ) : (
                    <div className="card u-mt-4">
                        <span className="section-title">Autentificare</span>
                        <p className="muted">Conecteaza-te pentru a sincroniza preferintele pe toate dispozitivele.</p>
                        <button className="btn primary u-mt-2" type="button" onClick={promptAuth}>Intra in cont</button>
                    </div>
                )}
            </main>
        </>
    );
}

Settings.layout = (page) => <AppLayout>{page}</AppLayout>;
