# ADR-004 - Keycloak pour l'authentification

**Statut :** Accepté

## Contexte

Le cahier des charges impose une authentification centralisée avec gestion des rôles (admin, manager, technicien, utilisateur).

## Décision

Keycloak 26, realm `flotte`. Deux clients : `gestion-flotte-frontend` (public, PKCE) et `gestion-flotte-api` (confidentiel, client_credentials).

## Pourquoi

- Standard OpenID Connect, pas de vendor lock-in
- Les rôles sont dans le JWT, pas besoin de table de droits en base
- PKCE obligatoire pour les SPAs (pas de secret dans le navigateur)

## Alternatives rejetées

- Auth maison : risqué en sécurité, hors scope
- Auth0 / Okta : services payants avec dépendance externe

## Conséquences

Keycloak consomme ~512 Mi de mémoire. keycloak-js requiert HTTPS ou localhost (Web Crypto API). En HTTP sur domaine custom, activer le flag Chrome `unsafely-treat-insecure-origin-as-secure`.
