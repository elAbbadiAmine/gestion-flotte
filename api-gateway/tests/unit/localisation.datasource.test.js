jest.mock('../../src/config/httpClient');
jest.mock('../../src/config/tracing', () => {});

const axios = require('../../src/config/httpClient');
const ds = require('../../src/datasources/localisation.datasource');

const mockPos = { vehicule_id: 'uuid-v1', latitude: 48.8566, longitude: 2.3522, time: '2025-01-01T10:00:00Z' };

describe('LocalisationDatasource', () => {
  beforeEach(() => jest.clearAllMocks());

  test('getToutesDernieresPositions mappe vehicule_id en vehiculeId', async () => {
    axios.get.mockResolvedValue({ data: { data: [mockPos] } });

    const result = await ds.getToutesDernieresPositions();

    expect(result[0].vehiculeId).toBe('uuid-v1');
    expect(axios.get).toHaveBeenCalledWith(expect.stringContaining('/dernieres'));
  });

  test('getDernierePosition retourne la position avec vehiculeId', async () => {
    axios.get.mockResolvedValue({ data: { data: mockPos } });

    const result = await ds.getDernierePosition('uuid-v1');

    expect(result.vehiculeId).toBe('uuid-v1');
    expect(result.latitude).toBe(48.8566);
  });

  test('getDernierePosition retourne null si 404', async () => {
    axios.get.mockRejectedValue({ response: { status: 404 } });

    const result = await ds.getDernierePosition('uuid-inconnu');

    expect(result).toBeNull();
  });

  test('getHistorique transmet les paramètres debut et fin', async () => {
    axios.get.mockResolvedValue({ data: { data: [mockPos] } });

    await ds.getHistorique('uuid-v1', '2025-01-01', '2025-01-02');

    expect(axios.get).toHaveBeenCalledWith(expect.stringContaining('debut=2025-01-01'));
    expect(axios.get).toHaveBeenCalledWith(expect.stringContaining('fin=2025-01-02'));
  });

  test('getHistorique retourne une liste avec vehiculeId', async () => {
    axios.get.mockResolvedValue({ data: { data: [mockPos] } });

    const result = await ds.getHistorique('uuid-v1', null, null);

    expect(result[0].vehiculeId).toBe('uuid-v1');
  });
});
