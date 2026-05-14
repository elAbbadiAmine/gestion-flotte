const client = require('prom-client');

const register = new client.Registry();
client.collectDefaultMetrics({ register });

const positionsGpsTotal = new client.Counter({
  name: 'positions_gps_recues_total',
  help: 'Nombre total de positions GPS reçues via gRPC',
  registers: [register],
});

const geofenceViolationsTotal = new client.Counter({
  name: 'geofence_violations_total',
  help: 'Nombre total de violations de geofence détectées',
  registers: [register],
});

module.exports = { register, positionsGpsTotal, geofenceViolationsTotal };
