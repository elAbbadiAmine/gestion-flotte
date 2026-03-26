const { Sequelize } = require('sequelize');

const sequelize = new Sequelize(process.env.DATABASE_URL || 'postgres://postgres:postgres@postgresql-fleet:5432/vehicules', {
  dialect: 'postgres',
  logging: false,
});

module.exports = sequelize;