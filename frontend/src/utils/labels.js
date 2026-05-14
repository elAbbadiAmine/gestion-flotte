const MAP = {
  disponible:          'Disponible',
  en_mission:          'En mission',
  en_maintenance:      'En maintenance',
  hors_service:        'Hors service',
  actif:               'Actif',
  inactif:             'Inactif',
  suspendu:            'Suspendu',
  revision:            'Révision',
  reparation:          'Réparation',
  controle_technique:  'Contrôle technique',
  pneus:               'Pneus',
  autre:               'Autre',
  planifiee:           'Planifiée',
  en_cours:            'En cours',
  terminee:            'Terminée',
  annulee:             'Annulée',
  admin:               'Administrateur',
  manager:             'Manager',
  technicien:          'Technicien',
  utilisateur:         'Utilisateur',
}

export const label = (val) => MAP[val] ?? val.replace(/_/g, ' ')
