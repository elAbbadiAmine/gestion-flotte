const ds = require('../datasources/conducteur.datasource');
const vehiculeDs = require('../datasources/vehicule.datasource');

const resolvers = {
  Query: {
    conducteurs: async (_, { statut }) => ds.getAll({ statut }),
    conducteur: async (_, { id }) => ds.getById(id),
  },
  Mutation: {
    createConducteur: async (_, { input }) => ds.create(input),
    updateConducteur: async (_, { id, input }) => ds.update(id, input),
    deleteConducteur: async (_, { id }) => ds.remove(id),
    assignerMission: async (_, { id, vehiculeId, missionId }) => {
      const vehicule = await vehiculeDs.getById(vehiculeId);
      if (!vehicule) throw new Error('Véhicule introuvable');
      if (vehicule.statut !== 'disponible') throw new Error(`Véhicule non disponible (statut : ${vehicule.statut})`);
      return ds.assignerMission(id, vehiculeId, missionId);
    },
    terminerMission: async (_, { id, missionId }) => ds.terminerMission(id, missionId),
  },
};

module.exports = resolvers;
