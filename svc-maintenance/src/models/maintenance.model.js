const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Intervention = sequelize.define('Intervention', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  vehiculeId: { type: DataTypes.UUID, allowNull: false },
  type: {
    type: DataTypes.ENUM('revision', 'reparation', 'controle_technique', 'pneus', 'autre'),
    allowNull: false,
  },
  statut: {
    type: DataTypes.ENUM('planifiee', 'en_cours', 'terminee', 'annulee'),
    defaultValue: 'planifiee',
  },
  datePlanifiee: { type: DataTypes.DATEONLY, allowNull: false },
  dateReelle: { type: DataTypes.DATEONLY, allowNull: true },
  kilometrageIntervention: { type: DataTypes.INTEGER, allowNull: true },
  kilometrageProchaine: { type: DataTypes.INTEGER, allowNull: true },
  description: { type: DataTypes.TEXT, allowNull: true },
  cout: { type: DataTypes.DECIMAL(10, 2), allowNull: true },
  technicien: { type: DataTypes.STRING, allowNull: true },
}, { tableName: 'interventions', timestamps: true });

module.exports = Intervention;