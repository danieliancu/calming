import AppLayout from '@/Layouts/AppLayout';
import { useAuth } from '@/contexts/AuthContext';
import { apiFetch } from '@/lib/http';
import { Head, Link } from '@inertiajs/react';
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { FiArrowLeft, FiLock, FiReply } from '@/lib/icons';

export default function CommunityConversations({ group }) {
    const { isAuthenticated, isPsychAuthenticated, authResolved, promptAuth } = useAuth();
    const [speakerFilter, setSpeakerFilter] = useState(null);
    const [replyTarget, setReplyTarget] = useState(null);
    const [dialogues, setDialogues] = useState(group?.dialogues ?? []);
    const [messageDraft, setMessageDraft] = useState('');
    const [submitError, setSubmitError] = useState(null);
    const messageListRef = useRef(null);
    const bottomAnchorRef = useRef(null);
    const messageInputRef = useRef(null);

    useEffect(() => {
        setDialogues(group?.dialogues ?? []);
    }, [group?.dialogues]);

    useEffect(() => {
        document.body.classList.add('group-thread-page');
        return () => document.body.classList.remove('group-thread-page');
    }, []);

    useEffect(() => {
        if (!authResolved) {
            return;
        }

        if (group && !group.isPrivate && !isAuthenticated && !isPsychAuthenticated) {
            promptAuth();
        }
    }, [authResolved, group, isAuthenticated, isPsychAuthenticated, promptAuth]);

    const scrollToLatestMessage = useCallback((behavior = 'smooth') => {
        const bottomAnchor = bottomAnchorRef.current;
        if (bottomAnchor) {
            bottomAnchor.scrollIntoView({ block: 'end', behavior });
            return;
        }

        const messageList = messageListRef.current;
        if (messageList) {
            messageList.scrollTo({ top: messageList.scrollHeight, behavior });
        }
    }, []);

    const scheduleScrollToLatestMessage = useCallback((behavior = 'auto') => {
        window.requestAnimationFrame(() => {
            window.requestAnimationFrame(() => {
                scrollToLatestMessage(behavior);
            });
        });
    }, [scrollToLatestMessage]);

    useEffect(() => {
        if (!group?.slug || (!isAuthenticated && !isPsychAuthenticated)) {
            return undefined;
        }

        let active = true;

        const syncMessages = async () => {
            try {
                const payload = await apiFetch(route('community.group.conversations.messages.index', group.slug));
                if (!active || !Array.isArray(payload.dialogues)) {
                    return;
                }

                setDialogues((current) => {
                    const currentSerialized = JSON.stringify(current ?? []);
                    const nextSerialized = JSON.stringify(payload.dialogues);

                    return currentSerialized === nextSerialized ? current : payload.dialogues;
                });
            } catch (error) {
                if (active) {
                    console.error('Community conversation sync failed', error);
                }
            }
        };

        syncMessages();
        const intervalId = window.setInterval(syncMessages, 2000);

        return () => {
            active = false;
            window.clearInterval(intervalId);
        };
    }, [group?.slug, isAuthenticated, isPsychAuthenticated]);

    const toggleSpeaker = useCallback((speaker) => {
        setSpeakerFilter((current) => (current === speaker ? null : speaker));
    }, []);

    const groupedDialogues = useMemo(() => {
        if (!dialogues) {
            return [];
        }

        const groups = {};
        dialogues.forEach((dialogue) => {
            if (!groups[dialogue.stamp]) {
                groups[dialogue.stamp] = { dateLabel: dialogue.stamp, entries: [] };
            }
            groups[dialogue.stamp].entries.push(dialogue);
        });

        return Object.values(groups);
    }, [dialogues]);

    const filteredDialogues = useMemo(() => {
        if (!speakerFilter) {
            return groupedDialogues;
        }

        return groupedDialogues
            .map((groupEntry) => {
                const filteredEntries = groupEntry.entries
                    .map((dialogue) => {
                        const messages = dialogue.messages.filter((message) => message.sender === speakerFilter);
                        return messages.length ? { ...dialogue, messages } : null;
                    })
                    .filter(Boolean);

                return filteredEntries.length ? { ...groupEntry, entries: filteredEntries } : null;
            })
            .filter(Boolean);
    }, [groupedDialogues, speakerFilter]);

    const daySummaries = useMemo(() => {
        return filteredDialogues.map((groupEntry) => ({
            dateLabel: groupEntry.dateLabel,
            messages: groupEntry.entries.flatMap((dialogue, dialogueIndex) =>
                dialogue.messages.map((message, messageIndex) => ({
                    ...message,
                    __key: `${groupEntry.dateLabel}-${dialogue.id}-${messageIndex}`,
                    __order: `${dialogueIndex}-${messageIndex}`,
                }))),
        }));
    }, [filteredDialogues]);

    useLayoutEffect(() => {
        scheduleScrollToLatestMessage('auto');
    }, [daySummaries, scheduleScrollToLatestMessage]);

    useEffect(() => {
        scheduleScrollToLatestMessage('auto');
    }, [group?.slug, scheduleScrollToLatestMessage]);

    const handleReplyClick = useCallback((message) => {
        setReplyTarget((current) => current?.key === message.__key ? null : {
            key: message.__key,
            speaker: message.sender,
            time: message.time,
        });
        window.requestAnimationFrame(() => {
            messageInputRef.current?.focus();
        });
    }, []);

    const submitMessage = useCallback(async (text, replyTo = null) => {
        if (!text.trim()) {
            return;
        }

        try {
            setSubmitError(null);
            const payload = await apiFetch(route('community.group.conversations.messages.store', group.slug), {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    text: text.trim(),
                    reply_to: replyTo,
                }),
            });

            const nextMessage = payload.message;
            setDialogues((current) => {
                const existingIndex = current.findIndex((entry) => entry.stamp === nextMessage.stamp);
                if (existingIndex === -1) {
                    return [...current, {
                        id: nextMessage.stamp,
                        stamp: nextMessage.stamp,
                        messages: [nextMessage],
                    }];
                }

                return current.map((entry, index) => index === existingIndex ? {
                    ...entry,
                    messages: [...entry.messages, nextMessage],
                } : entry);
            });
            setMessageDraft('');
            setReplyTarget(null);
            scheduleScrollToLatestMessage('auto');
        } catch (error) {
            setSubmitError(error.message || 'Nu am putut trimite mesajul.');
        }
    }, [group.slug, scheduleScrollToLatestMessage]);

    const handleMessageSubmit = useCallback((event) => {
        event.preventDefault();
        void submitMessage(messageDraft, replyTarget?.speaker ?? null);
    }, [messageDraft, replyTarget?.speaker, submitMessage]);

    const handleMessageBlur = useCallback(() => {
        if (!messageDraft.trim()) {
            setReplyTarget(null);
        }
    }, [messageDraft]);

    if (!group) {
        return null;
    }

    if (group.isPrivate && !group.canAccessConversations) {
        return (
            <>
                <Head title={`${group.name} - Acces privat`} />
                <div className="assistant-wrapper group-thread-wrapper">
                    <header className="assistant-header">
                        <div className="group-convo-nav">
                            <Link href="/community" className="group-back-link">
                                <FiArrowLeft aria-hidden /> Inapoi la comunitate
                            </Link>
                        </div>
                    </header>
                    <section className="card u-mt-4">
                        <div className="section-title"><FiLock aria-hidden /> Acces restrictionat</div>
                        <p className="muted">Acest grup este privat. Pentru a accesa conversatiile este necesara o invitatie trimisa catre contul tau.</p>
                        <div className="u-mt-4">
                            <Link href="/community" className="btn">Inapoi la comunitate</Link>
                        </div>
                    </section>
                </div>
            </>
        );
    }

    return (
        <>
            <Head title={`${group.name} - Conversatii`} />
            <div className="assistant-wrapper group-thread-wrapper">
                <header className="assistant-header">
                    <div className="group-convo-nav">
                        <Link href={`/community/${group.slug}`} className="group-back-link">
                            <FiArrowLeft aria-hidden /> Inapoi
                        </Link>
                        <div className="group-convo-title">{group.name}</div>
                    </div>
                </header>

                <div className="assistant-body" style={{ gap: 'var(--space-4)' }}>
                    <section className="group-dialog-shell" style={{ flex: 1 }}>
                        {submitError ? <div className="error u-mb-2">{submitError}</div> : null}
                        <div ref={messageListRef} className="group-dialog-list" style={{ flex: 1, overflowY: 'auto' }}>
                            {daySummaries.length > 0 ? daySummaries.map((groupEntry) => (
                                <article key={groupEntry.dateLabel} className="group-dialog-card">
                                    <header className="group-dialog-header">
                                        <span className="group-dialog-date">{groupEntry.dateLabel}</span>
                                    </header>
                                    <div className="group-dialog-thread">
                                        {groupEntry.messages.map((message) => (
                                            <div
                                                key={message.__key}
                                                className={`group-dialog-message ${message.isDemo ? 'group-dialog-message--self' : ''} ${message.replyTo ? 'group-dialog-message--reply' : ''}`}
                                            >
                                                <div className="group-dialog-message-head">
                                                    <button type="button" className={`group-dialog-speaker ${speakerFilter === message.sender ? 'is-active' : ''}`} onClick={() => toggleSpeaker(message.sender)}>
                                                        {message.sender}
                                                    </button>
                                                    {message.roleLabel ? <span className="chip chip--subtle">{message.roleLabel}</span> : null}
                                                    <span className="muted group-dialog-time">{message.time}</span>
                                                </div>
                                                <p>{message.text}</p>
                                                <div className="group-dialog-actions">
                                                    <button type="button" className="group-reply-button" onClick={() => handleReplyClick(message)} aria-label="Raspunde">
                                                        <FiReply aria-hidden />
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </article>
                            )) : <div className="group-dialog-empty muted">Nu exista mesaje pentru persoana selectata in aceasta selectie demo.</div>}
                            <div ref={bottomAnchorRef} />
                        </div>
                    </section>
                </div>

                <form className={`assistant-form row u-mt-4 group-message-compose${replyTarget ? ' has-reply-target' : ''}`} onSubmit={handleMessageSubmit}>
                    <div className="grow group-message-input-wrap">
                        <input
                            ref={messageInputRef}
                            className="form-input grow"
                            placeholder="Scrie un mesaj..."
                            value={messageDraft}
                            onChange={(event) => setMessageDraft(event.target.value)}
                            onBlur={handleMessageBlur}
                        />
                        {replyTarget ? <div className="group-reply-context muted">Raspunzi catre {replyTarget.speaker} - {replyTarget.time}</div> : null}
                    </div>
                    <button className="btn primary" type="submit">Trimite</button>
                </form>
            </div>
        </>
    );
}

CommunityConversations.layout = (page) => <AppLayout>{page}</AppLayout>;
