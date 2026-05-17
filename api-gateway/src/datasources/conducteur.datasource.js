const axios = require('../config/httpClient');
const BASE_URL = process.env.SVC_CONDUCTEURS_URL || 'http://svc-conducteurs:3002';

const getAll = async (filters = {}) => {
  const params = new URLSearchParams();
  if (filters.statut) params.append('statut', filters.statut);
  const res = await axios.get(`${BASE_URL}/api/v1/conducteurs?${params}`);
  return res.data.data;
};

const getById = async (id) => {
  try {
    const res = await axios.get(`${BASE_URL}/api/v1/conducteurs/${id}`);
    return res.data.data;
  } catch (e) {
    if (e.response?.status === 404) return null;
    throw e;
  }
};

const create = async (input) => {
  const res = await axios.post(`${BASE_URL}/api/v1/conducteurs`, input);
  return res.data.data;
};

const update = async (id, input) => {
  const res = await axios.put(`${BASE_URL}/api/v1/conducteurs/${id}`, input);
  return res.data.data;
};

const remove = async (id) => {
  await axios.delete(`${BASE_URL}/api/v1/conducteurs/${id}`);
  return true;
};

const assignerMission = async (id, vehiculeId, missionId) => {
  await axios.post(`${BASE_URL}/api/v1/conducteurs/${id}/assigner-mission`, { vehiculeId, missionId });
  return true;
};

const terminerMission = async (id, missionId) => {
  await axios.post(`${BASE_URL}/api/v1/conducteurs/${id}/terminer-mission`, { missionId });
  return true;
};

module.exports = { getAll, getById, create, update, remove, assignerMission, terminerMission };
