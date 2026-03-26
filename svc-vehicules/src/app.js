require('./config/tracing');
const express = require('express');
const sequelize = require('./config/database');
const { connectProducer } = require('./config/kafka');
const { connectConsumer } = require('./config/kafkaConsumer');
const vehiculeRoutes = require('./middleware/routes');
const logger = require('./config/logger');

const app = express();
app.use(express.json());

app.get('/health', (req, res) => res.json({ status: 'ok', service: 'svc-vehicules' }));
app.use('/api/v1', vehiculeRoutes);

const PORT = process.env.PORT || 3001;

const start = async () => {
  await sequelize.authenticate();
  await sequelize.sync({ alter: true });
  logger.info('PostgreSQL connecté et synchronisé');
  await connectProducer();
  await connectConsumer();
  app.listen(PORT, () => logger.info({ port: PORT }, 'svc-vehicules démarré'));
};

start().catch((err) => logger.error({ err }, 'Erreur au démarrage'));

module.exports = app;