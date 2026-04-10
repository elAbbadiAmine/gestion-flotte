const { Kafka } = require('kafkajs');
const logger = require('./logger');
const repo = require('../repositories/maintenance.repository');

const kafka = new Kafka({
  clientId: 'svc-maintenance-consumer',
  brokers: [(process.env.KAFKA_BROKER || 'kafka:9092')],
});

const consumer = kafka.consumer({ groupId: 'svc-maintenance-group' });

const handlers = {
  'vehicule.updated': async (payload) => {
    if (payload.kilometrage) {
      const alertes = await repo.findAlertesKilometrage(payload.kilometrage);
      if (alertes.length) {
        logger.warn({ vehiculeId: payload.id, alertes: alertes.length }, 'Alerte kilométrage déclenchée');
      }
    }
  },
  'vehicule.deleted': async (payload) => {
    const maintenances = await repo.findByVehicule(payload.id);
    const planifiees = maintenances.filter((m) => m.statut === 'planifiee');
    await Promise.all(planifiees.map((m) => repo.update(m.id, { statut: 'annulee' })));
    if (planifiees.length) logger.info({ vehiculeId: payload.id, annulees: planifiees.length }, 'Maintenances annulées suite suppression véhicule');
  },
  'mission.completed': async (payload) => {
    const maintenances = await repo.findAlertesKilometrage(payload.kilometrage || 0);
    if (maintenances.length) {
      logger.warn({ vehiculeId: payload.vehiculeId, maintenances: maintenances.length }, 'Alerte : maintenance due après mission');
    }
  },
  'mission.failed': async (payload) => {
    const maintenances = await repo.findByVehicule(payload.vehiculeId);
    const enCours = maintenances.filter((m) => m.statut === 'en_cours');
    await Promise.all(enCours.map((m) => repo.update(m.id, { statut: 'planifiee' })));
    if (enCours.length) logger.info({ vehiculeId: payload.vehiculeId }, 'Rollback maintenances en_cours → planifiee');
  },
};

const connectConsumer = async () => {
  await consumer.connect();
  await consumer.subscribe({ topics: ['vehicules', 'conducteurs', 'missions'], fromBeginning: false });
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