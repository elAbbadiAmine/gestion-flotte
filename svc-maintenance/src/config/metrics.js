const client = require('prom-client');

const register = new client.Registry();
client.collectDefaultMetrics({ register });

const maintenancesPlanifieesTotal = new client.Counter({
  name: 'maintenances_planifiees_total',
  help: 'Nombre total de maintenances planifiées',
  labelNames: ['type'],
  registers: [register],
});

const maintenancesTermineesTotal = new client.Counter({
  name: 'maintenances_terminees_total',
  help: 'Nombre total de maintenances terminées',
  registers: [register],
});

const maintenancesErrTotal = new client.Counter({
  name: 'maintenances_erreurs_total',
  help: 'Nombre total d\'erreurs dans svc-maintenance',
  labelNames: ['operation'],
  registers: [register],
});

module.exports = { register, maintenancesPlanifieesTotal, maintenancesTermineesTotal, maintenancesErrTotal };
