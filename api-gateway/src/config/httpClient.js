const axios = require('axios');
const { getServiceToken } = require('./auth');

const instance = axios.create();

instance.interceptors.request.use(async (config) => {
  try {
    const token = await getServiceToken();
    config.headers.Authorization = `Bearer ${token}`;
  } catch (err) {
    console.error('Erreur récupération token:', err.message);
  }
  return config;
});

module.exports = instance;
