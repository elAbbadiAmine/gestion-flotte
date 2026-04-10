const { Kafka } = require('kafkajs');
const logger = require('./logger');
const repo = require('../repositories/vehicule.repository');

const kafka = new Kafka({
  clientId: 'svc-vehicules-consumer',
  brokers: [(process.env.KAFKA_BROKER || 'kafka:9092')],
});

const consumer = kafka.consumer({ groupId: 'svc-vehicules-group' });

const handlers = {
  'maintenance.started': async (p) => {
    await repo.update(p.vehiculeId, { statut: 'en_maintenance' });
    logger.info({ vehiculeId: p.vehiculeId }, 'Statut : en_maintenance');
  },
  'maintenance.completed': async (p) => {
    await repo.update(p.vehiculeId, { statut: 'disponible' });
    logger.info({ vehiculeId: p.vehiculeId }, 'Statut : disponible');
  },
  'mission.assigned': async (p) => {
    await repo.update(p.vehiculeId, { statut: 'en_mission' });
    logger.info({ vehiculeId: p.vehiculeId }, 'Statut : en_mission');
  },
  'mission.completed': async (p) => {
    await repo.update(p.vehiculeId, { statut: 'disponible' });
    logger.info({ vehiculeId: p.vehiculeId }, 'Statut : disponible');
  },
  'mission.failed': async (p) => {
    await repo.update(p.vehiculeId, { statut: 'disponible' });
    logger.warn({ vehiculeId: p.vehiculeId }, 'Rollback véhicule : disponible');
  },
};

const connectConsumer = async () => {
  await consumer.connect();
  await consumer.subscribe({ topics: ['maintenance', 'missions'], fromBeginning: false });
  await consumer.run({
    eachMessage: async ({ topic, message }) => {
      try {
        const event = JSON.parse(message.value.toString());
        logger.info({ topic, type: event.type }, 'Event reçu');
        const handler = handlers[event.type];
        if (handler) await handler(event.payload);
        else logger.warn({ type: event.type }, 'Event sans handler');
      } catch (err) {
        logger.error({ err }, 'Erreur traitement event Kafka');
      }
    },
  });
  logger.info('Kafka consumer connecté');
};

module.exports = { connectConsumer };