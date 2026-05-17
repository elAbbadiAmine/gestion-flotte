const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Conducteur = sequelize.define('Conducteur', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  nom: { type: DataTypes.STRING, allowNull: false },
  prenom: { type: DataTypes.STRING, allowNull: false },
  email: { type: DataTypes.STRING, allowNull: false, unique: true, validate: { isEmail: true } },
  telephone: { type: DataTypes.STRING, allowNull: false },
  numeroPermis: { type: DataTypes.STRING, allowNull: false, unique: true },
  categoriesPermis: { type: DataTypes.ARRAY(DataTypes.STRING), allowNull: false, defaultValue: ['B'] },
  dateExpirationPermis: { type: DataTypes.DATEONLY, allowNull: false },
  statut: {
    type: DataTypes.ENUM('actif', 'inactif', 'suspendu'),
    defaultValue: 'actif',
  },
  vehiculeId: { type: DataTypes.UUID, allowNull: true },
  missionDebutAt: { type: DataTypes.DATE, allowNull: true },
}, { tableName: 'conducteurs', timestamps: true });

module.exports = Conducteur;