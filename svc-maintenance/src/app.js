const express = require('express');
const { json } = require('express');
const pino = require('pino-http');
const logger = require('./config/logger');
const sequelize = require('./config/database');
const { connectProducer } = require('./config/kafka');
const { connectConsumer } = require('./config/kafkaConsumer');
require('./config/tracing');
const router = require('./routes/maintenance.routes');
const app = express();

app.use(json());
app.use(pino({ logger }));
app.use('/api/v1/maintenances', router);

app.use((err, req, res, next) => {
  logger.error({ err }, 'Erreur non gérée');
  res.status(500).json({ success: false, error: 'Erreur interne' });
});

const start = async () => {
  await sequelize.authenticate();
  await sequelize.sync({ alter: true });
  await connectProducer();
  await connectConsumer();
  const port = process.env.PORT || 3003;
  app.listen(port, () => logger.info({ port }, 'svc-maintenance démarré'));
};

start().catch((err) => { logger.error({ err }, 'Démarrage échoué'); process.exit(1); });

module.exports = app;