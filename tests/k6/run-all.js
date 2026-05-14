// Test de charge global : 3 profils (lecteurs, managers, techniciens)
// SMOKE=1 pour un test rapide de 30s
import { sleep } from 'k6';
import { getToken } from './helpers/auth.js';
import { gql }      from './helpers/graphql.js';

const IS_SMOKE = __ENV.SMOKE === '1';

export const options = {
  scenarios: {
    // Lecteurs (utilisateurs en consultation)
    lecteurs: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: IS_SMOKE
        ? [{ duration: '10s', target: 3 }, { duration: '20s', target: 3 }, { duration: '10s', target: 0 }]
        : [{ duration: '30s', target: 20 }, { duration: '2m', target: 20 }, { duration: '30s', target: 0 }],
      exec: 'lecteur',
    },
    // Managers (CRUD véhicules + conducteurs)
    managers: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: IS_SMOKE
        ? [{ duration: '10s', target: 2 }, { duration: '20s', target: 2 }, { duration: '10s', target: 0 }]
        : [{ duration: '30s', target: 5 }, { duration: '2m', target: 5 }, { duration: '30s', target: 0 }],
      exec: 'manager',
    },
    // Techniciens (planification maintenance)
    techniciens: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: IS_SMOKE
        ? [{ duration: '10s', target: 1 }, { duration: '20s', target: 1 }, { duration: '10s', target: 0 }]
        : [{ duration: '30s', target: 3 }, { duration: '2m', target: 3 }, { duration: '30s', target: 0 }],
      exec: 'technicien',
    },
  },
  thresholds: {
    http_req_duration:                ['p(95)<500', 'p(99)<1000'],
    http_req_failed:                  ['rate<0.01'],
    checks:                           ['rate>0.99'],
    'http_req_duration{name:GetVehicules}':    ['p(95)<300'],
    'http_req_duration{name:GetConducteurs}':  ['p(95)<300'],
    'http_req_duration{name:GetMaintenances}': ['p(95)<300'],
    'http_req_duration{name:CreateVehicule}':  ['p(95)<800'],
  },
};

export function setup() {
  const token = getToken();

  const vehiculesData = gql(token, `
    query { vehicules { id } }
  `, {}, 'setup');

  const vehiculeIds = (vehiculesData?.vehicules ?? []).map(v => v.id);

  return { token, vehiculeIds };
}

const Q_VEHICULES = `query GetVehicules {
  vehicules { id immatriculation marque modele annee statut kilometrage }
}`;

const Q_CONDUCTEURS = `query GetConducteurs {
  conducteurs { id nom prenom email statut }
}`;

const Q_MAINTENANCES = `query GetMaintenances {
  maintenances { id vehiculeId type statut datePlanifiee }
}`;

const M_CREATE_VEHICULE = `mutation CreateVehicule($input: CreateVehiculeInput!) {
  createVehicule(input: $input) { id }
}`;

const M_DELETE_VEHICULE = `mutation DeleteVehicule($id: ID!) {
  deleteVehicule(id: $id)
}`;

const M_CREATE_CONDUCTEUR = `mutation CreateConducteur($input: CreateConducteurInput!) {
  createConducteur(input: $input) { id }
}`;

const M_DELETE_CONDUCTEUR = `mutation DeleteConducteur($id: ID!) {
  deleteConducteur(id: $id)
}`;

const M_CREATE_MAINTENANCE = `mutation CreateMaintenance($input: CreateMaintenanceInput!) {
  createMaintenance(input: $input) { id }
}`;

export function lecteur({ token }) {
  gql(token, Q_VEHICULES,    {}, 'GetVehicules');    sleep(0.5);
  gql(token, Q_CONDUCTEURS,  {}, 'GetConducteurs');  sleep(0.5);
  gql(token, Q_MAINTENANCES, {}, 'GetMaintenances'); sleep(1);
}

export function manager({ token }) {
  // Créer un véhicule puis le supprimer
  const MARQUES = ['Renault', 'Peugeot', 'Citroën', 'Toyota'];
  const idx   = Math.floor(Math.random() * MARQUES.length);
  const immat = `K6-${Date.now()}-${__VU}`;

  const vData = gql(token, M_CREATE_VEHICULE, {
    input: {
      immatriculation: immat,
      marque: MARQUES[idx], modele: 'Test',
      annee: 2022, statut: 'disponible', kilometrage: 0,
    },
  }, 'CreateVehicule');

  sleep(0.5);

  if (vData?.createVehicule?.id) {
    gql(token, M_DELETE_VEHICULE, { id: vData.createVehicule.id }, 'DeleteVehicule');
  }

  sleep(0.5);

  // Créer un conducteur puis le supprimer
  const ts = Date.now();
  const cData = gql(token, M_CREATE_CONDUCTEUR, {
    input: {
      nom: 'K6', prenom: 'Test',
      email: `k6.${ts}.${__VU}@test.local`,
      telephone: `06${String(ts).slice(-8)}`,
      numeroPermis: `K6-${ts}`, categoriesPermis: ['B'],
      dateExpirationPermis: '2027-01-01', statut: 'actif',
    },
  }, 'CreateConducteur');

  sleep(0.5);

  if (cData?.createConducteur?.id) {
    gql(token, M_DELETE_CONDUCTEUR, { id: cData.createConducteur.id }, 'DeleteConducteur');
  }

  sleep(1);
}

export function technicien({ token, vehiculeIds }) {
  gql(token, Q_MAINTENANCES, {}, 'GetMaintenances');
  sleep(0.5);

  if (vehiculeIds.length === 0) { sleep(1); return; }

  const vehiculeId = vehiculeIds[Math.floor(Math.random() * vehiculeIds.length)];
  const types = ['revision', 'reparation', 'controle_technique', 'pneus', 'autre'];
  const type  = types[Math.floor(Math.random() * types.length)];

  const d = new Date();
  d.setDate(d.getDate() + Math.floor(Math.random() * 30) + 1);

  gql(token, M_CREATE_MAINTENANCE, {
    input: {
      vehiculeId, type,
      datePlanifiee: d.toISOString().slice(0, 10),
      technicien: `k6-tech-${__VU}`,
    },
  }, 'CreateMaintenance');

  sleep(1);
}
