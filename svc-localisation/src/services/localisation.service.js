const repo = require('../repositories/position.repository');
const kafka = require('../config/kafka');
const logger = require('../config/logger');

const ZONES = [
  { nom: 'Paris_Centre', lat: 48.8566, lon: 2.3522, rayon: 10 },
];

const haversine = (lat1, lon1, lat2, lon2) => {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

const estDansZone = (latitude, longitude) =>
  ZONES.some(z => haversine(latitude, longitude, z.lat, z.lon) <= z.rayon);

const enregistrerPosition = async ({ vehicule_id, latitude, longitude, time }) => {
  const position = await repo.save({ vehicule_id, latitude, longitude, time });
  if (!estDansZone(latitude, longitude)) {
    await kafka.publishEvent('localisation', {
      type: 'geofence.violation',
      payload: { vehicule_id, latitude, longitude, time: position.time },
    });
    logger.warn(`Geofence violation: vehicule ${vehicule_id}`);
  }
  return position;
};

const getHistorique = async (vehicule_id, debut, fin) =>
  repo.findByVehicule(vehicule_id, debut, fin);

const getDernierePosition = async (vehicule_id) =>
  repo.findDernierePosition(vehicule_id);

module.exports = { enregistrerPosition, getHistorique, getDernierePosition };
