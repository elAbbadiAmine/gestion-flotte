# ADR-002 — API Gateway GraphQL avec Apollo Server

**Statut :** Accepté  
**Date :** 2025-09-15  
**Décideurs :** Équipe M1 GIL

## Contexte

Le frontend doit interroger plusieurs services (véhicules, conducteurs, maintenance, localisation, événements). Sans gateway, le frontend ferait N appels REST indépendants avec des problèmes de CORS, d'auth dupliquée et d'over-fetching.

## Décision

Un **API Gateway unique** expose une API **GraphQL** (Apollo Server v4) qui agrège les services REST internes. Le frontend ne parle qu'à la gateway.

## Justification

- **Un seul point d'entrée** : auth JWT validée une fois dans la gateway, pas dans chaque service
- **GraphQL** évite l'over/under-fetching : le frontend demande exactement les champs dont il a besoin
- **Agrégation** : une query `vehiculeAvecConducteur` peut appeler svc-vehicules ET svc-conducteurs en parallèle
- **Apollo Server v4** : support natif des subscriptions WebSocket (utile pour le GPS temps réel)
- **Apollo Sandbox** intégré : documentation interactive gratuite en dev

## Architecture retenue

```
Frontend (React/Apollo Client v3)
    ↓ HTTP/GraphQL :4000
API Gateway (Apollo Server v4 + Express)
    ↓ HTTP/REST        ↓ gRPC streaming
svc-vehicules      svc-localisation
svc-conducteurs    
svc-maintenance    
svc-evenements     
```

## Alternatives considérées

| Option | Pourquoi rejetée |
|--------|-----------------|
| REST pur sur chaque service | CORS + auth + over-fetching côté frontend |
| GraphQL Federation | Complexité excessive pour 5 services |
| BFF (Backend For Frontend) REST | Moins expressif, pas de subscriptions natives |

## Conséquences

- **Positif :** Frontend simplifié, auth centralisée, documentation auto via Sandbox
- **Négatif :** Gateway = SPOF ; si elle tombe, tout le frontend est down
- **Décision liée :** Apollo Client v3 côté frontend (pas v4 : breaking changes sur les imports, cf. ADR-005)
