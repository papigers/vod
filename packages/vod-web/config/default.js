module.exports = {
  server: {
    port: process.env.PORT || '8080',
  },
  cache: {
    auth: {
      host: 'vod-auth-cache.redis.cache.windows.net',
      port: 6380,
      password: 'LYKMfO+sAyJJQGpCFOGBHUKC8t8yeO09VgP9tVNSZSI=',
      tls: true,
    },
  },
  api: process.env.API_URL || 'http://localhost:9090/api',
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
  }
};
