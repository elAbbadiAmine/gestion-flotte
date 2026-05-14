# Gestion de flotte — M1 GIL

Projet de fin d'année M1 Génie Informatique et Logiciel, Université de Rouen 2025-2026.

L'idée c'est de gérer une flotte de véhicules : suivre les véhicules, les conducteurs, les maintenances, la position GPS en temps réel, et recevoir des alertes automatiques. Tout ça en microservices.

---

## Ce que fait l'application

- **Véhicules** : ajouter, modifier, supprimer un véhicule, voir son statut (disponible, en mission, en maintenance...)
- **Conducteurs** : gérer les conducteurs et leurs permis, leur assigner des missions
- **Maintenance** : planifier des interventions, suivre leur progression (planifiée → en cours → terminée)
- **Carte GPS** : voir la position en temps réel des véhicules sur une carte Leaflet
- **Alertes** : recevoir des notifications automatiques quand une maintenance est planifiée, un véhicule supprimé, ou une violation de zone géographique

---

## Architecture

L'application est découpée en plusieurs services indépendants qui communiquent entre eux :

```
Frontend React
     │
     ▼
API Gateway (GraphQL, port 4000)
     │
     ├── svc-vehicules   (port 3001) — PostgreSQL
     ├── svc-conducteurs (port 3002) — PostgreSQL
     ├── svc-maintenance (port 3003) — PostgreSQL
     ├── svc-localisation(port 3004) — TimescaleDB + PostGIS
     │         └── gRPC (port 50051) ← simulateur GPS
     └── svc-evenements  (port 3005) — PostgreSQL
                 ▲
                 │ consomme
              Kafka (topics: vehicules, maintenance, localisation)
```

L'authentification passe par **Keycloak** (SSO, tokens JWT). Il y a 4 rôles : `admin`, `manager`, `technicien`, `utilisateur`.

---

## Stack technique

| Couche | Techno |
|---|---|
| Frontend | React + Vite, Apollo Client, React Router, Leaflet |
| Backend | Node.js, Express |
| API | GraphQL (Apollo Server v4), REST, gRPC |
| Base de données | PostgreSQL (Sequelize), TimescaleDB + PostGIS |
| Messaging | Apache Kafka (KafkaJS) |
| Auth | Keycloak |
| Observabilité | OpenTelemetry, Jaeger, Prometheus, Grafana, Loki |
| Déploiement | Docker, Kubernetes (Minikube), Helm |
| CI/CD | GitHub Actions |
| Tests | Jest, Supertest, Playwright (E2E), k6 (charge) |

---

## Lancer le projet en local

### Prérequis

- Docker
- Minikube + kubectl
- Node.js 20
- Helm 3

### Démarrer le cluster

```bash
minikube start
kubectl create namespace flotte-dev
```

### Builder les images

```bash
eval $(minikube docker-env)

for svc in svc-vehicules svc-conducteurs svc-maintenance svc-localisation svc-evenements api-gateway; do
  docker build -t $svc:dev ./$svc
done
```

### Déployer

```bash
# Infrastructure (Kafka, PostgreSQL, Keycloak, Redis...)
kubectl apply -f infra/k8s/

# Services applicatifs
for svc in svc-vehicules svc-conducteurs svc-maintenance svc-localisation svc-evenements api-gateway; do
  kubectl apply -f infra/k8s/deployments/$svc.yaml
done

kubectl apply -f infra/k8s/services/all-services.yaml
```

### Accéder à l'application

```bash
# API GraphQL
kubectl port-forward -n flotte-dev svc/api-gateway 4000:4000

# Frontend
cd frontend && npm install && npm run dev
# → http://localhost:5173
```

### Keycloak (si besoin de gérer les utilisateurs)

```bash
kubectl port-forward -n flotte-dev svc/keycloak 8080:8080
# → http://localhost:8080, realm: flotte
```

---

## Tests

### Tests unitaires et d'intégration

```bash
cd svc-vehicules   && npm test   # 14 tests
cd svc-conducteurs && npm test   # 17 tests
cd svc-maintenance && npm test   # 41 tests
cd svc-evenements  && npm test   #  6 tests
```

### Tests E2E backend (saga complète)

```bash
# Nécessite la gateway sur :4000
bash test-e2e.sh
```

Le scénario : créer un véhicule → créer un conducteur → assigner une mission → planifier une maintenance → vérifier les alertes générées.

### Tests E2E frontend (Playwright)

```bash
cd frontend
npx playwright test
```

### Tests de charge (k6)

```bash
# Test rapide (30s)
SMOKE=1 k6 run tests/k6/run-all.js

# Test complet (3 profils : lecteurs, managers, techniciens)
k6 run tests/k6/run-all.js
```

---

## Tracking GPS

Le service `svc-localisation` reçoit des positions GPS via gRPC et les stocke dans TimescaleDB. Un simulateur permet de générer des données :

```bash
# Terminal 1
kubectl port-forward -n flotte-dev svc/svc-localisation 50051:50051

# Terminal 2
cd svc-localisation/simulateur
node simulateur.js
```

Les positions apparaissent sur la carte en temps réel (page Carte du frontend).

---

## Alertes automatiques

`svc-evenements` écoute les événements Kafka et crée des alertes dans la base :

| Événement Kafka | Alerte créée | Niveau |
|---|---|---|
| `maintenance.planifiee` | Maintenance planifiée pour véhicule X | info |
| `maintenance.terminee` | Maintenance terminée | info |
| `vehicule.deleted` | Véhicule supprimé | warning |
| `geofencing.violation` | Véhicule hors zone autorisée | critique |

Les alertes sont visibles dans l'onglet **Alertes** du frontend. Les alertes critiques sont réservées aux rôles `admin` et `manager`.

---

## CI/CD

Le pipeline GitHub Actions tourne sur chaque push sur `master` :

1. `npm ci` + `npm test` pour chaque service
2. Build de l'image Docker
3. Push sur GitHub Container Registry (`ghcr.io`)

---

## Structure du repo

```
gestion-flotte/
├── api-gateway/         GraphQL Apollo Server (agrège tous les services)
├── svc-vehicules/       CRUD véhicules + Kafka producer
├── svc-conducteurs/     CRUD conducteurs + saga missions
├── svc-maintenance/     Planification et suivi des maintenances
├── svc-localisation/    Tracking GPS (REST + gRPC + TimescaleDB)
│   └── simulateur/      Client gRPC pour générer des positions
├── svc-evenements/      Consumer Kafka + API alertes
├── frontend/            SPA React (Vite)
├── infra/
│   ├── k8s/             Manifests Kubernetes
│   └── helm-values/     Values Helm pour l'infra
├── tests/k6/            Scripts de tests de charge
└── test-e2e.sh          Scénario E2E backend
```

---

## Auteur

EL ABBADI Mohammed Amine — M1 GIL, Université de Rouen 2025-2026
