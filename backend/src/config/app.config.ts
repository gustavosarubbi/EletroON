export default () => ({
  app: {
    port: parseInt(process.env.PORT || '3000', 10) || 3000,
    env: process.env.NODE_ENV || 'development',
  },
  cors: {
    origins: process.env.CORS_ORIGINS?.split(',') || ['http://localhost:3001', 'http://localhost:3004'],
  },
});

