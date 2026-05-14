# Documentation

## ADR (Architecture Decision Records)

| Fichier | Décision |
|---------|----------|
| [ADR-001](adr/ADR-001-nodejs-uniformise.md) | Node.js pour tous les services |
| [ADR-002](adr/ADR-002-graphql-gateway.md) | API Gateway GraphQL |
| [ADR-003](adr/ADR-003-kafka-evenements.md) | Kafka comme bus d'événements |
| [ADR-004](adr/ADR-004-keycloak-sso.md) | Keycloak pour l'authentification |
| [ADR-005](adr/ADR-005-timescaledb-gps.md) | TimescaleDB et gRPC pour le GPS |
| [ADR-006](adr/ADR-006-kubernetes-minikube.md) | Kubernetes avec Minikube |

## Specs OpenAPI

| Service | Fichier | Port |
|---------|---------|------|
| svc-vehicules | [openapi/svc-vehicules.yaml](openapi/svc-vehicules.yaml) | 3001 |
| svc-conducteurs | [openapi/svc-conducteurs.yaml](openapi/svc-conducteurs.yaml) | 3002 |
| svc-maintenance | [openapi/svc-maintenance.yaml](openapi/svc-maintenance.yaml) | 3003 |
| svc-localisation | [openapi/svc-localisation.yaml](openapi/svc-localisation.yaml) | 3004 |
| svc-evenements | [openapi/svc-evenements.yaml](openapi/svc-evenements.yaml) | 3005 |

Pour visualiser une spec : coller le contenu dans [editor.swagger.io](https://editor.swagger.io).
