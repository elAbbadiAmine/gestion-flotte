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

const service = require('../../src/services/vehicule.service');
const repo = require('../../src/repositories/vehicule.repository');
const kafka = require('../../src/config/kafka');

jest.mock('../../src/repositories/vehicule.repository');

const mockVehicule = {
  id: 'uuid-123',
  immatriculation: 'AB-123-CD',
  marque: 'Renault',
  modele: 'Clio',
  annee: 2022,
  statut: 'disponible',
  kilometrage: 1000,
};

describe('VehiculeService', () => {
  beforeEach(() => jest.clearAllMocks());

  test('getAllVehicules retourne une liste', async () => {
    repo.findAll.mockResolvedValue([mockVehicule]);
    const result = await service.getAllVehicules({});
    expect(result).toHaveLength(1);
    expect(repo.findAll).toHaveBeenCalledTimes(1);
  });

  test('getVehiculeById retourne un véhicule existant', async () => {
    repo.findById.mockResolvedValue(mockVehicule);
    const result = await service.getVehiculeById('uuid-123');
    expect(result.immatriculation).toBe('AB-123-CD');
  });

  test('getVehiculeById throw si non trouvé', async () => {
    repo.findById.mockResolvedValue(null);
    await expect(service.getVehiculeById('inexistant')).rejects.toThrow('Véhicule non trouvé');
  });

  test('createVehicule crée et publie un event Kafka', async () => {
    repo.create.mockResolvedValue(mockVehicule);
    jest.spyOn(kafka, 'publishEvent').mockResolvedValue();
    const result = await service.createVehicule(mockVehicule);
    expect(result.immatriculation).toBe('AB-123-CD');
    expect(kafka.publishEvent).toHaveBeenCalledWith('vehicules', {
      type: 'vehicule.created',
      payload: mockVehicule,
    });
  });

  test('updateVehicule met à jour et publie un event Kafka', async () => {
    repo.update.mockResolvedValue({ ...mockVehicule, kilometrage: 2000 });
    jest.spyOn(kafka, 'publishEvent').mockResolvedValue();
    const result = await service.updateVehicule('uuid-123', { kilometrage: 2000 });
    expect(result.kilometrage).toBe(2000);
    expect(kafka.publishEvent).toHaveBeenCalledWith('vehicules', expect.objectContaining({
      type: 'vehicule.updated',
    }));
  });

  test('deleteVehicule supprime et publie un event Kafka', async () => {
    repo.remove.mockResolvedValue(1);
    jest.spyOn(kafka, 'publishEvent').mockResolvedValue();
    await service.deleteVehicule('uuid-123');
    expect(kafka.publishEvent).toHaveBeenCalledWith('vehicules', {
      type: 'vehicule.deleted',
      payload: { id: 'uuid-123' },
    });
  });

  test('deleteVehicule throw si non trouvé', async () => {
    repo.remove.mockResolvedValue(0);
    await expect(service.deleteVehicule('inexistant')).rejects.toThrow('Véhicule non trouvé');
  });
});
