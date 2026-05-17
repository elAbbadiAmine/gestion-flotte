require('./config/tracing');
const express = require('express');
const pinoHttp = require('pino-http');
const { startGrpcServer } = require('./grpc/server');
const { connectProducer } = require('./config/kafka');
const migrate = require('./config/migrate');
const localisationRoutes = require('./routes/localisation.routes');
const logger = require('./config/logger');
const { register } = require('./config/metrics');

const app = express();
app.use(express.json());
app.use(pinoHttp({ logger }));

app.get('/health', (req, res) => res.json({ status: 'ok', service: 'svc-localisation' }));
app.get('/metrics', async (req, res) => {
  res.set('Content-Type', register.contentType);
  res.send(await register.metrics());
});
app.use('/api/v1/positions', localisationRoutes);

const PORT = process.env.PORT || 3004;

const start = async () => {
  await migrate();
  await connectProducer();
  startGrpcServer();
  app.listen(PORT, () => logger.info(`svc-localisation démarré sur port ${PORT}`));
};

if (require.main === module) {
  start().catch((err) => logger.error('Erreur démarrage:', err.message));
}

module.exports = app;