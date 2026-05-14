import keycloak from '../keycloak'

const ROLE_PRIORITY = ['admin', 'manager', 'technicien', 'utilisateur']

export function getRole() {
  const roles = keycloak.tokenParsed?.realm_access?.roles ?? []
  return ROLE_PRIORITY.find(r => roles.includes(r)) ?? 'utilisateur'
}

// admin + manager : gestion complète du parc (véhicules, conducteurs)
export function canManageFleet() {
  const r = getRole()
  return r === 'admin' || r === 'manager'
}

// admin + manager + technicien : gestion des interventions maintenance
export function canManageMaintenance() {
  const r = getRole()
  return r === 'admin' || r === 'manager' || r === 'technicien'
}

// tous les rôles connectés voient les alertes
export function canSeeAlertes() {
  return true
}

// seuls admin et manager voient les alertes critique (geofencing, suppressions)
export function canSeeAlertsCritiques() {
  const r = getRole()
  return r === 'admin' || r === 'manager'
}
