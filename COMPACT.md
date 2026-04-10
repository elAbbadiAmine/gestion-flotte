# Session S4 — état au 09/04/2026

## Cluster
- Minikube en cours de reset (delete + start)
- Namespace : flotte-dev

## Services complétés
- svc-vehicules : v3 buildée, déploiement en attente
- svc-conducteurs : v2 buildée, déploiement en attente  
- svc-maintenance : v2 buildée (Node.js), déploiement en attente

## Ce qui reste
- [ ] kubectl apply des 3 services après reset minikube
- [ ] Phase 4 : Keycloak JWT
- [ ] Phase 5 : GraphQL gateway (conducteurs + maintenance)

## Ports
- svc-vehicules   : 3001
- svc-conducteurs : 3002
- svc-maintenance : 3003
- api-gateway     : 4000

## Secrets K8s à recréer si minikube delete
- app-secrets : DB_URL_VEHICLES, DB_URL_CONDUCTEURS, DB_URL_MAINTENANCE
- app-config  : KAFKA_BROKER=kafka:9092
