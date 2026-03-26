const ds = require('../datasources/vehicule.datasource');

const resolvers = {
  Query: {
    vehicules: async (_, { statut }) => {
      return ds.getAll({ statut });
    },
    vehicule: async (_, { id }) => {
      return ds.getById(id);
    },
  },

  Mutation: {
    createVehicule: async (_, { input }) => {
      return ds.create(input);
    },
    updateVehicule: async (_, { id, input }) => {
      return ds.update(id, input);
    },
    deleteVehicule: async (_, { id }) => {
      return ds.remove(id);
    },
  },
};

module.exports = resolvers;