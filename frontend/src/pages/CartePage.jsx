import { useQuery, gql } from '@apollo/client'
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import markerIcon from 'leaflet/dist/images/marker-icon.png'
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png'
import markerShadow from 'leaflet/dist/images/marker-shadow.png'

delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({ iconRetinaUrl: markerIcon2x, iconUrl: markerIcon, shadowUrl: markerShadow })

const GET_POSITIONS = gql`
  query ToutesDernieresPositions {
    toutesDernieresPositions {
      vehiculeId
      latitude
      longitude
      time
    }
  }
`

export function CartePage() {
  const { loading, error, data } = useQuery(GET_POSITIONS, { pollInterval: 5000 })

  if (loading) return <p className="state-loading">Chargement...</p>
  if (error)   return <p className="state-error">Erreur : {error.message}</p>

  const positions = data.toutesDernieresPositions

  return (
    <div>
      <div className="page-header" style={{ marginBottom: 12 }}>
        <h2 className="page-title">
          Carte GPS — {positions.length} véhicule{positions.length !== 1 ? 's' : ''} en ligne
        </h2>
      </div>

      <div style={{ borderRadius: 10, overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.1), 0 0 0 1px #e2e8f0' }}>
        <MapContainer center={[49.4432, 1.0999]} zoom={12} style={{ height: 600 }}>
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          />
          {positions.map((p) => (
            <Marker key={p.vehiculeId} position={[p.latitude, p.longitude]}>
              <Popup>
                <strong>Véhicule</strong><br />
                ID : {p.vehiculeId.slice(0, 8)}…<br />
                Lat : {p.latitude.toFixed(5)}<br />
                Lon : {p.longitude.toFixed(5)}<br />
                Heure : {new Date(p.time).toLocaleTimeString()}
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>
    </div>
  )
}
