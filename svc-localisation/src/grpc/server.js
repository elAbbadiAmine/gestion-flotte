const path = require('path');
const grpc = require('@grpc/grpc-js');
const protoLoader = require('@grpc/proto-loader');
const service = require('../services/localisation.service');
const logger = require('../config/logger');

const PROTO_PATH = path.join(__dirname, '../../proto/localisation.proto');

const packageDef = protoLoader.loadSync(PROTO_PATH, {
  keepCase: true,
  longs: String,
  enums: String,
  defaults: true,
  oneofs: true,
});

const proto = grpc.loadPackageDefinition(packageDef).localisation;

const envoyerPosition = (call, callback) => {
  const promises = [];
  call.on('data', (req) => {
    const p = service.enregistrerPosition({
      vehicule_id: req.vehicule_id,
      latitude: req.latitude,
      longitude: req.longitude,
      time: req.time ? new Date(req.time) : new Date(),
    }).then((position) => {
      logger.info({ vehicule_id: req.vehicule_id }, 'Position enregistrée');
      return position;
    }).catch((err) => {
      logger.error({ err: err.message }, 'Erreur enregistrement position');
      return null;
    });
    promises.push(p);
  });
  call.on('end', async () => {
    const results = await Promise.all(promises);
    const saved = results.filter(Boolean).length;
    logger.info({ saved }, 'Stream terminé');
    callback(null, { success: true, message: `${saved} positions enregistrées` });
  });
  call.on('error', (err) => {
    logger.error({ err: err.message }, 'Erreur stream gRPC');
  });
};

const streamPositions = async (call) => {
  const { vehicule_id } = call.request;
  try {
    const positions = await service.getHistorique(vehicule_id);
    for (const p of positions) {
      call.write({ success: true, message: JSON.stringify(p) });
    }
  } catch (err) {
    logger.error({ err: err.message }, 'Erreur stream positions');
  }
  call.end();
};

const startGrpcServer = () => {
  const server = new grpc.Server();
  server.addService(proto.LocalisationService.service, {
    EnvoyerPosition: envoyerPosition,
    StreamPositions: streamPositions,
  });
  server.bindAsync('0.0.0.0:50051', grpc.ServerCredentials.createInsecure(), (err, port) => {
    if (err) throw err;
    logger.info(`gRPC server démarré sur port ${port}`);
  });
  return server;
};

module.exports = { startGrpcServer };
