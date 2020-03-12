module.exports = {
  server: {
    port: process.env.PORT || '8083',
  },
  api: process.env.API_URL || 'http://localhost:9090/api',
};
