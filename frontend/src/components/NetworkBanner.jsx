import { useState, useEffect } from 'react'
import { onNetworkError } from '../network'

export function NetworkBanner() {
  const [down, setDown] = useState(false)
  const [retrying, setRetrying] = useState(false)

  useEffect(() => {
    return onNetworkError(() => setDown(true))
  }, [])

  if (!down) return null

  const retry = async () => {
    setRetrying(true)
    try {
      const url = import.meta.env.VITE_GRAPHQL_URL ?? 'http://localhost:4000/graphql'
      const res = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{"query":"{__typename}"}' })
      if (res.ok) {
        setDown(false)
        window.location.reload()
      } else {
        setRetrying(false)
      }
    } catch {
      setRetrying(false)
    }
  }

  return (
    <div style={{
      position: 'fixed',
      bottom: 24,
      left: '50%',
      transform: 'translateX(-50%)',
      background: '#1e293b',
      color: '#f1f5f9',
      borderRadius: 10,
      padding: '14px 20px',
      display: 'flex',
      alignItems: 'center',
      gap: 16,
      boxShadow: '0 8px 32px rgba(0,0,0,0.35)',
      zIndex: 9999,
      maxWidth: 480,
      width: 'calc(100vw - 48px)',
      border: '1px solid #334155',
    }}>
      <span style={{ fontSize: 20 }}>⚠️</span>
      <div style={{ flex: 1 }}>
        <div style={{ fontWeight: 600, fontSize: 14 }}>API inaccessible</div>
        <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 2 }}>
          Impossible de joindre le serveur. Vérifiez le port-forward.
        </div>
      </div>
      <button
        onClick={retry}
        disabled={retrying}
        style={{
          background: retrying ? '#334155' : 'var(--primary)',
          color: '#fff',
          border: 'none',
          borderRadius: 6,
          padding: '7px 14px',
          fontSize: 13,
          fontWeight: 600,
          cursor: retrying ? 'not-allowed' : 'pointer',
          whiteSpace: 'nowrap',
        }}
      >
        {retrying ? 'Test...' : 'Réessayer'}
      </button>
    </div>
  )
}
