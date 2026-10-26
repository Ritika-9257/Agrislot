const app = require('./app');
const env = require('./config/env');
const { testConnection, closePool } = require('./config/database');
const logger = require('./utils/logger');

let server = null;

async function startServer(port = env.PORT, retries = 5) {
  logger.info(`Starting AgriSlot Backend in ${env.NODE_ENV} mode...`);

  // Verify database connectivity
  const dbStatus = await testConnection();
  if (dbStatus.connected) {
    logger.info(`Database connected successfully to [${dbStatus.database}] at ${env.DB_HOST}:${env.DB_PORT}`);
  } else {
    logger.warn(`Database connection warning: ${dbStatus.message}`);
    logger.warn(`Tip: Put your MySQL Workbench root password in .env: DB_PASSWORD=your_password`);
  }

  const srv = app.listen(port);

  srv.on('listening', () => {
    server = srv;
    logger.info(`AgriSlot HTTP Server running on http://localhost:${port}`);
    logger.info(`Interactive Web Dashboard: http://localhost:${port}`);
    logger.info(`API Base Endpoint: http://localhost:${port}/api/v1`);
  });

  srv.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      if (retries > 0) {
        logger.warn(`Port ${port} is already in use (macOS AirPlay / ControlCenter frequently uses 5000).`);
        logger.info(`Trying next available port ${port + 1}...`);
        startServer(port + 1, retries - 1);
      } else {
        logger.error(`Could not bind to any port in range. Please specify a free PORT in .env.`);
        process.exit(1);
      }
    } else {
      logger.error('Server error:', err.message);
      process.exit(1);
    }
  });

  const handleShutdown = async (signal) => {
    logger.info(`Received ${signal}. Shutting down gracefully...`);
    if (server) {
      server.close(async () => {
        logger.info('HTTP server closed');
        await closePool();
        process.exit(0);
      });
    } else {
      await closePool();
      process.exit(0);
    }
  };

  process.on('SIGTERM', () => handleShutdown('SIGTERM'));
  process.on('SIGINT', () => handleShutdown('SIGINT'));
}

if (require.main === module) {
  startServer().catch(err => {
    logger.error('Fatal server startup error:', err.message);
    process.exit(1);
  });
}

module.exports = {
  app,
  startServer
};
