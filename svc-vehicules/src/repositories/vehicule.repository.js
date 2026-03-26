const Vehicule = require('../models/vehicule.model');

const findAll = (filters = {}) => Vehicule.findAll({ where: filters });
const findById = (id) => Vehicule.findByPk(id);
const create = (data) => Vehicule.create(data);
const update = async (id, data) => {
  await Vehicule.update(data, { where: { id } });
  return findById(id);
};
const remove = (id) => Vehicule.destroy({ where: { id } });

module.exports = { findAll, findById, create, update, remove };