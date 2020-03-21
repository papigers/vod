module.exports = {
  server: {
    port: process.env.PORT || 9090,
  },
  api: process.env.API_URL || 'http://localhost:9090/api',
  //api: 'http://vod-ubuntu.westeurope.cloudapp.azure.com:9090/api',
  db: {
    username: process.env.DB_USERNAME || 'postgres',
    password: process.env.DB_PASSWORD || 'Aa123123',
    database: process.env.DB_DATABASE || 'vod',
    host: process.env.DB_HOSTNAME || 'localhost',
    port: process.env.DB_PORT || 5432,
    // host: process.env.DB_HOSTNAME || 'vod-db.westeurope.cloudapp.azure.com',
    //port: process.env.DB_PORT || 5433,
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
    url: 'ldap://vod-dc.westeurope.cloudapp.azure.com',
    baseDN: 'ou=orgs,dc=example,dc=com',
    username: 'vod@example.com',
    password: 'Aa123123',
    scope: 'sub',
    attributes: {
      user: ['sAMAccountName', 'displayName', 'objectClass', 'dn'],
      group: ['dn', 'cn', 'displayName', 'objectClass'],
    },
  },
};
