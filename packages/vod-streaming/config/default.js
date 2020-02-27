module.exports = {
  server: {
    port: process.env.PORT || '9091',
  },
  api: process.env.API_URL,
  cookieSecret: 'secret',
  cache: {
    auth: {
      host: 'vod-auth-cache.redis.cache.windows.net',
      port: 6380,
      password: 'LYKMfO+sAyJJQGpCFOGBHUKC8t8yeO09VgP9tVNSZSI=',
      tls: true,
    },
    db: {
      host: 'vod-db-cache.redis.cache.windows.net',
      port: 6380,
      password: 'LYKMfO+sAyJJQGpCFOGBHUKC8t8yeO09VgP9tVNSZSI=',
      tls: true,
    },
    s3: {
      host: 'vod-s3-cache.redis.cache.windows.net',
      port: 6380,
      password: 'LYKMfO+sAyJJQGpCFOGBHUKC8t8yeO09VgP9tVNSZSI=',
      tls: true,
    },
  },
};
