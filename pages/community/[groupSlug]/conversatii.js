import Head from "next/head";
import Link from "next/link";
import { useMemo, useState, useCallback, useEffect } from "react";
import { FiArrowLeft, FiUsers, FiCalendar, FiMessageSquare, FiShield, FiLock } from "react-icons/fi";
import { useAuth } from "@/contexts/AuthContext";
import {
  getCommunityGroupBySlug,
  getCommunityGroupSlugs,
  roleLabels,
  prepareGroupForClient,
} from "@/lib/community/communityData";

export default function CommunityGroupConversations({ group }) {
  const { isAuthenticated, promptAuth } = useAuth();
  const [speakerFilter, setSpeakerFilter] = useState(null);
  const [replyTarget, setReplyTarget] = useState(null);
  const [replyText, setReplyText] = useState("");
  const [submittedReplies, setSubmittedReplies] = useState({});
  const [postedMessages, setPostedMessages] = useState([]);
  const [messageDraft, setMessageDraft] = useState("");

  useEffect(() => {
    document.body.classList.add("group-thread-page");
    return () => {
      document.body.classList.remove("group-thread-page");
    };
  }, []);

  useEffect(() => {
    if (!group.isPrivate && !isAuthenticated) {
      promptAuth();
    }
  }, [group.isPrivate, isAuthenticated, promptAuth]);

  const toggleSpeaker = useCallback((speaker) => {
    setSpeakerFilter((current) => (current === speaker ? null : speaker));
  }, []);

  const groupedDialogues = useMemo(() => {
    if (!group.dialogues) {
      return [];
    }
    const groups = {};
    group.dialogues.forEach((dialogue) => {
      const dateLabel = dialogue.stamp;
      if (!groups[dateLabel]) {
        groups[dateLabel] = { dateLabel, entries: [] };
      }
      groups[dateLabel].entries.push(dialogue);
    });
    return Object.values(groups);
  }, [group.dialogues]);

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

  const formatTime = useCallback((date) => {
    const hours = date.getHours().toString().padStart(2, "0");
    const minutes = date.getMinutes().toString().padStart(2, "0");
    return `${hours}:${minutes}`;
  }, []);

  const formatDateLabel = useCallback((date) => {
    const formatter = new Intl.DateTimeFormat("ro-RO", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });
    const raw = formatter.format(date);
    return raw.charAt(0).toUpperCase() + raw.slice(1);
  }, []);

  const daySummaries = useMemo(() => {
    const filteredPosted =
      speakerFilter && speakerFilter !== "Tu"
        ? postedMessages.filter((message) => message.sender === speakerFilter)
        : postedMessages;

    const summaries = filteredDialogues.map((groupEntry) => {
      const messages = groupEntry.entries.flatMap((dialogue, dialogueIndex) =>
        dialogue.messages.map((message, messageIndex) => ({
          ...message,
          __key: `${groupEntry.dateLabel}-${dialogue.id}-${messageIndex}`,
          __order: `${dialogueIndex}-${messageIndex}`,
        }))
      );
      return {
        dateLabel: groupEntry.dateLabel,
        messages,
      };
    });

    if (filteredPosted.length > 0) {
      const postedGroups = [];
      const groupIndex = new Map();
      filteredPosted.forEach((message) => {
        let bucket = groupIndex.get(message.dateLabel);
        if (!bucket) {
          bucket = { dateLabel: message.dateLabel, messages: [] };
          groupIndex.set(message.dateLabel, bucket);
          postedGroups.push(bucket);
        }
        bucket.messages.push(message);
      });

      return [...postedGroups, ...summaries];
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
      if (!replyText.trim()) {
        return;
      }
      setSubmittedReplies((current) => {
        const existing = current[replyTarget.key] ?? [];
        const nextReply = {
          id: `${replyTarget.key}-${existing.length + 1}`,
          text: replyText.trim(),
          time: formatTime(new Date()),
        };
        return {
          ...current,
          [replyTarget.key]: [...existing, nextReply],
        };
      });
      setReplyTarget(null);
      setReplyText("");
    },
    [formatTime, replyTarget, replyText]
  );

  const handleMessageSubmit = useCallback(
    (event) => {
      event.preventDefault();
      if (!messageDraft.trim()) {
        return;
      }
      const timestamp = new Date();
      const dateLabel = formatDateLabel(timestamp);
      const message = {
        __key: `demo-${timestamp.getTime()}`,
        sender: "Tu",
        role: "participant",
        time: formatTime(timestamp),
        text: messageDraft.trim(),
        isDemo: true,
        dateLabel,
      };
      setPostedMessages((current) => [message, ...current]);
      setMessageDraft("");
    },
    [formatDateLabel, formatTime, messageDraft]
  );

  if (!group) {
    return null;
  }

  if (group.isPrivate) {
    return (
      <>
        <Head>
          <title>{group.name} - Acces privat</title>
        </Head>
        <div className="assistant-wrapper group-thread-wrapper">
          <header className="assistant-header">
            <div className="group-convo-nav">
              <Link href="/community" className="group-back-link">
                <FiArrowLeft aria-hidden /> Inapoi la comunitate
              </Link>
            </div>
            <div className="group-convo-meta muted">
              <FiUsers aria-hidden /> {group.members} membri &middot; <FiCalendar aria-hidden /> activ {group.lastActive} in urma
            </div>
          </header>
          <section className="card u-mt-4">
            <div className="section-title">
              <FiLock aria-hidden /> Acces restrictionat
            </div>
            <p className="muted">
              Acest grup este privat. Pentru a accesa conversatiile este necesara o invitatie din partea moderatorilor.
            </p>
            <div className="u-mt-4">
              <Link href="/community" className="btn">
                Inapoi la comunitate
              </Link>
            </div>
          </section>
        </div>
      </>
    );
  }

  return (
    <>
      <Head>
        <title>{group.name} - Conversatii</title>
      </Head>
      <div className="assistant-wrapper group-thread-wrapper">
        <header className="assistant-header">
          <div className="group-convo-nav">
            <Link href={`/community/${group.slug}`} className="group-back-link">
              <FiArrowLeft aria-hidden /> Inapoi
            </Link>
          </div>
        </header>

        <div className="assistant-body" style={{ gap: "var(--space-4)" }}>

          <section className="card group-dialog-shell" style={{ flex: 1 }}>
            <div className="group-dialog-list" style={{ flex: 1, overflowY: "auto" }}>
              {daySummaries.length > 0 ? (
                daySummaries.map((groupEntry) => (
                  <article key={groupEntry.dateLabel} className="group-dialog-card">
                    <header className="group-dialog-header">
                      <span className="group-dialog-date">{groupEntry.dateLabel}</span>
                    </header>
                    <div className="group-dialog-thread">
                      {groupEntry.messages.map((message) => (
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
                            {message.role && roleLabels[message.role] ? (
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

        </div>

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
    </>
  );
}

export async function getStaticPaths() {
  const slugs = getCommunityGroupSlugs();
  return {
    paths: slugs.map((slug) => ({ params: { groupSlug: slug } })),
    fallback: false,
  };
}

export async function getStaticProps({ params }) {
  const group = getCommunityGroupBySlug(params.groupSlug);
  if (!group) {
    return { notFound: true };
  }

  return {
    props: {
      group: prepareGroupForClient(group),
    },
  };
}
