# ADR-003 — Kafka comme bus d'événements inter-services

**Statut :** Accepté  
**Date :** 2025-09-20  
**Décideurs :** Équipe M1 GIL

## Contexte

Les services doivent se notifier mutuellement sans couplage fort. Par exemple, quand un véhicule est créé, svc-evenements doit le savoir pour démarrer le monitoring. Un appel HTTP direct crée un couplage temporel : si svc-evenements est down au moment de la création, l'événement est perdu.

## Décision

**Apache Kafka** (via Helm, un broker en dev) est le bus d'événements. Chaque service est producer et/ou consumer selon son rôle.

## Topics définis

| Topic | Producer | Consumer(s) |
|-------|----------|-------------|
| `vehicules` | svc-vehicules | svc-evenements |
| `conducteurs` | svc-conducteurs | svc-evenements |
| `maintenance` | svc-maintenance | svc-evenements |
| `localisation` | svc-localisation | svc-evenements |

## Justification

- **Découplage temporel** : les événements sont persistés dans Kafka ; un consumer peut les traiter même s'il redémarre
- **Rétention** : Kafka conserve les messages (configurable), permettant du replay en cas de bug
- **Scalabilité** : plusieurs consumers peuvent lire le même topic (consumer groups)
- **KafkaJS** : client Node.js simple, bien documenté, pas de Zookeeper en mode KRaft (Kafka 3+)

## Alternatives considérées

| Option | Pourquoi rejetée |
|--------|-----------------|
| Appels HTTP synchrones | Couplage fort, perte d'événements si service down |
| RabbitMQ | Moins adapté aux streams continus (GPS) ; Kafka déjà dans le cahier des charges |
| Redis Streams | Plus simple mais moins robuste pour la persistance longue durée |

## Conséquences

- **Positif :** Services totalement découplés ; svc-evenements peut être redémarré sans perdre d'alertes
- **Négatif :** Kafka ajoute de la complexité opérationnelle (broker, topics, offsets) et de la latence (pas de sub-ms)
- **En dev :** `KAFKAJS_NO_PARTITIONER_WARNING=1` pour éviter les warnings du nouveau partitioner KafkaJS
