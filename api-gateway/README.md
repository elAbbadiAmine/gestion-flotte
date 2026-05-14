# api-gateway

Passerelle GraphQL qui agrège les 5 services REST. Seul point d'entrée exposé au frontend.

**Port :** 4000

## Variables d'environnement

| Variable | Exemple |
|----------|---------|
| PORT | 4000 |
| SVC_VEHICULES_URL | http://svc-vehicules:3001 |
| SVC_CONDUCTEURS_URL | http://svc-conducteurs:3002 |
| SVC_MAINTENANCE_URL | http://svc-maintenance:3003 |
| SVC_LOCALISATION_URL | http://svc-localisation:3004 |
| SVC_EVENEMENTS_URL | http://svc-evenements:3005 |
| KEYCLOAK_URL | http://keycloak:8080 |
| KEYCLOAK_REALM | flotte |
| KEYCLOAK_CLIENT_ID | gestion-flotte-api |
| KEYCLOAK_CLIENT_SECRET | *** |
| OTEL_EXPORTER_OTLP_ENDPOINT | http://otel-collector:4317 |

## Tester avec Apollo Sandbox

```bash
kubectl port-forward -n flotte-dev svc/api-gateway 4000:4000
# Ouvrir http://localhost:4000/graphql
```

Ajouter le header `Authorization: Bearer <token>` pour les requêtes authentifiées.

## Tester avec curl

```bash
curl -X POST http://localhost:4000/graphql \
  -H "Content-Type: application/json" \
  -H "apollo-require-preflight: true" \
  -H "Authorization: Bearer <token>" \
  -d '{"query": "{ vehicules { id immatriculation } }"}'
```

Apollo Server v4 bloque les requêtes sans header CSRF. Le header `apollo-require-preflight: true` est nécessaire avec curl.

## Rebuild K8s

```bash
eval $(minikube docker-env)
DOCKER_BUILDKIT=0 docker build -t api-gateway:dev .
kubectl rollout restart deployment/api-gateway -n flotte-dev
```
