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
      id vehiculeId type statut datePlanifiee description technicien
    }
  }
`

const TERMINER_MAINTENANCE = gql`
  mutation TerminerMaintenance($id: ID!, $input: TerminerMaintenanceInput!) {
    terminerMaintenance(id: $id, input: $input) {
      id statut dateReelle kilometrageIntervention kilometrageProchaine cout technicien
    }
  }
`

const ANNULER_MAINTENANCE = gql`
  mutation AnnulerMaintenance($id: ID!, $motif: String) {
    annulerMaintenance(id: $id, motif: $motif) {
      id statut
    }
  }
`

const TYPES = ['revision', 'reparation', 'controle_technique', 'pneus', 'autre']

const statutEffectif = (m) => {
  if (m.statut === 'planifiee') {
    const planifie = new Date(m.datePlanifiee)
    planifie.setHours(0, 0, 0, 0)
    const auj = new Date()
    auj.setHours(0, 0, 0, 0)
    if (planifie <= auj) return 'en_cours'
  }
  return m.statut
}

const EMPTY_CREATE = { vehiculeId: '', type: 'revision', datePlanifiee: '', description: '', technicien: '' }
function fmt(str) { return str ? str.slice(0, 10) : '—' }

export function MaintenancePage() {
  const { loading, error, data, refetch } = useQuery(GET_MAINTENANCES)
  const { data: dataV } = useQuery(GET_VEHICULES)
  const vehicules = dataV?.vehicules ?? []
  const vehiculeMap = Object.fromEntries(vehicules.map(v => [v.id, v.immatriculation]))

  const [modal, setModal]           = useState(null)
  const [selected, setSelected]     = useState(null)
  const [formCreate, setFormCreate] = useState(EMPTY_CREATE)
  const [formEdit, setFormEdit]     = useState({ type: 'revision', datePlanifiee: '', description: '', technicien: '' })
  const [motifAnnul, setMotifAnnul] = useState('')
  const [saving, setSaving]         = useState(false)
  const [errMsg, setErrMsg]         = useState('')

  const peutModifier = canManageMaintenance()

  const [createMaintenance]  = useMutation(CREATE_MAINTENANCE)
  const [updateMaintenance]  = useMutation(UPDATE_MAINTENANCE)
  const [terminerMaintenance] = useMutation(TERMINER_MAINTENANCE)
  const [annulerMaintenance]  = useMutation(ANNULER_MAINTENANCE)

  const openCreate = () => { setFormCreate(EMPTY_CREATE); setErrMsg(''); setModal('create') }

  const openEdit = (m) => {
    setSelected(m)
    setFormEdit({
      type: m.type,
      datePlanifiee: fmt(m.datePlanifiee) === '—' ? '' : fmt(m.datePlanifiee),
      description: m.description ?? '',
      technicien:  m.technicien  ?? '',
    })
    setErrMsg('')
    setModal('edit')
  }

  const openAnnuler = (m) => {
    setSelected(m)
    setMotifAnnul('')
    setErrMsg('')
    setModal('annuler')
  }

  const closeModal = () => { setModal(null); setSelected(null); setErrMsg('') }

  const handleCreate = async (e) => {
    e.preventDefault()
    setSaving(true); setErrMsg('')
    try {
      const input = { ...formCreate }
      if (!input.description) delete input.description
      if (!input.technicien)  delete input.technicien
      await createMaintenance({ variables: { input } })
      await refetch()
      closeModal()
    } catch (err) {
      setErrMsg(err.message)
    } finally { setSaving(false) }
  }

  const handleEdit = async (e) => {
    e.preventDefault()
    setSaving(true); setErrMsg('')
    try {
      const input = { ...formEdit }
      if (!input.description) delete input.description
      if (!input.technicien)  delete input.technicien
      await updateMaintenance({ variables: { id: selected.id, input } })
      await refetch()
      closeModal()
    } catch (err) {
      setErrMsg(err.message)
    } finally { setSaving(false) }
  }

  const handleTerminer = async (m) => {
    setSaving(true)
    try {
      await terminerMaintenance({ variables: { id: m.id, input: {} } })
      await refetch()
    } catch (err) {
      alert(err.message)
    } finally { setSaving(false) }
  }

  const handleAnnuler = async (e) => {
    e.preventDefault()
    setSaving(true); setErrMsg('')
    try {
      await annulerMaintenance({ variables: { id: selected.id, motif: motifAnnul || undefined } })
      await refetch()
      closeModal()
    } catch (err) {
      setErrMsg(err.message)
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
              <th>Technicien</th>
              <th>Description</th>
              {peutModifier && <th>Actions</th>}
            </tr>
          </thead>
          <tbody>
            {data.maintenances.map((m) => (
              <tr key={m.id}>
                <td style={{ fontWeight: 500 }}>{vehiculeMap[m.vehiculeId] ?? m.vehiculeId.slice(0, 8) + '…'}</td>
                <td>{label(m.type)}</td>
                <td><span className={`badge badge-${statutEffectif(m)}`}>{label(statutEffectif(m))}</span></td>
                <td>{fmt(m.datePlanifiee)}</td>
                <td>{m.technicien ?? '—'}</td>
                <td style={{ maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {m.description ?? '—'}
                </td>
                {peutModifier && (
                  <td style={{ whiteSpace: 'nowrap', display: 'flex', gap: 4 }}>
                    {statutEffectif(m) === 'planifiee' && (
                      <>
                        <button onClick={() => openEdit(m)} className="btn btn-secondary btn-sm">Modifier</button>
                        <button onClick={() => openAnnuler(m)} className="btn btn-danger btn-sm">Annuler</button>
                      </>
                    )}
                    {statutEffectif(m) === 'en_cours' && (
                      <>
                        <button onClick={() => handleTerminer(m)} disabled={saving} className="btn btn-primary btn-sm">Terminer</button>
                        <button onClick={() => openAnnuler(m)} className="btn btn-danger btn-sm">Annuler</button>
                      </>
                    )}
                    {(m.statut === 'terminee' || m.statut === 'annulee') && (
                      <span style={{ color: '#94a3b8', fontSize: 12 }}>—</span>
                    )}
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
            <form onSubmit={handleCreate}>
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
              {errMsg && <p style={{ color: '#dc2626', marginBottom: 8 }}>{errMsg}</p>}
              <div className="modal-footer">
                <button type="button" onClick={closeModal} className="btn btn-secondary">Fermer</button>
                <button type="submit" disabled={saving} className="btn btn-primary">
                  {saving ? 'Enregistrement...' : 'Planifier'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal modifier (planifiee seulement) */}
      {modal === 'edit' && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-box" onClick={e => e.stopPropagation()}>
            <h3 className="modal-title">Modifier l'intervention</h3>
            <form onSubmit={handleEdit}>
              <div className="form-group">
                <label className="form-label">Type</label>
                <select value={formEdit.type}
                  onChange={e => setFormEdit({ ...formEdit, type: e.target.value })}
                  className="form-select">
                  {TYPES.map(t => <option key={t} value={t}>{label(t)}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Date planifiée</label>
                <input type="date" value={formEdit.datePlanifiee}
                  onChange={e => setFormEdit({ ...formEdit, datePlanifiee: e.target.value })}
                  className="form-input" />
              </div>
              <div className="form-group">
                <label className="form-label">Technicien</label>
                <input type="text" value={formEdit.technicien}
                  onChange={e => setFormEdit({ ...formEdit, technicien: e.target.value })}
                  className="form-input" />
              </div>
              <div className="form-group">
                <label className="form-label">Description</label>
                <textarea value={formEdit.description}
                  onChange={e => setFormEdit({ ...formEdit, description: e.target.value })}
                  rows={3} className="form-textarea" />
              </div>
              {errMsg && <p style={{ color: '#dc2626', marginBottom: 8 }}>{errMsg}</p>}
              <div className="modal-footer">
                <button type="button" onClick={closeModal} className="btn btn-secondary">Fermer</button>
                <button type="submit" disabled={saving} className="btn btn-primary">
                  {saving ? 'Enregistrement...' : 'Enregistrer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal annuler */}
      {modal === 'annuler' && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-box" onClick={e => e.stopPropagation()}>
            <h3 className="modal-title">Annuler l'intervention</h3>
            <form onSubmit={handleAnnuler}>
              <div className="form-group">
                <label className="form-label">Motif (optionnel)</label>
                <textarea value={motifAnnul}
                  onChange={e => setMotifAnnul(e.target.value)}
                  rows={3} className="form-textarea"
                  placeholder="Raison de l'annulation..." />
              </div>
              {errMsg && <p style={{ color: '#dc2626', marginBottom: 8 }}>{errMsg}</p>}
              <div className="modal-footer">
                <button type="button" onClick={closeModal} className="btn btn-secondary">Fermer</button>
                <button type="submit" disabled={saving} className="btn btn-danger">
                  {saving ? 'Annulation...' : "Confirmer l'annulation"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
