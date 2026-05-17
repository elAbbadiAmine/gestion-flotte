const { Op } = require('sequelize');
const Alerte = require('../models/alerte.model');

const findAll = (filters = {}) => {
  const where = {};
  if (filters.niveau) where.niveau = filters.niveau;
  if (filters.lu !== undefined) where.lu = filters.lu === 'true' || filters.lu === true;
  if (filters.vehiculeId) where.vehiculeId = filters.vehiculeId;
  return Alerte.findAll({ where, order: [['created_at', 'DESC']] });
};

const findById = (id) => Alerte.findOne({ where: { id } });

const findUnreadByTypeAndVehicule = (type, vehiculeId) =>
  Alerte.findOne({ where: { type, vehiculeId, lu: false } });

const create = (data) => Alerte.create(data);

const update = (id, data) => Alerte.update(data, { where: { id }, returning: true }).then(([, rows]) => rows[0]);

module.exports = { findAll, findById, findUnreadByTypeAndVehicule, create, update };
