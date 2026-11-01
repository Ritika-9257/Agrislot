const crypto = require('crypto');

const CHARSET = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';

/**
 * Generate a unique, collision-resistant digital gate-pass token.
 * Default format: AG-T + 6 uppercase alphanumeric chars (e.g. AG-T7X89B)
 */
function generateToken(prefix = 'AG-T') {
  const bytes = crypto.randomBytes(6);
  let randomChars = '';
  for (let i = 0; i < 6; i++) {
    randomChars += CHARSET[bytes[i] % CHARSET.length];
  }
  return `${prefix}${randomChars}`;
}

module.exports = {
  generateToken
};
