# svc-vehicules

CRUD véhicules. Publie un événement Kafka après chaque mutation.

**Port :** 3001

## Variables d'environnement

| Variable | Exemple |
|----------|---------|
| PORT | 3001 |
| DATABASE_URL | postgresql://user:pass@host/db |
| KAFKA_BROKER | kafka:9092 |
| OTEL_EXPORTER_OTLP_ENDPOINT | http://otel-collector:4317 |

## Endpoints

| Méthode | Route | Rôles |
|---------|-------|-------|
| GET | /vehicules | tous |
| GET | /vehicules/:id | tous |
| POST | /vehicules | admin, manager |
| PUT | /vehicules/:id | admin, manager |
| DELETE | /vehicules/:id | admin |

## Événements Kafka produits

Topic `vehicules` — types : `VEHICULE_CREE`, `VEHICULE_MIS_A_JOUR`, `VEHICULE_SUPPRIME`

## Rebuild K8s

```bash
eval $(minikube docker-env)
DOCKER_BUILDKIT=0 docker build -t svc-vehicules:dev .
kubectl rollout restart deployment/svc-vehicules -n flotte-dev
```
