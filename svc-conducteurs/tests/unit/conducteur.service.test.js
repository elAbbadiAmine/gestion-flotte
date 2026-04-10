jest.mock('kafkajs', () => ({
  Kafka: jest.fn().mockImplementation(() => ({
    producer: jest.fn().mockReturnValue({
      connect: jest.fn(),
      send: jest.fn(),
      disconnect: jest.fn(),
    }),
    consumer: jest.fn().mockReturnValue({
      connect: jest.fn(),
      subscribe: jest.fn(),
      run: jest.fn(),
      disconnect: jest.fn(),
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

const service = require('../../src/services/conducteur.service');
const repo = require('../../src/repositories/conducteur.repository');
const kafka = require('../../src/config/kafka');

jest.mock('../../src/repositories/conducteur.repository');

const demain = new Date(Date.now() + 86400000).toISOString().split('T')[0];
const hier = new Date(Date.now() - 86400000).toISOString().split('T')[0];

const conducteurFixture = {
  id: 'uuid-1',
  nom: 'Dupont',
  prenom: 'Jean',
  email: 'jean.dupont@test.com',
  telephone: '0600000000',
  numeroPermis: 'P123456',
  categoriesPermis: ['B'],
  dateExpirationPermis: demain,
  statut: 'actif',
};

beforeEach(() => jest.clearAllMocks());

describe('getAllConducteurs', () => {
  test('retourne la liste', async () => {
    repo.findAll.mockResolvedValue([conducteurFixture]);
    const result = await service.getAllConducteurs({});
    expect(result).toHaveLength(1);
  });
});

describe('getConducteurById', () => {
  test('retourne le conducteur', async () => {
    repo.findById.mockResolvedValue(conducteurFixture);
    const result = await service.getConducteurById('uuid-1');
    expect(result.email).toBe('jean.dupont@test.com');
  });

  test('lève une erreur si non trouvé', async () => {
    repo.findById.mockResolvedValue(null);
    await expect(service.getConducteurById('uuid-x')).rejects.toThrow('Conducteur non trouvé');
  });
});

describe('createConducteur', () => {
  test('crée et publie un event', async () => {
    repo.create.mockResolvedValue(conducteurFixture);
    jest.spyOn(kafka, 'publishEvent').mockResolvedValue();
    const result = await service.createConducteur({ ...conducteurFixture });
    expect(kafka.publishEvent).toHaveBeenCalledWith('conducteurs', expect.objectContaining({ type: 'conducteur.created' }));
    expect(result.id).toBe('uuid-1');
  });

  test('rejette un permis expiré', async () => {
    await expect(service.createConducteur({ ...conducteurFixture, dateExpirationPermis: hier }))
      .rejects.toThrow('Permis expiré');
  });

  test('rejette une catégorie invalide', async () => {
    await expect(service.createConducteur({ ...conducteurFixture, categoriesPermis: ['Z'] }))
      .rejects.toThrow('Catégories invalides');
  });
});

describe('updateConducteur', () => {
  test('met à jour et publie', async () => {
    repo.update.mockResolvedValue({ ...conducteurFixture, nom: 'Martin' });
    jest.spyOn(kafka, 'publishEvent').mockResolvedValue();
    const result = await service.updateConducteur('uuid-1', { nom: 'Martin' });
    expect(result.nom).toBe('Martin');
    expect(kafka.publishEvent).toHaveBeenCalledWith('conducteurs', expect.objectContaining({ type: 'conducteur.updated' }));
  });

  test('lève une erreur si non trouvé', async () => {
    repo.update.mockResolvedValue(null);
    await expect(service.updateConducteur('uuid-x', {})).rejects.toThrow('Conducteur non trouvé');
  });
});

describe('deleteConducteur', () => {
  test('supprime et publie', async () => {
    repo.remove.mockResolvedValue(1);
    jest.spyOn(kafka, 'publishEvent').mockResolvedValue();
    await service.deleteConducteur('uuid-1');
    expect(kafka.publishEvent).toHaveBeenCalledWith('conducteurs', expect.objectContaining({ type: 'conducteur.deleted' }));
  });

  test('lève une erreur si non trouvé', async () => {
    repo.remove.mockResolvedValue(0);
    await expect(service.deleteConducteur('uuid-x')).rejects.toThrow('Conducteur non trouvé');
  });
});
