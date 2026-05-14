const ds = require('../datasources/evenement.datasource');

const resolvers = {
  Query: {
    alertes: (_, args) => ds.getAll(args),
    alerte: (_, { id }) => ds.getById(id),
  },
  Mutation: {
    marquerAlerteLue: (_, { id }) => ds.marquerLue(id),
  },
};

module.exports = resolvers;
