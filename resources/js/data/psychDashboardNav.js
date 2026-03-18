import { FiCalendar, FiCheckCircle, FiFileText, FiUsers } from '@/lib/icons';

export const PSYCH_DASHBOARD_MENU_ITEMS = [
    { key: 'validation', label: 'Validare', icon: FiCheckCircle },
    { key: 'articles', label: 'Articole', icon: FiFileText },
    { key: 'community', label: 'Comunitate', icon: FiUsers },
    { key: 'schedule', label: 'Programari', icon: FiCalendar },
];

export const DEFAULT_PSYCH_DASHBOARD_SECTION = PSYCH_DASHBOARD_MENU_ITEMS[0].key;

export function isValidPsychDashboardSection(section) {
    return PSYCH_DASHBOARD_MENU_ITEMS.some((item) => item.key === section);
}

export function normalizePsychDashboardSection(value) {
    if (typeof value === 'string' && isValidPsychDashboardSection(value)) {
        return value;
    }

    return DEFAULT_PSYCH_DASHBOARD_SECTION;
}
