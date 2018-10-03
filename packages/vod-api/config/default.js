module.exports = {
  server: {
    port: process.env.PORT || 9090,
  },
  api: 'http://localhost:9090/api',
  db: {
    username: process.env.DB_USERNAME || 'postgres',
    password: process.env.DB_PASSWORD || 'Aa123123',
    database: process.env.DB_DATABASE || 'vod',
    host: process.env.DB_HOSTNAME || '35.187.74.250',
    config: {
      dialect: process.env.DB_TYPE || 'postgres',
      pool: {
        max: 5,
        min: 0,
        acquire: 30000,
        idle: 10000,
      },
      operatorsAliases: false,
      logging: false,
    },
  },
  admin: {
    id: 's7591665',
    type: 'USER',
    picture: 'https://scontent.fhfa1-1.fna.fbcdn.net/v/t1.0-1/p480x480/36404826_10212689636864924_812286978346188800_n.jpg?_nc_cat=0&oh=f7b5d42c81a822f2a2e642abb2fafe4c&oe=5C0E4A2A',
    cover: 'https://scontent.fhfa1-1.fna.fbcdn.net/v/t31.0-8/21994326_10210708722743309_2900923781613308026_o.jpg?_nc_cat=0&oh=add5e60e2256e184fe651f630f9f3a43&oe=5BD96A45',
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
      user: ['sAMAccountName', 'displayName', 'objectClass'],
      group: ['dn', 'cn', 'displayName', 'objectClass'],
    }
  },
};
