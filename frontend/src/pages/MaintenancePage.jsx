import { useQuery, useMutation, gql } from '@apollo/client'
import { useState } from 'react'
import { canManageMaintenance } from '../utils/roles'
import { label } from '../utils/labels'

const GET_VEHICULES = gql`
  query GetVehiculesForMaintenance {
    vehicules { id immatriculation }
  }
`

const GET_MAINTENANCES = gql`
  query GetMaintenances {
    maintenances {
      id
      vehiculeId
      type
      statut
      datePlanifiee
      dateReelle
      kilometrageIntervention
      kilometrageProchaine
      description
      cout
      technicien
    }
  }
`

const CREATE_MAINTENANCE = gql`
  mutation CreateMaintenance($input: CreateMaintenanceInput!) {
    createMaintenance(input: $input) {
      id vehiculeId type statut datePlanifiee description technicien
    }
  }
`

const UPDATE_MAINTENANCE = gql`
  mutation UpdateMaintenance($id: ID!, $input: UpdateMaintenanceInput!) {
    updateMaintenance(id: $id, input: $input) {
      id vehiculeId type statut datePlanifiee dateReelle
      kilometrageIntervention kilometrageProchaine description cout technicien
    }
  }
`

const TYPES  = ['revision', 'reparation', 'controle_technique', 'pneus', 'autre']
const STATUTS = ['planifiee', 'en_cours', 'terminee', 'annulee']

const EMPTY_CREATE = { vehiculeId: '', type: 'revision', datePlanifiee: '', description: '', technicien: '' }
const EMPTY_UPDATE = { type: 'revision', statut: 'planifiee', datePlanifiee: '', dateReelle: '', kilometrageIntervention: '', kilometrageProchaine: '', description: '', cout: '', technicien: '' }

function fmt(str) { return str ? str.slice(0, 10) : '—' }

