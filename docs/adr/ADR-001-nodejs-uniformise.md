# ADR-001 — Node.js comme langage unique pour tous les services

**Statut :** Accepté  
**Date :** 2025-09-01  
**Décideurs :** Équipe M1 GIL

## Contexte

Le projet impose une architecture microservices avec 5+ services métier indépendants. Il faut choisir entre spécialiser le langage par service (Python pour les scripts, Go pour la perf, Java pour la robustesse) ou uniformiser.

## Décision

Tous les services backend sont écrits en **Node.js 20 LTS** avec Express. Pas de polyglottisme.

## Justification

- Équipe réduite (projet d'école) : un seul écosystème à maîtriser réduit la charge cognitive
- Partage de patterns entre services (structure `routes/services/repositories/`, logger pino, OpenTelemetry SDK)
- npm workspaces envisageable si besoin de code partagé
- Node.js est suffisant pour les charges de ce projet (pas de calcul intensif, pas de millions de req/s)
- Cohérence des Dockerfiles et des pipelines CI/CD

## Alternatives considérées

| Option | Pourquoi rejetée |
|--------|-----------------|
| Python (FastAPI) pour svc-localisation | Ajoute un runtime différent pour un gain marginal |
| Go pour les services haute perf | Surqualifié pour le volume de ce projet |
| Polyglottisme par service | Fragmente les compétences de l'équipe |

## Conséquences

- **Positif :** Débogage uniforme, un seul type de Dockerfile, partage des middlewares auth/log
- **Négatif :** Node.js n'est pas idéal pour CPU-bound ; si svc-localisation devait traiter des millions de points GPS en temps réel, il faudrait reconsidérer
