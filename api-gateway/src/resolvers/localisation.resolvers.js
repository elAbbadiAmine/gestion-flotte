const ds = require('../datasources/localisation.datasource');

const resolvers = {
  Query: {
    historiquePositions: (_, { vehiculeId, debut, fin }) => ds.getHistorique(vehiculeId, debut, fin),
    dernierePosition: (_, { vehiculeId }) => ds.getDernierePosition(vehiculeId),
  },
};

module.exports = resolvers;
