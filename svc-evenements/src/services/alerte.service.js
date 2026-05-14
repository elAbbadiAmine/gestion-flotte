const repo = require('../repositories/alerte.repository');
const { evenementsConsommesTotal } = require('../config/metrics');

const getAlertes = (filters) => repo.findAll(filters);

const getAlerteById = async (id) => {
  const alerte = await repo.findById(id);
  if (!alerte) throw new Error('Alerte non trouvée');
  return alerte;
};

const createAlerte = async (data) => {
  const alerte = await repo.create(data);
  evenementsConsommesTotal.inc({ topic: data.source || 'interne' });
  return alerte;
};

const marquerLue = async (id) => {
  const alerte = await getAlerteById(id);
  return repo.update(alerte.id, { lu: true });
};

module.exports = { getAlertes, getAlerteById, createAlerte, marquerLue };
