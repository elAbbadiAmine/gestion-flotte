# Documentation technique — Gestion de Flotte

## Architecture Decision Records (ADR)

Les ADR documentent les décisions d'architecture importantes prises pendant le projet.

| ADR | Décision |
|-----|----------|
| [ADR-001](adr/ADR-001-nodejs-uniformise.md) | Node.js comme langage unique pour tous les services |
| [ADR-002](adr/ADR-002-graphql-gateway.md) | API Gateway GraphQL avec Apollo Server |
| [ADR-003](adr/ADR-003-kafka-evenements.md) | Kafka comme bus d'événements inter-services |
| [ADR-004](adr/ADR-004-keycloak-sso.md) | Keycloak pour l'authentification SSO et le RBAC |
| [ADR-005](adr/ADR-005-timescaledb-gps.md) | TimescaleDB + gRPC pour le tracking GPS |
| [ADR-006](adr/ADR-006-kubernetes-minikube.md) | Déploiement Kubernetes avec Minikube |

## Spécifications OpenAPI

Chaque service REST est documenté en OpenAPI 3.0.

| Service | Spec | Port |
|---------|------|------|
| svc-vehicules | [openapi/svc-vehicules.yaml](openapi/svc-vehicules.yaml) | 3001 |
| svc-conducteurs | [openapi/svc-conducteurs.yaml](openapi/svc-conducteurs.yaml) | 3002 |
| svc-maintenance | [openapi/svc-maintenance.yaml](openapi/svc-maintenance.yaml) | 3003 |
| svc-localisation | [openapi/svc-localisation.yaml](openapi/svc-localisation.yaml) | 3004 |
| svc-evenements | [openapi/svc-evenements.yaml](openapi/svc-evenements.yaml) | 3005 |

Pour visualiser les specs localement :

```bash
# Avec npx swagger-ui-express (pas d'install globale)
npx @redocly/cli preview-docs docs/openapi/svc-vehicules.yaml
```

Ou copier le contenu d'un fichier YAML dans [editor.swagger.io](https://editor.swagger.io).

## READMEs par service

| Service | README |
|---------|--------|
| api-gateway | [api-gateway/README.md](../api-gateway/README.md) |
| svc-vehicules | [svc-vehicules/README.md](../svc-vehicules/README.md) |
| svc-conducteurs | [svc-conducteurs/README.md](../svc-conducteurs/README.md) |
| svc-maintenance | [svc-maintenance/README.md](../svc-maintenance/README.md) |
| svc-localisation | [svc-localisation/README.md](../svc-localisation/README.md) |
| svc-evenements | [svc-evenements/README.md](../svc-evenements/README.md) |
