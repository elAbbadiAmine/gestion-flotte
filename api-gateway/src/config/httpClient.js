const axios = require('axios');
const { getServiceToken } = require('./auth');
const logger = require('./logger');

const instance = axios.create();

instance.interceptors.request.use(async (config) => {
  try {
    const token = await getServiceToken();
    config.headers.Authorization = `Bearer ${token}`;
  } catch (err) {
    logger.error({ err: err.message }, 'Erreur récupération token service');
  }
  return config;
});

module.exports = instance;
