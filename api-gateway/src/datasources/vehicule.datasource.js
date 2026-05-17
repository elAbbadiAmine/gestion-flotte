const axios = require('../config/httpClient');
const BASE_URL = process.env.SVC_VEHICULES_URL || 'http://svc-vehicules:3001';

const getAll = async (filters = {}) => {
  const params = new URLSearchParams();
  if (filters.statut) params.append('statut', filters.statut);
  const res = await axios.get(`${BASE_URL}/api/v1/vehicules?${params}`);
  return res.data.data;
};

const getById = async (id) => {
  try {
    const res = await axios.get(`${BASE_URL}/api/v1/vehicules/${id}`);
    return res.data.data;
  } catch (e) {
    if (e.response?.status === 404) return null;
    throw e;
  }
};

const create = async (input) => {
  const res = await axios.post(`${BASE_URL}/api/v1/vehicules`, input);
  return res.data.data;
};

const update = async (id, input) => {
  const res = await axios.put(`${BASE_URL}/api/v1/vehicules/${id}`, input);
  return res.data.data;
};

const remove = async (id) => {
  try {
    await axios.delete(`${BASE_URL}/api/v1/vehicules/${id}`);
    return true;
  } catch (e) {
    throw new Error(e.response?.data?.error || e.message);
  }
};

module.exports = { getAll, getById, create, update, remove };
