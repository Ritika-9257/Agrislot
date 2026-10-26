const mysql = require('mysql2/promise');
const env = require('./env');
const logger = require('../utils/logger');

let pool = null;

/**
 * Initialize or retrieve the MySQL connection pool
 */
function getPool() {
  if (!pool) {
    pool = mysql.createPool({
      host: env.DB_HOST,
      port: env.DB_PORT,
      user: env.DB_USER,
      password: env.DB_PASSWORD,
      database: env.DB_NAME,
      waitForConnections: true,
      connectionLimit: env.DB_CONNECTION_LIMIT,
      queueLimit: env.DB_QUEUE_LIMIT,
      dateStrings: true,
      timezone: '+05:30', // APMC IST timezone
      enableKeepAlive: true,
      keepAliveInitialDelay: 0
    });
  }
  return pool;
}

/**
 * Injects a custom/mock pool for testing
 */
function setPool(customPool) {
  pool = customPool;
}

/**
 * Execute parameterized query using the pool
 */
async function query(sql, params = []) {
  const activePool = getPool();
  return activePool.query(sql, params);
}

/**
 * Obtain a dedicated connection for transactions
 */
async function getConnection() {
  const activePool = getPool();
  return activePool.getConnection();
}

/**
 * Test connectivity safely
 */
async function testConnection() {
  try {
    const activePool = getPool();
    const connection = await activePool.getConnection();
    try {
      const [rows] = await connection.query('SELECT 1 as ping, DATABASE() as current_db');
      return {
        connected: true,
        message: 'Database connection successful',
        database: rows[0]?.current_db || env.DB_NAME
      };
    } finally {
      connection.release();
    }
  } catch (err) {
    logger.error('Database connection test failed:', { code: err.code, message: err.message });
    return {
      connected: false,
      message: 'Unable to connect to database',
      error: env.NODE_ENV === 'development' ? err.message : undefined
    };
  }
}

/**
 * Graceful pool shutdown
 */
async function closePool() {
  if (pool) {
    try {
      await pool.end();
      logger.info('Database connection pool closed successfully');
    } catch (err) {
      logger.error('Error closing database connection pool:', err.message);
    } finally {
      pool = null;
    }
  }
}

module.exports = {
  getPool,
  setPool,
  query,
  getConnection,
  testConnection,
  closePool
};
