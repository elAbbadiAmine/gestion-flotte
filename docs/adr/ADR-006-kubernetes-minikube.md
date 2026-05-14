# ADR-006 — Déploiement Kubernetes avec Minikube en local

**Statut :** Accepté  
**Date :** 2025-10-10  
**Décideurs :** Équipe M1 GIL

## Contexte

Le cahier des charges demande un déploiement conteneurisé démontrable. Il faut choisir entre Docker Compose (simple) et Kubernetes (production-like).

## Décision

**Minikube** en local avec **kubectl** et **Helm** pour les dépendances d'infrastructure. Namespace `flotte-dev`. Les services applicatifs sont déployés via des manifests YAML (pas Helm) pour rester lisibles.

## Justification

- **Kubernetes** est demandé explicitement dans le cahier des charges
- **Minikube** : cluster K8s local single-node, sans besoin d'un cloud provider
- **Helm** uniquement pour l'infra (PostgreSQL, Kafka, Redis, Keycloak) : évite de réécrire des charts complexes
- **Manifests YAML** pour les services applicatifs : plus lisibles et modifiables qu'un Helm chart maison

## Structure infra

```
infra/
├── k8s/
│   ├── namespace.yaml
│   ├── configmaps/app-config.yaml      # URLs inter-services, Kafka broker
│   ├── secrets/app-secrets.yaml        # DB passwords, Keycloak secret
│   ├── deployments/                    # Un fichier par service
│   ├── services/all-services.yaml      # ClusterIP pour chaque service
│   └── ingress.yaml                    # Subdomain routing (nginx ingress)
└── helm-values/                        # Values Helm par chart
```

## Workflow de build (Minikube avec containerd)

```bash
# DOCKER_BUILDKIT=0 requis (buildkit incompatible avec le daemon Minikube containerd)
eval $(minikube docker-env)
DOCKER_BUILDKIT=0 docker build -t <service>:dev .
kubectl rollout restart deployment/<service> -n flotte-dev
```

## Ingress

Subdomain-based routing via nginx-ingress :
- `flotte.local` → frontend (port 80 → 8080)
- `api.flotte.local` → api-gateway (port 4000)
- `auth.flotte.local` → keycloak (port 8080)

Entrées `/etc/hosts` nécessaires (IP = `minikube ip`).

## Alternatives considérées

| Option | Pourquoi rejetée |
|--------|-----------------|
| Docker Compose | Pas de démonstration Kubernetes possible |
| Kind (Kubernetes in Docker) | Même complexité, moins documenté pour Minikube |
| k3s | Production-ready mais moins connu des correcteurs |

## Conséquences

- **Positif :** Démo K8s réelle avec probes, resources limits, configmaps, secrets, ingress
- **Négatif :** `eval $(minikube docker-env)` doit être fait avant chaque build, sinon ErrImageNeverPull
- **Piège :** `minikube image load` est cassé sur certaines versions avec containerd → utiliser `docker save | minikube ssh docker load` ou DOCKER_BUILDKIT=0
