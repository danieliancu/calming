import { Link, usePage } from '@inertiajs/react';
import { FiX } from '@/lib/icons';

export default function AuthPromptModal({ onClose, mode = 'user' }) {
    const page = usePage();
    const redirectTo = page?.url || '/';
    const isSpecialistMode = mode === 'specialist';

    return (
        <div className="modal-root" role="dialog" aria-modal="true" aria-label={isSpecialistMode ? 'Acces specialist' : 'Acces cont'}>
            <div className="modal-backdrop" onClick={onClose} />
            <div className="modal-center">
                <section className="sheet">
                    <div className="sheet-head">
                        <div className="title">{isSpecialistMode ? 'Esti specialist?' : 'Continua cu contul tau'}</div>
                        <button type="button" className="close" aria-label="Inchide" onClick={onClose}>
                            <FiX aria-hidden />
                        </button>
                    </div>

                    {isSpecialistMode ? (
                        <>
                            <div className="u-mt-2 muted">
                                Alatura-te retelei Calming si ofera sprijin persoanelor care au nevoie de tine.
                            </div>

                            <div className="grid cols-2 u-gap-3 u-mt-4">
                                <Link className="btn primary" href="/psychologists/signup" onClick={onClose}>
                                    Creeaza cont
                                </Link>
                                <Link className="btn" href="/psychologists/signin" onClick={onClose}>
                                    Acceseaza contul
                                </Link>
                            </div>
                        </>
                    ) : (
                        <>
                            <div className="u-mt-2 muted">
                                Nu ai cont? Completeaza inregistrarea pentru a accesa jurnalul, statisticile si recomandarile personalizate.
                            </div>

                            <div className="grid u-gap-3 u-mt-4">
                                <Link className="btn primary" href={route('register')} onClick={onClose}>
                                    Creeaza un cont
                                </Link>
                                <Link className="btn" href={route('login', { redirectTo })} onClick={onClose}>
                                    Conecteaza-te
                                </Link>
                            </div>

                            <div className="muted u-mt-4">
                                Pentru a salva progresul, programarile si notificarile, sau pentru a discuta cu asistentul este necesar sa fie conectat un cont Calming.
                            </div>
                        </>
                    )}

                </section>
            </div>
        </div>
    );
}
