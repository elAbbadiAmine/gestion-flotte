import { BrowserRouter, Routes, Route, NavLink } from 'react-router-dom'
import keycloak from './keycloak.js'
import { label } from './utils/labels'
import { VehiculesPage } from './pages/VehiculesPage'
import { ConducteursPage } from './pages/ConducteursPage'
import { CartePage } from './pages/CartePage'
import { MaintenancePage } from './pages/MaintenancePage'
import { AlertesPage } from './pages/AlertesPage'

const ROLES = ['admin', 'manager', 'technicien', 'utilisateur']

const navClass = ({ isActive }) => `nav-link${isActive ? ' active' : ''}`

function App() {
  const username = keycloak.tokenParsed?.preferred_username ?? ''
  const role = keycloak.tokenParsed?.realm_access?.roles?.find(r => ROLES.includes(r)) ?? 'utilisateur'

  return (
    <BrowserRouter>
      <div>
        <header className="app-header">
          <h1 className="app-logo">Gestion de <span>flotte</span></h1>
          <NavLink to="/" end className={navClass}>Véhicules</NavLink>
          <NavLink to="/conducteurs" className={navClass}>Conducteurs</NavLink>
          <NavLink to="/maintenance" className={navClass}>Maintenance</NavLink>
          <NavLink to="/carte" className={navClass}>Carte</NavLink>
          <NavLink to="/alertes" className={navClass}>Alertes</NavLink>
          <span className="header-user">
            {username.toLowerCase() !== role ? `${username} · ` : ''}{label(role)}
          </span>
          <button className="btn-logout" onClick={() => keycloak.logout({ redirectUri: window.location.origin + '/' })}>
            Déconnexion
          </button>
        </header>

        <main className="app-main">
          <Routes>
            <Route path="/" element={<VehiculesPage />} />
            <Route path="/conducteurs" element={<ConducteursPage />} />
            <Route path="/maintenance" element={<MaintenancePage />} />
            <Route path="/carte" element={<CartePage />} />
            <Route path="/alertes" element={<AlertesPage />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  )
}

export default App
