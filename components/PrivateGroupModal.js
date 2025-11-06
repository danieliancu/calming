export default function PrivateGroupModal({ groupName, onClose }) {
  return (
    <div className="modal-root" role="dialog" aria-modal="true" aria-label="Grup privat">
      <div className="modal-backdrop" onClick={onClose} />
      <div className="modal-center">
        <section className="sheet">
          <div className="sheet-head">
            <div className="title">{groupName}</div>
            <button type="button" className="close" aria-label="Inchide" onClick={onClose}>
              x
            </button>
          </div>

          <div className="u-mt-3 muted">
            Acest grup este privat. Pentru a accesa acest grup ai nevoie de o invitatie din partea moderatorilor.
          </div>

          <div className="u-mt-4" style={{ display: "flex", justifyContent: "flex-end" }}>
            <button type="button" className="btn primary" onClick={onClose} style={{ width:"100%" }}>
              OK
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}
