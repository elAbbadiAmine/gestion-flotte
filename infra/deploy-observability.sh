#!/usr/bin/env bash
# Deploie la stack observabilite dans Minikube (namespace monitoring + flotte-dev)
# Prerequis : minikube demarre, helm >= 3.x, kubectl configure
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
VALUES="$SCRIPT_DIR/helm-values"

echo "==> Ajout des repos Helm..."
helm repo add prometheus-community https://prometheus-community.github.io/helm-charts
helm repo add grafana               https://grafana.github.io/helm-charts
helm repo add jaegertracing         https://jaegertracing.github.io/helm-charts
helm repo add open-telemetry        https://open-telemetry.github.io/opentelemetry-helm-charts
helm repo update

echo ""
echo "==> Création du namespace monitoring..."
kubectl create namespace monitoring --dry-run=client -o yaml | kubectl apply -f -

# Prometheus + Grafana
echo ""
echo "==> Installation kube-prometheus-stack..."
helm upgrade --install prometheus prometheus-community/kube-prometheus-stack \
  --namespace monitoring \
  --values "$VALUES/prometheus.yaml" \
  --set prometheus.prometheusSpec.podMonitorSelectorNilUsesHelmValues=false \
  --set prometheus.prometheusSpec.serviceMonitorSelectorNilUsesHelmValues=false \
  --timeout 5m \
  --wait

# Dashboards Grafana via ConfigMap (charge automatiquement par le sidecar)
echo ""
echo "==> Application des dashboards Grafana..."
kubectl apply -f "$SCRIPT_DIR/k8s/configmaps/grafana-dashboards.yaml"

# Loki
echo ""
echo "==> Installation Loki..."
helm upgrade --install loki grafana/loki \
  --namespace monitoring \
  --values "$VALUES/loki.yaml" \
  --timeout 3m \
  --wait

# Jaeger
echo ""
echo "==> Installation Jaeger..."
helm upgrade --install jaeger jaegertracing/jaeger \
  --namespace monitoring \
  --values "$VALUES/jaeger.yaml" \
  --timeout 3m \
  --wait

# Promtail DaemonSet -> collecte logs pods -> Loki
echo ""
echo "==> Installation Promtail..."
helm upgrade --install promtail grafana/promtail \
  --namespace monitoring \
  --values "$VALUES/promtail.yaml" \
  --timeout 2m \
  --wait

# OTel Collector dans flotte-dev (meme namespace que les services)
echo ""
echo "==> Installation OpenTelemetry Collector..."
helm upgrade --install otel-collector open-telemetry/opentelemetry-collector \
  --namespace flotte-dev \
  --values "$VALUES/otel-collector.yaml" \
  --timeout 3m \
  --wait

echo ""
echo "==> Stack deployee avec succes !"
echo ""
echo "Port-forwards pour acceder aux UIs :"
echo "  Grafana    : kubectl port-forward -n monitoring svc/prometheus-grafana 3030:80"
echo "               http://localhost:3030  (admin / grafana_password_dev)"
echo ""
echo "  Jaeger     : kubectl port-forward -n monitoring svc/jaeger-query 16686:16686"
echo "               http://localhost:16686"
echo ""
echo "  Prometheus : kubectl port-forward -n monitoring svc/prometheus-kube-prometheus-prometheus 9090:9090"
echo "               http://localhost:9090"
echo ""
echo "Loki dans Grafana : {namespace=\"flotte-dev\"}"
