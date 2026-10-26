const SENSITIVE_KEYS = ['password', 'password_hash', 'aadhar_no', 'upi_id', 'token', 'authorization'];

function sanitize(data) {
  if (!data || typeof data !== 'object') {
    return data;
  }
  
  if (Array.isArray(data)) {
    return data.map(sanitize);
  }

  const cleaned = {};
  for (const [key, value] of Object.entries(data)) {
    const lowerKey = key.toLowerCase();
    if (SENSITIVE_KEYS.some(sensitive => lowerKey.includes(sensitive))) {
      cleaned[key] = '[REDACTED]';
    } else if (typeof value === 'object' && value !== null) {
      cleaned[key] = sanitize(value);
    } else {
      cleaned[key] = value;
    }
  }
  return cleaned;
}

const logger = {
  info: (message, meta) => {
    if (meta) {
      console.log(`[INFO] ${message}`, sanitize(meta));
    } else {
      console.log(`[INFO] ${message}`);
    }
  },
  warn: (message, meta) => {
    if (meta) {
      console.warn(`[WARN] ${message}`, sanitize(meta));
    } else {
      console.warn(`[WARN] ${message}`);
    }
  },
  error: (message, meta) => {
    if (meta) {
      console.error(`[ERROR] ${message}`, sanitize(meta));
    } else {
      console.error(`[ERROR] ${message}`);
    }
  },
  debug: (message, meta) => {
    if (process.env.NODE_ENV === 'development') {
      if (meta) {
        console.debug(`[DEBUG] ${message}`, sanitize(meta));
      } else {
        console.debug(`[DEBUG] ${message}`);
      }
    }
  }
};

module.exports = logger;
