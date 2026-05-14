jest.mock('../../src/config/httpClient');
jest.mock('../../src/config/tracing', () => {});

const axios = require('../../src/config/httpClient');
const ds = require('../../src/datasources/vehicule.datasource');

const mockVehicule = { id: 'uuid-v1', immatriculation: 'AB-123-CD', statut: 'disponible' };

describe('VehiculeDatasource', () => {
  beforeEach(() => jest.clearAllMocks());

  test('getAll retourne la liste des véhicules', async () => {
    axios.get.mockResolvedValue({ data: { data: [mockVehicule] } });

    const result = await ds.getAll();

    expect(axios.get).toHaveBeenCalledWith(expect.stringContaining('/vehicules'));
    expect(result).toEqual([mockVehicule]);
  });

  test('getAll transmet le filtre statut', async () => {
    axios.get.mockResolvedValue({ data: { data: [] } });

    await ds.getAll({ statut: 'disponible' });

    expect(axios.get).toHaveBeenCalledWith(expect.stringContaining('statut=disponible'));
  });

  test('getById retourne un véhicule', async () => {
    axios.get.mockResolvedValue({ data: { data: mockVehicule } });

    const result = await ds.getById('uuid-v1');

    expect(result).toEqual(mockVehicule);
  });

  test('getById retourne null si 404', async () => {
    axios.get.mockRejectedValue({ response: { status: 404 } });

    const result = await ds.getById('uuid-inconnu');

    expect(result).toBeNull();
  });

  test('getById propage les erreurs non-404', async () => {
    axios.get.mockRejectedValue({ response: { status: 500 } });

    await expect(ds.getById('uuid-v1')).rejects.toBeDefined();
  });

  test('create envoie les données et retourne le véhicule créé', async () => {
    axios.post.mockResolvedValue({ data: { data: mockVehicule } });

    const result = await ds.create({ immatriculation: 'AB-123-CD' });

    expect(axios.post).toHaveBeenCalledWith(expect.stringContaining('/vehicules'), { immatriculation: 'AB-123-CD' });
    expect(result).toEqual(mockVehicule);
  });

  test('update envoie les modifications', async () => {
    const updated = { ...mockVehicule, statut: 'en_mission' };
    axios.put.mockResolvedValue({ data: { data: updated } });

    const result = await ds.update('uuid-v1', { statut: 'en_mission' });

    expect(axios.put).toHaveBeenCalledWith(expect.stringContaining('/uuid-v1'), { statut: 'en_mission' });
    expect(result.statut).toBe('en_mission');
  });

  test('remove retourne true après suppression', async () => {
    axios.delete.mockResolvedValue({});

    const result = await ds.remove('uuid-v1');

    expect(result).toBe(true);
  });
});
