const pool = require('../config/database');

const save = async ({ vehicule_id, latitude, longitude, time }) => {
  const result = await pool.query(
    'INSERT INTO positions (time, vehicule_id, latitude, longitude) VALUES ($1, $2, $3, $4) RETURNING *',
    [time || new Date(), vehicule_id, latitude, longitude]
  );
  return result.rows[0];
};

const findByVehicule = async (vehicule_id, debut, fin) => {
  const result = await pool.query(
    `SELECT * FROM positions
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
    'SELECT * FROM positions WHERE vehicule_id = $1 ORDER BY time DESC LIMIT 1',
    [vehicule_id]
  );
  return result.rows[0] || null;
};

module.exports = { save, findByVehicule, findDernierePosition };
