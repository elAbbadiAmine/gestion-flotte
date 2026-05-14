jest.mock('../../src/config/tracing', () => {});
jest.mock('../../src/datasources/localisation.datasource');

const resolvers = require('../../src/resolvers/localisation.resolvers');
const ds = require('../../src/datasources/localisation.datasource');

const mockPos = { vehiculeId: 'uuid-v1', latitude: 48.8566, longitude: 2.3522 };

describe('LocalisationResolvers', () => {
  beforeEach(() => jest.clearAllMocks());

  test('Query.toutesDernieresPositions retourne toutes les positions', async () => {
    ds.getToutesDernieresPositions.mockResolvedValue([mockPos]);

    const result = await resolvers.Query.toutesDernieresPositions();

    expect(ds.getToutesDernieresPositions).toHaveBeenCalled();
    expect(result).toEqual([mockPos]);
  });

  test('Query.dernierePosition appelle ds avec vehiculeId', async () => {
    ds.getDernierePosition.mockResolvedValue(mockPos);

    const result = await resolvers.Query.dernierePosition(null, { vehiculeId: 'uuid-v1' });

    expect(ds.getDernierePosition).toHaveBeenCalledWith('uuid-v1');
    expect(result).toEqual(mockPos);
  });

  test('Query.historiquePositions transmet debut et fin', async () => {
    ds.getHistorique.mockResolvedValue([mockPos]);

    const result = await resolvers.Query.historiquePositions(null, {
      vehiculeId: 'uuid-v1',
      debut: '2025-01-01',
      fin: '2025-01-02',
    });

    expect(ds.getHistorique).toHaveBeenCalledWith('uuid-v1', '2025-01-01', '2025-01-02');
    expect(result).toEqual([mockPos]);
  });
});
