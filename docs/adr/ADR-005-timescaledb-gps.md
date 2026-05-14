# ADR-005 — TimescaleDB + gRPC pour le tracking GPS

**Statut :** Accepté  
**Date :** 2025-10-01  
**Décideurs :** Équipe M1 GIL

## Contexte

svc-localisation reçoit des positions GPS en continu depuis les véhicules (via simulateur). Les requêtes typiques sont : "dernière position de chaque véhicule", "historique des positions d'un véhicule sur les 24h". Ces requêtes sont mal adaptées à un schéma relationnel classique.

## Décision

- **TimescaleDB** (extension PostgreSQL) stocke les positions GPS comme séries temporelles
- **PostGIS** ajoute le type `GEOGRAPHY(POINT)` pour les coordonnées
- **gRPC** (port 50051) expose un stream bidirectionnel pour la réception des positions

## Justification TimescaleDB

- Compatible PostgreSQL : même ORM, mêmes outils d'admin
- **Hypertables** : partitionnement automatique par temps → requêtes d'historique 10-100x plus rapides
- Fonctions temporelles natives : `time_bucket`, `last()`, `first()`
- Extension PostGIS : calcul de distances, requêtes géospatiales

## Justification gRPC

- **Streaming bidirectionnel** : le simulateur ouvre un stream, envoie des positions en continu, le service les ack
- Protobuf : sérialisation binaire plus légère que JSON pour des centaines de messages/s
- gRPC n'est pas exposé au browser (HTTP/2 + trailers non supportés en JS) → la gateway fait le pont vers GraphQL/WebSocket

## Proto défini

```protobuf
service LocalisationService {
  rpc StreamPositions(stream PositionRequest) returns (stream PositionResponse);
}
message PositionRequest {
  string vehicule_id = 1;
  double latitude = 2;
  double longitude = 3;
  double vitesse = 4;
  string timestamp = 5;
}
```

## Alternatives considérées

| Option | Pourquoi rejetée |
|--------|-----------------|
| PostgreSQL classique | Sans TimescaleDB, les requêtes d'historique sont lentes sur des millions de lignes |
| InfluxDB | Pas compatible PostgreSQL, double stack à gérer |
| WebSocket pur | Moins structuré que gRPC pour le streaming, pas de schéma formalisé |

## Conséquences

- **Positif :** Performances temporelles natives, protocole de streaming robuste
- **Négatif :** Stack plus complexe (TimescaleDB + PostGIS + gRPC en plus de PostgreSQL standard)
- **pg natif** utilisé à la place de Sequelize (Sequelize ne supporte pas les hypertables TimescaleDB)
