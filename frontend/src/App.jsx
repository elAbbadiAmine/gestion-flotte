import { BrowserRouter, Routes, Route, NavLink, Navigate } from 'react-router-dom'
import keycloak from './keycloak.js'
import { label } from './utils/labels'
import { VehiculesPage } from './pages/VehiculesPage'
import { ConducteursPage } from './pages/ConducteursPage'
import { CartePage } from './pages/CartePage'
import { MaintenancePage } from './pages/MaintenancePage'
import { AlertesPage } from './pages/AlertesPage'
import { DashboardPage } from './pages/DashboardPage'
import { NetworkBanner } from './components/NetworkBanner'
import { ErrorBoundary } from './components/ErrorBoundary'

const ROLES = ['admin', 'manager', 'technicien', 'utilisateur']

// Pages accessibles par rôle (moindre privilège)
const ACCESS = {
  admin:       ['dashboard', 'vehicules', 'conducteurs', 'maintenance', 'carte', 'alertes'],
  manager:     ['dashboard', 'vehicules', 'conducteurs', 'maintenance', 'carte', 'alertes'],
  technicien:  ['vehicules', 'maintenance', 'carte', 'alertes'],
  utilisateur: ['vehicules', 'carte'],
}

const navClass = ({ isActive }) => `nav-link${isActive ? ' active' : ''}`

function ProtectedRoute({ page, role, children }) {
  const allowed = ACCESS[role] ?? ACCESS.utilisateur
  return allowed.includes(page) ? children : <Navigate to="/" replace />
}

function App() {
  const username = keycloak.tokenParsed?.preferred_username ?? ''
  const role = keycloak.tokenParsed?.realm_access?.roles?.find(r => ROLES.includes(r)) ?? 'utilisateur'
  const can = (page) => (ACCESS[role] ?? ACCESS.utilisateur).includes(page)

  return (
    <BrowserRouter>
      <div>
        <header className="app-header">
          <h1 className="app-logo">Gestion de <span>flotte</span></h1>
          {can('dashboard') && <NavLink to="/dashboard" className={navClass}>Tableau de bord</NavLink>}
          <NavLink to="/vehicules" className={navClass}>Véhicules</NavLink>
          {can('conducteurs') && <NavLink to="/conducteurs" className={navClass}>Conducteurs</NavLink>}
          {can('maintenance') && <NavLink to="/maintenance" className={navClass}>Maintenance</NavLink>}
          <NavLink to="/carte" className={navClass}>Carte</NavLink>
          {can('alertes') && <NavLink to="/alertes" className={navClass}>Alertes</NavLink>}
          <span className="header-user">
            {username.toLowerCase() !== role ? `${username} · ` : ''}{label(role)}
          </span>
          <button className="btn-logout" onClick={() => keycloak.logout({ redirectUri: window.location.origin + '/' })}>
            Déconnexion
          </button>
        </header>

        <main className="app-main">
          <ErrorBoundary>
          <Routes>
            <Route path="/" element={
              can('dashboard') ? <Navigate to="/dashboard" replace /> : <VehiculesPage />
            } />
            <Route path="/dashboard" element={
              <ProtectedRoute page="dashboard" role={role}><DashboardPage /></ProtectedRoute>
            } />
            <Route path="/vehicules" element={<VehiculesPage />} />
            <Route path="/conducteurs" element={
              <ProtectedRoute page="conducteurs" role={role}><ConducteursPage /></ProtectedRoute>
            } />
            <Route path="/maintenance" element={
              <ProtectedRoute page="maintenance" role={role}><MaintenancePage /></ProtectedRoute>
            } />
            <Route path="/carte" element={<CartePage />} />
            <Route path="/alertes" element={
              <ProtectedRoute page="alertes" role={role}><AlertesPage /></ProtectedRoute>
            } />
          </Routes>
          </ErrorBoundary>
        </main>
        <NetworkBanner />
      </div>
    </BrowserRouter>
  )
}

export default App
