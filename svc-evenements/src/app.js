require('./config/tracing');
const express = require('express');
const pinoHttp = require('pino-http');
const logger = require('./config/logger');
const { register } = require('./config/metrics');

const app = express();
app.use(express.json());
app.use(pinoHttp({ logger }));

app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'svc-evenements' });
});
app.get('/metrics', async (req, res) => {
  res.set('Content-Type', register.contentType);
  res.send(await register.metrics());
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => logger.info({ port: PORT }, 'svc-evenements démarré'));
