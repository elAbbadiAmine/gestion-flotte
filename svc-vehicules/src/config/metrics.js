const client = require('prom-client');

const register = new client.Registry();
client.collectDefaultMetrics({ register });

const vehiculesCreesTotal = new client.Counter({
  name: 'vehicules_crees_total',
  help: 'Nombre total de véhicules créés',
  registers: [register],
});

const vehiculesSupprTotal = new client.Counter({
  name: 'vehicules_supprimes_total',
  help: 'Nombre total de véhicules supprimés',
  registers: [register],
});

const vehiculesErrTotal = new client.Counter({
  name: 'vehicules_erreurs_total',
  help: 'Nombre total d\'erreurs dans svc-vehicules',
  labelNames: ['operation'],
  registers: [register],
});

module.exports = { register, vehiculesCreesTotal, vehiculesSupprTotal, vehiculesErrTotal };
