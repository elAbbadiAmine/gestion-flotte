// Scénario k6 conducteurs : liste, create, suspend, reactivate, delete
import { sleep } from 'k6';
import { getToken } from '../helpers/auth.js';
import { gql } from '../helpers/graphql.js';

export const options = {
  scenarios: {
    conducteurs_load: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '30s', target: 10 },
        { duration: '1m',  target: 10 },
        { duration: '20s', target: 0  },
      ],
    },
  },
  thresholds: {
    http_req_duration: ['p(95)<500'],
    http_req_failed:   ['rate<0.01'],
    checks:            ['rate>0.99'],
  },
};

export function setup() {
  return { token: getToken() };
}

const QUERY_LIST = `
  query GetConducteurs {
    conducteurs {
      id nom prenom email telephone statut
      numeroPermis categoriesPermis dateExpirationPermis
    }
  }
`;

const MUTATION_CREATE = `
  mutation CreateConducteur($input: CreateConducteurInput!) {
    createConducteur(input: $input) { id nom prenom email }
  }
`;

const MUTATION_UPDATE = `
  mutation UpdateConducteur($id: ID!, $input: UpdateConducteurInput!) {
    updateConducteur(id: $id, input: $input) { id statut }
  }
`;

const MUTATION_DELETE = `
  mutation DeleteConducteur($id: ID!) {
    deleteConducteur(id: $id)
  }
`;

const NOMS    = ['Martin', 'Dupont', 'Bernard', 'Petit', 'Robert'];
const PRENOMS = ['Jean', 'Pierre', 'Marie', 'Sophie', 'Lucas'];

// Date d'expiration permis : 2 ans dans le futur
function futureDate() {
  const d = new Date();
  d.setFullYear(d.getFullYear() + 2);
  return d.toISOString().slice(0, 10);
}

export default function ({ token }) {
  // 1. Lire la liste
  gql(token, QUERY_LIST, {}, 'GetConducteurs');
  sleep(0.5);

  // 2. Créer un conducteur
  const idx = Math.floor(Math.random() * NOMS.length);
  const ts  = Date.now();
  const data = gql(token, MUTATION_CREATE, {
    input: {
      nom:                  NOMS[idx],
      prenom:               PRENOMS[idx],
      email:                `k6.${ts}.${__VU}@test.local`,
      telephone:            `06${String(ts).slice(-8)}`,
      numeroPermis:         `K6-${ts}-${__VU}`,
      categoriesPermis:     ['B'],
      dateExpirationPermis: futureDate(),
      statut:               'actif',
    },
  }, 'CreateConducteur');

  if (!data?.createConducteur?.id) { sleep(1); return; }
  const id = data.createConducteur.id;
  sleep(0.3);

  // 3. Suspendre puis réactiver
  gql(token, MUTATION_UPDATE, { id, input: { statut: 'suspendu' } }, 'UpdateConducteur-suspend');
  sleep(0.2);
  gql(token, MUTATION_UPDATE, { id, input: { statut: 'actif' } }, 'UpdateConducteur-reactivate');
  sleep(0.3);

  // 4. Supprimer (nettoyage)
  gql(token, MUTATION_DELETE, { id }, 'DeleteConducteur');
  sleep(1);
}
