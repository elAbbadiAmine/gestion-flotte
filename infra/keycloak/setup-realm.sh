#!/usr/bin/env bash
# Configure le realm 'flotte' dans Keycloak :
#   - crée le client public gestion-flotte-frontend
#   - crée les utilisateurs de test (admin, manager, technicien, utilisateur)
# Prérequis : Keycloak accessible sur http://localhost:8080
set -euo pipefail

KC_URL="http://localhost:8080"
KC_ADMIN="admin"
KC_ADMIN_PASSWORD="admin_password_dev"
REALM="flotte"

echo "==> Récupération du token admin..."
TOKEN=$(curl -sf -X POST "$KC_URL/realms/master/protocol/openid-connect/token" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "grant_type=password&client_id=admin-cli&username=$KC_ADMIN&password=$KC_ADMIN_PASSWORD" \
  | python3 -c "import sys,json; print(json.load(sys.stdin)['access_token'])")

echo "    Token obtenu."

# ---- helper ----
kc_get()  { curl -sf -H "Authorization: Bearer $TOKEN" "$KC_URL/admin/realms/$REALM/$1"; }
kc_post() { curl -sf -X POST -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" "$KC_URL/admin/realms/$REALM/$1" -d "$2"; }
kc_put_realm() { curl -sf -X PUT -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" "$KC_URL/admin/realms/$REALM" -d "$1"; }

# 1. Vérifier que le realm existe
echo "==> Vérification du realm '$REALM'..."
if ! curl -sf -H "Authorization: Bearer $TOKEN" "$KC_URL/admin/realms/$REALM" > /dev/null; then
  echo "ERREUR : le realm '$REALM' n'existe pas. Importe-le d'abord via la console Keycloak."
  echo "  http://localhost:8080  >  Create realm  >  import realm-flotte-v2.json"
  exit 1
fi
echo "    Realm trouvé."

# 2. Appliquer le thème de login
echo "==> Application du thème de login 'flotte'..."
kc_put_realm '{"loginTheme":"flotte"}' && echo "    Thème appliqué." || echo "    (thème non trouvé dans Keycloak, à déployer d'abord)"

# 3. Créer les rôles manquants
for ROLE in manager technicien utilisateur; do
  if kc_get "roles/$ROLE" > /dev/null 2>&1; then
    echo "    rôle '$ROLE' déjà présent."
  else
    echo "==> Création du rôle '$ROLE'..."
    kc_post "roles" "{\"name\":\"$ROLE\",\"composite\":false,\"clientRole\":false}"
    echo "    Rôle '$ROLE' créé."
  fi
done

# 4. Créer/mettre à jour le client gestion-flotte-frontend
EXISTING_CLIENT=$(kc_get "clients?clientId=gestion-flotte-frontend" 2>/dev/null || echo "[]")
if echo "$EXISTING_CLIENT" | python3 -c "import sys,json; l=json.load(sys.stdin); exit(0 if l else 1)" 2>/dev/null; then
  CLIENT_ID=$(echo "$EXISTING_CLIENT" | python3 -c "import sys,json; print(json.load(sys.stdin)[0]['id'])")
  echo "==> Mise à jour du client gestion-flotte-frontend (id=$CLIENT_ID)..."
  curl -sf -X PUT \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    "$KC_URL/admin/realms/$REALM/clients/$CLIENT_ID" \
    -d '{
      "clientId": "gestion-flotte-frontend",
      "enabled": true,
      "publicClient": true,
      "standardFlowEnabled": true,
      "directAccessGrantsEnabled": false,
      "redirectUris": ["http://localhost:5173/*"],
      "webOrigins": ["http://localhost:5173"],
      "attributes": {
        "pkce.code.challenge.method": "S256",
        "post.logout.redirect.uris": "http://localhost:5173/*"
      },
      "fullScopeAllowed": true,
      "defaultClientScopes": ["web-origins","acr","profile","roles","basic","email"],
      "optionalClientScopes": ["address","phone","offline_access","microprofile-jwt"]
    }'
  echo "    Client mis à jour."
else
  echo "==> Création du client gestion-flotte-frontend..."
  kc_post "clients" '{
    "clientId": "gestion-flotte-frontend",
    "enabled": true,
    "publicClient": true,
    "standardFlowEnabled": true,
    "directAccessGrantsEnabled": false,
    "redirectUris": ["http://localhost:5173/*"],
    "webOrigins": ["http://localhost:5173"],
    "attributes": {
      "pkce.code.challenge.method": "S256",
      "post.logout.redirect.uris": "http://localhost:5173/*"
    },
    "fullScopeAllowed": true,
    "defaultClientScopes": ["web-origins","acr","profile","roles","basic","email"],
    "optionalClientScopes": ["address","phone","offline_access","microprofile-jwt"]
  }'
  echo "    Client créé."
fi

# 5. Créer les utilisateurs de test
create_user() {
  local USERNAME=$1 PASSWORD=$2 ROLE=$3 FIRST=$4 LAST=$5

  if kc_get "users?username=$USERNAME&exact=true" | python3 -c "import sys,json; l=json.load(sys.stdin); exit(0 if l else 1)" 2>/dev/null; then
    echo "    utilisateur '$USERNAME' déjà présent."
    return
  fi

  echo "==> Création de l'utilisateur '$USERNAME' (rôle: $ROLE)..."
  kc_post "users" "{
    \"username\": \"$USERNAME\",
    \"email\": \"${USERNAME}@flotte.local\",
    \"firstName\": \"$FIRST\",
    \"lastName\": \"$LAST\",
    \"emailVerified\": true,
    \"enabled\": true,
    \"credentials\": [{\"type\":\"password\",\"value\":\"$PASSWORD\",\"temporary\":false}],
    \"realmRoles\": [\"default-roles-flotte\", \"$ROLE\"]
  }"

  # Récupérer l'ID du user créé et lui assigner son rôle
  USER_ID=$(kc_get "users?username=$USERNAME&exact=true" | python3 -c "import sys,json; print(json.load(sys.stdin)[0]['id'])")
  ROLE_OBJ=$(kc_get "roles/$ROLE")
  curl -sf -X POST \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    "$KC_URL/admin/realms/$REALM/users/$USER_ID/role-mappings/realm" \
    -d "[$ROLE_OBJ]"
  echo "    Utilisateur '$USERNAME' créé avec le rôle '$ROLE'."
}

create_user "admin"       "admin"       "admin"       "Admin"       "User"
create_user "manager"     "manager"     "manager"     "Manager"     "User"
create_user "technicien"  "technicien"  "technicien"  "Technicien"  "User"
create_user "utilisateur" "utilisateur" "utilisateur" "Utilisateur" "User"

echo ""
echo "==> Setup Keycloak terminé."
echo "    Client    : gestion-flotte-frontend (public, PKCE S256)"
echo "    Redirect  : http://localhost:5173/*"
echo "    Utilisateurs : admin/admin  manager/manager  technicien/technicien  utilisateur/utilisateur"
