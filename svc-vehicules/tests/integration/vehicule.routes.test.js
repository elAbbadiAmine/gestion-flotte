jest.mock('kafkajs', () => ({
  Kafka: jest.fn().mockImplementation(() => ({
    producer: jest.fn().mockReturnValue({
      connect: jest.fn(), send: jest.fn(), disconnect: jest.fn(),
    }),
    consumer: jest.fn().mockReturnValue({
      connect: jest.fn(), subscribe: jest.fn(), run: jest.fn(), disconnect: jest.fn(),
    }),
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
jest.mock('../../src/config/logger', () => ({ info: jest.fn(), error: jest.fn(), warn: jest.fn() }));
jest.mock('../../src/config/tracing', () => ({}));
jest.mock('../../src/middleware/auth.middleware', () => ({
  authenticate: (req, res, next) => next(),
  authorize: () => (req, res, next) => next(),
}));
jest.mock('../../src/services/vehicule.service');

const request = require('supertest');
const express = require('express');
const routes = require('../../src/routes/vehicule.routes');
const service = require('../../src/services/vehicule.service');

const app = express();
app.use(express.json());
app.use('/api/v1/vehicules', routes);

const mockVehicule = {
  id: 'uuid-123',
  immatriculation: 'AB-123-CD',
  marque: 'Renault',
  modele: 'Clio',
  annee: 2022,
  statut: 'disponible',
  kilometrage: 1000,
};

describe('Routes /api/v1/vehicules', () => {
  beforeEach(() => jest.clearAllMocks());

  test('GET /vehicules → 200 avec liste', async () => {
    service.getAllVehicules.mockResolvedValue([mockVehicule]);
    const res = await request(app).get('/api/v1/vehicules');
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(1);
  });

  test('GET /vehicules/:id → 200 si trouvé', async () => {
    service.getVehiculeById.mockResolvedValue(mockVehicule);
    const res = await request(app).get('/api/v1/vehicules/uuid-123');
    expect(res.status).toBe(200);
    expect(res.body.data.immatriculation).toBe('AB-123-CD');
  });

  test('GET /vehicules/:id → 404 si non trouvé', async () => {
    service.getVehiculeById.mockRejectedValue(new Error('Véhicule non trouvé'));
    const res = await request(app).get('/api/v1/vehicules/inexistant');
    expect(res.status).toBe(404);
  });

  test('POST /vehicules → 201 avec le nouveau véhicule', async () => {
    service.createVehicule.mockResolvedValue(mockVehicule);
    const res = await request(app).post('/api/v1/vehicules').send(mockVehicule);
    expect(res.status).toBe(201);
    expect(res.body.data.immatriculation).toBe('AB-123-CD');
  });

  test('PUT /vehicules/:id → 200 mis à jour', async () => {
    service.updateVehicule.mockResolvedValue({ ...mockVehicule, kilometrage: 5000 });
    const res = await request(app).put('/api/v1/vehicules/uuid-123').send({ kilometrage: 5000 });
    expect(res.status).toBe(200);
    expect(res.body.data.kilometrage).toBe(5000);
  });

  test('DELETE /vehicules/:id → 204', async () => {
    service.deleteVehicule.mockResolvedValue();
    const res = await request(app).delete('/api/v1/vehicules/uuid-123');
    expect(res.status).toBe(204);
  });

  test('DELETE /vehicules/:id → 404 si non trouvé', async () => {
    service.deleteVehicule.mockRejectedValue(new Error('Véhicule non trouvé'));
    const res = await request(app).delete('/api/v1/vehicules/inexistant');
    expect(res.status).toBe(404);
  });
});
