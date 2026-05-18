import { useQuery, useMutation, gql } from '@apollo/client'
import { useState } from 'react'
import { canManageFleet } from '../utils/roles'
import { ConfirmModal } from '../components/ConfirmModal'
import { Pagination } from '../components/Pagination'
import { label } from '../utils/labels'

const PAGE_SIZE = 10

const GET_CONDUCTEURS = gql`
  query GetConducteurs {
    conducteurs {
      id nom prenom email telephone numeroPermis categoriesPermis dateExpirationPermis statut vehiculeId
    }
  }
`

const GET_VEHICULES_DISPO = gql`
  query GetVehiculesDispo {
    vehicules { id immatriculation marque modele statut }
  }
`

const CREATE_CONDUCTEUR = gql`
  mutation CreateConducteur($input: CreateConducteurInput!) {
    createConducteur(input: $input) {
      id nom prenom email telephone numeroPermis categoriesPermis dateExpirationPermis statut
    }
  }
`

const UPDATE_CONDUCTEUR = gql`
  mutation UpdateConducteur($id: ID!, $input: UpdateConducteurInput!) {
    updateConducteur(id: $id, input: $input) {
      id nom prenom email telephone numeroPermis categoriesPermis dateExpirationPermis statut
    }
  }
`

const DELETE_CONDUCTEUR = gql`
  mutation DeleteConducteur($id: ID!) {
    deleteConducteur(id: $id)
  }
`

const ASSIGNER_MISSION = gql`
  mutation AssignerMission($id: ID!, $vehiculeId: ID!, $missionId: String!) {
    assignerMission(id: $id, vehiculeId: $vehiculeId, missionId: $missionId)
  }
`

const TERMINER_MISSION = gql`
  mutation TerminerMission($id: ID!, $missionId: String!) {
    terminerMission(id: $id, missionId: $missionId)
  }
`

const STATUTS = ['actif', 'inactif', 'suspendu']

const EMPTY_FORM = { nom: '', prenom: '', email: '', telephone: '', numeroPermis: '', categoriesPermis: 'B', dateExpirationPermis: '', statut: 'actif' }

const FIELDS = [
  { label: 'Nom',                                      name: 'nom',                  type: 'text'  },
  { label: 'Prénom',                                   name: 'prenom',               type: 'text'  },
  { label: 'Email',                                    name: 'email',                type: 'email' },
  { label: 'Téléphone',                                name: 'telephone',            type: 'text'  },
  { label: 'N° Permis',                                name: 'numeroPermis',         type: 'text'  },
  { label: 'Catégories permis (séparées par virgule)', name: 'categoriesPermis',     type: 'text'  },
  { label: 'Date expiration permis',                   name: 'dateExpirationPermis', type: 'date'  },
]

