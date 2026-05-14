# svc-vehicules

Service REST de gestion du parc automobile. Expose les opérations CRUD sur les véhicules et publie des événements Kafka à chaque mutation.

## Responsabilités

- Créer, lire, modifier, supprimer des véhicules
- Publier un événement sur le topic Kafka `vehicules` après chaque mutation
- Valider le format des données entrantes

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

`3001`

## Variables d'environnement

| Variable | Description | Exemple |
|----------|-------------|---------|
| `PORT` | Port d'écoute | `3001` |
| `DATABASE_URL` | URL PostgreSQL | `postgresql://user:pass@host/db` |
| `KAFKA_BROKER` | Adresse du broker | `kafka:9092` |
| `OTEL_EXPORTER_OTLP_ENDPOINT` | Endpoint OpenTelemetry | `http://otel-collector:4317` |
| `OTEL_SERVICE_NAME` | Nom du service pour les traces | `svc-vehicules` |

## API REST

### `GET /vehicules`
Retourne tous les véhicules.

**Auth :** Bearer JWT (rôles : admin, manager, technicien, utilisateur)

**Réponse 200 :**
```json
[
  {
    "id": "uuid",
    "immatriculation": "AB-123-CD",
    "marque": "Renault",
    "modele": "Clio",
    "annee": 2022,
    "statut": "disponible",
    "kilometrage": 15000
  }
]
```

### `GET /vehicules/:id`
Retourne un véhicule par son UUID.

**Réponse 404 :** `{ "success": false, "error": "Vehicule non trouvé" }`

### `POST /vehicules`
Crée un nouveau véhicule.

**Auth :** Rôles : admin, manager

**Corps :**
```json
{
  "immatriculation": "AB-123-CD",
  "marque": "Renault",
  "modele": "Clio",
  "annee": 2022,
  "statut": "disponible",
  "kilometrage": 0
}
```

### `PUT /vehicules/:id`
Met à jour un véhicule.

**Auth :** Rôles : admin, manager

### `DELETE /vehicules/:id`
Supprime un véhicule.

**Auth :** Rôles : admin

## Événements Kafka produits

Topic : `vehicules`

```json
{
  "type": "VEHICULE_CREE | VEHICULE_MIS_A_JOUR | VEHICULE_SUPPRIME",
  "payload": { "id": "uuid", "immatriculation": "AB-123-CD", ... },
  "timestamp": "2025-10-01T10:00:00Z"
}
```

## Structure du code

```
src/
├── app.js              # Express setup + middleware
├── config/
│   ├── database.js     # Connexion Sequelize
│   ├── kafka.js        # Producer KafkaJS
│   └── opentelemetry.js
├── controllers/
│   └── vehiculeController.js
├── routes/
│   └── vehiculeRoutes.js
├── services/
│   └── vehiculeService.js
├── repositories/
│   └── vehiculeRepository.js
├── models/
│   └── Vehicule.js     # Sequelize model
└── middleware/
    └── auth.js         # Vérification JWT Keycloak
```

## Lancer en local (hors K8s)

```bash
npm install
DATABASE_URL=postgresql://postgres:pass@localhost/vehicules_db \
KAFKA_BROKER=localhost:9092 \
PORT=3001 \
node src/app.js
```

## Rebuild et déploiement K8s

```bash
eval $(minikube docker-env)
DOCKER_BUILDKIT=0 docker build -t svc-vehicules:dev .
kubectl rollout restart deployment/svc-vehicules -n flotte-dev
kubectl rollout status deployment/svc-vehicules -n flotte-dev
```
