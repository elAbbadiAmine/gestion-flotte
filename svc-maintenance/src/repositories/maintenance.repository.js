const { Op } = require('sequelize');
const Intervention = require('../models/maintenance.model');

const findAll = (filters = {}) => {
  const where = {};
  if (filters.vehiculeId) where.vehiculeId = filters.vehiculeId;
  if (filters.statut) where.statut = filters.statut;
  if (filters.type) where.type = filters.type;
  return Intervention.findAll({ where, order: [['datePlanifiee', 'ASC']] });
};

const findById = (id) => Intervention.findByPk(id);

const findByVehicule = (vehiculeId) =>
  Intervention.findAll({ where: { vehiculeId }, order: [['datePlanifiee', 'DESC']] });

const findAlertesKilometrage = (kilometrageActuel, marge = 500) =>
  Intervention.findAll({
    where: {
      statut: { [Op.in]: ['planifiee', 'en_cours'] },
      kilometrageProchaine: { [Op.between]: [kilometrageActuel, kilometrageActuel + marge] },
    },
  });

const create = (data) => Intervention.create(data);

const update = async (id, data) => {
  const [count, rows] = await Intervention.update(data, { where: { id }, returning: true });
  return count ? rows[0] : null;
};

const remove = (id) => Intervention.destroy({ where: { id } });

module.exports = { findAll, findById, findByVehicule, findAlertesKilometrage, create, update, remove };