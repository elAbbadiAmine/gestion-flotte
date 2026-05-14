export function ConfirmModal({ message, onConfirm, onCancel }) {
  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal-box" style={{ maxWidth: 380 }} onClick={e => e.stopPropagation()}>
        <div style={{ textAlign: 'center', marginBottom: 16 }}>
          <span style={{ fontSize: 36 }}>🗑️</span>
        </div>
        <h3 className="modal-title" style={{ textAlign: 'center' }}>
          Confirmer la suppression
        </h3>
        <p style={{ color: 'var(--text-muted)', textAlign: 'center', margin: '0 0 4px', fontSize: 14 }}>
          {message}
        </p>
        <p style={{ color: 'var(--text-muted)', textAlign: 'center', margin: '0', fontSize: 13 }}>
          Cette action est irréversible.
        </p>
        <div className="modal-footer" style={{ justifyContent: 'center', gap: 12 }}>
          <button onClick={onCancel} className="btn btn-secondary">
            Annuler
          </button>
          <button onClick={onConfirm} className="btn btn-danger" style={{ background: 'var(--danger-text)', color: 'white', border: 'none' }}>
            Confirmer
          </button>
        </div>
      </div>
    </div>
  )
}
