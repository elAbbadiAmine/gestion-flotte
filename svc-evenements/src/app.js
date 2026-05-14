require('./config/tracing');
const express = require('express');
const pinoHttp = require('pino-http');
const logger = require('./config/logger');
const { register } = require('./config/metrics');
const sequelize = require('./config/database');
const { connectConsumer } = require('./config/kafka');
const router = require('./routes/alerte.routes');

const app = express();
app.use(express.json());
app.use(pinoHttp({ logger }));
app.use('/api/v1/alertes', router);

app.get('/health', (req, res) => res.json({ status: 'ok', service: 'svc-evenements' }));
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
  await connectConsumer();
  const port = process.env.PORT || 3005;
  app.listen(port, () => logger.info({ port }, 'svc-evenements démarré'));
};

if (require.main === module) {
  start().catch((err) => { logger.error({ err }, 'Démarrage échoué'); process.exit(1); });
}

module.exports = app;
