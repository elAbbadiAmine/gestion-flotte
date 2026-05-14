# ADR-001 - Node.js pour tous les services

**Statut :** Accepté

## Contexte

Choisir le langage backend pour les microservices.

## Décision

Node.js 20 + Express sur tous les services.

## Pourquoi

- Équipe réduite : un seul écosystème à maîtriser
- Structure identique entre services (routes / services / repositories)
- Suffisant pour les charges de ce projet

## Alternatives rejetées

- Python, Go : ajoutent un runtime différent sans gain justifié pour ce projet

## Conséquences

Débogage et Dockerfiles uniformes. Node.js n'est pas adapté au calcul intensif, mais ce projet n'en a pas besoin.
