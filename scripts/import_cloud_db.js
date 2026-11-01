const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');

async function importCloudDb() {
  const host = process.env.DB_HOST || 'agrislot-db-agrislot-gourav.l.aivencloud.com';
  const port = parseInt(process.env.DB_PORT || '14764', 10);
  const user = process.env.DB_USER || 'avnadmin';
  const password = process.env.DB_PASSWORD;
  const database = process.env.DB_NAME || 'defaultdb';

  if (!password) {
    console.error('ERROR: DB_PASSWORD environment variable or argument is required.');
    console.log('Usage: DB_PASSWORD=your_password node scripts/import_cloud_db.js');
    process.exit(1);
  }

  console.log(`Connecting to Aiven MySQL at ${host}:${port} as ${user}...`);

  const connection = await mysql.createConnection({
    host,
    port,
    user,
    password,
    database,
    ssl: { rejectUnauthorized: false },
    multipleStatements: true
  });

  console.log('✓ Successfully connected to Aiven Cloud MySQL!');

  const dumpPath = path.resolve(__dirname, '../database/agrislot_full_dump.sql');
  console.log(`Reading SQL dump from ${dumpPath}...`);
  let sql = fs.readFileSync(dumpPath, 'utf8');

  // Strip DELIMITER statements for mysql2 driver compatibility
  sql = sql
    .replace(/^DELIMITER\s+\$\$/gm, '')
    .replace(/^DELIMITER\s+\/\//gm, '')
    .replace(/^DELIMITER\s+;/gm, '')
    .replace(/\$\$/g, ';')
    .replace(/\/\//g, ';');

  console.log('Executing database schema, triggers, procedures, views, and seed data...');
  await connection.query(sql);

  console.log('Verifying created tables in agrislot database...');
  await connection.query('USE agrislot;');
  const [tables] = await connection.query('SHOW TABLES;');
  console.log(`✓ Database ready! Created ${tables.length} tables:`);
  tables.forEach(t => console.log(`   - ${Object.values(t)[0]}`));

  const [users] = await connection.query('SELECT User_ID, Username, User_Role, Email FROM User_Login;');
  console.log('\n✓ Verified Seed User Accounts:');
  console.table(users);

  await connection.end();
  console.log('\n🎉 AgriSlot Cloud Database Initialized Successfully on Aiven!');
}

importCloudDb().catch(err => {
  console.error('Import failed:', err.message);
  process.exit(1);
});
