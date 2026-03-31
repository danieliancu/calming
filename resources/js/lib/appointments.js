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
            return 'In asteptare';
        case 'confirmed':
            return 'Confirmata';
        case 'declined_by_psychologist':
            return 'Respinsa';
        case 'cancelled_by_user':
            return 'Anulata de tine';
        case 'cancelled_by_psychologist':
            return 'Anulata de specialist';
        case 'completed':
            return 'Finalizata';
        case 'no_show':
            return 'No-show';
        case 'expired':
            return 'Expirata';
        default:
            return status;
    }
}

export function formatPaymentStatus(status) {
    switch (status) {
        case 'authorized':
            return 'Plata autorizata';
        case 'captured':
            return 'Plata incasata';
        case 'voided':
            return 'Plata anulata';
        case 'refunded':
            return 'Plata returnata';
        case 'not_required':
            return 'Fără plată online';
        default:
            return 'Plata in curs';
    }
}
