const repo = require('../repositories/vehicule.repository');
const { publishEvent } = require('../config/kafka');
const logger = require('../config/logger');

const getAllVehicules = (filters) => repo.findAll(filters);

const getVehiculeById = async (id) => {
  const v = await repo.findById(id);
  if (!v) throw new Error('Véhicule non trouvé');
  return v;
};

const createVehicule = async (data) => {
  const vehicule = await repo.create(data);
  logger.info({ id: vehicule.id, immatriculation: vehicule.immatriculation }, 'Véhicule créé');
  await publishEvent('vehicules', { type: 'vehicule.created', payload: vehicule });
  return vehicule;
};

const updateVehicule = async (id, data) => {
  const vehicule = await repo.update(id, data);
  if (!vehicule) throw new Error('Véhicule non trouvé');
  logger.info({ id }, 'Véhicule mis à jour');
  await publishEvent('vehicules', { type: 'vehicule.updated', payload: vehicule });
  return vehicule;
};

const deleteVehicule = async (id) => {
  const count = await repo.remove(id);
  if (!count) throw new Error('Véhicule non trouvé');
  logger.info({ id }, 'Véhicule supprimé');
  await publishEvent('vehicules', { type: 'vehicule.deleted', payload: { id } });
};

module.exports = { getAllVehicules, getVehiculeById, createVehicule, updateVehicule, deleteVehicule };