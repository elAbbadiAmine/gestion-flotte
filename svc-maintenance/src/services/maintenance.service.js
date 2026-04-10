const repo = require('../repositories/maintenance.repository');
const { publishEvent } = require('../config/kafka');
const logger = require('../config/logger');

const getAllInterventions = (filters) => repo.findAll(filters);

const getInterventionById = async (id) => {const Intervention = require('../models/maintenance.model');

  const i = await repo.findById(id);
  if (!i) throw new Error('Intervention non trouvée');
  return i;
};

const getHistoriqueVehicule = (vehiculeId) => repo.findByVehicule(vehiculeId);

const getAlertes = (kilometrageActuel, marge) =>
  repo.findAlertesKilometrage(Number(kilometrageActuel), marge ? Number(marge) : undefined);

const createIntervention = async (data) => {
  validerDates(data);
  const i = await repo.create(data);
  logger.info({ id: i.id, vehiculeId: i.vehiculeId, type: i.type }, 'Intervention créée');
  await publishEvent('maintenance', { type: 'maintenance.planifiee', payload: i });
  return i;
};

const demarrerIntervention = async (id) => {
  const i = await repo.findById(id);
  if (!i) throw new Error('Intervention non trouvée');
  if (i.statut !== 'planifiee') throw new Error(`Statut invalide : ${i.statut}`);
  const updated = await repo.update(id, { statut: 'en_cours', dateReelle: new Date() });
  logger.info({ id, vehiculeId: updated.vehiculeId }, 'Intervention démarrée');
  await publishEvent('maintenance', { type: 'maintenance.started', payload: { vehiculeId: updated.vehiculeId, interventionId: id } });
  return updated;
};

const terminerIntervention = async (id, data) => {
  const i = await repo.findById(id);
  if (!i) throw new Error('Intervention non trouvée');
  if (i.statut !== 'en_cours') throw new Error(`Statut invalide : ${i.statut}`);
  const updated = await repo.update(id, { statut: 'terminee', ...data });
  logger.info({ id, vehiculeId: updated.vehiculeId }, 'Intervention terminée');
  await publishEvent('maintenance', { type: 'maintenance.completed', payload: { vehiculeId: updated.vehiculeId, interventionId: id } });
  return updated;
};

const annulerIntervention = async (id, motif) => {
  const i = await repo.findById(id);
  if (!i) throw new Error('Intervention non trouvée');
  if (i.statut === 'terminee') throw new Error('Impossible d\'annuler une intervention terminée');
  const updated = await repo.update(id, { statut: 'annulee', description: motif || i.description });
  logger.info({ id, vehiculeId: updated.vehiculeId }, 'Intervention annulée');
  await publishEvent('maintenance', { type: 'maintenance.annulee', payload: { vehiculeId: updated.vehiculeId, interventionId: id } });
  return updated;
};

const updateIntervention = async (id, data) => {
  if (data.datePlanifiee) validerDates(data);
  const i = await repo.update(id, data);
  if (!i) throw new Error('Intervention non trouvée');
  logger.info({ id }, 'Intervention mise à jour');
  return i;
};

const validerDates = (data) => {
  if (data.datePlanifiee && data.dateReelle) {
    if (new Date(data.dateReelle) < new Date(data.datePlanifiee)) {
      throw new Error('La date réelle ne peut pas précéder la date planifiée');
    }
  }
};

module.exports = {
  getAllInterventions,
  getInterventionById,
  getHistoriqueVehicule,
  getAlertes,
  createIntervention,
  demarrerIntervention,
  terminerIntervention,
  annulerIntervention,
  updateIntervention,
};