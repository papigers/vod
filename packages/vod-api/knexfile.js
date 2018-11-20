var config = require('config').db;

module.exports = {
  client: 'postgresql',
  connection: {
    database: config.database,
    user: config.username,
    password: config.password,
    host: config.host,
    port: config.port,
  },
  pool: config.config.pool,
  migrations: {
    tableName: 'knex_migrations'
  },
};
