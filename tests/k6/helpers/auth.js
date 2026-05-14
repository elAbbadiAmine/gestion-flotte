import http from 'k6/http';

const KC_URL   = __ENV.KEYCLOAK_URL   || 'http://localhost:8080';
const KC_USER  = __ENV.KC_USERNAME    || 'admin';
const KC_PASS  = __ENV.KC_PASSWORD    || 'admin_password_dev';
const CLIENT   = __ENV.KC_CLIENT_ID   || 'gestion-flotte-frontend';

// Token Keycloak via password grant, a appeler dans setup()
export function getToken() {
  const res = http.post(
    `${KC_URL}/realms/flotte/protocol/openid-connect/token`,
    {
      grant_type: 'password',
      client_id:  CLIENT,
      username:   KC_USER,
      password:   KC_PASS,
    },
    { tags: { name: 'keycloak-token' } }
  );

  if (res.status !== 200) {
    console.error(`[auth] Keycloak token KO (${res.status}): ${res.body}`);
    return null;
  }

  return JSON.parse(res.body).access_token;
}
