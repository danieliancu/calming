import { emitNotificationSync } from '@/lib/notificationSync';

const STORAGE_KEY = 'calming-guest-state-v1';
const MAX_NOTIFICATIONS = 20;

function nowIso() {
    return new Date().toISOString();
}

function safeJsonParse(value, fallback) {
    try {
        return JSON.parse(value ?? '');
    } catch {
        return fallback;
    }
}

function defaultState() {
    return {
        token: null,
        createdAt: nowIso(),
        lastSeenAt: nowIso(),
        visitedDays: [],
        visitedSections: {},
        viewedArticles: [],
        savedArticles: [],
        reminders: [],
        viewedPsychologists: [],
        viewedCities: [],
        openedAssistant: false,
        openedCommunity: false,
        readNotificationIds: [],
    };
}

export function getGuestState() {
    if (typeof window === 'undefined') {
        return defaultState();
    }

    const stored = safeJsonParse(window.localStorage.getItem(STORAGE_KEY), null);
    const next = { ...defaultState(), ...(stored ?? {}) };

    if (!next.token && window.crypto?.randomUUID) {
        next.token = window.crypto.randomUUID();
        saveGuestState(next);
    }

    return next;
}

export function saveGuestState(state) {
    if (typeof window === 'undefined') {
        return;
    }

    const today = new Date().toISOString().slice(0, 10);
    const next = {
        ...defaultState(),
        ...state,
        lastSeenAt: nowIso(),
        visitedDays: Array.from(new Set([...(state?.visitedDays ?? []), today])).slice(-60),
    };

    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    emitNotificationSync({ source: 'guest-state' });
}

export function recordGuestSectionVisit(section) {
    const state = getGuestState();
    const visitedSections = {
        ...state.visitedSections,
        [section]: (state.visitedSections?.[section] ?? 0) + 1,
    };

    saveGuestState({
        ...state,
        visitedSections,
        openedAssistant: state.openedAssistant || section === 'assistant',
        openedCommunity: state.openedCommunity || section === 'community',
    });
}

export function recordGuestArticleView(article) {
    if (!article?.id) {
        return;
    }

    const state = getGuestState();
    const current = state.viewedArticles.filter((item) => item.id !== article.id);

    saveGuestState({
        ...state,
        viewedArticles: [{ ...article, viewedAt: nowIso() }, ...current].slice(0, 30),
    });
}

export function toggleGuestSavedArticle(article, shouldSave = true) {
    if (!article?.id) {
        return false;
    }

    const state = getGuestState();
    const current = state.savedArticles.filter((item) => item.id !== article.id);
    const nextSaved = shouldSave
        ? [{ ...article, savedAt: nowIso() }, ...current].slice(0, 30)
        : current;

    saveGuestState({
        ...state,
        savedArticles: nextSaved,
    });

    return shouldSave;
}

export function setGuestArticleReminder(article, frequency = 'monthly') {
    if (!article?.id) {
        return null;
    }

    const state = getGuestState();
    const current = state.reminders.filter((item) => item.id !== article.id);
    const nextReminderAt = new Date();
    nextReminderAt.setMonth(nextReminderAt.getMonth() + 1);
    const reminder = {
        id: article.id,
        slug: article.slug,
        title: article.title,
        frequency,
        nextReminderAt: nextReminderAt.toISOString(),
        updatedAt: nowIso(),
    };

    saveGuestState({
        ...state,
        reminders: [reminder, ...current].slice(0, 20),
    });

    return reminder;
}

export function clearGuestArticleReminder(articleId) {
    const state = getGuestState();

    saveGuestState({
        ...state,
        reminders: state.reminders.filter((item) => item.id !== articleId),
    });
}

export function markGuestNotificationRead(notificationId) {
    const state = getGuestState();

    saveGuestState({
        ...state,
        readNotificationIds: Array.from(new Set([...(state.readNotificationIds ?? []), notificationId])),
    });
}

export function markGuestNotificationUnread(notificationId) {
    const state = getGuestState();

    saveGuestState({
        ...state,
        readNotificationIds: (state.readNotificationIds ?? []).filter((id) => id !== notificationId),
    });
}

export function markAllGuestNotificationsRead(notificationIds = []) {
    const state = getGuestState();

    saveGuestState({
        ...state,
        readNotificationIds: Array.from(new Set([...(state.readNotificationIds ?? []), ...notificationIds])),
    });
}

function relativeTime(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const diffMinutes = Math.round((now.getTime() - date.getTime()) / (1000 * 60));

    if (diffMinutes <= 0) {
        return 'Acum';
    }
    if (diffMinutes < 60) {
        return `Acum ${diffMinutes} minute`;
    }

    const diffHours = Math.round(diffMinutes / 60);
    if (diffHours < 24) {
        return `Acum ${diffHours} ore`;
    }
    if (diffHours < 48) {
        return 'Ieri';
    }

    const diffDays = Math.round(diffHours / 24);
    if (diffDays < 7) {
        return `Acum ${diffDays} zile`;
    }

    return `Acum ${Math.max(1, Math.round(diffDays / 7))} saptamani`;
}

