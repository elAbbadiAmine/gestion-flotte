# Gestion de flotte — M1 GIL

Projet M1 Génie Informatique et Logiciel, Université de Rouen, 2025-2026.

Application de gestion de flotte de véhicules en microservices. On peut gérer des véhicules, des conducteurs, planifier des maintenances, suivre la position GPS en temps réel et recevoir des alertes automatiques.

## Architecture

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

## Stack

Backend Node.js/Express, GraphQL Apollo Server, PostgreSQL avec Sequelize, TimescaleDB + PostGIS pour le GPS, Kafka pour la communication entre services, Keycloak pour l'auth JWT, React + Vite pour le frontend.

Déploiement sur Kubernetes (Minikube en local), images Docker, CI/CD GitHub Actions.

## Lancer le projet

```bash
minikube start
kubectl create namespace flotte-dev

# builder les images dans Minikube
eval $(minikube docker-env)
for svc in svc-vehicules svc-conducteurs svc-maintenance svc-localisation svc-evenements api-gateway; do
  docker build -t $svc:dev ./$svc
done

# déployer
kubectl apply -f infra/k8s/
```

Accéder à la gateway :
```bash
kubectl port-forward -n flotte-dev svc/api-gateway 4000:4000
```

Frontend en local :
```bash
cd frontend && npm install && npm run dev
# http://localhost:5173
```

## Tests

```bash
cd svc-vehicules   && npm test
cd svc-conducteurs && npm test
cd svc-maintenance && npm test
cd svc-evenements  && npm test
```

Test E2E backend (saga complète véhicule → conducteur → mission → maintenance) :
```bash
bash test-e2e.sh
```

Tests Playwright :
```bash
cd frontend && npx playwright test
```

Tests de charge k6 :
```bash
k6 run tests/k6/run-all.js
```

## Simulateur GPS

```bash
kubectl port-forward -n flotte-dev svc/svc-localisation 50051:50051
cd svc-localisation/simulateur && node simulateur.js
```

## Livrables

**Code source**
Tous les microservices sont dans ce repo Git. Chaque service a son propre dossier avec son `package.json`, ses tests et son `Dockerfile`.

**Dockerfiles**
Multi-stage builds, utilisateur non-root. Une image par service.

**Manifests Kubernetes**
Deployments, Services, ConfigMaps, Secrets, Ingress dans `infra/k8s/`. Helm utilisé pour l'infra (PostgreSQL, Kafka, Keycloak, Redis).

**Configuration Keycloak**
Realm `flotte` avec les rôles `admin`, `manager`, `technicien`, `utilisateur`. Config dans `infra/keycloak/`.

**OpenTelemetry**
Instrumentation de chaque service (traces, métriques). Collector configuré dans `infra/helm-values/`. Dashboards Grafana disponibles pour la latence, le nombre de requêtes et les métriques métier.

**Tests**
78 tests unitaires et d'intégration (Jest + Supertest), tests E2E frontend (Playwright), tests E2E backend saga, tests de charge (k6 avec 3 profils d'utilisateurs).

## Auteur

EL ABBADI Mohammed Amine
