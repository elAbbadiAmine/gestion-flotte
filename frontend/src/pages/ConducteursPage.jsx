import { useQuery, useMutation, gql } from '@apollo/client'
import { useState } from 'react'
import { canManageFleet } from '../utils/roles'

const GET_CONDUCTEURS = gql`
  query GetConducteurs {
    conducteurs {
      id
      nom
      prenom
      email
      telephone
      numeroPermis
      categoriesPermis
      dateExpirationPermis
      statut
    }
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

const STATUTS = ['actif', 'inactif', 'en_mission', 'suspendu']
const EMPTY_FORM = { nom: '', prenom: '', email: '', telephone: '', numeroPermis: '', categoriesPermis: 'B', dateExpirationPermis: '', statut: 'actif' }

const btnPrimary = { padding: '7px 14px', background: '#2563eb', color: 'white', border: 'none', borderRadius: 4, cursor: 'pointer' }
const btnDanger = { padding: '4px 10px', background: 'transparent', color: '#dc2626', border: '1px solid #dc2626', borderRadius: 4, cursor: 'pointer' }
const btnSecondary = { padding: '4px 10px', border: '1px solid #aaa', borderRadius: 4, cursor: 'pointer', background: 'transparent' }

export function ConducteursPage() {
  const { loading, error, data, refetch } = useQuery(GET_CONDUCTEURS)
  const [modal, setModal] = useState(null)
  const [selected, setSelected] = useState(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [saving, setSaving] = useState(false)

  const peutModifier = canManageFleet()

  const [createConducteur] = useMutation(CREATE_CONDUCTEUR)
  const [updateConducteur] = useMutation(UPDATE_CONDUCTEUR)
  const [deleteConducteur] = useMutation(DELETE_CONDUCTEUR)

  const openCreate = () => { setForm(EMPTY_FORM); setSelected(null); setModal('create') }
  const openEdit = (c) => {
    setSelected(c)
    setForm({
      nom: c.nom, prenom: c.prenom, email: c.email, telephone: c.telephone,
      numeroPermis: c.numeroPermis, categoriesPermis: (c.categoriesPermis || []).join(', '),
      dateExpirationPermis: c.dateExpirationPermis?.slice(0, 10) ?? '',
      statut: c.statut,
    })
    setModal('edit')
  }
  const closeModal = () => { setModal(null); setSelected(null) }

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value })

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      const input = {
        ...form,
        categoriesPermis: form.categoriesPermis.split(',').map(s => s.trim()).filter(Boolean),
      }
      if (modal === 'create') {
        await createConducteur({ variables: { input } })
      } else {
        await updateConducteur({ variables: { id: selected.id, input } })
      }
      await refetch()
      closeModal()
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (c) => {
    if (!window.confirm(`Supprimer ${c.prenom} ${c.nom} ?`)) return
    await deleteConducteur({ variables: { id: c.id } })
    await refetch()
  }

  if (loading) return <p>Chargement...</p>
  if (error) return <p style={{ color: 'red' }}>Erreur : {error.message}</p>

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <h2 style={{ margin: 0 }}>Conducteurs ({data.conducteurs.length})</h2>
        {peutModifier && <button onClick={openCreate} style={btnPrimary}>+ Ajouter</button>}
      </div>

      <table border="1" cellPadding="8" style={{ borderCollapse: 'collapse', width: '100%' }}>
        <thead style={{ background: '#eee' }}>
          <tr>
            <th>Nom</th>
            <th>Prénom</th>
            <th>Email</th>
            <th>Téléphone</th>
            <th>N° Permis</th>
            <th>Catégories</th>
            <th>Expiration</th>
            <th>Statut</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {data.conducteurs.map((c) => (
            <tr key={c.id}>
              <td>{c.nom}</td>
              <td>{c.prenom}</td>
              <td>{c.email}</td>
              <td>{c.telephone}</td>
              <td>{c.numeroPermis}</td>
              <td>{(c.categoriesPermis || []).join(', ')}</td>
              <td>{c.dateExpirationPermis?.slice(0, 10)}</td>
              <td>{c.statut}</td>
              <td style={{ display: 'flex', gap: 6 }}>
                {peutModifier && <button onClick={() => openEdit(c)} style={btnSecondary}>Modifier</button>}
                {peutModifier && <button onClick={() => handleDelete(c)} style={btnDanger}>Supprimer</button>}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {modal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
          <div style={{ background: 'white', padding: 28, borderRadius: 8, width: 440, maxHeight: '90vh', overflowY: 'auto' }}>
            <h3 style={{ marginTop: 0 }}>{modal === 'create' ? 'Ajouter un conducteur' : 'Modifier le conducteur'}</h3>
            <form onSubmit={handleSubmit}>
              {[
                { label: 'Nom', name: 'nom', type: 'text' },
                { label: 'Prénom', name: 'prenom', type: 'text' },
                { label: 'Email', name: 'email', type: 'email' },
                { label: 'Téléphone', name: 'telephone', type: 'text' },
                { label: 'N° Permis', name: 'numeroPermis', type: 'text' },
                { label: 'Catégories permis (séparées par virgule)', name: 'categoriesPermis', type: 'text' },
                { label: 'Date expiration permis', name: 'dateExpirationPermis', type: 'date' },
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
