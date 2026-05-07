const pool = require('./database');
const logger = require('./logger');

const migrate = async () => {
  await pool.query(`CREATE EXTENSION IF NOT EXISTS postgis`);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS positions (
      time        TIMESTAMPTZ       NOT NULL,
      vehicule_id UUID              NOT NULL,
      latitude    DOUBLE PRECISION  NOT NULL,
      longitude   DOUBLE PRECISION  NOT NULL,
      geom        GEOGRAPHY(POINT, 4326)
    )
  `);

  await pool.query(`SELECT create_hypertable('positions', 'time', if_not_exists => TRUE)`);

  await pool.query(`
    ALTER TABLE positions ADD COLUMN IF NOT EXISTS geom GEOGRAPHY(POINT, 4326)
  `);

  await pool.query(`
    CREATE OR REPLACE FUNCTION update_geom_from_latlon() RETURNS TRIGGER AS $$
    BEGIN
      NEW.geom := ST_SetSRID(ST_MakePoint(NEW.longitude, NEW.latitude), 4326)::geography;
      RETURN NEW;
    END;
    $$ LANGUAGE plpgsql
  `);

  await pool.query(`DROP TRIGGER IF EXISTS trg_positions_geom ON positions`);

  await pool.query(`
    CREATE TRIGGER trg_positions_geom
      BEFORE INSERT OR UPDATE ON positions
      FOR EACH ROW EXECUTE FUNCTION update_geom_from_latlon()
  `);

  await pool.query(`
    CREATE INDEX IF NOT EXISTS idx_positions_vehicule_time
      ON positions (vehicule_id, time DESC)
  `);

  await pool.query(`
    CREATE INDEX IF NOT EXISTS idx_positions_geom
      ON positions USING GIST (geom)
  `);

  logger.info('Migration TimescaleDB + PostGIS OK — table positions spatialement indexée');
};

module.exports = migrate;
