const ds = require('../datasources/vehicule.datasource');
const resolvers = {
  Query: {
    vehicules: async (_, { statut }, { headers }) => ds.getAll({ statut }, headers),
    vehicule: async (_, { id }, { headers }) => ds.getById(id, headers),
  },
  Mutation: {
    createVehicule: async (_, { input }, { headers }) => ds.create(input, headers),
    updateVehicule: async (_, { id, input }, { headers }) => ds.update(id, input, headers),
    deleteVehicule: async (_, { id }, { headers }) => ds.remove(id, headers),
  },
};
module.exports = resolvers;
