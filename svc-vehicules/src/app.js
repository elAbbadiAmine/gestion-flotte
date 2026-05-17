require('./config/tracing');
const express = require('express');
const pinoHttp = require('pino-http');
const sequelize = require('./config/database');
const { connectProducer } = require('./config/kafka');
const { connectConsumer } = require('./config/kafkaConsumer');
const vehiculeRoutes = require('./routes/vehicule.routes');
const logger = require('./config/logger');
const { register } = require('./config/metrics');

const app = express();
app.use(express.json());
app.use(pinoHttp({ logger }));

app.get('/health', (req, res) => res.json({ status: 'ok', service: 'svc-vehicules' }));
app.get('/metrics', async (req, res) => {
  res.set('Content-Type', register.contentType);
  res.send(await register.metrics());
});
app.use('/api/v1/vehicules', vehiculeRoutes);    

const PORT = process.env.PORT || 3001;

const start = async () => {
  await sequelize.authenticate();
  await sequelize.sync({ alter: true });
  logger.info('PostgreSQL Vehicules connecté');
  await connectProducer();
  app.listen(PORT, () => logger.info({ port: PORT }, 'svc-vehicules démarré'));
  // Kafka consumer en background avec retry : ne bloque pas le démarrage HTTP
  const startConsumerWithRetry = async (attempt = 1) => {
    try {
      await connectConsumer();
    } catch (err) {
      const delay = Math.min(attempt * 5000, 30000);
      logger.error({ err, attempt, delay }, 'Kafka consumer échec — retry dans ' + delay + 'ms');
      setTimeout(() => startConsumerWithRetry(attempt + 1), delay);
    }
  };
  startConsumerWithRetry();
};

if (require.main === module) {
  start().catch((err) => {
    logger.error({ err }, 'Erreur au démarrage de svc-vehicules');
    process.exit(1);
  });
}

module.exports = app;