const STORAGE_KEY = 'calming-assistant-guest-session-v1';

const DEFAULT_PROFILE = {
    communityAlias: '',
    ageRange: '',
    focusTopics: [],
    primaryGoal: '',
    stressTriggers: '',
    copingStrategies: '',
    guidanceStyle: 'calm-empathetic',
    checkInPreference: 'morning',
    notificationFrequency: 'daily',
    therapyStatus: '',
};

function safeParse(value, fallback) {
    try {
        return JSON.parse(value ?? '');
    } catch {
        return fallback;
    }
}

function defaultState() {
    return {
        profile: { ...DEFAULT_PROFILE },
        messages: [],
        sessionMessageCount: 0,
    };
}

export function getGuestAssistantState() {
    if (typeof window === 'undefined') {
        return defaultState();
    }

    const stored = safeParse(window.sessionStorage.getItem(STORAGE_KEY), null);
    return {
        ...defaultState(),
        ...(stored ?? {}),
        profile: {
            ...DEFAULT_PROFILE,
            ...(stored?.profile ?? {}),
        },
    };
}

export function saveGuestAssistantState(state) {
    if (typeof window === 'undefined') {
        return;
    }

    window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify({
        ...defaultState(),
        ...state,
        profile: {
            ...DEFAULT_PROFILE,
            ...(state?.profile ?? {}),
        },
    }));
}

export function clearGuestAssistantState() {
    if (typeof window === 'undefined') {
        return;
    }

    window.sessionStorage.removeItem(STORAGE_KEY);
}

export function defaultGuestAssistantProfile() {
    return { ...DEFAULT_PROFILE };
}
