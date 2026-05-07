const axios = require('axios');

let cachedToken = null;
let tokenExpiry = 0;

const getServiceToken = async () => {
  if (cachedToken && Date.now() < tokenExpiry) return cachedToken;
  const res = await axios.post(
    `${process.env.KEYCLOAK_URL}/realms/${process.env.KEYCLOAK_REALM}/protocol/openid-connect/token`,
    new URLSearchParams({
      grant_type: 'client_credentials',
      client_id: process.env.KEYCLOAK_CLIENT_ID,
      client_secret: process.env.KEYCLOAK_CLIENT_SECRET,
    }),
    { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
  );
  cachedToken = res.data.access_token;
  tokenExpiry = Date.now() + (res.data.expires_in - 30) * 1000;
  return cachedToken;
};

module.exports = { getServiceToken };
