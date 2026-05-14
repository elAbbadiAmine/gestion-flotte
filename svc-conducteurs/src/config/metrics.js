const client = require('prom-client');

const register = new client.Registry();
client.collectDefaultMetrics({ register });

const conducteursCreesTotal = new client.Counter({
  name: 'conducteurs_crees_total',
  help: 'Nombre total de conducteurs créés',
  registers: [register],
});

const conducteursSupprTotal = new client.Counter({
  name: 'conducteurs_supprimes_total',
  help: 'Nombre total de conducteurs supprimés',
  registers: [register],
});

const conducteursErrTotal = new client.Counter({
  name: 'conducteurs_erreurs_total',
  help: 'Nombre total d\'erreurs dans svc-conducteurs',
  labelNames: ['operation'],
  registers: [register],
});

module.exports = { register, conducteursCreesTotal, conducteursSupprTotal, conducteursErrTotal };
