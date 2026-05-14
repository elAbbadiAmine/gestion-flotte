const client = require('prom-client');

const register = new client.Registry();
client.collectDefaultMetrics({ register });

const evenementsConsommesTotal = new client.Counter({
  name: 'evenements_consommes_total',
  help: 'Nombre total d\'événements Kafka consommés',
  labelNames: ['topic'],
  registers: [register],
});

module.exports = { register, evenementsConsommesTotal };
