# svc-maintenance

Planification et suivi des interventions de maintenance. Publie sur Kafka.

**Port :** 3003

## Variables d'environnement

| Variable | Exemple |
|----------|---------|
| PORT | 3003 |
| DATABASE_URL | postgresql://user:pass@host/db |
| KAFKA_BROKER | kafka:9092 |
| OTEL_EXPORTER_OTLP_ENDPOINT | http://otel-collector:4317 |

## Endpoints

| Méthode | Route | Rôles |
|---------|-------|-------|
| GET | /maintenance/alertes | tous |
| GET | /maintenance/vehicule/:vehiculeId | tous |
| GET | /maintenance | tous |
| GET | /maintenance/:id | tous |
| POST | /maintenance | admin, manager, technicien |
| PUT | /maintenance/:id | admin, manager, technicien |
| POST | /maintenance/:id/demarrer | admin, technicien |
| POST | /maintenance/:id/terminer | admin, technicien |
| POST | /maintenance/:id/annuler | admin, manager |

## Événements Kafka produits

Topic `maintenance` — types : `MAINTENANCE_PLANIFIEE`, `MAINTENANCE_DEMARREE`, `MAINTENANCE_TERMINEE`, `MAINTENANCE_ANNULEE`

## Rebuild K8s

```bash
eval $(minikube docker-env)
DOCKER_BUILDKIT=0 docker build -t svc-maintenance:dev .
kubectl rollout restart deployment/svc-maintenance -n flotte-dev
```
