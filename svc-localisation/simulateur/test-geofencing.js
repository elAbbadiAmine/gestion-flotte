const path = require('path');
const grpc = require('@grpc/grpc-js');
const protoLoader = require('@grpc/proto-loader');

const PROTO_PATH = path.join(__dirname, '../proto/localisation.proto');
const packageDef = protoLoader.loadSync(PROTO_PATH, {
  keepCase: true, longs: String, enums: String, defaults: true, oneofs: true,
});
const proto = grpc.loadPackageDefinition(packageDef).localisation;

const client = new proto.LocalisationService(
  'localhost:50051',
  grpc.credentials.createInsecure()
);

const POINTS = [
  { id: 'aaaaaaaa-1111-1111-1111-bbbbbbbbbbbb', lat: 48.8566, lon: 2.3522, label: 'Paris Centre (DANS zone)' },
  { id: 'aaaaaaaa-1111-1111-1111-bbbbbbbbbbbb', lat: 48.9000, lon: 2.4500, label: 'Saint-Denis (DANS zone, ~6km)' },
  { id: 'aaaaaaaa-1111-1111-1111-bbbbbbbbbbbb', lat: 49.2000, lon: 2.0000, label: 'Beauvais (HORS zone, ~50km)' },
  { id: 'aaaaaaaa-1111-1111-1111-bbbbbbbbbbbb', lat: 48.5000, lon: 2.0000, label: 'Étampes (HORS zone, ~45km)' },
  { id: 'aaaaaaaa-1111-1111-1111-bbbbbbbbbbbb', lat: 50.6292, lon: 3.0573, label: 'Lille (HORS zone, ~200km)' },
];

const test = () => {
  const call = client.EnvoyerPosition((err, response) => {
    if (err) return console.error('Erreur:', err.message);
    console.log('\nRéponse serveur:', response.message);
  });

  let i = 0;
  const interval = setInterval(() => {
    if (i >= POINTS.length) {
      clearInterval(interval);
      call.end();
      return;
    }
    const p = POINTS[i++];
    call.write({
      vehicule_id: p.id,
      latitude: p.lat,
      longitude: p.lon,
      time: new Date().toISOString(),
    });
    console.log(`[${p.label}] lat=${p.lat} lon=${p.lon}`);
  }, 1000);
};

test();
