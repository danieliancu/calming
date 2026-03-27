import AccentCard from '@/Components/AccentCard';
import AppLayout from '@/Layouts/AppLayout';
import { useAuth } from '@/contexts/AuthContext';
import { apiFetch } from '@/lib/http';
import {
    defaultGuestAssistantProfile,
    getGuestAssistantState,
    saveGuestAssistantState,
    clearGuestAssistantState,
} from '@/lib/assistantGuestSession';
import { FiArrowLeft, FiMessageSquare, FiPlus, FiSend, FiX, SettingsIcon } from '@/lib/icons';
import { Head, router } from '@inertiajs/react';
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';

const FOCUS_TOPICS = [
    'Gestionarea anxietatii',
    'Echilibru munca-viata',
    'Relatii si conexiune',
    'Stima de sine si auto-compasiune',
    'Gestionarea stresului',
    'Somn si recuperare',
    'Trauma si vindecare',
    'Claritate in obiective',
];
const AGE_RANGES = ['18-24', '25-34', '35-44', '45-54', '55+'];
const GUIDANCE_STYLES = [
    { value: 'calm-empathetic', label: 'Calm si empatic' },
    { value: 'solution-focused', label: 'Direct si orientat pe solutii' },
    { value: 'motivational', label: 'Motivant si pragmatic' },
];
const THERAPY_STATUS = [
    { value: 'none', label: 'Nu merg la terapie in prezent' },
    { value: 'considering', label: 'Ma gandesc sa incep' },
    { value: 'active', label: 'Sunt in terapie activa' },
    { value: 'completed', label: 'Am incheiat recent un proces terapeutic' },
];
const ASSISTANT_MODES = [
    {
        value: 'supportive',
        label: 'Sustinere',
        description: 'Cald, empatic, bun pentru descarcare emotionala',
    },
    {
        value: 'clarity',
        label: 'Claritate',
        description: 'Pune ordine in ganduri si separa esentialul',
    },
    {
        value: 'action',
        label: 'Actiune',
        description: 'Mai direct, orientat spre pasul urmator',
    },
    {
        value: 'checkin',
        label: 'Check-in',
        description: 'Scurt, linistit, bun pentru reglare si ritm zilnic',
    },
];

function LoadingDots() {
    return (
        <div className="assistant-typing-dots" aria-hidden="true">
            <span />
            <span />
            <span />
        </div>
    );
}

