# svc-evenements

Service de gestion des alertes et notifications. Consomme les événements de tous les autres services via Kafka et les expose via REST pour consultation par le frontend.

## Responsabilités

- Consommer les événements Kafka des topics `vehicules`, `conducteurs`, `maintenance`, `localisation`
- Persister les alertes en base PostgreSQL
- Exposer les alertes via REST
- Permettre de marquer une alerte comme lue

## Stack

| Composant | Technologie |
|-----------|-------------|
| Runtime | Node.js 20 |
| Framework | Express 4 |
| Base de données | PostgreSQL (Sequelize ORM) |
| Bus d'événements | Kafka consumer (KafkaJS) |
| Logs | pino |
| Observabilité | OpenTelemetry → Jaeger + Prometheus |

## Port

`3005`

## Variables d'environnement

| Variable | Description | Exemple |
|----------|-------------|---------|
| `PORT` | Port d'écoute | `3005` |
| `DATABASE_URL` | URL PostgreSQL | `postgresql://user:pass@events_db/db` |
| `KAFKA_BROKER` | Adresse du broker | `kafka:9092` |
| `KEYCLOAK_URL` | URL Keycloak pour JWKS | `http://keycloak:8080` |
| `KEYCLOAK_REALM` | Realm Keycloak | `flotte` |
| `OTEL_EXPORTER_OTLP_ENDPOINT` | Endpoint OpenTelemetry | `http://otel-collector:4317` |
| `KAFKAJS_NO_PARTITIONER_WARNING` | Supprime le warning partitioner | `1` |

## API REST

### `GET /alertes`
Liste toutes les alertes (triées par date décroissante).

**Auth :** Bearer JWT (tous rôles)

**Query params :**
- `non_lues` : `true` pour filtrer les alertes non lues uniquement
- `type` : filtrer par type d'événement
- `limit` : nombre de résultats (défaut: 50)

**Réponse 200 :**
```json
[
  {
    "id": "uuid",
    "type": "VEHICULE_CREE",
    "source_service": "svc-vehicules",
    "message": "Véhicule AB-123-CD créé",
    "payload": { "vehicule_id": "uuid", "immatriculation": "AB-123-CD" },
    "lu": false,
    "created_at": "2025-10-01T10:00:00Z"
  }
]
```

### `GET /alertes/:id`
Retourne une alerte par UUID.

**Auth :** Bearer JWT (tous rôles)

**Réponse 404 :** `{ "success": false, "error": "Alerte non trouvée" }`

### `PUT /alertes/:id/lu`
Marque une alerte comme lue.

**Auth :** Bearer JWT (tous rôles)

**Réponse 200 :**
```json
{
  "id": "uuid",
  "lu": true,
  "lu_at": "2025-10-01T10:05:00Z"
}
```

## Événements Kafka consommés

| Topic | Types d'événements traités |
|-------|---------------------------|
| `vehicules` | `VEHICULE_CREE`, `VEHICULE_MIS_A_JOUR`, `VEHICULE_SUPPRIME` |
| `conducteurs` | `CONDUCTEUR_CREE`, `MISSION_ASSIGNEE`, `MISSION_TERMINEE`, `MISSION_ECHOUEE` |
| `maintenance` | `MAINTENANCE_PLANIFIEE`, `MAINTENANCE_DEMARREE`, `MAINTENANCE_TERMINEE` |
| `localisation` | Positions GPS anormales (vitesse excessive, zone interdite) |

## Schéma de la table alertes

```sql
CREATE TABLE alertes (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type         VARCHAR(100) NOT NULL,
  source_service VARCHAR(50),
  message      TEXT,
  payload      JSONB,
  lu           BOOLEAN DEFAULT FALSE,
  lu_at        TIMESTAMPTZ,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);
```

## Structure du code

```
src/
├── app.js
├── config/
│   ├── database.js
│   ├── kafka.js          # Consumer group: svc-evenements-group
│   └── opentelemetry.js
├── consumers/
│   └── alerteConsumer.js # Logique de traitement des messages Kafka
├── controllers/
│   └── alerteController.js
├── routes/
│   └── alerteRoutes.js
├── services/
│   └── alerteService.js
├── repositories/
│   └── alerteRepository.js
├── models/
│   └── Alerte.js
└── middleware/
    └── auth.js
```

## Rebuild K8s

```bash
eval $(minikube docker-env)
DOCKER_BUILDKIT=0 docker build -t svc-evenements:dev .
kubectl rollout restart deployment/svc-evenements -n flotte-dev
```

## Note base de données

La base `events_db` doit exister dans le cluster PostgreSQL :

```bash
PGPASS=$(kubectl get secret -n flotte-dev postgresql-fleet -o jsonpath='{.data.postgres-password}' | base64 -d)
kubectl exec -it -n flotte-dev postgresql-fleet-0 -- \
  env PGPASSWORD="$PGPASS" psql -U postgres -c "CREATE DATABASE events_db;"
```
