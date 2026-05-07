const repo = require('../repositories/position.repository');
const kafka = require('../config/kafka');
const logger = require('../config/logger');

const enregistrerPosition = async ({ vehicule_id, latitude, longitude, time }) => {
  const position = await repo.save({ vehicule_id, latitude, longitude, time });
  const violations = await repo.checkGeofencing(latitude, longitude);
  for (const zone of violations) {
    await kafka.publishEvent('localisation', {
      type: 'geofence.violation',
      payload: {
        vehicule_id,
        latitude,
        longitude,
        time: position.time,
        zone: zone.nom,
        distance_metres: zone.distance,
      },
    });
    logger.warn(`Geofence violation: vehicule ${vehicule_id} hors zone ${zone.nom}`);
  }
  return position;
};

const getHistorique = async (vehicule_id, debut, fin) =>
  repo.findByVehicule(vehicule_id, debut, fin);

const getDernierePosition = async (vehicule_id) =>
  repo.findDernierePosition(vehicule_id);

const getVehiculesDansRayon = async (latitude, longitude, rayonMetres) =>
  repo.findInRadius(latitude, longitude, rayonMetres);

module.exports = { enregistrerPosition, getHistorique, getDernierePosition, getVehiculesDansRayon };
