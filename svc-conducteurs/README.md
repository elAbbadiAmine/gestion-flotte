# svc-conducteurs

CRUD conducteurs et gestion des missions (assignation véhicule-conducteur). Publie sur Kafka.

**Port :** 3002

## Variables d'environnement

| Variable | Exemple |
|----------|---------|
| PORT | 3002 |
| DATABASE_URL | postgresql://user:pass@host/db |
| KAFKA_BROKER | kafka:9092 |
| OTEL_EXPORTER_OTLP_ENDPOINT | http://otel-collector:4317 |

## Endpoints

| Méthode | Route | Rôles |
|---------|-------|-------|
| GET | /conducteurs | tous |
| GET | /conducteurs/:id | tous |
| POST | /conducteurs | admin, manager |
| PUT | /conducteurs/:id | admin, manager |
| DELETE | /conducteurs/:id | admin |
| POST | /conducteurs/:id/assigner-mission | admin, manager |
| POST | /conducteurs/:id/terminer-mission | admin, manager, technicien |
| POST | /conducteurs/:id/echouer-mission | admin, manager |

## Événements Kafka produits

Topic `conducteurs` — types : `CONDUCTEUR_CREE`, `MISSION_ASSIGNEE`, `MISSION_TERMINEE`, `MISSION_ECHOUEE`

## Rebuild K8s

```bash
eval $(minikube docker-env)
DOCKER_BUILDKIT=0 docker build -t svc-conducteurs:dev .
kubectl rollout restart deployment/svc-conducteurs -n flotte-dev
```
