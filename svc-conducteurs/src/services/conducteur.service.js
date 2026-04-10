const repo = require('../repositories/conducteur.repository');
const { publishEvent } = require('../config/kafka');
const logger = require('../config/logger');

const getAllConducteurs = (filters) => repo.findAll(filters);

const getConducteurById = async (id) => {
  const c = await repo.findById(id);
  if (!c) throw new Error('Conducteur non trouvé');
  return c;
};

const createConducteur = async (data) => {
  validerPermis(data);
  const c = await repo.create(data);
  logger.info({ id: c.id, email: c.email }, 'Conducteur créé');
  await publishEvent('conducteurs', { type: 'conducteur.created', payload: c });
  return c;
};

const updateConducteur = async (id, data) => {
  if (data.dateExpirationPermis || data.categoriesPermis) validerPermis(data);
  const c = await repo.update(id, data);
  if (!c) throw new Error('Conducteur non trouvé');
  logger.info({ id }, 'Conducteur mis à jour');
  await publishEvent('conducteurs', { type: 'conducteur.updated', payload: c });
  return c;
};

const deleteConducteur = async (id) => {
  const count = await repo.remove(id);
  if (!count) throw new Error('Conducteur non trouvé');
  logger.info({ id }, 'Conducteur supprimé');
  await publishEvent('conducteurs', { type: 'conducteur.deleted', payload: { id } });
};

const assignerMission = async (conducteurId, vehiculeId, missionId) => {
  const c = await repo.findById(conducteurId);
  if (!c) throw new Error('Conducteur non trouvé');
  if (c.statut !== 'actif') throw new Error(`Conducteur non disponible : ${c.statut}`);
  await repo.update(conducteurId, { statut: 'en_mission' });
  logger.info({ conducteurId, vehiculeId, missionId }, 'Mission assignée');
  try {
    await publishEvent('missions', {
      type: 'mission.assigned',
      payload: { conducteurId, vehiculeId, missionId },
    });
  } catch (err) {
    await repo.update(conducteurId, { statut: 'actif' });
    logger.error({ err, conducteurId }, 'Rollback assignation mission');
    throw new Error('Échec publication event — rollback effectué');
  }
};

const terminerMission = async (conducteurId, vehiculeId, missionId) => {
  const c = await repo.findById(conducteurId);
  if (!c) throw new Error('Conducteur non trouvé');
  await repo.update(conducteurId, { statut: 'actif' });
  logger.info({ conducteurId, missionId }, 'Mission terminée');
  await publishEvent('missions', {
    type: 'mission.completed',
    payload: { conducteurId, vehiculeId, missionId },
  });
};

const echouerMission = async (conducteurId, vehiculeId, missionId, motif) => {
  await repo.update(conducteurId, { statut: 'actif' });
  logger.warn({ conducteurId, missionId, motif }, 'Mission échouée — compensation');
  await publishEvent('missions', {
    type: 'mission.failed',
    payload: { conducteurId, vehiculeId, missionId, motif },
  });
};

const validerPermis = (data) => {
  if (data.dateExpirationPermis) {
    const expiration = new Date(data.dateExpirationPermis);
    if (expiration <= new Date()) throw new Error('Permis expiré');
  }
  const categoriesValides = ['A', 'A1', 'A2', 'B', 'B1', 'BE', 'C', 'C1', 'CE', 'D', 'D1'];
  if (data.categoriesPermis) {
    const invalides = data.categoriesPermis.filter(c => !categoriesValides.includes(c));
    if (invalides.length) throw new Error(`Catégories invalides : ${invalides.join(', ')}`);
  }
};

module.exports = {
  getAllConducteurs,
  getConducteurById,
  createConducteur,
  updateConducteur,
  deleteConducteur,
  assignerMission,
  terminerMission,
  echouerMission,
};