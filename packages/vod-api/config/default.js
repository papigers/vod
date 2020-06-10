module.exports = {
  server: {
    port: process.env.PORT || 9090,
  },
  api: process.env.API_URL || 'http://localhost:9090/api',
  db: {
    username: process.env.DB_USERNAME || 'postgres',
    password: process.env.DB_PASSWORD || 'Aa123123',
    database: process.env.DB_DATABASE || 'vod',
    host: process.env.DB_HOSTNAME || 'localhost',
    port: process.env.DB_PORT || 5432,
    config: {
      dialect: process.env.DB_TYPE || 'postgres',
      pool: {
        max: 5,
        min: 0,
      },
    },
  },
  RabbitMQ: {
    port: process.env.RABBITMQ_PORT || "5672",
    host: process.env.RABBITMQ_HOSTNAME || "localhost",
    username: process.env.RABBITMQ_USERNAME || "admin",
    password: process.env.RABBITMQ_PASSWORD || "Aa123123"
  },
  admin: {
    id: 's7591665',
    type: 'USER',
    picture:
      'https://images.unsplash.com/photo-1566903451935-7e8835ed3e97?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=crop&w=3300&q=80',
    cover:
        'https://cdn.pixabay.com/photo/2018/09/26/19/42/raindrop-3705463_1280.jpg',
    personal: true,
    access: 'PUBLIC',
    name: 'גרשון ח פפיאשוילי',
    description: 'wubba lubba dub dub',
    isAdmin: true,
  },
  ad: {
    url: process.env.AD_DOMAIN_CONTROLLER_URL || 'ldap://vod-dc.westeurope.cloudapp.azure.com',
    baseDN: process.env.AD_BASE_DN || 'ou=orgs,dc=example,dc=com',
    username: process.env.AD_PROJECTAL_USER || 'vod@example.com',
    password: process.env.AD_PROJECTAL_USER_PASSWORD || 'Aa123123',
    scope: 'sub',
    attributes: {
      user: ['sAMAccountName', 'displayName', 'objectClass', 'dn'],
      group: ['dn', 'cn', 'displayName', 'objectClass'],
    },
  },
  S3:{
    AWS_REGION: process.env.AWS_REGION || "eu-central-1",
    AWS_BUCKET: process.env.AWS_BUCKET || "bucket-vod"
  },
  TempStorage: {
    path: process.env.TEMP_STORAGE || 'C:\\temp\\'
  }
};
