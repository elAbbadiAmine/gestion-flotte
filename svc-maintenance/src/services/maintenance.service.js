const repo = require('../repositories/maintenance.repository');
const { publishEvent } = require('../config/kafka');
const logger = require('../config/logger');
const { maintenancesPlanifieesTotal, maintenancesTermineesTotal } = require('../config/metrics');

const getAllMaintenances = (filters) => repo.findAll(filters);

const getMaintenanceById = async (id) => {
  const i = await repo.findById(id);
  if (!i) throw new Error('Maintenance non trouvée');
  return i;
};

const getHistoriqueVehicule = (vehiculeId) => repo.findByVehicule(vehiculeId);

const getAlertes = (kilometrageActuel, marge) =>
  repo.findAlertesKilometrage(Number(kilometrageActuel), marge ? Number(marge) : undefined);

const createMaintenance = async (data) => {
  validerDates(data);
  const i = await repo.create(data);
  maintenancesPlanifieesTotal.inc({ type: i.type });
  logger.info({ id: i.id, vehiculeId: i.vehiculeId, type: i.type }, 'Maintenance créée');
  await publishEvent('maintenance', { type: 'maintenance.planifiee', payload: i });
  return i;
};

const demarrerMaintenance = async (id) => {
  const i = await repo.findById(id);
  if (!i) throw new Error('Maintenance non trouvée');
  if (i.statut !== 'planifiee') throw new Error(`Statut invalide : ${i.statut}`);
  const updated = await repo.update(id, { statut: 'en_cours', dateReelle: new Date() });
  logger.info({ id, vehiculeId: updated.vehiculeId }, 'Maintenance démarrée');
  await publishEvent('maintenance', { type: 'maintenance.started', payload: { vehiculeId: updated.vehiculeId, maintenanceId: id } });
  return updated;
};

const terminerMaintenance = async (id, data) => {
  const i = await repo.findById(id);
  if (!i) throw new Error('Maintenance non trouvée');
  if (i.statut !== 'en_cours') throw new Error(`Statut invalide : ${i.statut}`);
  const updated = await repo.update(id, { statut: 'terminee', ...data });
  maintenancesTermineesTotal.inc();
  logger.info({ id, vehiculeId: updated.vehiculeId }, 'Maintenance terminée');
  await publishEvent('maintenance', { type: 'maintenance.completed', payload: { vehiculeId: updated.vehiculeId, maintenanceId: id } });
  return updated;
};

const annulerMaintenance = async (id, motif) => {
  const i = await repo.findById(id);
  if (!i) throw new Error('Maintenance non trouvée');
  if (i.statut === 'terminee') throw new Error('Impossible d\'annuler une maintenance terminée');
  const updated = await repo.update(id, { statut: 'annulee', description: motif || i.description });
  logger.info({ id, vehiculeId: updated.vehiculeId }, 'Maintenance annulée');
  await publishEvent('maintenance', { type: 'maintenance.annulee', payload: { vehiculeId: updated.vehiculeId, maintenanceId: id } });
  return updated;
};

const updateMaintenance = async (id, data) => {
  if (data.datePlanifiee) validerDates(data);
  const i = await repo.update(id, data);
  if (!i) throw new Error('Maintenance non trouvée');
  logger.info({ id }, 'Maintenance mise à jour');
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
  getAllMaintenances,
  getMaintenanceById,
  getHistoriqueVehicule,
  getAlertes,
  createMaintenance,
  demarrerMaintenance,
  terminerMaintenance,
  annulerMaintenance,
  updateMaintenance,
};
