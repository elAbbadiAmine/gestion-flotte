const axios = require('../config/httpClient');
const BASE_URL = process.env.SVC_LOCALISATION_URL || 'http://svc-localisation:3004';

const getHistorique = async (vehiculeId, debut, fin) => {
  const params = new URLSearchParams();
  if (debut) params.append('debut', debut);
  if (fin) params.append('fin', fin);
  const res = await axios.get(`${BASE_URL}/api/v1/positions/${vehiculeId}/historique?${params}`);
  return res.data.data.map((p) => ({ ...p, vehiculeId: p.vehicule_id }));
};

const getDernierePosition = async (vehiculeId) => {
  try {
    const res = await axios.get(`${BASE_URL}/api/v1/positions/${vehiculeId}/derniere`);
    const p = res.data.data;
    return { ...p, vehiculeId: p.vehicule_id };
  } catch (e) {
    if (e.response?.status === 404) return null;
    throw e;
  }
};

module.exports = { getHistorique, getDernierePosition };
