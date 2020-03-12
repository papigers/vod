module.exports = {
  server: {
    port: process.env.PORT || '8082',
  },
  api: process.env.API_URL || 'http://localhost:9090/api',
};
