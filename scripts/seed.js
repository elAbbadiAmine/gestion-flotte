#!/usr/bin/env node
/**
 * Script de seed — génère des données réalistes via les APIs REST des microservices.
 *
 * Prérequis :
 *   kubectl port-forward -n flotte-dev svc/svc-vehicules   3001:3001 &
 *   kubectl port-forward -n flotte-dev svc/svc-conducteurs 3002:3002 &
 *   kubectl port-forward -n flotte-dev svc/svc-maintenance 3003:3003 &
 *
 * Usage : node scripts/seed.js
 */

const axios = require('axios');
const { faker } = require('@faker-js/faker/locale/fr');

const VEHICULES_URL   = 'http://localhost:3001/api/v1/vehicules';
const CONDUCTEURS_URL = 'http://localhost:3002/api/v1/conducteurs';
const MAINTENANCE_URL = 'http://localhost:3003/api/v1/maintenances';

const KC_URL   = 'http://localhost:8080';
const KC_REALM = 'flotte';
const KC_CLIENT = 'gestion-flotte-frontend';

async function getToken() {
  const params = new URLSearchParams({
    grant_type: 'password',
    client_id: KC_CLIENT,
    username: 'admin',
    password: 'admin',
  });
  const res = await axios.post(
    `${KC_URL}/realms/${KC_REALM}/protocol/openid-connect/token`,
    params.toString(),
    { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
  );
  return res.data.access_token;
}

let TOKEN = null;

function authHeader() {
  return TOKEN ? { Authorization: `Bearer ${TOKEN}` } : {};
}

const MARQUES = [
  { marque: 'Renault',  modeles: ['Clio', 'Megane', 'Kangoo', 'Master', 'Trafic'] },
  { marque: 'Peugeot',  modeles: ['208', '308', 'Partner', 'Boxer', '508'] },
  { marque: 'Citroën',  modeles: ['C3', 'C4', 'Berlingo', 'Jumper', 'SpaceTourer'] },
  { marque: 'Ford',     modeles: ['Focus', 'Transit', 'Kuga', 'Ranger'] },
  { marque: 'Volkswagen', modeles: ['Golf', 'Passat', 'Transporter', 'Crafter'] },
];

const TYPES_MAINTENANCE = ['revision', 'reparation', 'controle_technique', 'pneus', 'autre'];
const STATUTS_MAINTENANCE = ['planifiee', 'en_cours', 'terminee', 'annulee'];

function randomMarque() {
  const m = faker.helpers.arrayElement(MARQUES);
  return { marque: m.marque, modele: faker.helpers.arrayElement(m.modeles) };
}

function randomImmat(index) {
  const letters = 'ABCDEFGHJKLMNPQRSTVWXYZ';
  const l1 = letters[Math.floor(index / 26) % letters.length];
  const l2 = letters[index % letters.length];
  const num = faker.number.int({ min: 1, max: 999 }).toString().padStart(3, '0');
  const dept = faker.number.int({ min: 1, max: 95 }).toString().padStart(2, '0');
  return `${num}-${l1}${l2}-${dept}`;
}

async function seedVehicules(count = 12) {
  console.log(`\n🚗 Création de ${count} véhicules...`);
  const ids = [];
  const statuts = ['disponible', 'disponible', 'disponible', 'en_mission', 'en_maintenance', 'hors_service'];

  for (let i = 0; i < count; i++) {
    const { marque, modele } = randomMarque();
    const data = {
      immatriculation: randomImmat(i),
      marque,
      modele,
      annee: faker.number.int({ min: 2015, max: 2024 }),
      statut: faker.helpers.arrayElement(statuts),
      kilometrage: faker.number.int({ min: 5000, max: 180000 }),
    };
    try {
      const res = await axios.post(VEHICULES_URL, data, { headers: authHeader() });
      ids.push(res.data.data?.id || res.data.id);
      process.stdout.write('.');
    } catch (e) {
      if (e.response?.status === 409) {
        process.stdout.write('s'); // skip duplicate
      } else {
        console.error(`\n  Erreur véhicule ${data.immatriculation}:`, e.response?.data?.error || e.message);
      }
    }
  }
  console.log(`\n  ✅ ${ids.filter(Boolean).length} véhicules créés.`);
  return ids.filter(Boolean);
}

async function seedConducteurs(count = 8) {
  console.log(`\n👤 Création de ${count} conducteurs...`);
  const ids = [];

  for (let i = 0; i < count; i++) {
    const prenom = faker.person.firstName('male');
    const nom    = faker.person.lastName();
    const data = {
      nom,
      prenom,
      email: faker.internet.email({ firstName: prenom, lastName: nom }).toLowerCase(),
      telephone: faker.phone.number('06########'),
      numeroPermis: `P${faker.string.alphanumeric(8).toUpperCase()}`,
      categoriesPermis: faker.helpers.arrayElements(['B', 'C', 'D', 'BE'], { min: 1, max: 2 }),
      dateExpirationPermis: faker.date.future({ years: 5 }).toISOString().split('T')[0],
      statut: faker.helpers.weightedArrayElement([
        { weight: 7, value: 'actif' },
        { weight: 2, value: 'inactif' },
        { weight: 1, value: 'suspendu' },
      ]),
    };
    try {
      const res = await axios.post(CONDUCTEURS_URL, data, { headers: authHeader() });
      ids.push(res.data.data?.id || res.data.id);
      process.stdout.write('.');
    } catch (e) {
      if (e.response?.status === 409) {
        process.stdout.write('s');
      } else {
        console.error(`\n  Erreur conducteur ${data.email}:`, e.response?.data?.error || e.message);
      }
    }
  }
  console.log(`\n  ✅ ${ids.filter(Boolean).length} conducteurs créés.`);
  return ids.filter(Boolean);
}

async function seedMaintenances(vehiculeIds, count = 20) {
  console.log(`\n🔧 Création de ${count} maintenances...`);
  let created = 0;

  for (let i = 0; i < count; i++) {
    const vehiculeId = faker.helpers.arrayElement(vehiculeIds);
    const statut = faker.helpers.weightedArrayElement([
      { weight: 4, value: 'planifiee' },
      { weight: 2, value: 'en_cours' },
      { weight: 3, value: 'terminee' },
      { weight: 1, value: 'annulee' },
    ]);

    const isPast = ['terminee', 'annulee'].includes(statut);
    const datePlanifiee = isPast
      ? faker.date.past({ years: 1 }).toISOString().split('T')[0]
      : faker.date.future({ years: 1 }).toISOString().split('T')[0];

    const data = {
      vehiculeId,
      type: faker.helpers.arrayElement(TYPES_MAINTENANCE),
      statut,
      datePlanifiee,
      dateReelle: isPast ? datePlanifiee : undefined,
      kilometrageIntervention: faker.number.int({ min: 10000, max: 200000 }),
      kilometrageProchaine:    faker.number.int({ min: 210000, max: 250000 }),
      description: faker.helpers.arrayElement([
        'Vidange moteur et filtre à huile',
        'Remplacement plaquettes de frein',
        'Contrôle technique obligatoire',
        'Remplacement des 4 pneus',
        'Révision complète 60 000 km',
        'Réparation fuite de liquide de refroidissement',
        'Changement courroie de distribution',
        'Contrôle et réglage géométrie',
      ]),
      cout: parseFloat(faker.commerce.price({ min: 80, max: 2500 })),
      technicien: faker.person.fullName(),
    };

    try {
      await axios.post(MAINTENANCE_URL, data, { headers: authHeader() });
      created++;
      process.stdout.write('.');
    } catch (e) {
      console.error(`\n  Erreur maintenance:`, e.response?.data?.error || e.message);
    }
  }
  console.log(`\n  ✅ ${created} maintenances créées.`);
}

async function checkService(url, name) {
  try {
    await axios.get(url, { timeout: 3000 });
    return true;
  } catch (e) {
    if (e.code === 'ECONNREFUSED') {
      console.error(`❌ ${name} inaccessible sur ${url}`);
      console.error(`   Lance : kubectl port-forward -n flotte-dev svc/${name.toLowerCase().replace(' ', '-')} <port>:<port> &`);
      return false;
    }
    return true; // 4xx = service up
  }
}

async function main() {
  console.log('=== Seed — Gestion de Flotte ===\n');

  // Authentification Keycloak
  console.log('🔐 Authentification Keycloak...');
  try {
    TOKEN = await getToken();
    console.log('   Token obtenu.\n');
  } catch (e) {
    console.error('❌ Impossible d\'obtenir un token Keycloak:', e.response?.data || e.message);
    console.error('   Vérifie que Keycloak est port-forwardé sur 8080 et que admin/admin existe.');
    process.exit(1);
  }

  const ok = await Promise.all([
    checkService(VEHICULES_URL,   'svc-vehicules'),
    checkService(CONDUCTEURS_URL, 'svc-conducteurs'),
    checkService(MAINTENANCE_URL, 'svc-maintenance'),
  ]);

  if (ok.includes(false)) {
    console.error('\nArrêt : un ou plusieurs services sont inaccessibles.');
    process.exit(1);
  }

  const vehiculeIds  = await seedVehicules(12);
  await seedConducteurs(8);

  if (vehiculeIds.length > 0) {
    await seedMaintenances(vehiculeIds, 20);
  } else {
    console.log('\n⚠️  Pas de véhicules créés, skip maintenances.');
  }

  console.log('\n=== Seed terminé ===');
  console.log('  Vehicules   : 12');
  console.log('  Conducteurs :  8');
  console.log('  Maintenances: 20');
}

main().catch(err => {
  console.error('Erreur fatale:', err.message);
  process.exit(1);
});
