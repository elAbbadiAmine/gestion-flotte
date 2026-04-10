const request = require('supertest');
const express = require('express');
const service = require('../../src/services/conducteur.service');

jest.mock('../../src/services/conducteur.service');
jest.mock('kafkajs', () => ({
  Kafka: jest.fn().mockImplementation(() => ({
    producer: jest.fn().mockReturnValue({ connect: jest.fn(), send: jest.fn(), disconnect: jest.fn() }),
    consumer: jest.fn().mockReturnValue({ connect: jest.fn(), subscribe: jest.fn(), run: jest.fn(), disconnect: jest.fn() }),
  })),
}));
jest.mock('../../src/config/database', () => ({
  define: jest.fn(() => ({
    findAll: jest.fn(), findOne: jest.fn(),
    create: jest.fn(), update: jest.fn(), destroy: jest.fn(),
  })),
  authenticate: jest.fn(),
  sync: jest.fn(),
}));
jest.mock('../../src/config/tracing', () => ({}));
jest.mock('../../src/config/logger', () => ({
  info: jest.fn(), error: jest.fn(), warn: jest.fn(),
  child: () => ({ info: jest.fn(), error: jest.fn() }),
}));
jest.mock('../../src/middleware/auth.middleware', () => ({
  authenticate: (req, res, next) => next(),
  authorize: () => (req, res, next) => next(),
}));

const routes = require('../../src/routes/conducteur.routes');
const app = express();
app.use(express.json());
app.use('/', routes);

const mockConducteur = {
  id: 'uuid-456',
  nom: 'Zidane',
  prenom: 'Zinedine',
  email: 'zz@test.com',
  telephone: '0601020304',
  numeroPermis: 'PERM-789',
  categoriesPermis: ['B', 'D'],
  dateExpirationPermis: '2030-01-01',
  statut: 'actif',
};

describe('Routes /api/v1/conducteurs', () => {
  beforeEach(() => jest.clearAllMocks());

  test('GET / → 200 avec liste des conducteurs', async () => {
    service.getAllConducteurs.mockResolvedValue([mockConducteur]);
    const res = await request(app).get('/');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveLength(1);
  });

  test('GET /:id → 200 si le conducteur existe', async () => {
    service.getConducteurById.mockResolvedValue(mockConducteur);
    const res = await request(app).get('/uuid-456');
    expect(res.status).toBe(200);
    expect(res.body.data.nom).toBe('Zidane');
  });

  test('GET /:id → 404 si conducteur introuvable', async () => {
    service.getConducteurById.mockRejectedValue(new Error('Conducteur non trouvé'));
    const res = await request(app).get('/inexistant');
    expect(res.status).toBe(404);
  });

  test('POST / → 201 création réussie', async () => {
    service.createConducteur.mockResolvedValue(mockConducteur);
    const res = await request(app).post('/').send(mockConducteur);
    expect(res.status).toBe(201);
    expect(res.body.data.email).toBe('zz@test.com');
  });

  test('POST / → 400 si erreur de validation (permis expiré)', async () => {
    service.createConducteur.mockRejectedValue(new Error('Permis expiré'));
    const res = await request(app).post('/').send(mockConducteur);
    expect(res.status).toBe(400);
    expect(res.body.error).toBe('Permis expiré');
  });

  test('PUT /:id → 200 mise à jour réussie', async () => {
    service.updateConducteur.mockResolvedValue({ ...mockConducteur, statut: 'en_mission' });
    const res = await request(app).put('/uuid-456').send({ statut: 'en_mission' });
    expect(res.status).toBe(200);
    expect(res.body.data.statut).toBe('en_mission');
  });

  test('DELETE /:id → 204 suppression réussie', async () => {
    service.deleteConducteur.mockResolvedValue();
    const res = await request(app).delete('/uuid-456');
    expect(res.status).toBe(204);
  });
});
