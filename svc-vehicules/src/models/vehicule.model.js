const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Vehicule = sequelize.define('Vehicule', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  immatriculation: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
  },
  marque: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  modele: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  annee: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  statut: {
    type: DataTypes.ENUM('disponible', 'en_mission', 'en_maintenance', 'hors_service'),
    defaultValue: 'disponible',
  },
  kilometrage: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
}, {
  tableName: 'vehicules',
  timestamps: true,
});

module.exports = Vehicule;