# Gestion de Flotte

Projet M1 Génie Informatique et Logiciel — plateforme de gestion de flotte de véhicules en architecture microservices.

## Stack

- **Backend** : Node.js, Express, GraphQL (Apollo Server), gRPC
- **Bases de données** : PostgreSQL, TimescaleDB + PostGIS, Redis
- **Messaging** : Apache Kafka
- **Authentification** : Keycloak (JWT)
- **Observabilité** : OpenTelemetry, Jaeger, Prometheus
- **Déploiement** : Docker, Kubernetes (Minikube), Helm
- **CI/CD** : GitHub Actions

## Services

| Service | Port | Description |
|---|---|---|
| api-gateway | 4000 | API GraphQL fédérée |
| svc-vehicules | 3001 | CRUD des véhicules |
| svc-conducteurs | 3002 | CRUD des conducteurs et permis |
| svc-maintenance | 3003 | Planification des maintenances |
| svc-localisation | 3004 / 50051 | Tracking GPS (REST + gRPC) |

## Prérequis

- Docker, Minikube, kubectl, Node.js 20

## Lancer le projet

```bash
# 1. Démarrer le cluster
minikube start

# 2. Créer le namespace
kubectl create namespace flotte-dev

# 3. Build des images
eval $(minikube docker-env)
for svc in api-gateway svc-vehicules svc-conducteurs svc-maintenance svc-localisation; do
  docker build -t $svc:latest ./$svc
done

# 4. Déployer l'infrastructure
kubectl apply -f infra/k8s/

# 5. Déployer les services
kubectl apply -f svc-vehicules/k8s/
kubectl apply -f svc-conducteurs/k8s/
kubectl apply -f svc-maintenance/k8s/
kubectl apply -f svc-localisation/k8s/
kubectl apply -f api-gateway/k8s/

# 6. Vérifier
kubectl -n flotte-dev get pods
```

## Accéder à l'API GraphQL

```bash
kubectl -n flotte-dev port-forward svc/api-gateway 4000:4000
```

Puis ouvrir : http://localhost:4000/graphql

Exemple de requête :

```graphql
query {
  vehicules { id immatriculation marque statut }
  conducteurs { id nom prenom statut }
}
```

## Tester le tracking GPS

```bash
kubectl -n flotte-dev port-forward svc/svc-localisation 50051:50051 3004:3004
node svc-localisation/simulateur/simulateur.js
```

## Tests unitaires

```bash
cd svc-vehicules && npm test
cd svc-conducteurs && npm test
cd svc-maintenance && npm test
```

## Communication Kafka

Les services communiquent via Kafka avec un saga pattern :

- `mission.assigned` → met le véhicule et le conducteur en mission
- `mission.completed` → libère le véhicule et le conducteur
- `maintenance.started` → met le véhicule en maintenance
- `vehicule.deleted` → annule les maintenances planifiées
- `geofence.violation` → alerte si un véhicule sort de la zone autorisée

## Structure du projet

```
gestion-flotte/
├── api-gateway/          GraphQL Apollo Server
├── svc-vehicules/        Service véhicules
├── svc-conducteurs/      Service conducteurs
├── svc-maintenance/      Service maintenance
├── svc-localisation/     Service GPS (gRPC + TimescaleDB)
├── infra/k8s/            Manifests Kubernetes
└── .github/workflows/    Pipeline CI/CD
```

## Auteur

EL ABBADI Mohammed Amine — M1 GIL
