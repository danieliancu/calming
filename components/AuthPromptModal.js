import Link from "next/link";

export default function AuthPromptModal({ onClose }) {
  return (
    <div className="modal-root" role="dialog" aria-modal="true" aria-label="Acces cont">
      <div className="modal-backdrop" onClick={onClose} />
      <div className="modal-center">
        <section className="sheet">
          <div className="sheet-head">
            <div className="title">Continua cu contul tau</div>
            <button type="button" className="close" aria-label="Inchide" onClick={onClose}>
              x
            </button>
          </div>

          <div className="u-mt-2 muted">
            Pentru a salva progresul, programarile si notificarile, sau pentru a discuta cu psihologul AI este necesar sa fie conectat un cont Calming.
          </div>

          <div className="grid u-gap-3 u-mt-4">
            <Link className="btn primary" href="/signup" onClick={onClose}>
              Creeaza un cont
            </Link>
            <Link className="btn" href="/login" onClick={onClose}>
              Conecteaza-te
            </Link>
          </div>

          <div className="muted u-mt-4">
            Nu ai cont? Completeaza inregistrarea pentru a accesa jurnalul, statisticile si recomandarile personalizate.
          </div>
        </section>
      </div>
    </div>
  );
}
