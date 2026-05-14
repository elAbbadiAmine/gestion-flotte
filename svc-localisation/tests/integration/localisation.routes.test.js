jest.mock('../../src/config/tracing', () => {});
jest.mock('../../src/config/database', () => ({ query: jest.fn() }));
jest.mock('../../src/config/kafka', () => ({
  connectProducer: jest.fn().mockResolvedValue(),
  publishEvent: jest.fn().mockResolvedValue(),
}));
jest.mock('../../src/config/logger', () => {
  const logger = {
    info: jest.fn(), warn: jest.fn(), error: jest.fn(),
    child: jest.fn(),
  };
  logger.child.mockReturnValue(logger);
  logger.bindings = jest.fn().mockReturnValue({});
  logger.level = 'info';
  logger.levels = { values: { info: 30 } };
  return logger;
});
jest.mock('../../src/config/migrate', () => jest.fn().mockResolvedValue());
jest.mock('../../src/grpc/server', () => ({ startGrpcServer: jest.fn() }));
jest.mock('../../src/config/metrics', () => ({
  register: { contentType: 'text/plain', metrics: jest.fn().mockResolvedValue('') },
}));
jest.mock('../../src/services/localisation.service');

const request = require('supertest');
const app = require('../../src/app');
const service = require('../../src/services/localisation.service');

const mockPosition = {
  vehicule_id: 'uuid-v1',
  latitude: 48.8566,
  longitude: 2.3522,
  time: '2025-01-01T10:00:00.000Z',
};

describe('GET /api/v1/positions/dernieres', () => {
  test('retourne 200 avec la liste des positions', async () => {
    service.getToutesDernieresPositions.mockResolvedValue([mockPosition]);

    const res = await request(app).get('/api/v1/positions/dernieres');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveLength(1);
    expect(res.body.data[0].vehicule_id).toBe('uuid-v1');
  });

  test('retourne 500 en cas d erreur service', async () => {
    service.getToutesDernieresPositions.mockRejectedValue(new Error('DB error'));

    const res = await request(app).get('/api/v1/positions/dernieres');

    expect(res.status).toBe(500);
    expect(res.body.success).toBe(false);
  });
});

describe('GET /api/v1/positions/:vehicule_id/historique', () => {
  test('retourne 200 avec l historique', async () => {
    service.getHistorique.mockResolvedValue([mockPosition]);

    const res = await request(app).get('/api/v1/positions/uuid-v1/historique');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(service.getHistorique).toHaveBeenCalledWith('uuid-v1', undefined, undefined);
  });

  test('transmet les paramètres debut et fin', async () => {
    service.getHistorique.mockResolvedValue([]);

    await request(app)
      .get('/api/v1/positions/uuid-v1/historique?debut=2025-01-01&fin=2025-01-02');

    expect(service.getHistorique).toHaveBeenCalledWith('uuid-v1', '2025-01-01', '2025-01-02');
  });
});

describe('GET /api/v1/positions/:vehicule_id/derniere', () => {
  test('retourne 200 si position trouvée', async () => {
    service.getDernierePosition.mockResolvedValue(mockPosition);

    const res = await request(app).get('/api/v1/positions/uuid-v1/derniere');

    expect(res.status).toBe(200);
    expect(res.body.data.vehicule_id).toBe('uuid-v1');
  });

  test('retourne 404 si aucune position', async () => {
    service.getDernierePosition.mockResolvedValue(null);

    const res = await request(app).get('/api/v1/positions/uuid-inconnu/derniere');

    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
  });
});

describe('GET /health', () => {
  test('retourne 200', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
  });
});
