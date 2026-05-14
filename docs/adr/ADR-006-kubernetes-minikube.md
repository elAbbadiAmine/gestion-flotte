# ADR-006 - Déploiement Kubernetes avec Minikube

**Statut :** Accepté

## Contexte

Le cahier des charges demande un déploiement conteneurisé. Il faut choisir entre Docker Compose et Kubernetes.

## Décision

Minikube en local, namespace `flotte-dev`. Helm pour l'infra (PostgreSQL, Kafka, Keycloak). Manifests YAML simples pour les services applicatifs.

## Pourquoi

- Kubernetes est demandé explicitement dans le cahier des charges
- Les manifests YAML directs sont plus lisibles qu'un Helm chart maison pour un correcteur

## Alternatives rejetées

- Docker Compose : pas de démonstration Kubernetes possible

## Conséquences

`eval $(minikube docker-env)` est obligatoire avant chaque build d'image, sinon le pod obtient `ErrImageNeverPull`. `DOCKER_BUILDKIT=0` est requis avec le daemon containerd de Minikube.
