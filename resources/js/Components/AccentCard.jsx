import { FiX } from '@/lib/icons';
import { useEffect, useState } from 'react';

const STORAGE_PREFIX = 'accent-card:dismissed:';

export default function AccentCard({ children, className = '', dismissKey, showClose = true }) {
    const [dismissed, setDismissed] = useState(false);

    useEffect(() => {
        if (typeof window === 'undefined' || !dismissKey) {
            return;
        }

        setDismissed(window.localStorage.getItem(`${STORAGE_PREFIX}${dismissKey}`) === '1');
    }, [dismissKey]);

    if (dismissed) {
        return null;
    }

    return (
        <section className={`card accent accent-card ${className}`.trim()}>
            {showClose ? (
                <button
                    type="button"
                    className="accent-card__close"
                    aria-label="Inchide"
                    onClick={() => {
                        if (typeof window !== 'undefined' && dismissKey) {
                            window.localStorage.setItem(`${STORAGE_PREFIX}${dismissKey}`, '1');
                        }
                        setDismissed(true);
                    }}
                >
                    <FiX aria-hidden />
                </button>
            ) : null}
            {children}
        </section>
    );
}
