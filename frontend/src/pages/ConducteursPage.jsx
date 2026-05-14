import { useQuery, useMutation, gql } from '@apollo/client'
import { useState } from 'react'
import { canManageFleet } from '../utils/roles'
import { ConfirmModal } from '../components/ConfirmModal'
import { label } from '../utils/labels'

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

const FIELDS = [
  { label: 'Nom',                                    name: 'nom',                    type: 'text'  },
  { label: 'Prénom',                                 name: 'prenom',                 type: 'text'  },
  { label: 'Email',                                  name: 'email',                  type: 'email' },
  { label: 'Téléphone',                              name: 'telephone',              type: 'text'  },
  { label: 'N° Permis',                              name: 'numeroPermis',           type: 'text'  },
  { label: 'Catégories permis (séparées par virgule)', name: 'categoriesPermis',     type: 'text'  },
  { label: 'Date expiration permis',                 name: 'dateExpirationPermis',   type: 'date'  },
]

export function ConducteursPage() {
  const { loading, error, data, refetch } = useQuery(GET_CONDUCTEURS)
  const [modal, setModal] = useState(null)
  const [selected, setSelected] = useState(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [confirm, setConfirm] = useState(null)

  const peutModifier = canManageFleet()

  const [createConducteur] = useMutation(CREATE_CONDUCTEUR)
  const [updateConducteur] = useMutation(UPDATE_CONDUCTEUR)
  const [deleteConducteur] = useMutation(DELETE_CONDUCTEUR)

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
      if (modal === 'create') await createConducteur({ variables: { input } })
      else await updateConducteur({ variables: { id: selected.id, input } })
      await refetch()
      closeModal()
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
            {data.conducteurs.map((c) => (
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
                      <button onClick={() => askDelete(c)} className="btn btn-danger btn-sm">Supprimer</button>
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
            <h3 className="modal-title">{modal === 'create' ? 'Ajouter un conducteur' : 'Modifier le conducteur'}</h3>
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
