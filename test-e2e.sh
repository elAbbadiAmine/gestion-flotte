#!/bin/bash

GATEWAY="http://localhost:4000/graphql"
TIMESTAMP=$(date +%s)
IMMAT="E2E-${TIMESTAMP: -5}"
EMAIL="e2e${TIMESTAMP}@flotte.fr"
PERMIS="P${TIMESTAMP}"

echo "=== TEST E2E SCENARIO COMPLET ==="
echo ""

echo "[1/7] Creation d'un vehicule (immat=$IMMAT)..."
VEHICULE_RESPONSE=$(curl -s -X POST $GATEWAY \
  -H 'Content-Type: application/json' \
  -d "{\"query\":\"mutation { createVehicule(input: { immatriculation: \\\"$IMMAT\\\", marque: \\\"Renault\\\", modele: \\\"Master\\\", annee: 2023, kilometrage: 15000 }) { id immatriculation statut } }\"}")
echo "$VEHICULE_RESPONSE" | jq
VEHICULE_ID=$(echo "$VEHICULE_RESPONSE" | jq -r '.data.createVehicule.id')
echo "VEHICULE_ID=$VEHICULE_ID"
echo ""

echo "[2/7] Creation d'un conducteur (email=$EMAIL)..."
CONDUCTEUR_RESPONSE=$(curl -s -X POST $GATEWAY \
  -H 'Content-Type: application/json' \
  -d "{\"query\":\"mutation { createConducteur(input: { nom: \\\"Test\\\", prenom: \\\"E2E\\\", email: \\\"$EMAIL\\\", telephone: \\\"0612345678\\\", numeroPermis: \\\"$PERMIS\\\", categoriesPermis: [\\\"B\\\"], dateExpirationPermis: \\\"2030-01-01\\\" }) { id nom prenom statut } }\"}")
echo "$CONDUCTEUR_RESPONSE" | jq
CONDUCTEUR_ID=$(echo "$CONDUCTEUR_RESPONSE" | jq -r '.data.createConducteur.id')
echo "CONDUCTEUR_ID=$CONDUCTEUR_ID"
echo ""

if [ "$VEHICULE_ID" = "null" ] || [ "$CONDUCTEUR_ID" = "null" ]; then
  echo "ERREUR: creation echouee, arret du test"
  exit 1
fi

echo "[3/7] Assignation de mission..."
curl -s -X POST $GATEWAY \
  -H 'Content-Type: application/json' \
  -d "{\"query\":\"mutation { assignerMission(id: \\\"$CONDUCTEUR_ID\\\", vehiculeId: \\\"$VEHICULE_ID\\\", missionId: \\\"MISSION-E2E-001\\\") }\"}" | jq
echo ""

echo "[4/7] Attente propagation Kafka (5s)..."
sleep 5

echo "[5/7] Verification des etats apres assignation..."
echo "  Vehicule:"
curl -s -X POST $GATEWAY -H 'Content-Type: application/json' \
  -d "{\"query\":\"{ vehicule(id: \\\"$VEHICULE_ID\\\") { id immatriculation statut } }\"}" | jq '.data.vehicule'
echo "  Conducteur:"
curl -s -X POST $GATEWAY -H 'Content-Type: application/json' \
  -d "{\"query\":\"{ conducteur(id: \\\"$CONDUCTEUR_ID\\\") { id nom statut } }\"}" | jq '.data.conducteur'
echo ""

echo "[6/7] Fin de la mission..."
curl -s -X POST $GATEWAY -H 'Content-Type: application/json' \
  -d "{\"query\":\"mutation { terminerMission(id: \\\"$CONDUCTEUR_ID\\\", vehiculeId: \\\"$VEHICULE_ID\\\", missionId: \\\"MISSION-E2E-001\\\") }\"}" | jq
sleep 5

echo "[7/7] Verification des etats finaux..."
echo "  Vehicule:"
curl -s -X POST $GATEWAY -H 'Content-Type: application/json' \
  -d "{\"query\":\"{ vehicule(id: \\\"$VEHICULE_ID\\\") { id immatriculation statut } }\"}" | jq '.data.vehicule'
echo "  Conducteur:"
curl -s -X POST $GATEWAY -H 'Content-Type: application/json' \
  -d "{\"query\":\"{ conducteur(id: \\\"$CONDUCTEUR_ID\\\") { id nom statut } }\"}" | jq '.data.conducteur'
echo ""

echo "=== TEST E2E TERMINE ==="
