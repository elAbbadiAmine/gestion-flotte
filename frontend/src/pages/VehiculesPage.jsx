import { useQuery, useMutation, gql } from '@apollo/client'
import { useState } from 'react'
import { canManageFleet } from '../utils/roles'
import { ConfirmModal } from '../components/ConfirmModal'
import { label } from '../utils/labels'

const GET_VEHICULES = gql`
  query GetVehicules {
    vehicules {
      id
      immatriculation
      marque
      modele
      annee
      statut
      kilometrage
    }
  }
`

const CREATE_VEHICULE = gql`
  mutation CreateVehicule($input: CreateVehiculeInput!) {
    createVehicule(input: $input) {
      id immatriculation marque modele annee statut kilometrage
    }
  }
`

const UPDATE_VEHICULE = gql`
  mutation UpdateVehicule($id: ID!, $input: UpdateVehiculeInput!) {
    updateVehicule(id: $id, input: $input) {
      id immatriculation marque modele annee statut kilometrage
    }
  }
`

const DELETE_VEHICULE = gql`
  mutation DeleteVehicule($id: ID!) {
    deleteVehicule(id: $id)
  }
`

const STATUTS = ['disponible', 'en_mission', 'en_maintenance', 'hors_service']
const EMPTY_FORM = { immatriculation: '', marque: '', modele: '', annee: new Date().getFullYear(), statut: 'disponible', kilometrage: 0 }

const FIELDS = [
  { label: 'Immatriculation', name: 'immatriculation', type: 'text' },
  { label: 'Marque',          name: 'marque',          type: 'text' },
  { label: 'Modèle',          name: 'modele',          type: 'text' },
  { label: 'Année',           name: 'annee',           type: 'number' },
  { label: 'Kilométrage',     name: 'kilometrage',     type: 'number' },
]

export function VehiculesPage() {
  const { loading, error, data, refetch } = useQuery(GET_VEHICULES)
  const [modal, setModal] = useState(null)
  const [selected, setSelected] = useState(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [confirm, setConfirm] = useState(null)

  const peutModifier = canManageFleet()

  const [createVehicule] = useMutation(CREATE_VEHICULE)
  const [updateVehicule] = useMutation(UPDATE_VEHICULE)
  const [deleteVehicule] = useMutation(DELETE_VEHICULE)

  const openCreate = () => { setForm(EMPTY_FORM); setSelected(null); setModal('create') }
  const openEdit = (v) => {
    setSelected(v)
    setForm({ immatriculation: v.immatriculation, marque: v.marque, modele: v.modele, annee: v.annee, statut: v.statut, kilometrage: v.kilometrage })
    setModal('edit')
  }
  const closeModal = () => { setModal(null); setSelected(null) }
  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value })

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      const input = { ...form, annee: parseInt(form.annee), kilometrage: parseInt(form.kilometrage) }
      if (modal === 'create') await createVehicule({ variables: { input } })
      else await updateVehicule({ variables: { id: selected.id, input } })
      await refetch()
      closeModal()
    } finally {
      setSaving(false)
    }
  }

  const askDelete = (v) => setConfirm({
    message: `Supprimer le véhicule ${v.immatriculation} ?`,
    onConfirm: async () => {
      setConfirm(null)
      await deleteVehicule({ variables: { id: v.id } })
      await refetch()
    },
  })

  if (loading) return <p className="state-loading">Chargement...</p>
  if (error)   return <p className="state-error">Erreur : {error.message}</p>

  return (
    <div>
      <div className="page-header">
        <h2 className="page-title">Véhicules ({data.vehicules.length})</h2>
        {peutModifier && (
          <button onClick={openCreate} className="btn btn-primary">+ Ajouter</button>
        )}
      </div>

      <div className="table-wrap">
        <table className="data-table">
          <thead>
            <tr>
              <th>Immatriculation</th>
              <th>Marque</th>
              <th>Modèle</th>
              <th>Année</th>
              <th>Statut</th>
              <th>Kilométrage</th>
              {peutModifier && <th>Actions</th>}
            </tr>
          </thead>
          <tbody>
            {data.vehicules.map((v) => (
              <tr key={v.id}>
                <td style={{ fontWeight: 500 }}>{v.immatriculation}</td>
                <td>{v.marque}</td>
                <td>{v.modele}</td>
                <td>{v.annee}</td>
                <td><span className={`badge badge-${v.statut}`}>{label(v.statut)}</span></td>
                <td>{v.kilometrage.toLocaleString()} km</td>
                {peutModifier && (
                  <td>
                    <div className="td-actions">
                      <button onClick={() => openEdit(v)} className="btn btn-secondary btn-sm">Modifier</button>
                      <button onClick={() => askDelete(v)} className="btn btn-danger btn-sm">Supprimer</button>
                    </div>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {confirm && (
        <ConfirmModal
          message={confirm.message}
          onConfirm={confirm.onConfirm}
          onCancel={() => setConfirm(null)}
        />
      )}

      {modal && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-box" onClick={e => e.stopPropagation()}>
            <h3 className="modal-title">{modal === 'create' ? 'Ajouter un véhicule' : 'Modifier le véhicule'}</h3>
            <form onSubmit={handleSubmit}>
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
