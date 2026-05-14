const express = require('express');
const { json } = require('express');
const pino = require('pino-http');
const logger = require('./config/logger');
const { register } = require('./config/metrics');
const sequelize = require('./config/database');
const { connectProducer } = require('./config/kafka');
const { connectConsumer } = require('./config/kafkaConsumer');
require('./config/tracing');
const router = require('./routes/conducteur.routes');

const app = express();

app.use(json());
app.use(pino({ logger }));
app.use('/api/v1/conducteurs', router);
app.get('/health', (req, res) => res.json({ status: 'ok', service: 'svc-conducteurs' }));
app.get('/metrics', async (req, res) => {
  res.set('Content-Type', register.contentType);
  res.send(await register.metrics());
});

app.use((err, req, res, next) => {
  logger.error({ err }, 'Erreur non gérée');
  res.status(500).json({ success: false, error: 'Erreur interne' });
});

const start = async () => {
  await sequelize.authenticate();
  await sequelize.sync({ alter: true });
  await connectProducer();
  await connectConsumer();
  const port = process.env.PORT || 3002;
  app.listen(port, () => logger.info({ port }, 'svc-conducteurs démarré'));
};

start().catch((err) => { logger.error({ err }, 'Démarrage échoué'); process.exit(1); });

module.exports = app;