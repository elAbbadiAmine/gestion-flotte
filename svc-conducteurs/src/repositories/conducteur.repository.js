const { Op } = require('sequelize');
const Conducteur = require('../models/conducteur.model');

const findAll = (filters = {}) => {
  const where = {};
  if (filters.statut) where.statut = filters.statut;
  if (filters.categorie) where.categoriesPermis = { [Op.contains]: [filters.categorie] };
  return Conducteur.findAll({ where });
};

const findById = (id) => Conducteur.findByPk(id);

const create = (data) => Conducteur.create(data);

const update = async (id, data) => {
  const [count, rows] = await Conducteur.update(data, { where: { id }, returning: true });
  return count ? rows[0] : null;
};

const remove = (id) => Conducteur.destroy({ where: { id } });

module.exports = { findAll, findById, create, update, remove };