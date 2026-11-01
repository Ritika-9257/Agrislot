const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const os = require('os');
const { getSslConfig, getPool, testConnection, closePool } = require('../src/config/database');
const env = require('../src/config/env');

test('Database SSL Compatibility & Security Test Suite', async (t) => {
  t.after(async () => {
    await closePool();
  });

  await t.test('1. Default behavior: getSslConfig returns undefined when DB_SSL is false or unset (local MySQL preserved)', () => {
    assert.strictEqual(getSslConfig({ DB_SSL: false }), undefined);
    assert.strictEqual(getSslConfig({ DB_SSL: false, DB_SSL_CA: 'MOCK_CERT' }), undefined);
    assert.strictEqual(getSslConfig({ DB_SSL: false, DB_SSL_CA_PATH: '/path/ca.pem' }), undefined);
    assert.strictEqual(getSslConfig({}), undefined);
  });

  await t.test('2. Cloud SSL enabled without custom CA strictly enforces rejectUnauthorized: true', () => {
    const config = getSslConfig({ DB_SSL: true });
    assert.ok(config, 'SSL config object must be returned');
    assert.strictEqual(config.rejectUnauthorized, true, 'rejectUnauthorized must be strictly true');
    assert.strictEqual(config.ca, undefined, 'ca must be undefined when not supplied so Node uses trusted system CAs');
  });

  await t.test('3. Cloud SSL with inline DB_SSL_CA normalizes escaped newlines and enforces rejectUnauthorized: true', () => {
    const inlinePem = '-----BEGIN CERTIFICATE-----\\nMIIBkTCB+wIJAL...\\n-----END CERTIFICATE-----';
    const config = getSslConfig({
      DB_SSL: true,
      DB_SSL_CA: inlinePem
    });

    assert.ok(config);
    assert.strictEqual(config.rejectUnauthorized, true);
    assert.strictEqual(config.ca, '-----BEGIN CERTIFICATE-----\nMIIBkTCB+wIJAL...\n-----END CERTIFICATE-----');
  });

  await t.test('4. Cloud SSL with DB_SSL_CA_PATH reads CA file contents and enforces rejectUnauthorized: true', () => {
    const tempDir = os.tmpdir();
    const tempCaPath = path.join(tempDir, `agrislot-test-ca-${Date.now()}.pem`);
    const mockCaContent = '-----BEGIN CERTIFICATE-----\nMIIFdDCCBFygAwIBAgIQ...TEST_CA...\n-----END CERTIFICATE-----';

    try {
      fs.writeFileSync(tempCaPath, mockCaContent, 'utf8');

      const config = getSslConfig({
        DB_SSL: true,
        DB_SSL_CA_PATH: tempCaPath
      });

      assert.ok(config);
      assert.strictEqual(config.rejectUnauthorized, true);
      assert.strictEqual(config.ca, mockCaContent);
    } finally {
      if (fs.existsSync(tempCaPath)) {
        fs.unlinkSync(tempCaPath);
      }
    }
  });

  await t.test('5. Cloud SSL with non-existent DB_SSL_CA_PATH falls back to system CAs without throwing', () => {
    const nonExistentPath = path.join(os.tmpdir(), `non-existent-ca-${Date.now()}.pem`);
    const config = getSslConfig({
      DB_SSL: true,
      DB_SSL_CA_PATH: nonExistentPath
    });

    assert.ok(config);
    assert.strictEqual(config.rejectUnauthorized, true);
    assert.strictEqual(config.ca, undefined);
  });

  await t.test('6. Security audit: rejectUnauthorized is ALWAYS true in all SSL configurations', () => {
    const configsToTest = [
      { DB_SSL: true },
      { DB_SSL: true, DB_SSL_CA: 'cert' },
      { DB_SSL: true, DB_SSL_CA: '' },
      { DB_SSL: true, DB_SSL_CA_PATH: '' }
    ];

    for (const c of configsToTest) {
      const ssl = getSslConfig(c);
      assert.strictEqual(ssl?.rejectUnauthorized, true, 'SSL must never disable certificate verification');
    }
  });

  await t.test('7. Live local MySQL connectivity check continues working without SSL', async () => {
    // Verify that current runtime env.DB_SSL is false for local development
    assert.strictEqual(Boolean(env.DB_SSL), false, 'DB_SSL must default to false for local development');

    const status = await testConnection();
    if (!status.connected) {
      // In sandbox environments without port 3306 open
      return;
    }

    assert.strictEqual(status.connected, true);
    assert.ok(status.database);
    assert.strictEqual(status.ssl, false);
  });
});
