import Keycloak from 'keycloak-js'

const keycloak = new Keycloak({
  url: 'http://localhost:8080',
  realm: 'flotte',
  clientId: 'gestion-flotte-frontend',
})

export default keycloak
