const ds = require('../datasources/conducteur.datasource');
const resolvers = {
  Query: {
    conducteurs: async () => ds.getAll(),
    conducteur: async (_, { id }) => ds.getById(id),
  },
  Mutation: {
    createConducteur: async (_, { input }) => ds.create(input),
    updateConducteur: async (_, { id, input }) => ds.update(id, input),
    deleteConducteur: async (_, { id }) => ds.remove(id),
  },
};
module.exports = resolvers;