export default function Assistant() {
    const { isAuthenticated, promptAuth } = useAuth();
    const threadRef = useRef(null);
    const composeInputRef = useRef(null);
    const guestStateHydratedRef = useRef(false);
    const modeMenuRef = useRef(null);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);
    const [resetting, setResetting] = useState(false);
    const [error, setError] = useState(null);
    const [messages, setMessages] = useState([]);
    const [profile, setProfile] = useState(defaultGuestAssistantProfile());
    const [limits, setLimits] = useState({ max_guest_messages: 12, max_message_chars: 1500 });
    const [guestMode, setGuestMode] = useState(!isAuthenticated);
    const [guestSessionCount, setGuestSessionCount] = useState(0);
    const [settingsOpen, setSettingsOpen] = useState(false);
    const [modeMenuOpen, setModeMenuOpen] = useState(false);
    const focusTopicSet = useMemo(() => new Set(profile.focusTopics ?? profile.focus_topics ?? []), [profile.focusTopics, profile.focus_topics]);
    const activeAssistantMode = profile.assistantMode ?? profile.assistant_mode ?? 'supportive';
    const activeAssistantModeMeta = ASSISTANT_MODES.find((mode) => mode.value === activeAssistantMode) ?? ASSISTANT_MODES[0];

    const scrollToLatestMessage = useCallback(() => {
        const thread = threadRef.current;
        if (!thread) {
            return;
        }

        thread.scrollTo({ top: thread.scrollHeight, behavior: 'smooth' });
    }, []);

    const hydrate = useCallback(async () => {
        setLoading(true);
        setError(null);
        guestStateHydratedRef.current = false;

        try {
            const payload = await apiFetch('/api/assistant/bootstrap');
            const localGuestState = getGuestAssistantState();
            const isGuest = Boolean(payload?.guest_mode);

            console.log('Assistant hydrate: payload received', {
                isGuest,
                messageCount: (payload?.messages ?? []).length,
                thread: payload?.thread,
                payloadKeys: Object.keys(payload),
            });

            setGuestMode(isGuest);
            setLimits(payload?.limits ?? { max_guest_messages: 12, max_message_chars: 1500 });

            if (isGuest) {
                setProfile({
                    ...defaultGuestAssistantProfile(),
                    ...(payload?.profile ?? {}),
                    ...(localGuestState.profile ?? {}),
                });
                setMessages(localGuestState.messages ?? []);
                setGuestSessionCount(localGuestState.sessionMessageCount ?? 0);
            } else {
                // Authenticated user
                setProfile(normalizeUserProfile(payload?.profile ?? {}));

                // CRITICAL: Ensure messages are properly set
                const msgs = Array.isArray(payload?.messages) ? payload.messages : [];
                console.log('Setting messages for authenticated user:', {
                    count: msgs.length,
                    isEmpty: msgs.length === 0,
                    firstMsg: msgs[0] ? {
                        id: msgs[0].id,
                        role: msgs[0].role,
                        contentLen: (msgs[0].content ?? '').length,
                    } : null,
                });

                setMessages(msgs);
                setGuestSessionCount(0);
            }
        } catch (err) {
            console.error('Assistant bootstrap failed', err);
            setError('Nu am putut incarca Assistantul acum.');
        }

        guestStateHydratedRef.current = true;
        setLoading(false);
    }, []);

    // Only hydrate once on mount
    useEffect(() => {
        hydrate();
    }, []);

    useEffect(() => {
        if (!guestMode || !guestStateHydratedRef.current) {
            return;
        }

        saveGuestAssistantState({
            profile,
            messages,
            sessionMessageCount: guestSessionCount,
        });
    }, [guestMode, guestSessionCount, messages, profile]);

    useEffect(() => {
        if (!modeMenuOpen) {
            return undefined;
        }

        const handlePointerDown = (event) => {
            if (modeMenuRef.current && !modeMenuRef.current.contains(event.target)) {
                setModeMenuOpen(false);
            }
        };

        document.addEventListener('mousedown', handlePointerDown);

        return () => document.removeEventListener('mousedown', handlePointerDown);
    }, [modeMenuOpen]);

    useLayoutEffect(() => {
        window.requestAnimationFrame(() => {
            window.requestAnimationFrame(() => {
                console.log('Messages updated, scrolling:', {
                    messageCount: messages.length,
                    loading,
                    guestMode,
                });
                scrollToLatestMessage();
            });
        });
    }, [messages, scrollToLatestMessage, loading]);

    useLayoutEffect(() => {
        const element = composeInputRef.current;
        if (!element) {
            return;
        }

        element.style.height = '48px';
        element.style.height = `${element.scrollHeight}px`;
    }, [input]);

    useEffect(() => {
        if (typeof window === 'undefined' || typeof document === 'undefined') {
            return undefined;
        }

        const updateViewportHeight = () => {
            const viewportHeight = Math.round(window.visualViewport?.height ?? window.innerHeight);
            document.body.style.setProperty('--assistant-viewport-height', `${viewportHeight}px`);
        };

        updateViewportHeight();

        const visualViewport = window.visualViewport;
        window.addEventListener('resize', updateViewportHeight);
        visualViewport?.addEventListener('resize', updateViewportHeight);
        visualViewport?.addEventListener('scroll', updateViewportHeight);

        return () => {
            window.removeEventListener('resize', updateViewportHeight);
            visualViewport?.removeEventListener('resize', updateViewportHeight);
            visualViewport?.removeEventListener('scroll', updateViewportHeight);
            document.body.style.removeProperty('--assistant-viewport-height');
        };
    }, []);

    const updateProfileField = (key, value) => {
        setProfile((current) => ({ ...current, [key]: value }));
    };

    const toggleTopic = (topic) => {
        setProfile((current) => {
            const existing = new Set(current.focusTopics ?? []);
            if (existing.has(topic)) {
                existing.delete(topic);
            } else if (existing.size < 10) {
                existing.add(topic);
            }

            return {
                ...current,
                focusTopics: Array.from(existing),
            };
        });
    };

    const handleSend = useCallback(async (event) => {
        event.preventDefault();
        const content = input.trim();

        if (!content || sending) {
            return;
        }

        const userLocalMsg = createLocalMessage('user', content);
        setMessages((current) => [...current, userLocalMsg]);
        setInput('');
        setSending(true);
        setError(null);

        try {
            if (guestMode) {
                const nextMessages = [...messages, userLocalMsg];
                const payload = await apiFetch('/api/assistant/guest/respond', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        guestProfile: profile,
                        assistantMode: activeAssistantMode,
                        messages: nextMessages.map((item) => ({ role: item.role, content: item.content })),
                        sessionMessageCount: guestSessionCount,
                    }),
                });

                const assistantMessage = payload?.message
                    ? payload.message
                    : createLocalMessage('assistant', 'Momentan nu am putut genera un raspuns.');

                setMessages((current) => {
                    const filtered = current.filter(m => m.id !== userLocalMsg.id);
                    return [...filtered, userLocalMsg, assistantMessage];
                });
                setGuestSessionCount(payload?.usage?.session_message_count ?? guestSessionCount + 1);
            } else {
                const payload = await apiFetch('/api/assistant/messages', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        content,
                        assistantMode: activeAssistantMode,
                    }),
                });

                setMessages((current) => {
                    const filtered = current.filter(m => m.id !== userLocalMsg.id);
                    return [
                        ...filtered,
                        payload?.user_message ?? userLocalMsg,
                        payload?.message ?? createLocalMessage('assistant', 'Momentan nu am putut genera un raspuns.'),
                    ];
                });
            }
        } catch (err) {
            console.error('Assistant send failed', err);
            setError(err?.message ?? 'Nu am putut trimite mesajul.');
        }

        setSending(false);
    }, [activeAssistantMode, guestMode, guestSessionCount, input, messages, profile, sending]);

    const handleNewConversation = useCallback(async (nextMode = null) => {
        if (resetting || loading || sending) {
            return;
        }

        const resolvedMode = nextMode ?? activeAssistantMode;
        setResetting(true);
        setError(null);
        setModeMenuOpen(false);

        try {
            if (guestMode) {
                setMessages([]);
                setInput('');
                clearGuestAssistantState();
                const nextProfile = { ...profile, assistantMode: resolvedMode };
                setProfile(nextProfile);
                saveGuestAssistantState({
                    profile: nextProfile,
                    messages: [],
                    sessionMessageCount: guestSessionCount,
                });
            } else {
                const payload = await apiFetch('/api/assistant/new-conversation', {
                    method: 'POST',
                });

                setProfile({
                    ...normalizeUserProfile(payload?.profile ?? {}),
                    assistantMode: resolvedMode,
                });
                setMessages(payload?.messages ?? []);
                setInput('');
            }
        } catch (err) {
            console.error('Assistant new conversation failed', err);
            setError('Nu am putut porni o conversatie noua acum.');
        }

        setResetting(false);
    }, [activeAssistantMode, guestMode, guestSessionCount, loading, profile, resetting, sending]);

    const guestLimitReached = guestMode && guestSessionCount >= (limits.max_guest_messages ?? 12);
    const handleSettingsClick = useCallback(() => {
        if (guestMode) {
            setSettingsOpen(true);
            return;
        }

        router.visit('/profile?edit=1&returnTo=%2Fassistant', { preserveScroll: true });
    }, [guestMode]);

    const handleModeSelect = useCallback((mode) => {
        if (mode === activeAssistantMode) {
            setModeMenuOpen(false);
            return;
        }

        handleNewConversation(mode);
    }, [activeAssistantMode, handleNewConversation]);

    const handleComposeKeyDown = useCallback((event) => {
        if (event.key !== 'Enter' || event.shiftKey) {
            return;
        }

        event.preventDefault();
        event.currentTarget.form?.requestSubmit();
    }, []);

    return (
        <>
            <Head title="Asistent AI - Calming" />
            <div className="assistant-wrapper">
                <div className="assistant-shell">
                    <AccentCard dismissKey="assistant-intro">
                        <div className="assistant-intro-head">
                            <div className="section-title">
                                <FiMessageSquare className="section-icon" /> Asistent AI
                            </div>
                        </div>
                        <div className="muted">
                            {guestMode
                                ? 'Spune ce te preocupa acum si Assistantul va raspunde tinand cont de setarile sesiunii.'
                                : 'Assistantul porneste de la profilul tau si te poate ajuta cu un check-in, clarificare sau urmatorul pas.'}
                        </div>
                    </AccentCard>

                    <section className="assistant-pane">
                        <div className="assistant-body">
                            <div className="assistant-convo-nav">
                                <button
                                    type="button"
                                    className="assistant-back-link"
                                    onClick={() => {
                                        if (typeof window !== 'undefined' && window.history.length > 1) {
                                            window.history.back();
                                            return;
                                        }

                                        router.visit('/');
                                    }}
                                >
                                    <FiArrowLeft aria-hidden /> Inapoi
                                </button>
                                <div className="assistant-convo-mode">Asistent AI: <span style={{ color:"var(--text-900)" }}>{activeAssistantModeMeta.label}</span></div>
                            </div>

                            {loading ? <div className="card muted">Se incarca Assistantul...</div> : null}
                            {error ? <div className="error">{error}</div> : null}

                            <div ref={threadRef} className="assistant-thread" role="log" aria-live="polite">
                                {messages.map((entry) => (
                                    <div key={entry.id ?? `${entry.role}-${entry.created_at ?? Math.random()}`} className={`assistant-bubble assistant-bubble--${entry.role}`}>
                                        {entry.content}
                                    </div>
                                ))}
                            </div>

                            {guestLimitReached ? (
                                <div className="assistant-limit card">
                                    <div className="section-title">Limita sesiunii a fost atinsa</div>
                                    <div className="muted">Creeaza-ti un cont pentru a continua conversatia si pentru a salva istoricul Assistantului.</div>
                                    <button className="btn primary u-mt-2" type="button" onClick={promptAuth}>Creeaza cont</button>
                                </div>
                            ) : null}

                            {sending ? (
                                <div className="assistant-typing-indicator" aria-live="polite" aria-label="Asistentul raspunde">
                                    <LoadingDots />
                                    <span>{activeAssistantModeMeta.label}</span>
                                </div>
                            ) : null}

                            <form className="assistant-form row u-mt-4" onSubmit={handleSend}>
                                <div className="assistant-compose-field grow">
                                    <div className="assistant-compose-actions" ref={modeMenuRef}>
                                        {modeMenuOpen ? (
                                            <div className="assistant-mode-menu" role="menu" aria-label="Alege modelul asistentului">
                                                {ASSISTANT_MODES.map((mode) => (
                                                    <button
                                                        key={mode.value}
                                                        type="button"
                                                        className={`assistant-mode-option${mode.value === activeAssistantMode ? ' is-active' : ''}`}
                                                        onClick={() => handleModeSelect(mode.value)}
                                                        role="menuitem"
                                                    >
                                                        <strong>{mode.label}</strong>
                                                        <span>{mode.description}</span>
                                                    </button>
                                                ))}
                                            </div>
                                        ) : null}
                                        <button
                                            type="button"
                                            className="assistant-fab assistant-new-conversation"
                                            onClick={() => setModeMenuOpen((current) => !current)}
                                            disabled={resetting || loading || sending}
                                            aria-label="Alege modelul pentru o conversatie noua"
                                            title="Alege modelul pentru o conversatie noua"
                                            aria-haspopup="menu"
                                            aria-expanded={modeMenuOpen}
                                        >
                                            <FiPlus />
                                        </button>
                                        <button
                                            type="button"
                                            className="assistant-fab assistant-title-settings"
                                            onClick={handleSettingsClick}
                                            aria-label={guestMode ? 'Setari assistant' : 'Editeaza profilul'}
                                            title={guestMode ? 'Setari assistant' : 'Editeaza profilul'}
                                        >
                                            <SettingsIcon />
                                        </button>
                                    </div>
                                    <textarea
                                        ref={composeInputRef}
                                        className="grow form-input assistant-compose-input"
                                        placeholder="Scrie un mesaj..."
                                        value={input}
                                        onChange={(event) => setInput(event.target.value)}
                                        onKeyDown={handleComposeKeyDown}
                                        maxLength={limits.max_message_chars ?? 1500}
                                        disabled={sending || loading || guestLimitReached}
                                        rows={1}
                                    />
                                </div>
                                <button className="btn primary icon-only" type="submit" disabled={sending || loading || guestLimitReached} aria-label="Trimite">
                                    <FiSend />
                                </button>
                            </form>
                        </div>
                    </section>
                </div>
            </div>
            {guestMode ? (
                <aside className={`assistant-settings-panel${settingsOpen ? ' is-open' : ''}${guestMode ? ' is-guest' : ''}`}>
                    <div className="assistant-settings-head">
                        <div>
                            <div className="title">Setari sesiune</div>
                            <div className="muted">Aceste setari se pierd la iesirea din sesiune.</div>
                        </div>
                        <button type="button" className="close assistant-settings-close" onClick={() => setSettingsOpen(false)} aria-label="Inchide setarile">
                            <FiX />
                        </button>
                    </div>

                    <GuestAssistantSettings
                        profile={profile}
                        focusTopicSet={focusTopicSet}
                        onFieldChange={updateProfileField}
                        onToggleTopic={toggleTopic}
                    />
                </aside>
            ) : null}
            {guestMode && settingsOpen ? <div className="modal-backdrop assistant-settings-backdrop" onClick={() => setSettingsOpen(false)} /> : null}
        </>
    );
}

