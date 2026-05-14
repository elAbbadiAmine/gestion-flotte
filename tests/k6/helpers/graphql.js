import http from 'k6/http';
import { check } from 'k6';

const GW_URL = __ENV.GATEWAY_URL || 'http://localhost:4000';

// Requete GraphQL avec verification du statut et des erreurs
export function gql(token, query, variables = {}, opName = '') {
  const headers = {
    'Content-Type': 'application/json',
    'apollo-require-preflight': 'true',
  };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = http.post(
    `${GW_URL}/graphql`,
    JSON.stringify({ query, variables }),
    { headers, tags: { name: opName || 'graphql' } }
  );

  const ok = check(res, {
    [`${opName} status 200`]: (r) => r.status === 200,
    [`${opName} sans erreur GraphQL`]: (r) => {
      try {
        const body = JSON.parse(r.body);
        return !body.errors;
      } catch {
        return false;
      }
    },
  });

  if (!ok) return null;
  return JSON.parse(res.body).data;
}
