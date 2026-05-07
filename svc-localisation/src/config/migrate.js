const pool = require('./database');
const logger = require('./logger');

const migrate = async () => {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS positions (
      time        TIMESTAMPTZ       NOT NULL,
      vehicule_id UUID              NOT NULL,
      latitude    DOUBLE PRECISION  NOT NULL,
      longitude   DOUBLE PRECISION  NOT NULL
    )
  `);
  await pool.query(`
    SELECT create_hypertable('positions', 'time', if_not_exists => TRUE)
  `);
  await pool.query(`
    CREATE INDEX IF NOT EXISTS idx_positions_vehicule_time
      ON positions (vehicule_id, time DESC)
  `);
  logger.info('Migration TimescaleDB OK — table positions prête');
};

module.exports = migrate;
