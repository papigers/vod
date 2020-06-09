module.exports = {
  RabbitMQ: {
    port: process.env.RABBITMQ_PORT || "5672",
    host: process.env.RABBITMQ_HOSTNAME || "localhost",
    username: process.env.RABBITMQ_USERNAME || "admin",
    password: process.env.RABBITMQ_PASSWORD || "Aa123123"
  },
  S3:{
    AWS_REGION: process.env.AWS_REGION || "eu-central-1",
    AWS_BUCKET: process.env.AWS_BUCKET || "bucket-vod",
    AWS_SECRET_ACCESS_KEY: process.env.AWS_SECRET_ACCESS_KEY,
    AWS_ACCESS_KEY_ID: process.env.AWS_ACCESS_KEY_ID
  },
  TempStorage: {
    path: process.env.TEMP_STORAGE || 'C:\\temp\\'
  }
};
