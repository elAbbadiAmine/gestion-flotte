// Scénario k6 maintenance : setup recupere les vehiculeIds réels, puis planification
import { sleep } from 'k6';
import { getToken } from '../helpers/auth.js';
import { gql } from '../helpers/graphql.js';

export const options = {
  scenarios: {
    maintenance_load: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '30s', target: 5 },
        { duration: '1m',  target: 5 },
        { duration: '20s', target: 0 },
      ],
    },
  },
  thresholds: {
    http_req_duration: ['p(95)<800'],
    http_req_failed:   ['rate<0.01'],
    checks:            ['rate>0.95'],
  },
};

export function setup() {
  const token = getToken();

  // Récupère les IDs véhicules disponibles pour le test
  const data = gql(token, `
    query GetVehiculesIds {
      vehicules { id immatriculation }
    }
  `, {}, 'setup-GetVehicules');

  const vehiculeIds = (data?.vehicules ?? []).map(v => v.id);
  return { token, vehiculeIds };
}

const QUERY_LIST = `
  query GetMaintenances {
    maintenances {
      id vehiculeId type statut datePlanifiee
    }
  }
`;

const MUTATION_CREATE = `
  mutation CreateMaintenance($input: CreateMaintenanceInput!) {
    createMaintenance(input: $input) {
      id vehiculeId type statut datePlanifiee
    }
  }
`;

const TYPES = ['revision', 'reparation', 'controle_technique', 'pneus', 'autre'];

function todayPlus(days) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

export default function ({ token, vehiculeIds }) {
  // 1. Lire la liste des interventions
  gql(token, QUERY_LIST, {}, 'GetMaintenances');
  sleep(0.5);

  // 2. Planifier une intervention si des véhicules existent
  if (vehiculeIds.length === 0) {
    sleep(1);
    return;
  }

  const vehiculeId = vehiculeIds[Math.floor(Math.random() * vehiculeIds.length)];
  const type       = TYPES[Math.floor(Math.random() * TYPES.length)];

  gql(token, MUTATION_CREATE, {
    input: {
      vehiculeId,
      type,
      datePlanifiee: todayPlus(Math.floor(Math.random() * 30) + 1),
      description:   `Test k6 — ${type}`,
      technicien:    `Technicien-k6-${__VU}`,
    },
  }, 'CreateMaintenance');

  sleep(1);
}
