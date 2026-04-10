const axios = require('axios');
const BASE_URL = process.env.SVC_VEHICULES_URL || 'http://svc-conducteurs:3002';
const pick = (headers) => ({
  ...(headers.authorization && { authorization: headers.authorization }),
});
const getAll = async (filters = {}, headers = {}) => {
  const params = new URLSearchParams();
  if (filters.statut) params.append('statut', filters.statut);
  const res = await axios.get(`${BASE_URL}/api/v1/conducteurs?${params}`, { headers: pick(headers) });
  return res.data.data;
};
const getById = async (id, headers = {}) => {
  try {
    const res = await axios.get(`${BASE_URL}/api/v1/conducteurs/${id}`, { headers: pick(headers) });
    return res.data.data;
  } catch (e) {
    if (e.response?.status === 404) return null;
    throw e;
  }
};
const create = async (input, headers = {}) => {
  const res = await axios.post(`${BASE_URL}/api/v1/conducteurs`, input, { headers: pick(headers) });
  return res.data.data;
};
const update = async (id, input, headers = {}) => {
  const res = await axios.put(`${BASE_URL}/api/v1/conducteurs/${id}`, input, { headers: pick(headers) });
  return res.data.data;
};
const remove = async (id, headers = {}) => {
  await axios.delete(`${BASE_URL}/api/v1/conducteurs/${id}`, { headers: pick(headers) });
  return true;
};
module.exports = { getAll, getById, create, update, remove };