export function MaintenancePage() {
  const { loading, error, data, refetch } = useQuery(GET_MAINTENANCES)
  const { data: dataV } = useQuery(GET_VEHICULES)
  const vehicules = dataV?.vehicules ?? []
  const vehiculeMap = Object.fromEntries(vehicules.map(v => [v.id, v.immatriculation]))
  const [modal, setModal] = useState(null)
  const [selected, setSelected] = useState(null)
  const [formCreate, setFormCreate] = useState(EMPTY_CREATE)
  const [formUpdate, setFormUpdate] = useState(EMPTY_UPDATE)
  const [saving, setSaving] = useState(false)

  const peutModifier = canManageMaintenance()

  const [createMaintenance] = useMutation(CREATE_MAINTENANCE)
  const [updateMaintenance] = useMutation(UPDATE_MAINTENANCE)

  const openCreate = () => { setFormCreate(EMPTY_CREATE); setModal('create') }
  const openEdit = (m) => {
    setSelected(m)
    setFormUpdate({
      type: m.type,
      statut: m.statut,
      datePlanifiee: fmt(m.datePlanifiee) === '—' ? '' : fmt(m.datePlanifiee),
      dateReelle:    fmt(m.dateReelle)    === '—' ? '' : fmt(m.dateReelle),
      kilometrageIntervention: m.kilometrageIntervention ?? '',
      kilometrageProchaine:    m.kilometrageProchaine    ?? '',
      description: m.description ?? '',
      cout:        m.cout        ?? '',
      technicien:  m.technicien  ?? '',
    })
    setModal('edit')
  }
  const closeModal = () => { setModal(null); setSelected(null) }

  const handleSubmitCreate = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      const input = { ...formCreate }
      if (!input.description) delete input.description
      if (!input.technicien)  delete input.technicien
      await createMaintenance({ variables: { input } })
      await refetch()
      closeModal()
    } finally { setSaving(false) }
  }

  const handleSubmitUpdate = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      const input = { ...formUpdate }
      if (input.kilometrageIntervention) input.kilometrageIntervention = parseInt(input.kilometrageIntervention)
      else delete input.kilometrageIntervention
      if (input.kilometrageProchaine) input.kilometrageProchaine = parseInt(input.kilometrageProchaine)
      else delete input.kilometrageProchaine
      if (input.cout) input.cout = parseFloat(input.cout)
      else delete input.cout
      if (!input.dateReelle)   delete input.dateReelle
      if (!input.description)  delete input.description
      if (!input.technicien)   delete input.technicien
      await updateMaintenance({ variables: { id: selected.id, input } })
      await refetch()
      closeModal()
    } finally { setSaving(false) }
  }

  if (loading) return <p className="state-loading">Chargement...</p>
  if (error)   return <p className="state-error">Erreur : {error.message}</p>

  return (
    <div>
      <div className="page-header">
        <h2 className="page-title">Maintenance ({data.maintenances.length})</h2>
        {peutModifier && (
          <button onClick={openCreate} className="btn btn-primary">+ Planifier</button>
        )}
      </div>

      <div className="table-wrap">
        <table className="data-table">
          <thead>
            <tr>
              <th>Véhicule</th>
              <th>Type</th>
              <th>Statut</th>
              <th>Date planifiée</th>
              <th>Date réelle</th>
              <th>Km intervention</th>
              <th>Km prochaine</th>
              <th>Coût (€)</th>
              <th>Technicien</th>
              <th>Description</th>
              {peutModifier && <th>Actions</th>}
            </tr>
          </thead>
          <tbody>
            {data.maintenances.map((m) => (
              <tr key={m.id}>
                <td style={{ fontWeight: 500 }}>{vehiculeMap[m.vehiculeId] ?? m.vehiculeId.slice(0, 8) + '…'}</td>
                <td>{m.type}</td>
                <td><span className={`badge badge-${m.statut}`}>{label(m.statut)}</span></td>
                <td>{fmt(m.datePlanifiee)}</td>
                <td>{fmt(m.dateReelle)}</td>
                <td>{m.kilometrageIntervention ?? '—'}</td>
                <td>{m.kilometrageProchaine    ?? '—'}</td>
                <td>{m.cout != null ? `${m.cout} €` : '—'}</td>
                <td>{m.technicien ?? '—'}</td>
                <td style={{ maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {m.description ?? '—'}
                </td>
                {peutModifier && (
                  <td>
                    <button onClick={() => openEdit(m)} className="btn btn-secondary btn-sm">Modifier</button>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal création */}
      {modal === 'create' && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-box" onClick={e => e.stopPropagation()}>
            <h3 className="modal-title">Planifier une intervention</h3>
            <form onSubmit={handleSubmitCreate}>
              <div className="form-group">
                <label className="form-label">Véhicule</label>
                <select value={formCreate.vehiculeId}
                  onChange={e => setFormCreate({ ...formCreate, vehiculeId: e.target.value })}
                  required className="form-select">
                  <option value="">— Sélectionner un véhicule —</option>
                  {vehicules.map(v => (
                    <option key={v.id} value={v.id}>{v.immatriculation}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Type</label>
                <select value={formCreate.type}
                  onChange={e => setFormCreate({ ...formCreate, type: e.target.value })}
                  className="form-select">
                  {TYPES.map(t => <option key={t} value={t}>{label(t)}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Date planifiée</label>
                <input type="date" value={formCreate.datePlanifiee}
                  onChange={e => setFormCreate({ ...formCreate, datePlanifiee: e.target.value })}
                  required className="form-input" />
              </div>
              <div className="form-group">
                <label className="form-label">Technicien</label>
                <input type="text" value={formCreate.technicien}
                  onChange={e => setFormCreate({ ...formCreate, technicien: e.target.value })}
                  className="form-input" />
              </div>
              <div className="form-group">
                <label className="form-label">Description</label>
                <textarea value={formCreate.description}
                  onChange={e => setFormCreate({ ...formCreate, description: e.target.value })}
                  rows={3} className="form-textarea" />
              </div>
              <div className="modal-footer">
                <button type="button" onClick={closeModal} className="btn btn-secondary">Annuler</button>
                <button type="submit" disabled={saving} className="btn btn-primary">
                  {saving ? 'Enregistrement...' : 'Planifier'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal modification */}
      {modal === 'edit' && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-box" onClick={e => e.stopPropagation()}>
            <h3 className="modal-title">Modifier l'intervention</h3>
            <form onSubmit={handleSubmitUpdate}>
              {[
                { title: 'Type',   key: 'type',   options: TYPES   },
                { title: 'Statut', key: 'statut', options: STATUTS },
              ].map(({ title, key, options }) => (
                <div key={key} className="form-group">
                  <label className="form-label">{title}</label>
                  <select value={formUpdate[key]}
                    onChange={e => setFormUpdate({ ...formUpdate, [key]: e.target.value })}
                    className="form-select">
                    {options.map(o => <option key={o} value={o}>{label(o)}</option>)}
                  </select>
                </div>
              ))}
              {[
                { title: 'Date planifiée',             key: 'datePlanifiee',          type: 'date'   },
                { title: 'Date réelle',                key: 'dateReelle',             type: 'date'   },
                { title: "Km à l'intervention",        key: 'kilometrageIntervention', type: 'number' },
                { title: 'Km prochaine intervention',  key: 'kilometrageProchaine',   type: 'number' },
                { title: 'Coût (€)',                   key: 'cout',                   type: 'number' },
                { title: 'Technicien',                 key: 'technicien',             type: 'text'   },
              ].map(({ title, key, type }) => (
                <div key={key} className="form-group">
                  <label className="form-label">{title}</label>
                  <input type={type} value={formUpdate[key]}
                    onChange={e => setFormUpdate({ ...formUpdate, [key]: e.target.value })}
                    className="form-input" />
                </div>
              ))}
              <div className="form-group">
                <label className="form-label">Description</label>
                <textarea value={formUpdate.description}
                  onChange={e => setFormUpdate({ ...formUpdate, description: e.target.value })}
                  rows={3} className="form-textarea" />
              </div>
              <div className="modal-footer">
                <button type="button" onClick={closeModal} className="btn btn-secondary">Annuler</button>
                <button type="submit" disabled={saving} className="btn btn-primary">
                  {saving ? 'Enregistrement...' : 'Enregistrer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
