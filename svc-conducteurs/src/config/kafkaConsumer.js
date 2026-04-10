const { Kafka } = require('kafkajs');
const logger = require('./logger');
const repo = require('../repositories/conducteur.repository');

const kafka = new Kafka({
  clientId: 'svc-conducteurs-consumer',
  brokers: [(process.env.KAFKA_BROKER || 'kafka:9092')],
});

const consumer = kafka.consumer({ groupId: 'svc-conducteurs-group' });

const handlers = {
  'mission.assigned': async (payload) => {
    await repo.update(payload.conducteurId, { statut: 'en_mission' });
    logger.info({ conducteurId: payload.conducteurId }, 'Statut conducteur : en_mission');
  },
  'mission.completed': async (payload) => {
    await repo.update(payload.conducteurId, { statut: 'actif' });
    logger.info({ conducteurId: payload.conducteurId }, 'Statut conducteur : actif');
  },
  'mission.failed': async (payload) => {
    await repo.update(payload.conducteurId, { statut: 'actif' });
    logger.info({ conducteurId: payload.conducteurId }, 'Rollback conducteur : actif');
  },
};

const connectConsumer = async () => {
  await consumer.connect();
  await consumer.subscribe({ topics: ['missions'], fromBeginning: false });
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