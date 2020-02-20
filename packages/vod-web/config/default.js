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
  api: 'http://172.17.0.2:9090/api',
};
