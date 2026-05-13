import { BrowserRouter, Routes, Route, NavLink } from 'react-router-dom'
import keycloak from './keycloak.js'
import { VehiculesPage } from './pages/VehiculesPage'
import { ConducteursPage } from './pages/ConducteursPage'
import { CartePage } from './pages/CartePage'
import { MaintenancePage } from './pages/MaintenancePage'

const navStyle = ({ isActive }) => ({
  padding: '8px 16px',
  textDecoration: 'none',
  color: isActive ? 'white' : '#333',
  background: isActive ? '#2563eb' : 'transparent',
  borderRadius: 4,
})

function App() {
  return (
    <BrowserRouter>
      <div style={{ fontFamily: 'sans-serif' }}>
        <header style={{
          padding: 16,
          borderBottom: '1px solid #ddd',
          display: 'flex',
          gap: 8,
          alignItems: 'center',
        }}>
          <h1 style={{ marginRight: 'auto' }}>Gestion de flotte</h1>
          <NavLink to="/" end style={navStyle}>Véhicules</NavLink>
          <NavLink to="/conducteurs" style={navStyle}>Conducteurs</NavLink>
          <NavLink to="/maintenance" style={navStyle}>Maintenance</NavLink>
          <NavLink to="/carte" style={navStyle}>Carte</NavLink>
          <span style={{ marginLeft: 16, color: '#555', fontSize: 14 }}>
            {keycloak.tokenParsed?.preferred_username}
            {' · '}
            {keycloak.tokenParsed?.realm_access?.roles?.find(r =>
              ['admin', 'manager', 'technicien', 'utilisateur'].includes(r)
            ) ?? 'utilisateur'}
          </span>
          <button onClick={() => keycloak.logout()} style={{ marginLeft: 8 }}>
            Déconnexion
          </button>
        </header>

        <main style={{ padding: 20 }}>
          <Routes>
            <Route path="/" element={<VehiculesPage />} />
            <Route path="/conducteurs" element={<ConducteursPage />} />
            <Route path="/maintenance" element={<MaintenancePage />} />
            <Route path="/carte" element={<CartePage />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  )
}

export default App