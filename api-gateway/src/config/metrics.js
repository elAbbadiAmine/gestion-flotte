const client = require('prom-client');

const register = new client.Registry();
client.collectDefaultMetrics({ register });

const graphqlOperationsTotal = new client.Counter({
  name: 'graphql_operations_total',
  help: 'Nombre total d\'opérations GraphQL',
  labelNames: ['operation', 'status'],
  registers: [register],
});

module.exports = { register, graphqlOperationsTotal };
