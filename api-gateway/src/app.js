const express = require('express');
const { ApolloServer } = require('@apollo/server');
const { expressMiddleware } = require('@apollo/server/express4');
const { mergeTypeDefs, mergeResolvers } = require('@graphql-tools/merge');
const { json } = require('express');
const vehiculeTypeDefs = require('./schema/vehicule.schema');
const conducteurTypeDefs = require('./schema/conducteur.schema');
const maintenanceTypeDefs = require('./schema/maintenance.schema');
const vehiculeResolvers = require('./resolvers/vehicule.resolvers');
const conducteurResolvers = require('./resolvers/conducteur.resolvers');
const maintenanceResolvers = require('./resolvers/maintenance.resolvers');
const typeDefs = mergeTypeDefs([vehiculeTypeDefs, conducteurTypeDefs, maintenanceTypeDefs]);
const resolvers = mergeResolvers([vehiculeResolvers, conducteurResolvers, maintenanceResolvers]);
const app = express();
const start = async () => {
  const server = new ApolloServer({ typeDefs, resolvers });
  await server.start();
  app.use(express.json());
  app.get('/health', (req, res) => res.json({ status: 'ok', service: 'api-gateway' }));
  app.use('/graphql', json(), expressMiddleware(server, {
    context: async ({ req }) => ({ headers: req.headers }),
  }));
  const PORT = process.env.PORT || 4000;
  app.listen(PORT, () => {
    console.log(`[api-gateway] Port ${PORT}`);
    console.log(`[GraphQL] http://localhost:${PORT}/graphql`);
  });
};
start().catch(console.error);
module.exports = app;
