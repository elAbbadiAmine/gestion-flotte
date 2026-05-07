const express = require('express');
const { startGrpcServer } = require('./grpc/server');
const { connectProducer } = require('./config/kafka');
const migrate = require('./config/migrate');
const localisationRoutes = require('./routes/localisation.routes');
const logger = require('./config/logger');

const app = express();
app.use(express.json());

app.get('/health', (req, res) => res.json({ status: 'ok', service: 'svc-localisation' }));
app.use('/api/v1/positions', localisationRoutes);

const PORT = process.env.PORT || 3004;

const start = async () => {
  await migrate();
  await connectProducer();
  startGrpcServer();
  app.listen(PORT, () => logger.info(`svc-localisation démarré sur port ${PORT}`));
};

start().catch((err) => logger.error('Erreur démarrage:', err.message));

module.exports = app;