function GuestAssistantSettings({
    profile,
    focusTopicSet,
    onFieldChange,
    onToggleTopic,
}) {
    return (
        <div className="assistant-settings-body">
            <label className="profile-label" htmlFor="guestAgeRange">Interval de varsta</label>
            <select id="guestAgeRange" className="form-input" value={profile.ageRange ?? ''} onChange={(event) => onFieldChange('ageRange', event.target.value)}>
                <option value="">Selecteaza</option>
                {AGE_RANGES.map((item) => <option key={item} value={item}>{item} ani</option>)}
            </select>

            <label className="profile-label" htmlFor="guestGuidanceStyle">Cum preferi ghidajul</label>
            <select id="guestGuidanceStyle" className="form-input" value={profile.guidanceStyle ?? 'calm-empathetic'} onChange={(event) => onFieldChange('guidanceStyle', event.target.value)}>
                {GUIDANCE_STYLES.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
            </select>

            <div className="profile-label">Pe ce arii vrei sa lucram</div>
            <div className="tags">
                {FOCUS_TOPICS.map((topic) => (
                    <button type="button" key={topic} className={`tag ${focusTopicSet.has(topic) ? 'sel' : ''}`} onClick={() => onToggleTopic(topic)}>
                        {topic}
                    </button>
                ))}
            </div>

            <label className="profile-label" htmlFor="guestTherapyStatus">Situatia ta legata de terapie</label>
            <select id="guestTherapyStatus" className="form-input" value={profile.therapyStatus ?? ''} onChange={(event) => onFieldChange('therapyStatus', event.target.value)}>
                <option value="">Selecteaza</option>
                {THERAPY_STATUS.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
            </select>
        </div>
    );
}

function normalizeUserProfile(profile) {
    return {
        ...defaultGuestAssistantProfile(),
        ...profile,
        focusTopics: profile.focus_topics ?? [],
        assistantMode: profile.assistant_mode ?? profile.assistantMode ?? 'supportive',
    };
}

function createLocalMessage(role, content) {
    return {
        id: `local-${role}-${Math.random().toString(36).slice(2)}`,
        role,
        content,
        status: 'completed',
        safety_state: 'ok',
        created_at: new Date().toISOString(),
    };
}

Assistant.layout = (page) => <AppLayout>{page}</AppLayout>;
