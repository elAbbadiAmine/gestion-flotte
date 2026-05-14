const { Kafka } = require('kafkajs');
const logger = require('./logger');
const repo = require('../repositories/alerte.repository');

const kafka = new Kafka({
  clientId: 'svc-evenements',
  brokers: [(process.env.KAFKA_BROKER || 'kafka:9092')],
});

const consumer = kafka.consumer({ groupId: 'svc-evenements-group' });

const handlers = {
  'maintenance.planifiee': async (payload) => {
    await repo.create({
      type: 'maintenance_planifiee',
      niveau: 'info',
      vehiculeId: payload.vehiculeId || null,
      message: `Maintenance ${payload.type || ''} planifiée pour le ${payload.datePlanifiee || 'date inconnue'}`,
      source: 'maintenance',
    });
  },
  'maintenance.terminee': async (payload) => {
    await repo.create({
      type: 'maintenance_terminee',
      niveau: 'info',
      vehiculeId: payload.vehiculeId || null,
      message: `Maintenance terminée${payload.cout ? ` (coût : ${payload.cout} €)` : ''}`,
      source: 'maintenance',
    });
  },
  'vehicule.deleted': async (payload) => {
    await repo.create({
      type: 'vehicule_supprime',
      niveau: 'warning',
      vehiculeId: payload.id || null,
      message: `Véhicule ${payload.immatriculation || payload.id} supprimé`,
      source: 'vehicules',
    });
  },
  'geofencing.violation': async (payload) => {
    await repo.create({
      type: 'geofencing',
      niveau: 'critique',
      vehiculeId: payload.vehiculeId || null,
      message: `Violation de zone géographique détectée pour le véhicule ${payload.vehiculeId}`,
      source: 'localisation',
    });
  },
};

const connectConsumer = async () => {
  await consumer.connect();
  await consumer.subscribe({ topics: ['maintenance', 'vehicules', 'localisation'], fromBeginning: false });
  await consumer.run({
    eachMessage: async ({ topic, message }) => {
      try {
        const event = JSON.parse(message.value.toString());
        logger.info({ topic, type: event.type }, 'Event reçu');
        const handler = handlers[event.type];
        if (handler) await handler(event.payload || event);
        else logger.warn({ type: event.type }, 'Event sans handler');
      } catch (err) {
        logger.error({ err }, 'Erreur traitement event Kafka');
      }
    },
  });
  logger.info('Kafka consumer svc-evenements connecté');
};

module.exports = { connectConsumer };
