const axios = require('../config/httpClient');
const BASE_URL = process.env.SVC_EVENEMENTS_URL || 'http://svc-evenements:3005';

const getAll = async (filters = {}) => {
  const params = new URLSearchParams();
  if (filters.niveau) params.append('niveau', filters.niveau);
  if (filters.lu !== undefined) params.append('lu', filters.lu);
  if (filters.vehiculeId) params.append('vehiculeId', filters.vehiculeId);
  const res = await axios.get(`${BASE_URL}/api/v1/alertes?${params}`);
  return res.data.data;
};

const getById = async (id) => {
  try {
    const res = await axios.get(`${BASE_URL}/api/v1/alertes/${id}`);
    return res.data.data;
  } catch (e) {
    if (e.response?.status === 404) return null;
    throw e;
  }
};

const marquerLue = async (id) => {
  const res = await axios.put(`${BASE_URL}/api/v1/alertes/${id}/lu`);
  return res.data.data;
};

module.exports = { getAll, getById, marquerLue };
