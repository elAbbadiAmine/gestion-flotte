const express = require('express');
const { ApolloServer } = require('@apollo/server');
const { expressMiddleware } = require('@apollo/server/express4');
const { json } = require('express');
const typeDefs = require('./schema/vehicule.schema');
const resolvers = require('./resolvers/vehicule.resolvers');

const app = express();

const start = async () => {
  const server = new ApolloServer({ typeDefs, resolvers });
  await server.start();

  app.use(express.json());

  app.get('/health', (req, res) =>
    res.json({ status: 'ok', service: 'api-gateway' })
  );

  app.use('/graphql', json(), expressMiddleware(server, {
    context: async ({ req }) => ({ headers: req.headers }),
  }));

  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log(`[api-gateway] Port ${PORT}`);
    console.log(`[GraphQL] http://localhost:${PORT}/graphql`);
  });
};

start().catch(console.error);

module.exports = app;