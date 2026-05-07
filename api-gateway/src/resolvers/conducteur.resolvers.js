const ds = require('../datasources/conducteur.datasource');

const resolvers = {
  Query: {
    conducteurs: async (_, { statut }) => ds.getAll({ statut }),
    conducteur: async (_, { id }) => ds.getById(id),
  },
  Mutation: {
    createConducteur: async (_, { input }) => ds.create(input),
    updateConducteur: async (_, { id, input }) => ds.update(id, input),
    deleteConducteur: async (_, { id }) => ds.remove(id),
    assignerMission: async (_, { id, vehiculeId, missionId }) => ds.assignerMission(id, vehiculeId, missionId),
    terminerMission: async (_, { id, vehiculeId, missionId }) => ds.terminerMission(id, vehiculeId, missionId),
  },
};

module.exports = resolvers;
