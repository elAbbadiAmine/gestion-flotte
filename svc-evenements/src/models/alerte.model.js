const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Alerte = sequelize.define('Alerte', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  type: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  niveau: {
    type: DataTypes.ENUM('info', 'warning', 'critique'),
    allowNull: false,
    defaultValue: 'info',
  },
  vehiculeId: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  message: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  lu: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
}, {
  tableName: 'alertes',
  underscored: true,
});

module.exports = Alerte;
