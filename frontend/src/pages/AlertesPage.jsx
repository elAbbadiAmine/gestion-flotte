import { useQuery, useMutation, gql } from '@apollo/client'
import { useState } from 'react'
import { canSeeAlertsCritiques } from '../utils/roles'
import { label } from '../utils/labels'

const GET_ALERTES = gql`
  query GetAlertes($niveau: NiveauAlerte, $lu: Boolean) {
    alertes(niveau: $niveau, lu: $lu) {
      id
      type
      niveau
      vehiculeId
      message
      lu
      createdAt
    }
  }
`

const GET_VEHICULES = gql`
  query GetVehiculesAlertes {
    vehicules {
      id
      immatriculation
    }
  }
`

const MARQUER_LUE = gql`
  mutation MarquerAlerteLue($id: ID!) {
    marquerAlerteLue(id: $id) {
      id lu
    }
  }
`

function fmtDate(iso) {
  if (!iso) return '—'
  return new Date(iso).toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' })
}

const UUID_RE = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi
function replaceIds(msg, map) {
  if (!msg) return '—'
  return msg.replace(UUID_RE, (id) => map[id] ?? id.slice(0, 8) + '…')
}

export function AlertesPage() {
  const [filtreNiveau, setFiltreNiveau] = useState('')
  const [filtreLu, setFiltreLu] = useState('false')

  const voitCritiques = canSeeAlertsCritiques()

  const variables = {}
  if (filtreNiveau) variables.niveau = filtreNiveau
  if (filtreLu !== '') variables.lu = filtreLu === 'true'

  const { loading, error, data, refetch } = useQuery(GET_ALERTES, { variables })
  const { data: dataVehicules } = useQuery(GET_VEHICULES)
  const [marquerLue] = useMutation(MARQUER_LUE)

  const vehiculeMap = {}
  for (const v of dataVehicules?.vehicules ?? []) vehiculeMap[v.id] = v.immatriculation

  const handleMarquer = async (id) => {
    await marquerLue({ variables: { id } })
    await refetch()
  }

  const alertes = (data?.alertes ?? []).filter(a => {
    if (a.niveau === 'critique' && !voitCritiques) return false
    return true
  })

  if (loading) return <p className="state-loading">Chargement...</p>
  if (error)   return <p className="state-error">Erreur : {error.message}</p>

  return (
    <div>
      <div className="page-header">
        <h2 className="page-title">Alertes ({alertes.length})</h2>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <select
            value={filtreNiveau}
            onChange={e => setFiltreNiveau(e.target.value)}
            className="form-select"
            style={{ width: 160 }}
          >
            <option value="">Tous les niveaux</option>
            <option value="info">Info</option>
            <option value="warning">Avertissement</option>
            {voitCritiques && <option value="critique">Critique</option>}
          </select>
          <select
            value={filtreLu}
            onChange={e => setFiltreLu(e.target.value)}
            className="form-select"
            style={{ width: 160 }}
          >
            <option value="false">Non lues</option>
            <option value="true">Lues</option>
            <option value="">Toutes</option>
          </select>
          <button onClick={() => refetch()} className="btn btn-secondary">Rafraîchir</button>
        </div>
      </div>

      {alertes.length === 0 ? (
        <div style={{ padding: '32px 0', textAlign: 'center', color: '#64748b' }}>
          Aucune alerte{filtreLu === 'false' ? ' non lue' : ''}.
        </div>
      ) : (
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Niveau</th>
                <th>Type</th>
                <th>Message</th>
                <th>Véhicule</th>
                <th>Statut</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {alertes.map(a => (
                <tr key={a.id} style={{ opacity: a.lu ? 0.6 : 1 }}>
                  <td style={{ whiteSpace: 'nowrap' }}>{fmtDate(a.createdAt)}</td>
                  <td>
                    <span className={`badge badge-${a.niveau}`}>{label(a.niveau)}</span>
                  </td>
                  <td>{label(a.type)}</td>
                  <td style={{ maxWidth: 320 }}>{replaceIds(a.message, vehiculeMap)}</td>
                  <td>{a.vehiculeId ? (vehiculeMap[a.vehiculeId] ?? a.vehiculeId.slice(0, 8) + '…') : '—'}</td>
                  <td>
                    {a.lu
                      ? <span className="badge badge-lu">Lue</span>
                      : <span className="badge badge-warning">Non lue</span>
                    }
                  </td>
                  <td>
                    {!a.lu && (
                      <button
                        onClick={() => handleMarquer(a.id)}
                        className="btn btn-secondary btn-sm"
                      >
                        Marquer lue
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
