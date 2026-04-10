const { Sequelize } = require('sequelize');

const dbUrl = process.env.DATABASE_URL || process.env.DB_URL;

if (!dbUrl) {
  console.error("Erreur : Aucune URL de base de données n'est configurée !");
}

const sequelize = new Sequelize(dbUrl, {
  dialect: 'postgres',
  logging: false,
});

module.exports = sequelize;