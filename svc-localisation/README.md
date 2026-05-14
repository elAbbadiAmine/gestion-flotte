# svc-localisation

Service de tracking GPS en temps réel. Reçoit des positions via un stream gRPC depuis le simulateur, les stocke dans TimescaleDB, et les expose via REST et Kafka.

## Responsabilités

- Recevoir des positions GPS en continu (gRPC streaming bidirectionnel)
- Persister dans TimescaleDB (séries temporelles + PostGIS)
- Exposer l'historique et la dernière position via REST
- Publier chaque position sur le topic Kafka `localisation`

## Stack

| Composant | Technologie |
|-----------|-------------|
| Runtime | Node.js 20 |
| Framework | Express 4 + `@grpc/grpc-js` |
| Base de données | TimescaleDB + PostGIS (client `pg` natif, pas Sequelize) |
| Bus d'événements | Kafka (KafkaJS) |
| Logs | pino |
| Observabilité | OpenTelemetry → Jaeger + Prometheus |

## Ports

| Port | Protocole | Usage |
|------|-----------|-------|
| `3004` | HTTP/REST | API interne + healthcheck |
| `50051` | gRPC | Stream de positions (simulateur → service) |

## Variables d'environnement

| Variable | Description | Exemple |
|----------|-------------|---------|
| `PORT` | Port REST | `3004` |
| `GRPC_PORT` | Port gRPC | `50051` |
| `DATABASE_URL` | URL TimescaleDB | `postgresql://user:pass@host/db` |
| `KAFKA_BROKER` | Adresse du broker | `kafka:9092` |
| `OTEL_EXPORTER_OTLP_ENDPOINT` | Endpoint OpenTelemetry | `http://otel-collector:4317` |

## API REST

### `GET /localisation/dernieres`
Retourne la dernière position connue de chaque véhicule actif.

**Auth :** Bearer JWT (tous rôles)

**Réponse 200 :**
```json
[
  {
    "vehicule_id": "uuid",
    "latitude": 48.8566,
    "longitude": 2.3522,
    "vitesse": 60.5,
    "timestamp": "2025-10-01T10:00:00Z"
  }
]
```

### `GET /localisation/:vehicule_id/historique`
Retourne l'historique des positions d'un véhicule (par défaut : dernières 24h).

**Query params :**
- `depuis` : ISO 8601 (ex: `2025-10-01T00:00:00Z`)
- `jusqu_a` : ISO 8601
- `limit` : nombre de points (défaut: 100)

**Auth :** Bearer JWT (tous rôles)

### `GET /localisation/:vehicule_id/derniere`
Retourne la dernière position d'un véhicule spécifique.

**Auth :** Bearer JWT (tous rôles)

## Interface gRPC

Défini dans `src/grpc/localisation.proto` :

```protobuf
syntax = "proto3";
package localisation;

service LocalisationService {
  rpc StreamPositions(stream PositionRequest) returns (stream PositionResponse);
}

message PositionRequest {
  string vehicule_id = 1;
  double latitude    = 2;
  double longitude   = 3;
  double vitesse     = 4;
  string timestamp   = 5;
}

message PositionResponse {
  bool   success = 1;
  string message = 2;
}
```

## Schéma TimescaleDB

```sql
CREATE TABLE positions (
  time        TIMESTAMPTZ NOT NULL,
  vehicule_id UUID        NOT NULL,
  localisation GEOGRAPHY(POINT, 4326),
  vitesse     DOUBLE PRECISION,
  PRIMARY KEY (vehicule_id, time)
);
SELECT create_hypertable('positions', 'time');
```

## Simulateur GPS

```bash
# Terminal 1 : port-forward gRPC
kubectl port-forward -n flotte-dev svc/svc-localisation 50051:50051

# Terminal 2 : lancer le simulateur
cd simulateur
node simulateur.js
```

Le simulateur envoie des positions fictives pour des UUIDs de véhicules. Adapter `VEHICULES` dans `simulateur.js` avec les vrais IDs en base.

## Structure du code

```
src/
├── app.js
├── config/
│   ├── database.js     # Pool pg natif
│   ├── kafka.js
│   └── opentelemetry.js
├── grpc/
│   ├── server.js       # Serveur gRPC
│   └── localisation.proto
├── controllers/
│   └── localisationController.js
├── routes/
│   └── localisationRoutes.js
├── repositories/
│   └── localisationRepository.js
└── middleware/
    └── auth.js
simulateur/
└── simulateur.js       # Client gRPC de test
```

## Rebuild K8s

```bash
eval $(minikube docker-env)
DOCKER_BUILDKIT=0 docker build -t svc-localisation:dev .
kubectl rollout restart deployment/svc-localisation -n flotte-dev
```
