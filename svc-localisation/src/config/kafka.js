const { Kafka } = require('kafkajs');

const kafka = new Kafka({
  clientId: 'svc-localisation',
  brokers: [process.env.KAFKA_BROKER || 'kafka:9092'],
});

const producer = kafka.producer();

const connectProducer = async () => {
  await producer.connect();
};

const publishEvent = async (topic, event) => {
  await producer.send({
    topic,
    messages: [{ value: JSON.stringify(event) }],
  });
};

module.exports = { connectProducer, publishEvent };
