const { Kafka } = require('kafkajs');
const logger = require('./logger');

const kafka = new Kafka({
  clientId: 'svc-conducteurs',
  brokers: [(process.env.KAFKA_BROKER || 'kafka:9092')],
});

const producer = kafka.producer();

const connectProducer = async () => {
  await producer.connect();
  logger.info('Kafka producer connecté');
};

const publishEvent = async (topic, event) => {
  await producer.send({
    topic,
    messages: [{ value: JSON.stringify(event) }],
  });
  logger.info({ topic, type: event.type }, 'Kafka event publié');
};

module.exports = { connectProducer, publishEvent };