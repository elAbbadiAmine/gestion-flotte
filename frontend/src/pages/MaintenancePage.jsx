import { useQuery, useMutation, gql } from '@apollo/client'
import { useState } from 'react'
import { canManageMaintenance } from '../utils/roles'

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

const TYPES = ['revision', 'reparation', 'controle_technique', 'pneus', 'autre']
const STATUTS = ['planifiee', 'en_cours', 'terminee', 'annulee']

const EMPTY_CREATE = { vehiculeId: '', type: 'revision', datePlanifiee: '', description: '', technicien: '' }
const EMPTY_UPDATE = { type: 'revision', statut: 'planifiee', datePlanifiee: '', dateReelle: '', kilometrageIntervention: '', kilometrageProchaine: '', description: '', cout: '', technicien: '' }

const btnPrimary = { padding: '7px 14px', background: '#2563eb', color: 'white', border: 'none', borderRadius: 4, cursor: 'pointer' }
const btnSecondary = { padding: '4px 10px', border: '1px solid #aaa', borderRadius: 4, cursor: 'pointer', background: 'transparent' }

const STATUT_COLORS = {
  planifiee: '#f59e0b',
  en_cours: '#3b82f6',
  terminee: '#10b981',
  annulee: '#6b7280',
}

function formatDate(str) {
  if (!str) return '—'
  return str.slice(0, 10)
}

