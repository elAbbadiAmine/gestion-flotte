jest.mock('../../src/config/database', () => ({ query: jest.fn() }));
jest.mock('../../src/config/kafka', () => ({ publishEvent: jest.fn().mockResolvedValue() }));
jest.mock('../../src/config/logger', () => ({ info: jest.fn(), warn: jest.fn(), error: jest.fn() }));
jest.mock('../../src/config/tracing', () => {});
jest.mock('../../src/repositories/position.repository');

const service = require('../../src/services/localisation.service');
const repo = require('../../src/repositories/position.repository');
const kafka = require('../../src/config/kafka');

const mockPosition = {
  vehicule_id: 'uuid-v1',
  latitude: 48.8566,
  longitude: 2.3522,
  time: new Date('2025-01-01T10:00:00Z'),
};

describe('LocalisationService', () => {
  beforeEach(() => jest.clearAllMocks());

  describe('enregistrerPosition', () => {
    test('sauvegarde la position et retourne le résultat', async () => {
      repo.save.mockResolvedValue(mockPosition);
      repo.checkGeofencing.mockResolvedValue([]);

      const result = await service.enregistrerPosition(mockPosition);

      expect(repo.save).toHaveBeenCalledWith(mockPosition);
      expect(result).toEqual(mockPosition);
    });

    test('publie un événement Kafka si violation geofencing', async () => {
      repo.save.mockResolvedValue(mockPosition);
      repo.checkGeofencing.mockResolvedValue([{ nom: 'Zone_Test', distance: 15000 }]);

      await service.enregistrerPosition(mockPosition);

      expect(kafka.publishEvent).toHaveBeenCalledWith('localisation', expect.objectContaining({
        type: 'geofence.violation',
        payload: expect.objectContaining({ vehicule_id: 'uuid-v1' }),
      }));
    });

    test('ne publie pas d événement Kafka si pas de violation', async () => {
      repo.save.mockResolvedValue(mockPosition);
      repo.checkGeofencing.mockResolvedValue([]);

      await service.enregistrerPosition(mockPosition);

      expect(kafka.publishEvent).not.toHaveBeenCalled();
    });
  });

  describe('getHistorique', () => {
    test('retourne l historique d un véhicule', async () => {
      repo.findByVehicule.mockResolvedValue([mockPosition]);

      const result = await service.getHistorique('uuid-v1', null, null);

      expect(repo.findByVehicule).toHaveBeenCalledWith('uuid-v1', null, null);
      expect(result).toEqual([mockPosition]);
    });
  });

  describe('getDernierePosition', () => {
    test('retourne la dernière position', async () => {
      repo.findDernierePosition.mockResolvedValue(mockPosition);

      const result = await service.getDernierePosition('uuid-v1');

      expect(result).toEqual(mockPosition);
    });

    test('retourne null si aucune position', async () => {
      repo.findDernierePosition.mockResolvedValue(null);

      const result = await service.getDernierePosition('uuid-inconnu');

      expect(result).toBeNull();
    });
  });

  describe('getToutesDernieresPositions', () => {
    test('retourne la liste de toutes les dernières positions', async () => {
      repo.findToutesDernieresPositions.mockResolvedValue([mockPosition]);

      const result = await service.getToutesDernieresPositions();

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual(mockPosition);
    });
  });
});
