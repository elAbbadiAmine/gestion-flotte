# Guide d'installation et de déploiement

## Prérequis

- Docker Desktop ou Docker Engine
- Minikube >= 1.32
- kubectl >= 1.28
- Helm >= 3.12
- Node.js 20 LTS (pour le développement local)

## 1. Démarrer Minikube

```bash
minikube start --memory=8192 --cpus=4 --driver=docker
minikube addons enable ingress
minikube addons enable metrics-server
```

## 2. Configurer /etc/hosts

```bash
echo "$(minikube ip) flotte.local api.flotte.local auth.flotte.local" | sudo tee -a /etc/hosts
```

## 3. Créer le namespace

```bash
kubectl apply -f infra/k8s/namespace.yaml
```

## 4. Déployer l'infrastructure (Helm)

```bash
# PostgreSQL
helm install postgresql-fleet oci://registry-1.docker.io/bitnamicharts/postgresql \
  -n flotte-dev -f infra/helm-values/postgresql.yaml

# Kafka
helm install kafka bitnami/kafka \
  -n flotte-dev -f infra/helm-values/kafka.yaml

# Keycloak
helm install keycloak bitnami/keycloak \
  -n flotte-dev -f infra/helm-values/keycloak.yaml

# Redis (optionnel)
helm install redis bitnami/redis \
  -n flotte-dev -f infra/helm-values/redis.yaml
```

Attendre que tous les pods soient Running :

```bash
kubectl get pods -n flotte-dev -w
```

## 5. Importer la configuration Keycloak

```bash
# Port-forward Keycloak
kubectl port-forward -n flotte-dev svc/keycloak 8080:8080 &

# Importer le realm
ADMIN_TOKEN=$(curl -s -X POST http://localhost:8080/realms/master/protocol/openid-connect/token \
  -d 'client_id=admin-cli&grant_type=password&username=admin&password=admin_password_dev' \
  | grep -o '"access_token":"[^"]*' | cut -d'"' -f4)

curl -s -X POST http://localhost:8080/admin/realms \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d @infra/keycloak/realm-flotte-v2.json
```

## 6. Créer les bases de données

```bash
PGPASS=$(kubectl get secret -n flotte-dev postgresql-fleet -o jsonpath='{.data.postgres-password}' | base64 -d)
kubectl exec -it -n flotte-dev postgresql-fleet-0 -- \
  env PGPASSWORD="$PGPASS" psql -U postgres -c "
    CREATE DATABASE IF NOT EXISTS vehicules_db;
    CREATE DATABASE IF NOT EXISTS conducteurs_db;
    CREATE DATABASE IF NOT EXISTS maintenance_db;
    CREATE DATABASE IF NOT EXISTS events_db;
  "
```

## 7. Appliquer les secrets et ConfigMaps

```bash
kubectl apply -f infra/k8s/configmaps/
kubectl apply -f infra/k8s/secrets/app-secrets.yaml
```

## 8. Builder et déployer les services applicatifs

```bash
# Pointer Docker vers le daemon Minikube
eval $(minikube docker-env)

# Builder toutes les images
for service in svc-vehicules svc-conducteurs svc-maintenance svc-localisation svc-evenements api-gateway frontend; do
  echo "Build $service..."
  DOCKER_BUILDKIT=0 docker build -t $service:dev ./$service
done

# Déployer
kubectl apply -f infra/k8s/services/all-services.yaml
kubectl apply -f infra/k8s/deployments/
kubectl apply -f infra/k8s/ingress.yaml
```

## 9. Vérifier le déploiement

```bash
kubectl get pods -n flotte-dev
kubectl get ingress -n flotte-dev
```

Tous les pods doivent être en état `1/1 Running`.

## 10. Accéder à l'application

| Service | URL |
|---------|-----|
| Frontend | http://flotte.local |
| API Gateway (GraphQL) | http://api.flotte.local/graphql |
| Keycloak Admin | http://auth.flotte.local |

Identifiants par défaut :
- Keycloak admin : `admin` / `admin_password_dev`
- Utilisateur app : `admin` / `admin`

## 11. Lancer le simulateur GPS (optionnel)

```bash
kubectl port-forward -n flotte-dev svc/svc-localisation 50051:50051 &
cd svc-localisation/simulateur && node simulateur.js
```

## Déployer l'observabilité (optionnel)

```bash
# OpenTelemetry Collector
helm install otel-collector open-telemetry/opentelemetry-collector \
  -n flotte-dev -f infra/helm-values/otel-collector.yaml

# Jaeger
helm install jaeger jaegertracing/jaeger \
  -n flotte-dev -f infra/helm-values/jaeger.yaml

# Prometheus + Grafana
helm install prometheus prometheus-community/kube-prometheus-stack \
  -n flotte-dev -f infra/helm-values/prometheus.yaml

# Importer le dashboard Grafana
kubectl apply -f infra/k8s/configmaps/grafana-dashboards.yaml
```

## Rebuild d'un service après modification

```bash
eval $(minikube docker-env)
DOCKER_BUILDKIT=0 docker build -t <service>:dev ./<service>
kubectl rollout restart deployment/<service> -n flotte-dev
kubectl rollout status deployment/<service> -n flotte-dev
```
