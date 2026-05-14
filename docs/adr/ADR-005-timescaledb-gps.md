# ADR-005 - TimescaleDB et gRPC pour le GPS

**Statut :** Accepté

## Contexte

svc-localisation reçoit des positions GPS en continu et doit répondre à des requêtes d'historique. Un schéma relationnel classique est peu performant sur ce type de données.

## Décision

TimescaleDB (extension PostgreSQL) pour le stockage, PostGIS pour les coordonnées, gRPC pour la réception du stream.

## Pourquoi

- TimescaleDB partitionne automatiquement les données par temps, ce qui accélère les requêtes d'historique
- Reste compatible avec PostgreSQL (mêmes outils, même admin)
- gRPC permet un streaming bidirectionnel structuré (protobuf) entre le simulateur et le service
- Sequelize ne supporte pas les hypertables TimescaleDB, donc on utilise le client `pg` natif

## Alternatives rejetées

- PostgreSQL seul : requêtes d'historique lentes sur de gros volumes
- WebSocket à la place de gRPC : moins structuré, pas de schéma formalisé

## Conséquences

Stack plus complexe. gRPC n'est pas accessible depuis le navigateur, la gateway fait le pont via GraphQL.
