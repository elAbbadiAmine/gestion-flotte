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
  'maintenance.supprimee': async (payload) => {
    await repo.create({
      type: 'maintenance_supprimee',
      niveau: 'info',
      vehiculeId: payload.vehiculeId || null,
      message: `Maintenance ${payload.type || ''} (${payload.statut || ''}) supprimée`,
      source: 'maintenance',
    });
  },
  'maintenance.annulee': async (payload) => {
    await repo.create({
      type: 'maintenance_annulee',
      niveau: 'warning',
      vehiculeId: payload.vehiculeId || null,
      message: `Maintenance ${payload.type || ''} annulée${payload.datePlanifiee ? ` (prévue le ${String(payload.datePlanifiee).slice(0, 10)})` : ''}`,
      source: 'maintenance',
    });
  },
  'conducteur.deleted': async (payload) => {
    await repo.create({
      type: 'conducteur_supprime',
      niveau: 'warning',
      vehiculeId: null,
      message: `Conducteur ${payload.prenom || ''} ${payload.nom || payload.id} supprimé`,
      source: 'conducteurs',
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
  'geofence.violation': async (payload) => {
    const vehiculeId = payload.vehicule_id || payload.vehiculeId || null;
    const existe = await repo.findUnreadByTypeAndVehicule('geofencing', vehiculeId);
    if (existe) return;
    await repo.create({
      type: 'geofencing',
      niveau: 'critique',
      vehiculeId,
      message: `Véhicule hors zone ${payload.zone} (${payload.distance_metres} m)`,
      source: 'localisation',
    });
  },
};

const connectConsumer = async () => {
  await consumer.connect();
  await consumer.subscribe({ topics: ['maintenance', 'vehicules', 'localisation', 'conducteurs'], fromBeginning: false });
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
