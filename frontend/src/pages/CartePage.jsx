import { useQuery, gql } from '@apollo/client'
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import markerIcon from 'leaflet/dist/images/marker-icon.png'
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png'
import markerShadow from 'leaflet/dist/images/marker-shadow.png'

delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
})

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

  if (loading) return <p>Chargement...</p>
  if (error) return <p style={{ color: 'red' }}>Erreur : {error.message}</p>

  const positions = data.toutesDernieresPositions

  return (
    <div>
      <h2>Carte GPS ({positions.length} véhicule{positions.length > 1 ? 's' : ''})</h2>
      <MapContainer center={[49.4432, 1.0999]} zoom={12} style={{ height: '600px', marginTop: 10 }}>
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        />
        {positions.map((p) => (
          <Marker key={p.vehiculeId} position={[p.latitude, p.longitude]}>
            <Popup>
              <strong>Véhicule</strong><br />
              ID : {p.vehiculeId}<br />
              Lat : {p.latitude.toFixed(5)}<br />
              Lon : {p.longitude.toFixed(5)}<br />
              Heure : {new Date(p.time).toLocaleTimeString()}
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  )
}
