const ds = require('../datasources/maintenance.datasource');
const resolvers = {
  Query: {
    maintenances: async (_, __, { headers }) => ds.getAll(headers),
    maintenance: async (_, { id }, { headers }) => ds.getById(id, headers),
  },
  Mutation: {
    createMaintenance: async (_, { input }, { headers }) => ds.create(input, headers),
    updateMaintenance: async (_, { id, input }, { headers }) => ds.update(id, input, headers),
  },
};
module.exports = resolvers;
