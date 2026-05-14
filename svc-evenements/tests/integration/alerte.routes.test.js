jest.mock('kafkajs', () => ({
  Kafka: jest.fn().mockImplementation(() => ({
    consumer: jest.fn().mockReturnValue({
      connect: jest.fn(), subscribe: jest.fn(), run: jest.fn(), disconnect: jest.fn(),
    }),
  })),
}));
jest.mock('../../src/config/database', () => ({
  define: jest.fn(() => ({})),
  authenticate: jest.fn(),
  sync: jest.fn(),
}));
jest.mock('../../src/config/logger', () => ({
  info: jest.fn(), error: jest.fn(), warn: jest.fn(),
  child: () => ({ info: jest.fn(), error: jest.fn(), warn: jest.fn() }),
}));
jest.mock('../../src/config/tracing', () => ({}));
jest.mock('pino-http', () => () => (req, res, next) => next());
jest.mock('../../src/middleware/auth.middleware', () => ({
  authenticate: (req, res, next) => next(),
  authorize: () => (req, res, next) => next(),
}));
jest.mock('../../src/services/alerte.service');
jest.mock('../../src/config/kafka', () => ({ connectConsumer: jest.fn() }));
jest.mock('../../src/config/metrics', () => ({
  register: { metrics: jest.fn().mockResolvedValue(''), contentType: 'text/plain' },
  evenementsConsommesTotal: { inc: jest.fn() },
}));

const request = require('supertest');
const app = require('../../src/app');
const service = require('../../src/services/alerte.service');

const fixture = {
  id: 'uuid-1',
  type: 'maintenance_planifiee',
  niveau: 'info',
  vehiculeId: 'v-uuid-1',
  message: 'Maintenance planifiée',
  lu: false,
};

beforeEach(() => jest.clearAllMocks());

describe('GET /api/v1/alertes', () => {
  test('200 — retourne la liste', async () => {
    service.getAlertes.mockResolvedValue([fixture]);
    const res = await request(app).get('/api/v1/alertes');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveLength(1);
  });

  test('200 — filtre par niveau', async () => {
    service.getAlertes.mockResolvedValue([fixture]);
    const res = await request(app).get('/api/v1/alertes?niveau=info');
    expect(res.status).toBe(200);
    expect(service.getAlertes).toHaveBeenCalledWith(expect.objectContaining({ niveau: 'info' }));
  });
});

describe('GET /api/v1/alertes/:id', () => {
  test('200 — retourne l alerte', async () => {
    service.getAlerteById.mockResolvedValue(fixture);
    const res = await request(app).get('/api/v1/alertes/uuid-1');
    expect(res.status).toBe(200);
    expect(res.body.data.id).toBe('uuid-1');
  });

  test('404 — alerte non trouvée', async () => {
    service.getAlerteById.mockRejectedValue(new Error('Alerte non trouvée'));
    const res = await request(app).get('/api/v1/alertes/inexistant');
    expect(res.status).toBe(404);
    expect(res.body.error).toBe('Alerte non trouvée');
  });
});

describe('PUT /api/v1/alertes/:id/lu', () => {
  test('200 — marque comme lue', async () => {
    service.marquerLue.mockResolvedValue({ ...fixture, lu: true });
    const res = await request(app).put('/api/v1/alertes/uuid-1/lu');
    expect(res.status).toBe(200);
    expect(res.body.data.lu).toBe(true);
  });

  test('404 — alerte non trouvée', async () => {
    service.marquerLue.mockRejectedValue(new Error('Alerte non trouvée'));
    const res = await request(app).put('/api/v1/alertes/inexistant/lu');
    expect(res.status).toBe(404);
  });
});
