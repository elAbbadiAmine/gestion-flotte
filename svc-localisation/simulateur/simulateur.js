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
  { id: 'aaaaaaaa-1111-1111-1111-bbbbbbbbbbbb', lat: 48.8566, lon: 2.3522 },
  { id: 'cccccccc-3333-3333-3333-dddddddddddd', lat: 48.9000, lon: 2.4000 },
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
