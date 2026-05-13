import { useQuery, useMutation, gql } from '@apollo/client'
import { useState } from 'react'
import { canManageFleet } from '../utils/roles'

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

const btnPrimary = { padding: '7px 14px', background: '#2563eb', color: 'white', border: 'none', borderRadius: 4, cursor: 'pointer' }
const btnDanger = { padding: '4px 10px', background: 'transparent', color: '#dc2626', border: '1px solid #dc2626', borderRadius: 4, cursor: 'pointer' }
const btnSecondary = { padding: '4px 10px', border: '1px solid #aaa', borderRadius: 4, cursor: 'pointer', background: 'transparent' }

export function VehiculesPage() {
  const { loading, error, data, refetch } = useQuery(GET_VEHICULES)
  const [modal, setModal] = useState(null)
  const [selected, setSelected] = useState(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [saving, setSaving] = useState(false)

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
      if (modal === 'create') {
        await createVehicule({ variables: { input } })
      } else {
        await updateVehicule({ variables: { id: selected.id, input } })
      }
      await refetch()
      closeModal()
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (v) => {
    if (!window.confirm(`Supprimer ${v.immatriculation} ?`)) return
    await deleteVehicule({ variables: { id: v.id } })
    await refetch()
  }

  if (loading) return <p>Chargement...</p>
  if (error) return <p style={{ color: 'red' }}>Erreur : {error.message}</p>

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <h2 style={{ margin: 0 }}>Véhicules ({data.vehicules.length})</h2>
        {peutModifier && <button onClick={openCreate} style={btnPrimary}>+ Ajouter</button>}
      </div>

      <table border="1" cellPadding="8" style={{ borderCollapse: 'collapse', width: '100%' }}>
        <thead style={{ background: '#eee' }}>
          <tr>
            <th>Immatriculation</th>
            <th>Marque</th>
            <th>Modèle</th>
            <th>Année</th>
            <th>Statut</th>
            <th>Kilométrage</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {data.vehicules.map((v) => (
            <tr key={v.id}>
              <td>{v.immatriculation}</td>
              <td>{v.marque}</td>
              <td>{v.modele}</td>
              <td>{v.annee}</td>
              <td>{v.statut}</td>
              <td>{v.kilometrage} km</td>
              <td style={{ display: 'flex', gap: 6 }}>
                {peutModifier && <button onClick={() => openEdit(v)} style={btnSecondary}>Modifier</button>}
                {peutModifier && <button onClick={() => handleDelete(v)} style={btnDanger}>Supprimer</button>}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {modal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
          <div style={{ background: 'white', padding: 28, borderRadius: 8, width: 420 }}>
            <h3 style={{ marginTop: 0 }}>{modal === 'create' ? 'Ajouter un véhicule' : 'Modifier le véhicule'}</h3>
            <form onSubmit={handleSubmit}>
              {[
                { label: 'Immatriculation', name: 'immatriculation', type: 'text' },
                { label: 'Marque', name: 'marque', type: 'text' },
                { label: 'Modèle', name: 'modele', type: 'text' },
                { label: 'Année', name: 'annee', type: 'number' },
                { label: 'Kilométrage', name: 'kilometrage', type: 'number' },
              ].map(({ label, name, type }) => (
                <div key={name} style={{ marginBottom: 12 }}>
                  <label style={{ display: 'block', marginBottom: 4, fontWeight: 500 }}>{label}</label>
                  <input
                    type={type}
                    name={name}
                    value={form[name]}
                    onChange={handleChange}
                    required
                    style={{ width: '100%', padding: 7, boxSizing: 'border-box', border: '1px solid #ccc', borderRadius: 4 }}
                  />
                </div>
              ))}

              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', marginBottom: 4, fontWeight: 500 }}>Statut</label>
                <select name="statut" value={form.statut} onChange={handleChange} style={{ width: '100%', padding: 7, border: '1px solid #ccc', borderRadius: 4 }}>
                  {STATUTS.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>

              <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                <button type="button" onClick={closeModal} style={btnSecondary}>Annuler</button>
                <button type="submit" disabled={saving} style={{ ...btnPrimary, opacity: saving ? 0.7 : 1 }}>
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
