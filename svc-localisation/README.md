# svc-localisation

Tracking GPS en temps réel. Reçoit les positions via gRPC, les stocke dans TimescaleDB, les expose via REST.

**Ports :** 3004 (REST), 50051 (gRPC)

## Variables d'environnement

| Variable | Exemple |
|----------|---------|
| PORT | 3004 |
| GRPC_PORT | 50051 |
| DATABASE_URL | postgresql://user:pass@host/timescaledb |
| KAFKA_BROKER | kafka:9092 |
| OTEL_EXPORTER_OTLP_ENDPOINT | http://otel-collector:4317 |

## Endpoints REST

| Méthode | Route | Description |
|---------|-------|-------------|
| GET | /localisation/dernieres | Dernière position de chaque véhicule |
| GET | /localisation/:vehicule_id/historique | Historique (params: depuis, jusqu_a, limit) |
| GET | /localisation/:vehicule_id/derniere | Dernière position d'un véhicule |

## Interface gRPC

Service `LocalisationService`, méthode `StreamPositions` (stream bidirectionnel). Proto dans `src/grpc/localisation.proto`.

## Simulateur

```bash
# Port-forward gRPC
kubectl port-forward -n flotte-dev svc/svc-localisation 50051:50051
# Lancer le simulateur
cd simulateur && node simulateur.js
```

Adapter les UUIDs dans `simulateur.js` avec les vrais IDs des véhicules en base.

## Rebuild K8s

```bash
eval $(minikube docker-env)
DOCKER_BUILDKIT=0 docker build -t svc-localisation:dev .
kubectl rollout restart deployment/svc-localisation -n flotte-dev
```
