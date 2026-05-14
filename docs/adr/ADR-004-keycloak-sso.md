# ADR-004 — Keycloak pour l'authentification SSO et le RBAC

**Statut :** Accepté  
**Date :** 2025-09-25  
**Décideurs :** Équipe M1 GIL

## Contexte

Le cahier des charges impose une authentification centralisée avec gestion des rôles (admin, manager, technicien, utilisateur). Implémenter un système auth maison serait hors scope et risqué en sécurité.

## Décision

**Keycloak 26** gère l'identité. Realm `flotte`, deux clients :
- `gestion-flotte-api` (confidential, client_credentials pour les services backend)
- `gestion-flotte-frontend` (public, PKCE pour le SPA React)

## Rôles définis

| Rôle | Accès |
|------|-------|
| `admin` | Toutes opérations CRUD + administration |
| `manager` | Lecture + création véhicules/conducteurs |
| `technicien` | Lecture + gestion maintenance |
| `utilisateur` | Lecture seule |

## Flux d'authentification

```
Browser → Keycloak (Authorization Code + PKCE)
       ← JWT access_token (RS256)
Browser → API Gateway (Bearer token)
Gateway → Keycloak JWKS (vérification signature)
Gateway → Services REST (token forwardé dans X-User-* headers)
```

## Justification

- **Standard OpenID Connect** : interopérable, pas de vendor lock-in au niveau du protocole
- **RBAC intégré** : rôles dans le JWT, pas besoin de table de droits en base
- **PKCE obligatoire** pour les SPAs (pas de client secret dans le browser)
- **keycloak-js** officiel pour le frontend (gère le refresh token automatiquement)

## Alternatives considérées

| Option | Pourquoi rejetée |
|--------|-----------------|
| Auth0 / Okta | SaaS payant, dépendance externe |
| Auth maison (JWT + bcrypt) | Sécurité difficile à garantir, hors scope |
| Passport.js | Pas de SSO, pas d'admin UI |

## Conséquences

- **Positif :** SSO réel, admin UI prête, refresh tokens, sessions centralisées
- **Négatif :** Keycloak est lourd en mémoire (~512Mi) ; en prod il faudrait du clustering
- **Piège connu :** keycloak-js utilise Web Crypto API (HTTPS requis ou `localhost`). En HTTP sur domaine custom, activer le flag Chrome `#unsafely-treat-insecure-origin-as-secure`
