const ds = require('../datasources/maintenance.datasource');
const resolvers = {
  Query: {
    maintenances: async (_, __, { headers }) => ds.getAll(headers),
    maintenance: async (_, { id }, { headers }) => ds.getById(id, headers),
  },
  Mutation: {
    createMaintenance:   async (_, { input }, { headers }) => ds.create(input, headers),
    updateMaintenance:   async (_, { id, input }, { headers }) => ds.update(id, input, headers),
    terminerMaintenance: async (_, { id, input }) => ds.terminer(id, input),
    annulerMaintenance:  async (_, { id, motif }) => ds.annuler(id, motif),
  },
};
module.exports = resolvers;
