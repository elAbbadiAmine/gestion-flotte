#!/bin/bash

set -euo pipefail

GATEWAY="http://localhost:4000/graphql"
TIMESTAMP=$(date +%s)
IMMAT="E2E-${TIMESTAMP: -5}"
EMAIL="e2e${TIMESTAMP}@flotte.fr"
PERMIS="P${TIMESTAMP}"
PASS=0
FAIL=0

assert_eq() {
  local label="$1" actual="$2" expected="$3"
  if [ "$actual" = "$expected" ]; then
    echo "  ✓ $label: $actual"
    PASS=$((PASS + 1))
  else
    echo "  ✗ $label: attendu '$expected', obtenu '$actual'"
    FAIL=$((FAIL + 1))
  fi
}

wait_kafka() {
  local label="$1" seconds="${2:-5}"
  echo "[attente] propagation Kafka ($seconds s) — $label..."
  sleep "$seconds"
}

echo "=== TEST E2E SCENARIO COMPLET ==="
echo ""

echo "[1/7] Creation d'un vehicule (immat=$IMMAT)..."
VEHICULE_RESPONSE=$(curl -s -X POST $GATEWAY \
  -H 'Content-Type: application/json' \
  -d "{\"query\":\"mutation { createVehicule(input: { immatriculation: \\\"$IMMAT\\\", marque: \\\"Renault\\\", modele: \\\"Master\\\", annee: 2023, kilometrage: 15000 }) { id immatriculation statut } }\"}")
echo "$VEHICULE_RESPONSE" | jq
VEHICULE_ID=$(echo "$VEHICULE_RESPONSE" | jq -r '.data.createVehicule.id')
VEHICULE_STATUT=$(echo "$VEHICULE_RESPONSE" | jq -r '.data.createVehicule.statut')
echo "VEHICULE_ID=$VEHICULE_ID"
assert_eq "statut vehicule initial" "$VEHICULE_STATUT" "DISPONIBLE"
echo ""

echo "[2/7] Creation d'un conducteur (email=$EMAIL)..."
CONDUCTEUR_RESPONSE=$(curl -s -X POST $GATEWAY \
  -H 'Content-Type: application/json' \
  -d "{\"query\":\"mutation { createConducteur(input: { nom: \\\"Test\\\", prenom: \\\"E2E\\\", email: \\\"$EMAIL\\\", telephone: \\\"0612345678\\\", numeroPermis: \\\"$PERMIS\\\", categoriesPermis: [\\\"B\\\"], dateExpirationPermis: \\\"2030-01-01\\\" }) { id nom prenom statut } }\"}")
echo "$CONDUCTEUR_RESPONSE" | jq
CONDUCTEUR_ID=$(echo "$CONDUCTEUR_RESPONSE" | jq -r '.data.createConducteur.id')
CONDUCTEUR_STATUT=$(echo "$CONDUCTEUR_RESPONSE" | jq -r '.data.createConducteur.statut')
echo "CONDUCTEUR_ID=$CONDUCTEUR_ID"
assert_eq "statut conducteur initial" "$CONDUCTEUR_STATUT" "DISPONIBLE"
echo ""

if [ "$VEHICULE_ID" = "null" ] || [ "$CONDUCTEUR_ID" = "null" ]; then
  echo "ERREUR: creation echouee, arret du test"
  exit 1
fi

echo "[3/7] Assignation de mission..."
ASSIGN_RESPONSE=$(curl -s -X POST $GATEWAY \
  -H 'Content-Type: application/json' \
  -d "{\"query\":\"mutation { assignerMission(id: \\\"$CONDUCTEUR_ID\\\", vehiculeId: \\\"$VEHICULE_ID\\\", missionId: \\\"MISSION-E2E-001\\\") }\"}")
echo "$ASSIGN_RESPONSE" | jq
ASSIGN_OK=$(echo "$ASSIGN_RESPONSE" | jq -r '.data.assignerMission')
assert_eq "assignerMission retour" "$ASSIGN_OK" "true"
echo ""

wait_kafka "apres assignation" 5

echo "[5/7] Verification des etats apres assignation..."
VEHICULE_MID=$(curl -s -X POST $GATEWAY -H 'Content-Type: application/json' \
  -d "{\"query\":\"{ vehicule(id: \\\"$VEHICULE_ID\\\") { id immatriculation statut } }\"}" | jq -r '.data.vehicule.statut')
CONDUCTEUR_MID=$(curl -s -X POST $GATEWAY -H 'Content-Type: application/json' \
  -d "{\"query\":\"{ conducteur(id: \\\"$CONDUCTEUR_ID\\\") { id nom statut } }\"}" | jq -r '.data.conducteur.statut')
assert_eq "statut vehicule apres assignation" "$VEHICULE_MID" "EN_MISSION"
assert_eq "statut conducteur apres assignation" "$CONDUCTEUR_MID" "EN_MISSION"
echo ""

echo "[6/7] Fin de la mission..."
TERMINER_RESPONSE=$(curl -s -X POST $GATEWAY -H 'Content-Type: application/json' \
  -d "{\"query\":\"mutation { terminerMission(id: \\\"$CONDUCTEUR_ID\\\", vehiculeId: \\\"$VEHICULE_ID\\\", missionId: \\\"MISSION-E2E-001\\\") }\"}")
echo "$TERMINER_RESPONSE" | jq
TERMINER_OK=$(echo "$TERMINER_RESPONSE" | jq -r '.data.terminerMission')
assert_eq "terminerMission retour" "$TERMINER_OK" "true"

wait_kafka "apres fin de mission" 5

echo "[7/7] Verification des etats finaux..."
VEHICULE_FINAL=$(curl -s -X POST $GATEWAY -H 'Content-Type: application/json' \
  -d "{\"query\":\"{ vehicule(id: \\\"$VEHICULE_ID\\\") { id immatriculation statut } }\"}" | jq -r '.data.vehicule.statut')
CONDUCTEUR_FINAL=$(curl -s -X POST $GATEWAY -H 'Content-Type: application/json' \
  -d "{\"query\":\"{ conducteur(id: \\\"$CONDUCTEUR_ID\\\") { id nom statut } }\"}" | jq -r '.data.conducteur.statut')
assert_eq "statut vehicule apres fin de mission" "$VEHICULE_FINAL" "DISPONIBLE"
assert_eq "statut conducteur apres fin de mission" "$CONDUCTEUR_FINAL" "DISPONIBLE"
echo ""

echo "=== RESULTATS ==="
echo "  PASS: $PASS  FAIL: $FAIL"
if [ "$FAIL" -gt 0 ]; then
  echo "=== TEST E2E ECHOUE ==="
  exit 1
fi
echo "=== TEST E2E OK ==="
