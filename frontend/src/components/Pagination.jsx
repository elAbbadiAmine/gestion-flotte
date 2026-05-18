export function Pagination({ page, total, pageSize, onChange }) {
  const pages = Math.ceil(total / pageSize) || 1
  const from = total === 0 ? 0 : (page - 1) * pageSize + 1
  const to = Math.min(page * pageSize, total)

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '10px 16px',
      borderTop: '1px solid var(--border)',
      background: 'var(--table-head)',
    }}>
      <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>
        {total === 0 ? '0 résultat' : <>Affichage de <strong style={{ color: 'var(--text)' }}>{from}</strong> à <strong style={{ color: 'var(--text)' }}>{to}</strong> sur <strong style={{ color: 'var(--text)' }}>{total}</strong></>}
      </span>
      <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
        <button onClick={() => onChange(1)} disabled={page === 1 || pages === 1} className="btn btn-secondary btn-sm" style={{ padding: '4px 8px' }}>«</button>
        <button onClick={() => onChange(page - 1)} disabled={page === 1 || pages === 1} className="btn btn-secondary btn-sm">Préc.</button>
        <span style={{ fontSize: 13, padding: '0 8px', color: 'var(--text)', fontWeight: 500 }}>
          Page {page} / {pages}
        </span>
        <button onClick={() => onChange(page + 1)} disabled={page === pages} className="btn btn-secondary btn-sm">Suiv.</button>
        <button onClick={() => onChange(pages)} disabled={page === pages} className="btn btn-secondary btn-sm" style={{ padding: '4px 8px' }}>»</button>
      </div>
    </div>
  )
}
