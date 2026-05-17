const pool = require('../config/database');

const ZONES_AUTORISEES = [
  { nom: 'Rouen_Centre', latitude: 49.4432, longitude: 1.0999, rayon_m: 5000 },
];

const save = async ({ vehicule_id, latitude, longitude, time }) => {
  const result = await pool.query(
    'INSERT INTO positions (time, vehicule_id, latitude, longitude) VALUES ($1, $2, $3, $4) RETURNING *',
    [time || new Date(), vehicule_id, latitude, longitude]
  );
  return result.rows[0];
};

const findByVehicule = async (vehicule_id, debut, fin) => {
  const result = await pool.query(
    `SELECT time, vehicule_id, latitude, longitude
     FROM positions
     WHERE vehicule_id = $1
       AND time >= $2
       AND time <= $3
     ORDER BY time DESC`,
    [vehicule_id, debut || new Date(Date.now() - 3600000), fin || new Date()]
  );
  return result.rows;
};

const findDernierePosition = async (vehicule_id) => {
  const result = await pool.query(
    'SELECT time, vehicule_id, latitude, longitude FROM positions WHERE vehicule_id = $1 ORDER BY time DESC LIMIT 1',
    [vehicule_id]
  );
  return result.rows[0] || null;
};

const findInRadius = async (latitude, longitude, rayonMetres) => {
  const result = await pool.query(
    `SELECT DISTINCT ON (vehicule_id)
       vehicule_id, latitude, longitude, time,
       ST_Distance(geom, ST_SetSRID(ST_MakePoint($2, $1), 4326)::geography) AS distance
     FROM positions
     WHERE ST_DWithin(geom, ST_SetSRID(ST_MakePoint($2, $1), 4326)::geography, $3)
     ORDER BY vehicule_id, time DESC`,
    [latitude, longitude, rayonMetres]
  );
  return result.rows;
};

const checkGeofencing = async (latitude, longitude) => {
  const violations = [];
  for (const zone of ZONES_AUTORISEES) {
    const result = await pool.query(
      `SELECT ST_Distance(
         ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography,
         ST_SetSRID(ST_MakePoint($3, $4), 4326)::geography
       ) AS distance`,
      [longitude, latitude, zone.longitude, zone.latitude]
    );
    const distance = result.rows[0].distance;
    if (distance > zone.rayon_m) {
      violations.push({ nom: zone.nom, distance: Math.round(distance) });
    }
  }
  return violations;
};

const findToutesDernieresPositions = async () => {
  const result = await pool.query(
    `SELECT DISTINCT ON (vehicule_id) time, vehicule_id, latitude, longitude
     FROM positions
     ORDER BY vehicule_id, time DESC`
  );
  return result.rows;
};

module.exports = { save, findByVehicule, findDernierePosition, findToutesDernieresPositions, findInRadius, checkGeofencing };