function localNotificationsFromState(state) {
    const notifications = [];

    if (state.savedArticles[0]) {
        notifications.push({
            id: `guest-saved-${state.savedArticles[0].id}`,
            title: 'Articol salvat',
            body: `${state.savedArticles[0].title} a fost salvat local in browser.`,
            category: 'article',
            icon: 'FiBookmark',
            icon_color: 'lilac',
            accent: 'lilac',
            published_at: state.savedArticles[0].savedAt,
            created_at: state.savedArticles[0].savedAt,
            relative_time: relativeTime(state.savedArticles[0].savedAt),
            is_new: true,
            is_read: false,
            cta: { kind: 'open', href: `/article/${state.savedArticles[0].slug}`, label: 'Deschide articolul' },
        });
    }

    if (state.reminders[0]) {
        notifications.push({
            id: `guest-reminder-${state.reminders[0].id}`,
            title: 'Reminder activ',
            body: `Ai activat un reminder ${state.reminders[0].frequency} pentru ${state.reminders[0].title}.`,
            category: 'reminder',
            icon: 'FiCalendar',
            icon_color: 'rose',
            accent: 'rose',
            published_at: state.reminders[0].updatedAt,
            created_at: state.reminders[0].updatedAt,
            relative_time: relativeTime(state.reminders[0].updatedAt),
            is_new: true,
            is_read: false,
            cta: { kind: 'open', href: `/article/${state.reminders[0].slug}`, label: 'Vezi articolul' },
        });
    }

    if ((state.visitedSections.learn ?? 0) >= 2 && state.savedArticles.length === 0) {
        notifications.push({
            id: 'guest-nudge-save-article',
            title: 'Salveaza articolele importante',
            body: 'Poti salva articolele preferate si activa remindere direct din pagina lor.',
            category: 'product',
            icon: 'FiBell',
            icon_color: 'peach',
            accent: 'peach',
            published_at: state.lastSeenAt,
            created_at: state.lastSeenAt,
            relative_time: relativeTime(state.lastSeenAt),
            is_new: true,
            is_read: false,
            cta: { kind: 'open', href: '/learn', label: 'Mergi la articole' },
        });
    }

    if (state.openedAssistant) {
        notifications.push({
            id: 'guest-assistant-tip',
            title: 'Asistentul te asteapta',
            body: 'Revino in Assistant pentru un nou punct de pornire sau un check-in ghidat.',
            category: 'assistant',
            icon: 'FiMessageSquare',
            icon_color: 'sky',
            accent: 'sky',
            published_at: state.lastSeenAt,
            created_at: state.lastSeenAt,
            relative_time: relativeTime(state.lastSeenAt),
            is_new: true,
            is_read: false,
            cta: { kind: 'open', href: '/assistant', label: 'Deschide Assistant' },
        });
    }

    return notifications;
}

export function buildGuestNotifications(publicNotifications = []) {
    const state = getGuestState();
    const localNotifications = localNotificationsFromState(state);
    const all = [...localNotifications, ...publicNotifications]
        .map((item) => ({
            ...item,
            is_read: item.is_read || state.readNotificationIds.includes(item.id),
            is_new: !state.readNotificationIds.includes(item.id) && Boolean(item.is_new),
        }))
        .sort((left, right) => new Date(right.published_at ?? right.created_at ?? 0).getTime() - new Date(left.published_at ?? left.created_at ?? 0).getTime())
        .slice(0, MAX_NOTIFICATIONS);

    return all;
}

export function buildGuestMilestones() {
    const state = getGuestState();
    const milestones = [];

    if (state.viewedArticles.length >= 1) {
        milestones.push({
            id: 'guest-first-article',
            title: 'Primul articol explorat',
            description: 'Ai deschis primul articol din biblioteca publica.',
            achieved_at: state.viewedArticles[0].viewedAt,
            icon: 'FiBookOpen',
            icon_color: 'lilac',
            category: 'article',
        });
    }
    if (state.savedArticles.length >= 1) {
        milestones.push({
            id: 'guest-first-save',
            title: 'Primul articol salvat',
            description: 'Ai salvat primul articol direct in browser.',
            achieved_at: state.savedArticles[0].savedAt,
            icon: 'FiBookmark',
            icon_color: 'lilac',
            category: 'article',
        });
    }
    if (state.reminders.length >= 1) {
        milestones.push({
            id: 'guest-first-reminder',
            title: 'Primul reminder activat',
            description: 'Ai setat un reminder local pentru a reveni la conținut.',
            achieved_at: state.reminders[0].updatedAt,
            icon: 'FiCalendar',
            icon_color: 'rose',
            category: 'reminder',
        });
    }
    if (state.openedCommunity) {
        milestones.push({
            id: 'guest-community',
            title: 'Comunitate explorata',
            description: 'Ai vizitat zona de comunitate si suport.',
            achieved_at: state.lastSeenAt,
            icon: 'FiUsers',
            icon_color: 'amber',
            category: 'community',
        });
    }
    if (state.openedAssistant) {
        milestones.push({
            id: 'guest-assistant',
            title: 'Assistant deschis',
            description: 'Ai pornit prima conversație cu Assistant.',
            achieved_at: state.lastSeenAt,
            icon: 'FiMessageSquare',
            icon_color: 'sky',
            category: 'assistant',
        });
    }
    if (state.visitedDays.length >= 7) {
        milestones.push({
            id: 'guest-returning',
            title: '7 zile de revenire',
            description: 'Ai revenit in aplicatie in cel putin 7 zile diferite.',
            achieved_at: state.lastSeenAt,
            icon: 'FiAward',
            icon_color: 'rose',
            category: 'consistency',
        });
    }

    return milestones.sort((left, right) => new Date(right.achieved_at).getTime() - new Date(left.achieved_at).getTime());
}
