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

const VEHICULES = [
  { id: '11111111-0000-0000-0000-000000000001', lat: 49.4432, lon: 1.0999 }, // RO-001-AA Clio — Rouen centre
  { id: '11111111-0000-0000-0000-000000000002', lat: 49.4380, lon: 1.0900 }, // RO-002-BB 308 — Rouen
  { id: '11111111-0000-0000-0000-000000000004', lat: 49.9254, lon: 1.0762 }, // RO-004-DD Kangoo — Dieppe (hors zone)
];

const simuler = () => {
  const call = client.EnvoyerPosition((err, response) => {
    if (err) return console.error('Erreur:', err.message);
    console.log('Réponse serveur:', response.message);
  });

  let tick = 0;
  const interval = setInterval(() => {
    for (const v of VEHICULES) {
      v.lat += (Math.random() - 0.5) * 0.001;
      v.lon += (Math.random() - 0.5) * 0.001;
      call.write({
        vehicule_id: v.id,
        latitude: v.lat,
        longitude: v.lon,
        time: new Date().toISOString(),
      });
      console.log(`[${v.id}] lat=${v.lat.toFixed(5)} lon=${v.lon.toFixed(5)}`);
    }
    if (++tick >= 10) {
      clearInterval(interval);
      call.end();
    }
  }, 1000);
};

simuler();
