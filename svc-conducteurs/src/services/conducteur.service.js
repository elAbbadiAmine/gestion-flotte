const repo = require('../repositories/conducteur.repository');
const { publishEvent } = require('../config/kafka');
const logger = require('../config/logger');
const { conducteursCreesTotal, conducteursSupprTotal } = require('../config/metrics');

const getAllConducteurs = (filters) => repo.findAll(filters);

const getConducteurById = async (id) => {
  const c = await repo.findById(id);
  if (!c) throw new Error('Conducteur non trouvé');
  return c;
};

const createConducteur = async (data) => {
  validerPermis(data);
  const c = await repo.create(data);
  conducteursCreesTotal.inc();
  logger.info({ id: c.id, email: c.email }, 'Conducteur créé');
  await publishEvent('conducteurs', { type: 'conducteur.created', payload: c });
  return c;
};

const updateConducteur = async (id, data) => {
  if (data.categoriesPermis) validerCategoriesPermis(data.categoriesPermis);
  const avant = await repo.findById(id);
  if (!avant) throw new Error('Conducteur non trouvé');
  const statutChange = data.statut && data.statut !== avant.statut;
  const devenirIndisponible = statutChange && (data.statut === 'inactif' || data.statut === 'suspendu');
  if (devenirIndisponible && avant.vehiculeId) {
    data = { ...data, vehiculeId: null, missionDebutAt: null };
    logger.info({ id, vehiculeId: avant.vehiculeId, statut: data.statut }, 'Conducteur désactivé — libération véhicule');
    await publishEvent('missions', {
      type: 'mission.completed',
      payload: { conducteurId: id, vehiculeId: avant.vehiculeId, missionId: `SUSPEND-${id}` },
    });
  }
  const c = await repo.update(id, data);
  logger.info({ id }, 'Conducteur mis à jour');
  await publishEvent('conducteurs', { type: 'conducteur.updated', payload: c });
  return c;
};

const deleteConducteur = async (id) => {
  const c = await repo.findById(id);
  if (!c) throw new Error('Conducteur non trouvé');
  const vehiculeId = c.vehiculeId;
  await repo.remove(id);
  conducteursSupprTotal.inc();
  logger.info({ id }, 'Conducteur supprimé');
  await publishEvent('conducteurs', { type: 'conducteur.deleted', payload: { id } });
  if (vehiculeId) {
    logger.info({ id, vehiculeId }, 'Conducteur supprimé — libération véhicule');
    await publishEvent('missions', {
      type: 'mission.completed',
      payload: { conducteurId: id, vehiculeId, missionId: `DELETE-${id}` },
    });
  }
};

const assignerMission = async (conducteurId, vehiculeId, missionId) => {
  const c = await repo.findById(conducteurId);
  if (!c) throw new Error('Conducteur non trouvé');
  if (c.statut !== 'actif') throw new Error(`Conducteur non disponible : ${c.statut}`);
  if (c.vehiculeId) throw new Error('Conducteur déjà en mission');
  await repo.update(conducteurId, { vehiculeId, missionDebutAt: new Date() });
  logger.info({ conducteurId, vehiculeId, missionId }, 'Mission assignée');
  try {
    await publishEvent('missions', {
      type: 'mission.assigned',
      payload: { conducteurId, vehiculeId, missionId },
    });
  } catch (err) {
    await repo.update(conducteurId, { vehiculeId: null });
    logger.error({ err, conducteurId }, 'Rollback assignation mission');
    throw new Error('Échec publication event — rollback effectué');
  }
};

const terminerMission = async (conducteurId, missionId) => {
  const c = await repo.findById(conducteurId);
  if (!c) throw new Error('Conducteur non trouvé');
  const vehiculeId = c.vehiculeId;
  await repo.update(conducteurId, { vehiculeId: null, missionDebutAt: null });
  logger.info({ conducteurId, vehiculeId, missionId }, 'Mission terminée');
  await publishEvent('missions', {
    type: 'mission.completed',
    payload: { conducteurId, vehiculeId, missionId },
  });
};

const echouerMission = async (conducteurId, vehiculeId, missionId, motif) => {
  await repo.update(conducteurId, { vehiculeId: null });
  logger.warn({ conducteurId, missionId, motif }, 'Mission échouée — compensation');
  await publishEvent('missions', {
    type: 'mission.failed',
    payload: { conducteurId, vehiculeId, missionId, motif },
  });
};

const CATEGORIES_VALIDES = ['A', 'A1', 'A2', 'B', 'B1', 'BE', 'C', 'C1', 'CE', 'D', 'D1'];

const validerCategoriesPermis = (categories) => {
  const invalides = categories.filter(c => !CATEGORIES_VALIDES.includes(c));
  if (invalides.length) throw new Error(`Catégories invalides : ${invalides.join(', ')}`);
};

const validerPermis = (data) => {
  if (data.dateExpirationPermis) {
    const expiration = new Date(data.dateExpirationPermis);
    if (expiration <= new Date()) throw new Error('Permis expiré');
  }
  if (data.categoriesPermis) validerCategoriesPermis(data.categoriesPermis);
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