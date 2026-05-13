#!/usr/bin/env bash
set -e

SERVICE=$1
VERSION=$2

if [ -z "$SERVICE" ] || [ -z "$VERSION" ]; then
  echo "Usage: bash deploy.sh <service> <version>"
  echo "  ex: bash deploy.sh svc-localisation v4"
  exit 1
fi

TAR="/tmp/${SERVICE}-${VERSION}.tar"
BUILD_DIR="$HOME/gestion-flotte/${SERVICE}"

echo "[1/5] Build $SERVICE:$VERSION"
DOCKER_BUILDKIT=0 docker build --no-cache -t "$SERVICE:$VERSION" "$BUILD_DIR"

echo "[2/5] Save image to $TAR"
docker save "$SERVICE:$VERSION" -o "$TAR"

echo "[3/5] Copie du tar dans la VM via SCP"
MINIKUBE_KEY=$(minikube ssh-key)
MINIKUBE_IP=$(minikube ip)
scp -i "$MINIKUBE_KEY" -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null \
  "$TAR" "docker@${MINIKUBE_IP}:/tmp/${SERVICE}-${VERSION}.tar"

echo "[4/5] Import dans containerd Minikube"
minikube ssh -- sudo ctr -n k8s.io images import "/tmp/${SERVICE}-${VERSION}.tar"

echo "[4.5] Tag nom court pour Kubernetes"
minikube ssh -- sudo ctr -n k8s.io images tag "docker.io/library/${SERVICE}:${VERSION}" "${SERVICE}:${VERSION}"

echo "[4.6] Vérification import"
minikube ssh -- sudo crictl images | grep "${SERVICE}" | grep "${VERSION}" || { echo "ERREUR: image ${SERVICE}:${VERSION} non trouvée dans containerd"; exit 1; }

echo "[5/6] Mise à jour du deployment"
kubectl set image -n flotte-dev "deployment/$SERVICE" "$SERVICE=$SERVICE:$VERSION"

echo "[6/6] Rollout status"
kubectl rollout status -n flotte-dev "deployment/$SERVICE"

echo "Done — $SERVICE:$VERSION déployé."
