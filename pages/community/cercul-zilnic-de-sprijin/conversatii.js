import Head from "next/head";
import Link from "next/link";
import { useMemo, useState, useCallback, useEffect } from "react";
import {
  FiArrowLeft,
  FiUsers,
  FiCalendar,
  FiMessageSquare,
  FiShield,
  FiLock,
} from "react-icons/fi";
import { useAuth } from "@/contexts/AuthContext";
import { groupInfo, rawDialogues, roleLabels } from "@/lib/community/dailyCircleData";

export default function DailyCircleConversations() {
  const { isAuthenticated, promptAuth } = useAuth();
  const [speakerFilter, setSpeakerFilter] = useState(null);
  const [replyTarget, setReplyTarget] = useState(null);
  const [replyText, setReplyText] = useState("");
  const [submittedReplies, setSubmittedReplies] = useState({});
  const [postedMessages, setPostedMessages] = useState([]);

  useEffect(() => {
    document.body.classList.add("group-thread-page");
    return () => {
      document.body.classList.remove("group-thread-page");
    };
  }, []);

  useEffect(() => {
    if (!isAuthenticated) {
      promptAuth();
    }
  }, [isAuthenticated, promptAuth]);

  const toggleSpeaker = useCallback((speaker) => {
    setSpeakerFilter((current) => (current === speaker ? null : speaker));
  }, []);

  const groupedDialogues = useMemo(() => {
    const groups = {};
    rawDialogues.forEach((dialogue) => {
      const dateLabel = dialogue.stamp;
      if (!groups[dateLabel]) {
        groups[dateLabel] = { dateLabel, entries: [] };
      }
      groups[dateLabel].entries.push(dialogue);
    });
    return Object.values(groups);
  }, []);

  const filteredDialogues = useMemo(() => {
    if (!speakerFilter) {
      return groupedDialogues;
    }
    return groupedDialogues
      .map((group) => {
        const filteredEntries = group.entries
          .map((dialogue) => {
            const messages = dialogue.messages.filter((message) => message.sender === speakerFilter);
            return messages.length ? { ...dialogue, messages } : null;
          })
          .filter(Boolean);
        return filteredEntries.length ? { ...group, entries: filteredEntries } : null;
      })
      .filter(Boolean);
  }, [groupedDialogues, speakerFilter]);

  const formatTime = useCallback((date) => {
    const hours = date.getHours().toString().padStart(2, "0");
    const minutes = date.getMinutes().toString().padStart(2, "0");
    return `${hours}:${minutes}`;
  }, []);

  const daySummaries = useMemo(() => {
    const filteredPosted =
      speakerFilter && speakerFilter !== "Tu"
        ? postedMessages.filter((message) => message.sender === speakerFilter)
        : postedMessages;

    const summaries = filteredDialogues.map((group) => {
      const messages = group.entries.flatMap((dialogue, dialogueIndex) =>
        dialogue.messages.map((message, messageIndex) => ({
          ...message,
          __key: `${group.dateLabel}-${dialogue.id}-${messageIndex}`,
          __order: `${dialogueIndex}-${messageIndex}`,
        }))
      );
      return {
        dateLabel: group.dateLabel,
        messages,
      };
    });

    if (filteredPosted.length > 0) {
      summaries.push({
        dateLabel: "Astazi (demo)",
        messages: filteredPosted.map((message) => ({
          ...message,
          __key: message.__key,
        })),
      });
    }

    return summaries;
  }, [filteredDialogues, postedMessages, speakerFilter]);

  const handleReplyClick = useCallback((message) => {
    setReplyTarget((current) => {
      if (current?.key === message.__key) {
        return null;
      }
      return {
        key: message.__key,
        speaker: message.sender,
        time: message.time,
        preview: message.text,
      };
    });
    setReplyText("");
  }, []);

  const handleReplySubmit = useCallback(
    (event) => {
      event.preventDefault();
      if (!replyTarget) {
        return;
      }
      if (!isAuthenticated) {
        promptAuth();
        return;
      }
      if (!replyText.trim()) {
        return;
      }
      const replyPayload = {
        id: `reply-${Date.now()}`,
        sender: "Tu",
        time: formatTime(new Date()),
        text: replyText.trim(),
      };
      setSubmittedReplies((current) => {
        const existing = current[replyTarget.key] ?? [];
        return {
          ...current,
          [replyTarget.key]: [...existing, replyPayload],
        };
      });
      setReplyText("");
      setReplyTarget(null);
    },
    [formatTime, isAuthenticated, promptAuth, replyTarget, replyText]
  );

  const [messageDraft, setMessageDraft] = useState("");

  const handleMessageSubmit = useCallback(
    (event) => {
      event.preventDefault();
      if (!isAuthenticated) {
        promptAuth();
        return;
      }
      if (!messageDraft.trim()) {
        return;
      }
      const now = new Date();
      const payload = {
        __key: `demo-message-${now.getTime()}`,
        sender: "Tu",
        role: "participant",
        time: formatTime(now),
        text: messageDraft.trim(),
        isDemo: true,
      };
      setPostedMessages((previous) => [...previous, payload]);
      setMessageDraft("");
    },
    [formatTime, isAuthenticated, messageDraft, promptAuth]
  );

  if (!isAuthenticated) {
    return (
      <>
        <Head>
          <title>{groupInfo.name} - Conversatii</title>
        </Head>
        <section className="card accent auth-required-card">
          <div className="section-title">
            <FiLock className="section-icon" aria-hidden /> Acces restricționat
          </div>
          <p>
            Pentru a parcurge conversatiile din <strong>{groupInfo.name}</strong> trebuie sa fii conectat in cont.
            Autentificarea protejeaza confidentialitatea grupului.
          </p>
          <button type="button" className="btn primary u-mt-4" onClick={promptAuth}>
            Conectează-te
          </button>
        </section>
      </>
    );
  }

  return (
    <>
      <Head>
        <title>{groupInfo.name} - Conversatii</title>
      </Head>
      <div className="assistant-wrapper group-thread-wrapper">
        <header className="assistant-header">
          <div className="group-convo-nav">
            <Link href="/community/cercul-zilnic-de-sprijin" className="group-back-link">
              <FiArrowLeft aria-hidden /> Inapoi
            </Link>
          </div>
        </header>

        <div className="assistant-body" style={{ gap: "var(--space-4)" }}>
          <section className="card u-mt-4 group-dialog-shell" style={{ flex: 1 }}>

            <div className="group-dialog-list" style={{ flex: 1, overflowY: "auto" }}>
              {daySummaries.length > 0 ? (
                daySummaries.map((group) => (
                  <article key={group.dateLabel} className="group-dialog-card">
                    <header className="group-dialog-header">
                      <span className="group-dialog-date">{group.dateLabel}</span>
                    </header>
                    <div className="group-dialog-thread">
                      {group.messages.map((message) => (
                        <div
                          key={message.__key}
                          className={`group-dialog-message ${message.isDemo ? "group-dialog-message--self" : ""}`}
                        >
                          <div className="group-dialog-message-head">
                            <button
                              type="button"
                              className={`group-dialog-speaker ${speakerFilter === message.sender ? "is-active" : ""}`}
                              onClick={() => toggleSpeaker(message.sender)}
                            >
                              {message.sender}
                            </button>
                            {message.role ? (
                              <span className="chip chip--subtle">{roleLabels[message.role]}</span>
                            ) : null}
                            <span className="muted group-dialog-time">{message.time}</span>
                          </div>
                          {message.replyTo ? (
                            <div className="group-dialog-reply muted">Raspuns catre {message.replyTo}</div>
                          ) : null}
                          <p>{message.text}</p>
                          <div className="group-dialog-actions">
                            <button type="button" className="group-reply-button" onClick={() => handleReplyClick(message)}>
                              Raspunde
                            </button>
                          </div>
                          {submittedReplies[message.__key]?.length ? (
                            <div className="group-reply-thread">
                              {submittedReplies[message.__key].map((reply) => (
                                <div key={reply.id} className="group-reply-bubble">
                                  <div className="group-reply-header">
                                    <span className="group-reply-author">Tu</span>
                                    <span className="muted group-reply-time">{reply.time}</span>
                                  </div>
                                  <p>{reply.text}</p>
                                </div>
                              ))}
                            </div>
                          ) : null}
                          {replyTarget?.key === message.__key ? (
                            <form className="group-reply-form" onSubmit={handleReplySubmit}>
                              <div className="group-reply-context muted">
                                Raspunzi catre {replyTarget.speaker} - {replyTarget.time}
                              </div>
                              <textarea
                                className="group-reply-input"
                                rows={3}
                                placeholder="Scrie raspunsul tau..."
                                value={replyText}
                                onChange={(event) => setReplyText(event.target.value)}
                              />
                              <div className="group-reply-actions">
                                <button className="btn primary" type="submit">
                                  Trimite
                                </button>
                                <button
                                  type="button"
                                  className="btn"
                                  onClick={() => {
                                    setReplyTarget(null);
                                    setReplyText("");
                                  }}
                                >
                                  Renunta
                                </button>
                              </div>
                            </form>
                          ) : null}
                        </div>
                      ))}
                    </div>
                  </article>
                ))
              ) : (
                <div className="group-dialog-empty muted">
                  Nu exista mesaje pentru persoana selectata in aceasta selectie demo.
                </div>
              )}
            </div>
          </section>

          <form className="assistant-form row u-mt-4 group-message-compose" onSubmit={handleMessageSubmit}>
            <input
              className="form-input grow"
              placeholder="Scrie un mesaj..."
              value={messageDraft}
              onChange={(event) => setMessageDraft(event.target.value)}
            />
            <button className="btn primary" type="submit">
              Trimite
            </button>
          </form>
        </div>
      </div>
    </>
  );
}
