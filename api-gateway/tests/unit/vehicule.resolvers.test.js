jest.mock('../../src/config/tracing', () => {});
jest.mock('../../src/datasources/vehicule.datasource');

const resolvers = require('../../src/resolvers/vehicule.resolvers');
const ds = require('../../src/datasources/vehicule.datasource');

const mockVehicule = { id: 'uuid-v1', immatriculation: 'AB-123-CD', statut: 'disponible' };
const ctx = { headers: {} };

describe('VehiculeResolvers', () => {
  beforeEach(() => jest.clearAllMocks());

  test('Query.vehicules appelle ds.getAll', async () => {
    ds.getAll.mockResolvedValue([mockVehicule]);

    const result = await resolvers.Query.vehicules(null, {}, ctx);

    expect(ds.getAll).toHaveBeenCalled();
    expect(result).toEqual([mockVehicule]);
  });

  test('Query.vehicule appelle ds.getById avec l id', async () => {
    ds.getById.mockResolvedValue(mockVehicule);

    const result = await resolvers.Query.vehicule(null, { id: 'uuid-v1' }, ctx);

    expect(ds.getById).toHaveBeenCalledWith('uuid-v1', ctx.headers);
    expect(result).toEqual(mockVehicule);
  });

  test('Mutation.createVehicule appelle ds.create', async () => {
    ds.create.mockResolvedValue(mockVehicule);
    const input = { immatriculation: 'AB-123-CD' };

    const result = await resolvers.Mutation.createVehicule(null, { input }, ctx);

    expect(ds.create).toHaveBeenCalledWith(input, ctx.headers);
    expect(result).toEqual(mockVehicule);
  });

  test('Mutation.updateVehicule appelle ds.update', async () => {
    const updated = { ...mockVehicule, statut: 'en_mission' };
    ds.update.mockResolvedValue(updated);

    const result = await resolvers.Mutation.updateVehicule(null, { id: 'uuid-v1', input: { statut: 'en_mission' } }, ctx);

    expect(ds.update).toHaveBeenCalledWith('uuid-v1', { statut: 'en_mission' }, ctx.headers);
    expect(result.statut).toBe('en_mission');
  });

  test('Mutation.deleteVehicule appelle ds.remove', async () => {
    ds.remove.mockResolvedValue(true);

    const result = await resolvers.Mutation.deleteVehicule(null, { id: 'uuid-v1' }, ctx);

    expect(ds.remove).toHaveBeenCalledWith('uuid-v1', ctx.headers);
    expect(result).toBe(true);
  });
});
