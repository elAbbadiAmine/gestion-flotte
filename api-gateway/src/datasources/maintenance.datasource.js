const axios = require('../config/httpClient');
const BASE_URL = process.env.SVC_MAINTENANCE_URL || 'http://svc-maintenance:3003';

const getAll = async (filters = {}) => {
  const params = new URLSearchParams();
  if (filters.vehiculeId) params.append('vehiculeId', filters.vehiculeId);
  if (filters.statut) params.append('statut', filters.statut);
  const res = await axios.get(`${BASE_URL}/api/v1/maintenances?${params}`);
  return res.data.data;
};

const getById = async (id) => {
  try {
    const res = await axios.get(`${BASE_URL}/api/v1/maintenances/${id}`);
    return res.data.data;
  } catch (e) {
    if (e.response?.status === 404) return null;
    throw e;
  }
};

const getHistorique = async (vehiculeId) => {
  const res = await axios.get(`${BASE_URL}/api/v1/maintenances/vehicule/${vehiculeId}`);
  return res.data.data;
};

const getAlertes = async (kilometrage, marge) => {
  const params = new URLSearchParams({ kilometrage });
  if (marge) params.append('marge', marge);
  const res = await axios.get(`${BASE_URL}/api/v1/maintenances/alertes?${params}`);
  return res.data.data;
};

const create = async (input) => {
  const res = await axios.post(`${BASE_URL}/api/v1/maintenances`, input);
  return res.data.data;
};

const update = async (id, input) => {
  const res = await axios.put(`${BASE_URL}/api/v1/maintenances/${id}`, input);
  return res.data.data;
};

const demarrer = async (id) => {
  const res = await axios.post(`${BASE_URL}/api/v1/maintenances/${id}/demarrer`);
  return res.data.data;
};

const terminer = async (id, input) => {
  const res = await axios.post(`${BASE_URL}/api/v1/maintenances/${id}/terminer`, input);
  return res.data.data;
};

const annuler = async (id, motif) => {
  const res = await axios.post(`${BASE_URL}/api/v1/maintenances/${id}/annuler`, { motif });
  return res.data.data;
};

const remove = async (id) => {
  await axios.delete(`${BASE_URL}/api/v1/maintenances/${id}`);
  return true;
};

module.exports = { getAll, getById, getHistorique, getAlertes, create, update, demarrer, terminer, annuler, remove };
