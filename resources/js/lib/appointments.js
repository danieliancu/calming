export const REMINDER_OPTIONS = [
    { value: '1440', label: '24h inainte' },
    { value: '120', label: '2h inainte' },
    { value: '30', label: '30m inainte' },
    { value: 'none', label: 'Fără reminder' },
];

export function partitionAppointments(appointments = []) {
    return {
        pendingAppointments: appointments.filter((item) => item.status === 'pending'),
        confirmedAppointments: appointments.filter((item) => item.status === 'confirmed'),
        historyAppointments: appointments.filter((item) => !['pending', 'confirmed'].includes(item.status)),
    };
}

export function formatAppointmentStatus(status) {
    switch (status) {
        case 'pending':
            return 'În asteptare';
        case 'confirmed':
            return 'Confirmată';
        case 'declined_by_psychologist':
            return 'Respinsă';
        case 'cancelled_by_user':
            return 'Anulată de tine';
        case 'cancelled_by_psychologist':
            return 'Anulată de specialist';
        case 'completed':
            return 'Finalizată';
        case 'no_show':
            return 'No-show';
        case 'expired':
            return 'Expirată';
        default:
            return status;
    }
}

export function formatPaymentStatus(status) {
    switch (status) {
        case 'authorized':
            return 'Plată autorizată';
        case 'captured':
            return 'Plată incasată';
        case 'voided':
            return 'Plată anulată';
        case 'refunded':
            return 'Plată returnată';
        case 'not_required':
            return 'Fără plată online';
        default:
            return 'Plata în curs';
    }
}
