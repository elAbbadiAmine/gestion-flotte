# svc-conducteurs

Service REST de gestion des conducteurs et de leurs missions. Gère le cycle de vie des assignations véhicule-conducteur et publie des événements Kafka.

## Responsabilités

- Créer, lire, modifier, supprimer des conducteurs
- Assigner/terminer/échouer des missions (lie un conducteur à un véhicule)
- Publier sur le topic Kafka `conducteurs` à chaque mutation

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

`3002`

## Variables d'environnement

| Variable | Description | Exemple |
|----------|-------------|---------|
| `PORT` | Port d'écoute | `3002` |
| `DATABASE_URL` | URL PostgreSQL | `postgresql://user:pass@host/db` |
| `KAFKA_BROKER` | Adresse du broker | `kafka:9092` |
| `OTEL_EXPORTER_OTLP_ENDPOINT` | Endpoint OpenTelemetry | `http://otel-collector:4317` |
| `OTEL_SERVICE_NAME` | Nom du service | `svc-conducteurs` |

## API REST

### `GET /conducteurs`
Liste tous les conducteurs.

**Auth :** Bearer JWT (tous rôles)

**Réponse 200 :**
```json
[
  {
    "id": "uuid",
    "nom": "Dupont",
    "prenom": "Jean",
    "email": "jean.dupont@flotte.fr",
    "permis": "B",
    "statut": "disponible",
    "vehicule_id": null
  }
]
```

### `GET /conducteurs/:id`
Retourne un conducteur par UUID.

### `POST /conducteurs`
Crée un conducteur.

**Auth :** Rôles : admin, manager

**Corps :**
```json
{
  "nom": "Dupont",
  "prenom": "Jean",
  "email": "jean.dupont@flotte.fr",
  "permis": "B",
  "statut": "disponible"
}
```

### `PUT /conducteurs/:id`
Modifie un conducteur.

**Auth :** Rôles : admin, manager

### `DELETE /conducteurs/:id`
Supprime un conducteur.

**Auth :** Rôles : admin

### `POST /conducteurs/:id/assigner-mission`
Assigne un véhicule à un conducteur (passe le conducteur en statut `en_mission`).

**Auth :** Rôles : admin, manager

**Corps :**
```json
{
  "vehicule_id": "uuid-du-vehicule",
  "destination": "Lyon",
  "date_debut": "2025-10-01T08:00:00Z"
}
```

### `POST /conducteurs/:id/terminer-mission`
Marque la mission en cours comme terminée.

**Auth :** Rôles : admin, manager, technicien

### `POST /conducteurs/:id/echouer-mission`
Marque la mission comme échouée (incident, panne…).

**Auth :** Rôles : admin, manager

## Événements Kafka produits

Topic : `conducteurs`

```json
{
  "type": "CONDUCTEUR_CREE | MISSION_ASSIGNEE | MISSION_TERMINEE | MISSION_ECHOUEE",
  "payload": { "conducteur_id": "uuid", "vehicule_id": "uuid", ... },
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
│   └── conducteurController.js
├── routes/
│   └── conducteurRoutes.js
├── services/
│   └── conducteurService.js
├── repositories/
│   └── conducteurRepository.js
├── models/
│   └── Conducteur.js
└── middleware/
    └── auth.js
```

## Rebuild K8s

```bash
eval $(minikube docker-env)
DOCKER_BUILDKIT=0 docker build -t svc-conducteurs:dev .
kubectl rollout restart deployment/svc-conducteurs -n flotte-dev
```
