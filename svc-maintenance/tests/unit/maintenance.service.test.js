const service = require('../../src/services/maintenance.service');
const repo = require('../../src/repositories/maintenance.repository');
const kafka = require('../../src/config/kafka');

jest.mock('../../src/repositories/maintenance.repository');
jest.mock('../../src/config/kafka');
jest.mock('../../src/config/logger', () => ({ info: jest.fn(), error: jest.fn(), warn: jest.fn() }));

const demain = new Date(Date.now() + 86400000).toISOString().split('T')[0];

const fixture = {
  id: 'uuid-1',
  vehiculeId: 'v-uuid-1',
  type: 'revision',
  statut: 'planifiee',
  datePlanifiee: demain,
};

beforeEach(() => jest.clearAllMocks());

describe('getAllMaintenances', () => {
  test('retourne la liste', async () => {
    repo.findAll.mockResolvedValue([fixture]);
    const result = await service.getAllMaintenances({});
    expect(result).toHaveLength(1);
  });
});

describe('getMaintenanceById', () => {
  test('retourne la maintenance', async () => {
    repo.findById.mockResolvedValue(fixture);
    const result = await service.getMaintenanceById('uuid-1');
    expect(result.id).toBe('uuid-1');
  });

  test('lève une erreur si non trouvée', async () => {
    repo.findById.mockResolvedValue(null);
    await expect(service.getMaintenanceById('uuid-x')).rejects.toThrow('Maintenance non trouvée');
  });
});

describe('createMaintenance', () => {
  test('crée et publie maintenance.planifiee', async () => {
    repo.create.mockResolvedValue(fixture);
    kafka.publishEvent.mockResolvedValue();
    const result = await service.createMaintenance({ ...fixture });
    expect(kafka.publishEvent).toHaveBeenCalledWith('maintenance', expect.objectContaining({ type: 'maintenance.planifiee' }));
    expect(result.id).toBe('uuid-1');
  });
});

describe('demarrerMaintenance', () => {
  test('passe en_cours et publie maintenance.started', async () => {
    repo.findById.mockResolvedValue({ ...fixture, statut: 'planifiee' });
    repo.update.mockResolvedValue({ ...fixture, statut: 'en_cours' });
    kafka.publishEvent.mockResolvedValue();
    const result = await service.demarrerMaintenance('uuid-1');
    expect(result.statut).toBe('en_cours');
    expect(kafka.publishEvent).toHaveBeenCalledWith('maintenance', expect.objectContaining({ type: 'maintenance.started' }));
  });

  test('lève une erreur si non trouvée', async () => {
    repo.findById.mockResolvedValue(null);
    await expect(service.demarrerMaintenance('uuid-x')).rejects.toThrow('Maintenance non trouvée');
  });

  test('rejette si déjà en_cours', async () => {
    repo.findById.mockResolvedValue({ ...fixture, statut: 'en_cours' });
    await expect(service.demarrerMaintenance('uuid-1')).rejects.toThrow('Statut invalide');
  });

  test('rejette si terminée', async () => {
    repo.findById.mockResolvedValue({ ...fixture, statut: 'terminee' });
    await expect(service.demarrerMaintenance('uuid-1')).rejects.toThrow('Statut invalide');
  });
});

describe('terminerMaintenance', () => {
  test('passe terminee et publie maintenance.completed', async () => {
    repo.findById.mockResolvedValue({ ...fixture, statut: 'en_cours' });
    repo.update.mockResolvedValue({ ...fixture, statut: 'terminee', cout: 350 });
    kafka.publishEvent.mockResolvedValue();
    const result = await service.terminerMaintenance('uuid-1', { cout: 350 });
    expect(result.statut).toBe('terminee');
    expect(kafka.publishEvent).toHaveBeenCalledWith('maintenance', expect.objectContaining({ type: 'maintenance.completed' }));
  });

  test('lève une erreur si non trouvée', async () => {
    repo.findById.mockResolvedValue(null);
    await expect(service.terminerMaintenance('uuid-x', {})).rejects.toThrow('Maintenance non trouvée');
  });

  test('rejette si non en_cours', async () => {
    repo.findById.mockResolvedValue({ ...fixture, statut: 'planifiee' });
    await expect(service.terminerMaintenance('uuid-1', {})).rejects.toThrow('Statut invalide');
  });
});

describe('annulerMaintenance', () => {
  test('annule une maintenance planifiée et publie maintenance.annulee', async () => {
    repo.findById.mockResolvedValue({ ...fixture, statut: 'planifiee' });
    repo.update.mockResolvedValue({ ...fixture, statut: 'annulee' });
    kafka.publishEvent.mockResolvedValue();
    const result = await service.annulerMaintenance('uuid-1', 'motif test');
    expect(result.statut).toBe('annulee');
    expect(kafka.publishEvent).toHaveBeenCalledWith('maintenance', expect.objectContaining({ type: 'maintenance.annulee' }));
  });

  test('annule une maintenance en_cours', async () => {
    repo.findById.mockResolvedValue({ ...fixture, statut: 'en_cours' });
    repo.update.mockResolvedValue({ ...fixture, statut: 'annulee' });
    kafka.publishEvent.mockResolvedValue();
    await service.annulerMaintenance('uuid-1');
    expect(kafka.publishEvent).toHaveBeenCalled();
  });

  test('lève une erreur si non trouvée', async () => {
    repo.findById.mockResolvedValue(null);
    await expect(service.annulerMaintenance('uuid-x')).rejects.toThrow('Maintenance non trouvée');
  });

  test('rejette si déjà terminée', async () => {
    repo.findById.mockResolvedValue({ ...fixture, statut: 'terminee' });
    await expect(service.annulerMaintenance('uuid-1')).rejects.toThrow('annuler une maintenance terminée');
  });
});

describe('updateMaintenance', () => {
  test('met à jour et retourne la maintenance', async () => {
    repo.update.mockResolvedValue({ ...fixture, technicien: 'Dupont' });
    const result = await service.updateMaintenance('uuid-1', { technicien: 'Dupont' });
    expect(result.technicien).toBe('Dupont');
  });

  test('lève une erreur si non trouvée', async () => {
    repo.update.mockResolvedValue(null);
    await expect(service.updateMaintenance('uuid-x', {})).rejects.toThrow('Maintenance non trouvée');
  });
});

describe('getHistoriqueVehicule', () => {
  test('retourne l historique du véhicule', async () => {
    repo.findByVehicule.mockResolvedValue([fixture]);
    const result = await service.getHistoriqueVehicule('v-uuid-1');
    expect(repo.findByVehicule).toHaveBeenCalledWith('v-uuid-1');
    expect(result).toHaveLength(1);
  });
});

describe('getAlertes', () => {
  test('retourne les alertes avec marge par défaut', async () => {
    repo.findAlertesKilometrage.mockResolvedValue([fixture]);
    const result = await service.getAlertes(49800);
    expect(repo.findAlertesKilometrage).toHaveBeenCalledWith(49800, undefined);
    expect(result).toHaveLength(1);
  });

  test('retourne les alertes avec marge personnalisée', async () => {
    repo.findAlertesKilometrage.mockResolvedValue([fixture]);
    await service.getAlertes(49800, 1000);
    expect(repo.findAlertesKilometrage).toHaveBeenCalledWith(49800, 1000);
  });

  test('retourne un tableau vide si aucune alerte', async () => {
    repo.findAlertesKilometrage.mockResolvedValue([]);
    const result = await service.getAlertes(10000);
    expect(result).toHaveLength(0);
  });
});