import { Component } from 'react'

export class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { error: null }
  }

  static getDerivedStateFromError(error) {
    return { error }
  }

  render() {
    if (!this.state.error) return this.props.children

    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '60vh',
        gap: 16,
        padding: 32,
        textAlign: 'center',
      }}>
        <div style={{ fontSize: 48 }}>💥</div>
        <div style={{ fontWeight: 700, fontSize: 18, color: 'var(--text)' }}>
          Une erreur inattendue s'est produite
        </div>
        <div style={{
          fontSize: 13,
          color: 'var(--text-muted)',
          background: 'var(--danger-bg)',
          border: '1px solid var(--danger-border)',
          borderRadius: 8,
          padding: '10px 16px',
          maxWidth: 480,
          fontFamily: 'ui-monospace, monospace',
          wordBreak: 'break-all',
        }}>
          {this.state.error.message}
        </div>
        <button
          onClick={() => window.location.reload()}
          className="btn btn-primary"
        >
          Recharger la page
        </button>
      </div>
    )
  }
}
