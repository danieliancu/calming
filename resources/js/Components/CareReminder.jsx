import { useEffect, useRef, useState } from 'react';
import { FiHeart } from '@/lib/icons';

const CARE_REMINDERS = [
    {
        title: 'Amintește-ți să ai grijă de tine cu blândețe astăzi.',
        body: 'Starea ta de bine contează, iar tu meriți sprijin, blândețe și puțin răgaz chiar azi.',
    },
    {
        title: 'Fiecare pas mic contează mai mult decât crezi acum.',
        body: 'Chiar și un moment de liniște îți poate schimba ritmul zilei și îți poate face bine.',
    },
    {
        title: 'Ai voie să o iei mai încet fără să te judeci.',
        body: 'Ritmul tău este suficient atunci când îți asculți nevoile și îți acorzi răbdare reală.',
    },
    {
        title: 'Respiră adânc și revino cu calm în prezent.',
        body: 'Câteva clipe de calm pot aduce claritate, stabilitate și mai mult control interior.',
    },
    {
        title: 'Ziua de azi poate începe din nou pentru tine.',
        body: 'Oricând alegi să te regrupezi, ai deja făcut un pas important spre echilibru.',
    },
    {
        title: 'Bunătatea față de tine este o formă de putere.',
        body: 'Vorbește-ți cu blândețe și vei simți cum presiunea se așază puțin mai ușor.',
    },
    {
        title: 'Nu trebuie să rezolvi totul chiar acum singur.',
        body: 'Uneori este suficient să faci următorul pas simplu, clar și realist pentru tine.',
    },
    {
        title: 'Merită să-ți oferi puțin răgaz fără vinovăție.',
        body: 'Pauzele scurte nu te opresc, ci te ajută să mergi mai departe cu stabilitate.',
    },
    {
        title: 'Există progres și în zilele liniștite pentru tine.',
        body: 'Vindecarea nu e mereu spectaculoasă, dar poate fi liniștită, constantă și reală.',
    },
    {
        title: 'Ești mai pregătit decât crezi în acest moment.',
        body: 'Ai depășit deja momente grele, iar resursele tale interioare sunt încă prezente.',
    },
    {
        title: 'Speranța se construiește din gesturi mici zilnic.',
        body: 'Un gând bun, o respirație conștientă și un pas înainte pot schimba direcția zilei.',
    },
];

function getNextReminderIndex(currentIndex) {
    if (CARE_REMINDERS.length <= 1) {
        return currentIndex;
    }

    let nextIndex = currentIndex;
    while (nextIndex === currentIndex) {
        nextIndex = Math.floor(Math.random() * CARE_REMINDERS.length);
    }

    return nextIndex;
}

export default function CareReminder({ className = '', intervalMs = 10000 }) {
    const [activeIndex, setActiveIndex] = useState(0);
    const [isFading, setIsFading] = useState(false);
    const [isSpinning, setIsSpinning] = useState(false);
    const timeoutsRef = useRef([]);

    useEffect(() => {
        const queueTimeout = (callback, delay) => {
            const timeoutId = window.setTimeout(callback, delay);
            timeoutsRef.current.push(timeoutId);
        };

        const runTransition = () => {
            setIsFading(true);
            setIsSpinning(true);

            queueTimeout(() => {
                setActiveIndex((currentIndex) => getNextReminderIndex(currentIndex));
            }, 220);

            queueTimeout(() => {
                setIsFading(false);
            }, 440);

            queueTimeout(() => {
                setIsSpinning(false);
            }, 1100);
        };

        const intervalId = window.setInterval(runTransition, intervalMs);

        return () => {
            window.clearInterval(intervalId);
            timeoutsRef.current.forEach((timeoutId) => window.clearTimeout(timeoutId));
            timeoutsRef.current = [];
        };
    }, [intervalMs]);

    const reminder = CARE_REMINDERS[activeIndex];

    return (
        <div className={`note-card care-reminder ${className}`.trim()}>
            <div className={`note-icon care-reminder__icon${isSpinning ? ' is-spinning' : ''}`}>
                <FiHeart size={24} />
            </div>
            <div className={`care-reminder__copy${isFading ? ' is-fading' : ''}`}>
                <div className="u-text-semibold">{reminder.title}</div>
                <div className="muted note-subtext">{reminder.body}</div>
            </div>
        </div>
    );
}
