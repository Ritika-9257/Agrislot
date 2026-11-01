const path = require('path');
const dotenv = require('dotenv');

// Check multiple locations so .env is always loaded regardless of where it was saved
dotenv.config({ path: path.resolve(__dirname, '.env') });
dotenv.config({ path: path.resolve(__dirname, '../../.env') });
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });
dotenv.config({ path: path.resolve(process.cwd(), '.env') });
dotenv.config();

const env = {
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: parseInt(process.env.PORT, 10) || 5001,
  
  // Database configuration
  DB_HOST: process.env.DB_HOST || '127.0.0.1',
  DB_PORT: parseInt(process.env.DB_PORT, 10) || 3306,
  DB_USER: process.env.DB_USER || 'root',
  DB_PASSWORD: process.env.DB_PASSWORD || '',
  DB_NAME: process.env.DB_NAME || 'agrislot',
  DB_CONNECTION_LIMIT: parseInt(process.env.DB_CONNECTION_LIMIT, 10) || 10,
  DB_QUEUE_LIMIT: parseInt(process.env.DB_QUEUE_LIMIT, 10) || 0,

  // JWT Security
  JWT_SECRET: process.env.JWT_SECRET || 'agrislot_development_jwt_secret_key_change_in_production_32char',
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '24h',

  // Rate Limiting
  RATE_LIMIT_WINDOW_MS: parseInt(process.env.RATE_LIMIT_WINDOW_MS, 10) || 15 * 60 * 1000,
  RATE_LIMIT_MAX: parseInt(process.env.RATE_LIMIT_MAX, 10) || 300,

  // Google OAuth 2.0
  GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID || process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || '304542558475-irf55f69uevblj5hcg702gtp1gtlg4ji.apps.googleusercontent.com',

  // Frontend origin for CORS
  FRONTEND_ORIGIN: process.env.FRONTEND_ORIGIN || 'http://localhost:3000'
};

module.exports = env;
