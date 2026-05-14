require('./config/tracing');
const express = require('express');
const pinoHttp = require('pino-http');
const cors = require('cors');
const { ApolloServer } = require('@apollo/server');
const { expressMiddleware } = require('@apollo/server/express4');
const { mergeTypeDefs, mergeResolvers } = require('@graphql-tools/merge');
const { json } = require('express');
const logger = require('./config/logger');
const { register } = require('./config/metrics');
const vehiculeTypeDefs = require('./schema/vehicule.schema');
const conducteurTypeDefs = require('./schema/conducteur.schema');
const maintenanceTypeDefs = require('./schema/maintenance.schema');
const localisationTypeDefs = require('./schema/localisation.schema');
const evenementTypeDefs = require('./schema/evenement.schema');
const vehiculeResolvers = require('./resolvers/vehicule.resolvers');
const conducteurResolvers = require('./resolvers/conducteur.resolvers');
const maintenanceResolvers = require('./resolvers/maintenance.resolvers');
const localisationResolvers = require('./resolvers/localisation.resolvers');
const evenementResolvers = require('./resolvers/evenement.resolvers');

const typeDefs = mergeTypeDefs([vehiculeTypeDefs, conducteurTypeDefs, maintenanceTypeDefs, localisationTypeDefs, evenementTypeDefs]);
const resolvers = mergeResolvers([vehiculeResolvers, conducteurResolvers, maintenanceResolvers, localisationResolvers, evenementResolvers]);

const app = express();

const start = async () => {
  const server = new ApolloServer({ typeDefs, resolvers });
  await server.start();

  app.use(cors({
    origin: 'http://localhost:5173',
    credentials: true,
  }));

  app.use(express.json());
  app.use(pinoHttp({ logger }));
  app.get('/health', (req, res) => res.json({ status: 'ok', service: 'api-gateway' }));
  app.get('/metrics', async (req, res) => {
    res.set('Content-Type', register.contentType);
    res.send(await register.metrics());
  });
  app.use('/graphql', json(), expressMiddleware(server, {
    context: async ({ req }) => ({ headers: req.headers }),
  }));

  const PORT = process.env.PORT || 4000;
  app.listen(PORT, () => {
    logger.info({ port: PORT }, 'api-gateway démarré');
    logger.info(`GraphQL : http://localhost:${PORT}/graphql`);
  });
};

start().catch((err) => logger.error({ err }, 'Erreur au démarrage api-gateway'));
module.exports = app;