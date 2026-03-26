const { Kafka } = require('kafkajs');
const logger = require('./logger');
const repo = require('../repositories/vehicule.repository');

const kafka = new Kafka({
  clientId: 'svc-vehicules-consumer',
  brokers: [(process.env.KAFKA_BROKER || 'kafka:9092')],
});

const consumer = kafka.consumer({ groupId: 'svc-vehicules-group' });

const handlers = {
  'maintenance.started': async (payload) => {
    await repo.update(payload.vehiculeId, { statut: 'en_maintenance' });
    logger.info({ vehiculeId: payload.vehiculeId }, 'Statut mis à jour: en_maintenance');
  },
  'maintenance.completed': async (payload) => {
    await repo.update(payload.vehiculeId, { statut: 'disponible' });
    logger.info({ vehiculeId: payload.vehiculeId }, 'Statut mis à jour: disponible');
  },
  'mission.started': async (payload) => {
    await repo.update(payload.vehiculeId, { statut: 'en_mission' });
    logger.info({ vehiculeId: payload.vehiculeId }, 'Statut mis à jour: en_mission');
  },
  'mission.completed': async (payload) => {
    await repo.update(payload.vehiculeId, { statut: 'disponible' });
    logger.info({ vehiculeId: payload.vehiculeId }, 'Statut mis à jour: disponible');
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
        if (handler) {
          await handler(event.payload);
        } else {
          logger.warn({ type: event.type }, 'Event sans handler');
        }
      } catch (err) {
        logger.error({ err }, 'Erreur traitement event Kafka');
      }
    },
  });

  logger.info('Kafka consumer connecté');
};

module.exports = { connectConsumer };