// Scénario k6 vehicules : liste, create, update, delete
import { sleep } from 'k6';
import { getToken } from '../helpers/auth.js';
import { gql } from '../helpers/graphql.js';

export const options = {
  scenarios: {
    vehicules_load: {
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
  query GetVehicules {
    vehicules { id immatriculation marque modele annee statut kilometrage }
  }
`;

const MUTATION_CREATE = `
  mutation CreateVehicule($input: CreateVehiculeInput!) {
    createVehicule(input: $input) { id immatriculation }
  }
`;

const MUTATION_UPDATE = `
  mutation UpdateVehicule($id: ID!, $input: UpdateVehiculeInput!) {
    updateVehicule(id: $id, input: $input) { id statut kilometrage }
  }
`;

const MUTATION_DELETE = `
  mutation DeleteVehicule($id: ID!) {
    deleteVehicule(id: $id)
  }
`;

const MARQUES = ['Renault', 'Peugeot', 'Citroën', 'Toyota', 'Volkswagen'];
const MODELES = ['Clio', '208', 'C3', 'Yaris', 'Polo'];

export default function ({ token }) {
  // 1. Lire la liste
  gql(token, QUERY_LIST, {}, 'GetVehicules');
  sleep(0.5);

  // 2. Créer un véhicule
  const idx  = Math.floor(Math.random() * MARQUES.length);
  const immat = `K6-${Date.now()}-${__VU}`;
  const data = gql(token, MUTATION_CREATE, {
    input: {
      immatriculation: immat,
      marque:   MARQUES[idx],
      modele:   MODELES[idx],
      annee:    2020 + Math.floor(Math.random() * 5),
      statut:   'disponible',
      kilometrage: Math.floor(Math.random() * 100000),
    },
  }, 'CreateVehicule');

  if (!data?.createVehicule?.id) { sleep(1); return; }
  const id = data.createVehicule.id;
  sleep(0.3);

  // 3. Modifier le kilométrage
  gql(token, MUTATION_UPDATE, {
    id,
    input: { kilometrage: Math.floor(Math.random() * 200000) },
  }, 'UpdateVehicule');
  sleep(0.3);

  // 4. Supprimer (nettoyage)
  gql(token, MUTATION_DELETE, { id }, 'DeleteVehicule');
  sleep(1);
}
