# ADR-002 - API Gateway GraphQL

**Statut :** Accepté

## Contexte

Le frontend doit interroger plusieurs services. Sans gateway, cela implique du CORS sur chaque service, une auth dupliquée et de l'over-fetching.

## Décision

Un seul API Gateway expose une API GraphQL (Apollo Server v4). Le frontend ne parle qu'à lui.

## Pourquoi

- Auth JWT validée une seule fois dans la gateway
- GraphQL permet de ne demander que les champs nécessaires
- Apollo Sandbox fournit une documentation interactive en dev sans effort

## Alternatives rejetées

- REST direct sur chaque service : CORS + auth répétée côté frontend
- GraphQL Federation : trop complexe pour 5 services

## Conséquences

La gateway est un point de défaillance unique. Si elle tombe, tout le frontend est inaccessible.
