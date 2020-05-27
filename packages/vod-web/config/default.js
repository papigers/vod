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
  apiEndpoint: process.env.REACT_APP_API_HOSTNAME || 'http://localhost:9090',
  streamingEndpoint: process.env.REACT_APP_STREAMER_HOSTNAME || 'http://localhost:9091'
};