export function ConducteursPage() {
  const { loading, error, data, refetch } = useQuery(GET_CONDUCTEURS)
  const { data: dataVehicules, refetch: refetchVehicules } = useQuery(GET_VEHICULES_DISPO, { fetchPolicy: 'network-only' })
  const [modal, setModal] = useState(null)
  const [selected, setSelected] = useState(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [page, setPage] = useState(1)
  const [formError, setFormError] = useState(null)
  const [confirm, setConfirm] = useState(null)
  const [missionForm, setMissionForm] = useState({ vehiculeId: '', missionId: '' })

  const peutModifier = canManageFleet()

  const [createConducteur] = useMutation(CREATE_CONDUCTEUR)
  const [updateConducteur] = useMutation(UPDATE_CONDUCTEUR)
  const [deleteConducteur] = useMutation(DELETE_CONDUCTEUR)
  const [assignerMission] = useMutation(ASSIGNER_MISSION)
  const [terminerMission] = useMutation(TERMINER_MISSION)

  const openCreate = () => { setForm(EMPTY_FORM); setSelected(null); setModal('create') }
  const openEdit = (c) => {
    setSelected(c)
    setForm({
      nom: c.nom, prenom: c.prenom, email: c.email, telephone: c.telephone,
      numeroPermis: c.numeroPermis,
      categoriesPermis: (c.categoriesPermis || []).join(', '),
      dateExpirationPermis: c.dateExpirationPermis?.slice(0, 10) ?? '',
      statut: c.statut,
    })
    setModal('edit')
  }
  const openAssigner = async (c) => {
    setSelected(c)
    setMissionForm({ vehiculeId: '', missionId: `MISSION-${Date.now()}` })
    await refetchVehicules()
    setModal('assigner')
  }
  const openTerminer = (c) => {
    setSelected(c)
    setMissionForm({ vehiculeId: '', missionId: `MISSION-${Date.now()}` })
    setModal('terminer')
  }
  const closeModal = () => { setModal(null); setSelected(null); setFormError(null) }
  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value })

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    setFormError(null)
    try {
      const input = {
        ...form,
        categoriesPermis: form.categoriesPermis.split(',').map(s => s.trim()).filter(Boolean),
      }
      if (modal === 'create') await createConducteur({ variables: { input } })
      else await updateConducteur({ variables: { id: selected.id, input } })
      await refetch()
      closeModal()
    } catch (err) {
      setFormError(err.message)
    } finally {
      setSaving(false)
    }
  }

  const handleAssigner = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      await assignerMission({
        variables: { id: selected.id, vehiculeId: missionForm.vehiculeId, missionId: missionForm.missionId },
        update(cache) {
          cache.modify({
            id: cache.identify({ __typename: 'Vehicule', id: missionForm.vehiculeId }),
            fields: { statut: () => 'en_mission' },
          })
        },
      })
      await Promise.all([refetch(), refetchVehicules()])
      closeModal()
    } catch (err) {
      setFormError(err.message)
    } finally {
      setSaving(false)
    }
  }

  const handleTerminer = async () => {
    setSaving(true)
    const vehiculeId = selected.vehiculeId
    try {
      await terminerMission({
        variables: { id: selected.id, missionId: `MISSION-${Date.now()}` },
        update(cache) {
          if (vehiculeId) {
            cache.modify({
              id: cache.identify({ __typename: 'Vehicule', id: vehiculeId }),
              fields: { statut: () => 'disponible' },
            })
          }
        },
      })
      await Promise.all([refetch(), refetchVehicules()])
      closeModal()
    } catch (err) {
      setFormError(err.message)
    } finally {
      setSaving(false)
    }
  }

  const askDelete = (c) => setConfirm({
    message: `Supprimer le conducteur ${c.prenom} ${c.nom} ?`,
    onConfirm: async () => {
      setConfirm(null)
      await deleteConducteur({ variables: { id: c.id } })
      await refetch()
    },
  })

  const vehiculesDispo = (dataVehicules?.vehicules ?? []).filter(v => v.statut === 'disponible')

  if (loading) return <p className="state-loading">Chargement...</p>
  if (error)   return <p className="state-error">Erreur : {error.message}</p>

  return (
    <div>
      <div className="page-header">
        <h2 className="page-title">Conducteurs ({data.conducteurs.length})</h2>
        {peutModifier && (
          <button onClick={openCreate} className="btn btn-primary">+ Ajouter</button>
        )}
      </div>

      <div className="table-wrap">
        <table className="data-table">
          <thead>
            <tr>
              <th>Nom</th>
              <th>Prénom</th>
              <th>Email</th>
              <th>Téléphone</th>
              <th>N° Permis</th>
              <th>Catégories</th>
              <th>Expiration</th>
              <th>Statut</th>
              {peutModifier && <th>Actions</th>}
            </tr>
          </thead>
          <tbody>
            {data.conducteurs.slice((page-1)*PAGE_SIZE, page*PAGE_SIZE).map((c) => (
              <tr key={c.id}>
                <td style={{ fontWeight: 500 }}>{c.nom}</td>
                <td>{c.prenom}</td>
                <td>{c.email}</td>
                <td>{c.telephone}</td>
                <td className="mono-sm">{c.numeroPermis}</td>
                <td>{(c.categoriesPermis || []).join(', ')}</td>
                <td>{c.dateExpirationPermis?.slice(0, 10) ?? '—'}</td>
                <td><span className={`badge badge-${c.statut}`}>{label(c.statut)}</span></td>
                {peutModifier && (
                  <td>
                    <div className="td-actions">
                      <button onClick={() => openEdit(c)} className="btn btn-secondary btn-sm">Modifier</button>
                      {c.statut === 'actif' && !c.vehiculeId && (
                        <button onClick={() => openAssigner(c)} className="btn btn-primary btn-sm">Assigner</button>
                      )}
                      {c.statut !== 'actif' && !c.vehiculeId && (
                        <button disabled title={`Conducteur ${label(c.statut)} — modifier le statut pour assigner`} className="btn btn-primary btn-sm" style={{ opacity: 0.4, cursor: 'not-allowed' }}>Assigner</button>
                      )}
                      {c.vehiculeId && (
                        <button onClick={() => openTerminer(c)} className="btn btn-secondary btn-sm">Terminer mission</button>
                      )}
                      <button onClick={() => askDelete(c)} className="btn btn-danger btn-sm">Supprimer</button>
                    </div>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
        <Pagination page={page} total={data.conducteurs.length} pageSize={PAGE_SIZE} onChange={setPage} />
      </div>

      {confirm && (
        <ConfirmModal
          message={confirm.message}
          onConfirm={confirm.onConfirm}
          onCancel={() => setConfirm(null)}
        />
      )}

      {modal === 'terminer' && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-box" onClick={e => e.stopPropagation()}>
            <h3 className="modal-title">Terminer mission — {selected.prenom} {selected.nom}</h3>
            <p style={{ color: '#64748b', marginBottom: 24 }}>
              Le conducteur repassera en <strong>actif</strong> et son véhicule en <strong>disponible</strong>.
            </p>
            {formError && <p style={{ color: '#ef4444', marginBottom: 12, fontSize: 14 }}>{formError}</p>}
            <div className="modal-footer">
              <button type="button" onClick={closeModal} className="btn btn-secondary">Annuler</button>
              <button onClick={handleTerminer} disabled={saving} className="btn btn-primary">
                {saving ? 'En cours...' : 'Confirmer'}
              </button>
            </div>
          </div>
        </div>
      )}

      {modal === 'assigner' && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-box" onClick={e => e.stopPropagation()}>
            <h3 className="modal-title">Assigner un véhicule — {selected.prenom} {selected.nom}</h3>
            <form onSubmit={handleAssigner}>
              {formError && <p style={{ color: '#ef4444', marginBottom: 12, fontSize: 14 }}>{formError}</p>}
              <div className="form-group">
                <label className="form-label">Véhicule disponible</label>
                <select
                  className="form-select"
                  value={missionForm.vehiculeId}
                  onChange={e => setMissionForm({ ...missionForm, vehiculeId: e.target.value })}
                  required
                >
                  <option value="">— Sélectionner —</option>
                  {vehiculesDispo.map(v => (
                    <option key={v.id} value={v.id}>{v.immatriculation} — {v.marque} {v.modele}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Référence mission</label>
                <input
                  className="form-input"
                  value={missionForm.missionId}
                  onChange={e => setMissionForm({ ...missionForm, missionId: e.target.value })}
                  required
                />
              </div>
              <div className="modal-footer">
                <button type="button" onClick={closeModal} className="btn btn-secondary">Annuler</button>
                <button type="submit" disabled={saving || !missionForm.vehiculeId} className="btn btn-primary">
                  {saving ? 'Assignation...' : 'Assigner'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {(modal === 'create' || modal === 'edit') && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-box" onClick={e => e.stopPropagation()}>
            <h3 className="modal-title">{modal === 'create' ? 'Ajouter un conducteur' : 'Modifier le conducteur'}</h3>
            <form onSubmit={handleSubmit}>
              {formError && <p style={{ color: '#ef4444', marginBottom: 12, fontSize: 14 }}>{formError}</p>}
              {FIELDS.map(({ label, name, type }) => (
                <div key={name} className="form-group">
                  <label className="form-label">{label}</label>
                  <input
                    type={type}
                    name={name}
                    value={form[name]}
                    onChange={handleChange}
                    required
                    className="form-input"
                  />
                </div>
              ))}
              <div className="form-group">
                <label className="form-label">Statut</label>
                <select name="statut" value={form.statut} onChange={handleChange} className="form-select">
                  {STATUTS.map(s => <option key={s} value={s}>{label(s)}</option>)}
                </select>
              </div>
              <div className="modal-footer">
                <button type="button" onClick={closeModal} className="btn btn-secondary">Annuler</button>
                <button type="submit" disabled={saving} className="btn btn-primary">
                  {saving ? 'Enregistrement...' : modal === 'create' ? 'Créer' : 'Enregistrer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
