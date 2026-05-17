import { useQuery, gql } from '@apollo/client'
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

const createVehiculeIcon = (immat) => L.divIcon({
  className: '',
  html: `<div style="text-align:center;position:relative;width:64px">
    <div style="background:#1e40af;color:white;font-size:9px;font-weight:700;padding:2px 5px;border-radius:4px;white-space:nowrap;margin-bottom:2px;box-shadow:0 1px 3px rgba(0,0,0,0.3)">${immat}</div>
    <div style="font-size:24px;line-height:1;filter:drop-shadow(0 1px 2px rgba(0,0,0,0.3))">🚗</div>
  </div>`,
  iconSize: [64, 46],
  iconAnchor: [32, 46],
  popupAnchor: [0, -48],
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

const GET_VEHICULES = gql`
  query GetVehiculesCarte {
    vehicules { id immatriculation }
  }
`

export function CartePage() {
  const { loading, error, data } = useQuery(GET_POSITIONS, { pollInterval: 5000 })
  const { data: dataVehicules } = useQuery(GET_VEHICULES)

  if (loading) return <p className="state-loading">Chargement...</p>
  if (error)   return <p className="state-error">Erreur : {error.message}</p>

  const positions = data.toutesDernieresPositions
  const vehiculeMap = {}
  for (const v of dataVehicules?.vehicules ?? []) vehiculeMap[v.id] = v.immatriculation

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
          {positions.map((p) => {
            const immat = vehiculeMap[p.vehiculeId] ?? p.vehiculeId.slice(0, 8)
            return (
              <Marker key={p.vehiculeId} position={[p.latitude, p.longitude]} icon={createVehiculeIcon(immat)}>
                <Popup>
                  <strong>{immat}</strong><br />
                  Lat : {p.latitude.toFixed(5)}<br />
                  Lon : {p.longitude.toFixed(5)}<br />
                  Heure : {new Date(p.time).toLocaleTimeString()}
                </Popup>
              </Marker>
            )
          })}
        </MapContainer>
      </div>
    </div>
  )
}
