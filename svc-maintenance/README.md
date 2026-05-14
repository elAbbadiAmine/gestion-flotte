# svc-maintenance

Service REST de planification et suivi des interventions de maintenance sur les véhicules. Publie des événements Kafka et consomme les événements des autres services pour déclencher des alertes préventives.

## Responsabilités

- Planifier, démarrer, terminer et annuler des interventions de maintenance
- Exposer les alertes de maintenance (kilométrage dépassé, délai dépassé)
- Publier sur le topic Kafka `maintenance`

## Stack

| Composant | Technologie |
|-----------|-------------|
| Runtime | Node.js 20 |
| Framework | Express 4 |
| Base de données | PostgreSQL (Sequelize ORM) |
| Bus d'événements | Kafka (KafkaJS) |
| Logs | pino |
| Observabilité | OpenTelemetry → Jaeger + Prometheus |

## Port

`3003`

## Variables d'environnement

| Variable | Description | Exemple |
|----------|-------------|---------|
| `PORT` | Port d'écoute | `3003` |
| `DATABASE_URL` | URL PostgreSQL | `postgresql://user:pass@host/db` |
| `KAFKA_BROKER` | Adresse du broker | `kafka:9092` |
| `OTEL_EXPORTER_OTLP_ENDPOINT` | Endpoint OpenTelemetry | `http://otel-collector:4317` |
| `OTEL_SERVICE_NAME` | Nom du service | `svc-maintenance` |

## API REST

### `GET /maintenance/alertes`
Liste les interventions en retard ou urgentes.

**Auth :** Bearer JWT (tous rôles)

**Réponse 200 :**
```json
[
  {
    "id": "uuid",
    "vehicule_id": "uuid",
    "type": "vidange",
    "statut": "planifiee",
    "date_prevue": "2025-09-01T00:00:00Z",
    "priorite": "haute"
  }
]
```

### `GET /maintenance/vehicule/:vehiculeId`
Liste toutes les interventions pour un véhicule donné.

### `GET /maintenance`
Liste toutes les interventions.

**Auth :** Bearer JWT (tous rôles)

### `GET /maintenance/:id`
Retourne une intervention par UUID.

### `POST /maintenance`
Planifie une nouvelle intervention.

**Auth :** Rôles : admin, manager, technicien

**Corps :**
```json
{
  "vehicule_id": "uuid",
  "type": "vidange",
  "description": "Vidange + filtre à huile",
  "date_prevue": "2025-12-01T08:00:00Z",
  "kilometrage_prevu": 50000,
  "priorite": "normale"
}
```

### `PUT /maintenance/:id`
Modifie une intervention planifiée.

**Auth :** Rôles : admin, manager, technicien

### `POST /maintenance/:id/demarrer`
Démarre une intervention (passe en statut `en_cours`).

**Auth :** Rôles : admin, technicien

### `POST /maintenance/:id/terminer`
Termine une intervention.

**Auth :** Rôles : admin, technicien

**Corps :**
```json
{
  "rapport": "Vidange effectuée, filtre remplacé",
  "kilometrage_reel": 49850,
  "cout": 89.90
}
```

### `POST /maintenance/:id/annuler`
Annule une intervention planifiée.

**Auth :** Rôles : admin, manager

## Événements Kafka produits

Topic : `maintenance`

```json
{
  "type": "MAINTENANCE_PLANIFIEE | MAINTENANCE_DEMARREE | MAINTENANCE_TERMINEE | MAINTENANCE_ANNULEE",
  "payload": { "intervention_id": "uuid", "vehicule_id": "uuid", ... },
  "timestamp": "2025-10-01T10:00:00Z"
}
```

## Structure du code

```
src/
├── app.js
├── config/
│   ├── database.js
│   ├── kafka.js
│   └── opentelemetry.js
├── controllers/
│   └── maintenanceController.js
├── routes/
│   └── maintenanceRoutes.js
├── services/
│   └── maintenanceService.js
├── repositories/
│   └── maintenanceRepository.js
├── models/
│   └── Maintenance.js
└── middleware/
    └── auth.js
```

## Rebuild K8s

```bash
eval $(minikube docker-env)
DOCKER_BUILDKIT=0 docker build -t svc-maintenance:dev .
kubectl rollout restart deployment/svc-maintenance -n flotte-dev
```