export function MaintenancePage() {
  const { loading, error, data, refetch } = useQuery(GET_MAINTENANCES)
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
      datePlanifiee: formatDate(m.datePlanifiee),
      dateReelle: formatDate(m.dateReelle) === '—' ? '' : formatDate(m.dateReelle),
      kilometrageIntervention: m.kilometrageIntervention ?? '',
      kilometrageProchaine: m.kilometrageProchaine ?? '',
      description: m.description ?? '',
      cout: m.cout ?? '',
      technicien: m.technicien ?? '',
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
      if (!input.technicien) delete input.technicien
      await createMaintenance({ variables: { input } })
      await refetch()
      closeModal()
    } finally {
      setSaving(false)
    }
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
      if (!input.dateReelle) delete input.dateReelle
      if (!input.description) delete input.description
      if (!input.technicien) delete input.technicien
      await updateMaintenance({ variables: { id: selected.id, input } })
      await refetch()
      closeModal()
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <p>Chargement...</p>
  if (error) return <p style={{ color: 'red' }}>Erreur : {error.message}</p>

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <h2 style={{ margin: 0 }}>Maintenance ({data.maintenances.length})</h2>
        {peutModifier && <button onClick={openCreate} style={btnPrimary}>+ Planifier</button>}
      </div>

      <table border="1" cellPadding="8" style={{ borderCollapse: 'collapse', width: '100%' }}>
        <thead style={{ background: '#eee' }}>
          <tr>
            <th>Véhicule (ID)</th>
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
              <td style={{ fontFamily: 'monospace', fontSize: 12 }}>{m.vehiculeId.slice(0, 8)}…</td>
              <td>{m.type}</td>
              <td>
                <span style={{
                  padding: '2px 8px', borderRadius: 10, fontSize: 12,
                  background: STATUT_COLORS[m.statut] + '22',
                  color: STATUT_COLORS[m.statut],
                  border: `1px solid ${STATUT_COLORS[m.statut]}`,
                }}>
                  {m.statut}
                </span>
              </td>
              <td>{formatDate(m.datePlanifiee)}</td>
              <td>{formatDate(m.dateReelle)}</td>
              <td>{m.kilometrageIntervention ?? '—'}</td>
              <td>{m.kilometrageProchaine ?? '—'}</td>
              <td>{m.cout != null ? `${m.cout} €` : '—'}</td>
              <td>{m.technicien ?? '—'}</td>
              <td style={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {m.description ?? '—'}
              </td>
              {peutModifier && (
                <td>
                  <button onClick={() => openEdit(m)} style={btnSecondary}>Modifier</button>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>

      {/* Modal création */}
      {modal === 'create' && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
          <div style={{ background: 'white', padding: 28, borderRadius: 8, width: 420 }}>
            <h3 style={{ marginTop: 0 }}>Planifier une intervention</h3>
            <form onSubmit={handleSubmitCreate}>
              <div style={{ marginBottom: 12 }}>
                <label style={{ display: 'block', marginBottom: 4, fontWeight: 500 }}>ID Véhicule</label>
                <input type="text" value={formCreate.vehiculeId} onChange={e => setFormCreate({ ...formCreate, vehiculeId: e.target.value })} required placeholder="UUID du véhicule" style={{ width: '100%', padding: 7, boxSizing: 'border-box', border: '1px solid #ccc', borderRadius: 4 }} />
              </div>
              <div style={{ marginBottom: 12 }}>
                <label style={{ display: 'block', marginBottom: 4, fontWeight: 500 }}>Type</label>
                <select value={formCreate.type} onChange={e => setFormCreate({ ...formCreate, type: e.target.value })} style={{ width: '100%', padding: 7, border: '1px solid #ccc', borderRadius: 4 }}>
                  {TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div style={{ marginBottom: 12 }}>
                <label style={{ display: 'block', marginBottom: 4, fontWeight: 500 }}>Date planifiée</label>
                <input type="date" value={formCreate.datePlanifiee} onChange={e => setFormCreate({ ...formCreate, datePlanifiee: e.target.value })} required style={{ width: '100%', padding: 7, boxSizing: 'border-box', border: '1px solid #ccc', borderRadius: 4 }} />
              </div>
              <div style={{ marginBottom: 12 }}>
                <label style={{ display: 'block', marginBottom: 4, fontWeight: 500 }}>Technicien</label>
                <input type="text" value={formCreate.technicien} onChange={e => setFormCreate({ ...formCreate, technicien: e.target.value })} style={{ width: '100%', padding: 7, boxSizing: 'border-box', border: '1px solid #ccc', borderRadius: 4 }} />
              </div>
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', marginBottom: 4, fontWeight: 500 }}>Description</label>
                <textarea value={formCreate.description} onChange={e => setFormCreate({ ...formCreate, description: e.target.value })} rows={3} style={{ width: '100%', padding: 7, boxSizing: 'border-box', border: '1px solid #ccc', borderRadius: 4 }} />
              </div>
              <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                <button type="button" onClick={closeModal} style={btnSecondary}>Annuler</button>
                <button type="submit" disabled={saving} style={{ ...btnPrimary, opacity: saving ? 0.7 : 1 }}>
                  {saving ? 'Enregistrement...' : 'Planifier'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal modification */}
      {modal === 'edit' && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
          <div style={{ background: 'white', padding: 28, borderRadius: 8, width: 440, maxHeight: '90vh', overflowY: 'auto' }}>
            <h3 style={{ marginTop: 0 }}>Modifier l'intervention</h3>
            <form onSubmit={handleSubmitUpdate}>
              {[
                { label: 'Type', key: 'type', type: 'select', options: TYPES },
                { label: 'Statut', key: 'statut', type: 'select', options: STATUTS },
              ].map(({ label, key, options }) => (
                <div key={key} style={{ marginBottom: 12 }}>
                  <label style={{ display: 'block', marginBottom: 4, fontWeight: 500 }}>{label}</label>
                  <select value={formUpdate[key]} onChange={e => setFormUpdate({ ...formUpdate, [key]: e.target.value })} style={{ width: '100%', padding: 7, border: '1px solid #ccc', borderRadius: 4 }}>
                    {options.map(o => <option key={o} value={o}>{o}</option>)}
                  </select>
                </div>
              ))}
              {[
                { label: 'Date planifiée', key: 'datePlanifiee', type: 'date' },
                { label: 'Date réelle', key: 'dateReelle', type: 'date' },
                { label: 'Km à l\'intervention', key: 'kilometrageIntervention', type: 'number' },
                { label: 'Km prochaine intervention', key: 'kilometrageProchaine', type: 'number' },
                { label: 'Coût (€)', key: 'cout', type: 'number' },
                { label: 'Technicien', key: 'technicien', type: 'text' },
              ].map(({ label, key, type }) => (
                <div key={key} style={{ marginBottom: 12 }}>
                  <label style={{ display: 'block', marginBottom: 4, fontWeight: 500 }}>{label}</label>
                  <input type={type} value={formUpdate[key]} onChange={e => setFormUpdate({ ...formUpdate, [key]: e.target.value })} style={{ width: '100%', padding: 7, boxSizing: 'border-box', border: '1px solid #ccc', borderRadius: 4 }} />
                </div>
              ))}
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', marginBottom: 4, fontWeight: 500 }}>Description</label>
                <textarea value={formUpdate.description} onChange={e => setFormUpdate({ ...formUpdate, description: e.target.value })} rows={3} style={{ width: '100%', padding: 7, boxSizing: 'border-box', border: '1px solid #ccc', borderRadius: 4 }} />
              </div>
              <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                <button type="button" onClick={closeModal} style={btnSecondary}>Annuler</button>
                <button type="submit" disabled={saving} style={{ ...btnPrimary, opacity: saving ? 0.7 : 1 }}>
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
