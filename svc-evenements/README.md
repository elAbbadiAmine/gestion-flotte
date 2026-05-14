# svc-evenements

Consomme les événements Kafka de tous les services et les expose comme alertes via REST.

**Port :** 3005

## Variables d'environnement

| Variable | Exemple |
|----------|---------|
| PORT | 3005 |
| DATABASE_URL | postgresql://user:pass@host/events_db |
| KAFKA_BROKER | kafka:9092 |
| KEYCLOAK_URL | http://keycloak:8080 |
| KEYCLOAK_REALM | flotte |
| OTEL_EXPORTER_OTLP_ENDPOINT | http://otel-collector:4317 |

## Endpoints

| Méthode | Route | Description |
|---------|-------|-------------|
| GET | /alertes | Liste les alertes (params: non_lues, type, limit) |
| GET | /alertes/:id | Retourne une alerte |
| PUT | /alertes/:id/lu | Marque une alerte comme lue |

## Topics Kafka consommés

`vehicules`, `conducteurs`, `maintenance`, `localisation`

## Note base de données

La base `events_db` doit être créée manuellement dans le cluster PostgreSQL :

```bash
PGPASS=$(kubectl get secret -n flotte-dev postgresql-fleet -o jsonpath='{.data.postgres-password}' | base64 -d)
kubectl exec -it -n flotte-dev postgresql-fleet-0 -- \
  env PGPASSWORD="$PGPASS" psql -U postgres -c "CREATE DATABASE events_db;"
```

## Rebuild K8s

```bash
eval $(minikube docker-env)
DOCKER_BUILDKIT=0 docker build -t svc-evenements:dev .
kubectl rollout restart deployment/svc-evenements -n flotte-dev
```
