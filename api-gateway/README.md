# api-gateway

Passerelle GraphQL unique qui agrège tous les services REST internes. Seul point d'entrée exposé au frontend.

## Responsabilités

- Exposer une API GraphQL unifiée (Apollo Server v4)
- Valider les tokens JWT Keycloak (JWKS)
- Agréger les données de tous les services métier
- Propager le contexte utilisateur aux services (headers `X-User-*`)
- Gérer le CORS pour le frontend React

## Stack

| Composant | Technologie |
|-----------|-------------|
| Runtime | Node.js 20 |
| Framework | Express 4 + Apollo Server v4 |
| Client HTTP | Axios (via `config/httpClient`) |
| Auth | Keycloak JWKS (jwks-rsa) |
| Logs | pino |
| Observabilité | OpenTelemetry → Jaeger + Prometheus |

## Port

`4000`

## Variables d'environnement

| Variable | Description | Exemple |
|----------|-------------|---------|
| `PORT` | Port d'écoute | `4000` |
| `SVC_VEHICULES_URL` | URL interne svc-vehicules | `http://svc-vehicules:3001` |
| `SVC_CONDUCTEURS_URL` | URL interne svc-conducteurs | `http://svc-conducteurs:3002` |
| `SVC_MAINTENANCE_URL` | URL interne svc-maintenance | `http://svc-maintenance:3003` |
| `SVC_LOCALISATION_URL` | URL interne svc-localisation | `http://svc-localisation:3004` |
| `SVC_EVENEMENTS_URL` | URL interne svc-evenements | `http://svc-evenements:3005` |
| `KEYCLOAK_URL` | URL Keycloak | `http://keycloak:8080` |
| `KEYCLOAK_REALM` | Realm | `flotte` |
| `KEYCLOAK_CLIENT_ID` | Client ID | `gestion-flotte-api` |
| `KEYCLOAK_CLIENT_SECRET` | Secret client | `***` |
| `OTEL_EXPORTER_OTLP_ENDPOINT` | Endpoint OpenTelemetry | `http://otel-collector:4317` |

## Schéma GraphQL

Le schéma est splitté par domaine dans `src/schema/` :

```
src/schema/
├── index.js            # Merge de tous les types
├── vehicule.graphql    # Type Vehicule, queries, mutations
├── conducteur.graphql  # Type Conducteur, queries, mutations
├── maintenance.graphql # Type Maintenance, queries, mutations
├── localisation.graphql# Type Position, queries
└── alerte.graphql      # Type Alerte, queries, mutations
```

### Queries principales

```graphql
# Lister tous les véhicules
query GetVehicules {
  vehicules { id immatriculation marque statut }
}

# Véhicule avec sa dernière position
query GetVehiculeAvecPosition($id: ID!) {
  vehicule(id: $id) {
    id immatriculation
    dernierePosition { latitude longitude vitesse timestamp }
  }
}

# Toutes les alertes non lues
query GetAlertes {
  alertes(nonLues: true) { id type message createdAt }
}
```

### Mutations principales

```graphql
mutation CreerVehicule($input: VehiculeInput!) {
  creerVehicule(input: $input) { id immatriculation }
}

mutation AssignerMission($conducteurId: ID!, $vehiculeId: ID!) {
  assignerMission(conducteurId: $conducteurId, vehiculeId: $vehiculeId) {
    id statut
  }
}

mutation MarquerAlerteLue($id: ID!) {
  marquerAlerteLue(id: $id) { id lu }
}
```

## Architecture interne

```
src/
├── app.js              # Express + Apollo Server setup
├── schema/             # Fichiers GraphQL par domaine
├── resolvers/          # Résolution des queries/mutations
│   ├── vehiculeResolver.js
│   ├── conducteurResolver.js
│   ├── maintenanceResolver.js
│   ├── localisationResolver.js
│   └── alerteResolver.js
├── datasources/        # Clients HTTP vers chaque service
│   ├── vehicule.datasource.js
│   ├── conducteur.datasource.js
│   ├── maintenance.datasource.js
│   ├── localisation.datasource.js
│   └── alerte.datasource.js
├── config/
│   ├── httpClient.js   # Instance Axios partagée
│   ├── keycloak.js     # Vérification JWKS
│   └── opentelemetry.js
└── middleware/
    └── auth.js         # Extraction et validation du token
```

## Tester avec Apollo Sandbox

En dev, Apollo Sandbox est accessible sur `http://localhost:4000/graphql` (port-forward requis).

```bash
kubectl port-forward -n flotte-dev svc/api-gateway 4000:4000
```

Pour les requêtes authentifiées, ajouter dans les headers :
```json
{ "Authorization": "Bearer <token>" }
```

## Tester avec curl

```bash
curl -X POST http://localhost:4000/graphql \
  -H "Content-Type: application/json" \
  -H "apollo-require-preflight: true" \
  -H "Authorization: Bearer <token>" \
  -d '{"query": "{ vehicules { id immatriculation } }"}'
```

> Apollo Server v4 bloque les requêtes sans header CSRF. Le header `apollo-require-preflight: true` est nécessaire avec curl.

## CORS

Le frontend React tourne sur `http://localhost:5173` (dev) ou `http://flotte.local` (K8s). La config CORS dans `app.js` autorise ces deux origines avec `credentials: true`.

## Rebuild K8s

```bash
eval $(minikube docker-env)
DOCKER_BUILDKIT=0 docker build -t api-gateway:dev .
kubectl rollout restart deployment/api-gateway -n flotte-dev
```
