const request = require('supertest');
const app = require('../../src/app');
const service = require('../../src/services/maintenance.service');

jest.mock('../../src/services/maintenance.service');
jest.mock('../../src/config/kafka');
jest.mock('../../src/config/logger', () => ({ info: jest.fn(), error: jest.fn(), warn: jest.fn() }));
jest.mock('../../src/config/database', () => ({ authenticate: jest.fn(), sync: jest.fn(), define: jest.fn(() => ({})) }));
jest.mock('../../src/config/kafkaConsumer', () => ({ connectConsumer: jest.fn() }));
jest.mock('../../src/config/tracing', () => ({ startTracing: jest.fn() }));

const demain = new Date(Date.now() + 86400000).toISOString().split('T')[0];

const fixture = {
  id: 'uuid-1',
  vehiculeId: 'v-uuid-1',
  type: 'revision',
  statut: 'planifiee',
  datePlanifiee: demain,
};

beforeEach(() => jest.clearAllMocks());

describe('GET /api/v1/maintenances', () => {
  test('200 — retourne la liste', async () => {
    service.getAllMaintenances.mockResolvedValue([fixture]);
    const res = await request(app).get('/api/v1/maintenances');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveLength(1);
  });

  test('200 — filtre par statut', async () => {
    service.getAllMaintenances.mockResolvedValue([fixture]);
    const res = await request(app).get('/api/v1/maintenances?statut=planifiee');
    expect(res.status).toBe(200);
    expect(service.getAllMaintenances).toHaveBeenCalledWith(expect.objectContaining({ statut: 'planifiee' }));
  });
});

describe('GET /api/v1/maintenances/alertes', () => {
  test('200 — retourne les alertes', async () => {
    service.getAlertes.mockResolvedValue([fixture]);
    const res = await request(app).get('/api/v1/maintenances/alertes?kilometrage=49800');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  test('400 — kilometrage manquant', async () => {
    const res = await request(app).get('/api/v1/maintenances/alertes');
    expect(res.status).toBe(400);
    expect(res.body.error).toBe('kilometrage requis');
  });
});

describe('GET /api/v1/maintenances/vehicule/:vehiculeId', () => {
  test('200 — retourne l historique', async () => {
    service.getHistoriqueVehicule.mockResolvedValue([fixture]);
    const res = await request(app).get('/api/v1/maintenances/vehicule/v-uuid-1');
    expect(res.status).toBe(200);
    expect(service.getHistoriqueVehicule).toHaveBeenCalledWith('v-uuid-1');
  });
});

describe('GET /api/v1/maintenances/:id', () => {
  test('200 — retourne la maintenance', async () => {
    service.getMaintenanceById.mockResolvedValue(fixture);
    const res = await request(app).get('/api/v1/maintenances/uuid-1');
    expect(res.status).toBe(200);
    expect(res.body.data.id).toBe('uuid-1');
  });

  test('404 — maintenance non trouvée', async () => {
    service.getMaintenanceById.mockRejectedValue(new Error('Maintenance non trouvée'));
    const res = await request(app).get('/api/v1/maintenances/uuid-x');
    expect(res.status).toBe(404);
    expect(res.body.error).toBe('Maintenance non trouvée');
  });
});

describe('POST /api/v1/maintenances', () => {
  test('201 — crée une maintenance', async () => {
    service.createMaintenance.mockResolvedValue(fixture);
    const res = await request(app).post('/api/v1/maintenances').send({
      vehiculeId: 'v-uuid-1',
      type: 'revision',
      datePlanifiee: demain,
    });
    expect(res.status).toBe(201);
    expect(res.body.data.id).toBe('uuid-1');
  });

  test('400 — dates invalides', async () => {
    service.createMaintenance.mockRejectedValue(new Error('La date réelle ne peut pas précéder la date planifiée'));
    const res = await request(app).post('/api/v1/maintenances').send({ ...fixture });
    expect(res.status).toBe(400);
  });
});

describe('PUT /api/v1/maintenances/:id', () => {
  test('200 — met à jour la maintenance', async () => {
    service.updateMaintenance.mockResolvedValue({ ...fixture, technicien: 'Dupont' });
    const res = await request(app).put('/api/v1/maintenances/uuid-1').send({ technicien: 'Dupont' });
    expect(res.status).toBe(200);
    expect(res.body.data.technicien).toBe('Dupont');
  });

  test('404 — maintenance non trouvée', async () => {
    service.updateMaintenance.mockRejectedValue(new Error('Maintenance non trouvée'));
    const res = await request(app).put('/api/v1/maintenances/uuid-x').send({});
    expect(res.status).toBe(404);
  });
});

describe('POST /api/v1/maintenances/:id/demarrer', () => {
  test('200 — démarre la maintenance', async () => {
    service.demarrerMaintenance.mockResolvedValue({ ...fixture, statut: 'en_cours' });
    const res = await request(app).post('/api/v1/maintenances/uuid-1/demarrer');
    expect(res.status).toBe(200);
    expect(res.body.data.statut).toBe('en_cours');
  });

  test('400 — statut invalide', async () => {
    service.demarrerMaintenance.mockRejectedValue(new Error('Statut invalide : en_cours'));
    const res = await request(app).post('/api/v1/maintenances/uuid-1/demarrer');
    expect(res.status).toBe(400);
  });

  test('404 — maintenance non trouvée', async () => {
    service.demarrerMaintenance.mockRejectedValue(new Error('Maintenance non trouvée'));
    const res = await request(app).post('/api/v1/maintenances/uuid-x/demarrer');
    expect(res.status).toBe(404);
  });
});

describe('POST /api/v1/maintenances/:id/terminer', () => {
  test('200 — termine la maintenance', async () => {
    service.terminerMaintenance.mockResolvedValue({ ...fixture, statut: 'terminee', cout: 350 });
    const res = await request(app).post('/api/v1/maintenances/uuid-1/terminer').send({ cout: 350 });
    expect(res.status).toBe(200);
    expect(res.body.data.statut).toBe('terminee');
  });

  test('400 — statut invalide', async () => {
    service.terminerMaintenance.mockRejectedValue(new Error('Statut invalide : planifiee'));
    const res = await request(app).post('/api/v1/maintenances/uuid-1/terminer').send({});
    expect(res.status).toBe(400);
  });

  test('404 — maintenance non trouvée', async () => {
    service.terminerMaintenance.mockRejectedValue(new Error('Maintenance non trouvée'));
    const res = await request(app).post('/api/v1/maintenances/uuid-x/terminer').send({});
    expect(res.status).toBe(404);
  });
});

describe('POST /api/v1/maintenances/:id/annuler', () => {
  test('200 — annule la maintenance', async () => {
    service.annulerMaintenance.mockResolvedValue({ ...fixture, statut: 'annulee' });
    const res = await request(app).post('/api/v1/maintenances/uuid-1/annuler').send({ motif: 'test' });
    expect(res.status).toBe(200);
    expect(res.body.data.statut).toBe('annulee');
  });

  test('400 — maintenance déjà terminée', async () => {
    service.annulerMaintenance.mockRejectedValue(new Error('annuler une maintenance terminée'));
    const res = await request(app).post('/api/v1/maintenances/uuid-1/annuler').send({});
    expect(res.status).toBe(400);
  });

  test('404 — maintenance non trouvée', async () => {
    service.annulerMaintenance.mockRejectedValue(new Error('Maintenance non trouvée'));
    const res = await request(app).post('/api/v1/maintenances/uuid-x/annuler').send({});
    expect(res.status).toBe(404);
  });
});