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
  { id: 'f1f9c031-88a7-47cb-9df0-0f7e53124c3d', lat: 49.4432, lon: 1.0999 }, // RO-001-AA — Rouen centre
  { id: '776959a0-d81d-44eb-846e-54e8dee61475', lat: 49.4380, lon: 1.0900 }, // RO-003-BB — Rouen
  { id: 'be9fa1eb-db46-4d1e-b963-388b16eec383', lat: 49.9254, lon: 1.0762 }, // RO-005-EE — Dieppe (hors zone)
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
