# ADR-003 - Kafka comme bus d'événements

**Statut :** Accepté

## Contexte

Les services doivent se notifier sans couplage direct. Un appel HTTP synchrone entre services est fragile : si le destinataire est down, l'événement est perdu.

## Décision

Kafka (KafkaJS) comme bus d'événements. Topics : vehicules, conducteurs, maintenance, localisation.

## Pourquoi

- Les messages sont persistés : un service peut les traiter après un redémarrage
- Découplage total entre producteur et consommateur

## Alternatives rejetées

- Appels HTTP synchrones : perte d'événements si service indisponible
- RabbitMQ : Kafka est explicitement demandé dans le cahier des charges

## Conséquences

Complexité opérationnelle ajoutée (broker, topics, offsets). En dev, `KAFKAJS_NO_PARTITIONER_WARNING=1` supprime les avertissements du nouveau partitioner.
