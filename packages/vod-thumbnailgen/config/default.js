module.exports = {
  RabbitMQ: {
    port: process.env.RABBITMQ_PORT || "5672",
    host: process.env.RABBITMQ_HOSTNAME || "localhost",
    username: process.env.RABBITMQ_USERNAME || "admin",
    password: process.env.RABBITMQ_PASSWORD || "Aa123123"
  }
};
