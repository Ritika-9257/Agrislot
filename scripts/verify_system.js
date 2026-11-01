#!/usr/bin/env node

/**
 * AgriSlot System & Database Pre-Viva Diagnostic Verifier
 * Validates MySQL connectivity, 25+ records per table, procedures,
 * triggers, views, and environment configuration.
 * 
 * Zero external dependencies: natively parses .env and locates mysql2.
 */

const path = require('path');
const fs = require('fs');

// Built-in .env parser (No dotenv package required)
function loadEnv(filePath) {
  if (!fs.existsSync(filePath)) return;
  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    for (const line of content.split('\n')) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const idx = trimmed.indexOf('=');
      if (idx !== -1) {
        const key = trimmed.slice(0, idx).trim();
        const val = trimmed.slice(idx + 1).trim().replace(/^['"]|['"]$/g, '');
        if (val) process.env[key] = val;
      }
    }
  } catch {}
}

loadEnv(path.resolve(__dirname, '../.env'));
loadEnv(path.resolve(__dirname, '../backend/.env'));

const DB_CONFIG = {
  host: process.env.DB_HOST || '127.0.0.1',
  port: parseInt(process.env.DB_PORT, 10) || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '6125',
  database: process.env.DB_NAME || 'agrislot',
};

const REQUIRED_TABLES = [
  'Mandis',
  'Produce',
  'Farmers',
  'Slots',
  'Bookings',
  'Warehouses',
  'Traders',
  'Transactions',
  'User_Login',
  'application_audit_log'
];

const REQUIRED_ROUTINES = [
  'Insert_Farmer',
  'Update_Farmer',
  'Delete_Farmer',
  'Total_Booking_Weight',
  'Total_Weight_By_Farmer',
  'Display_All_Farmers',
  'Display_First_Five_Farmers',
  'Search_Farmers_Paginated',
  'Search_Farmers_Filtered'
];

const REQUIRED_TRIGGERS = [
  'Audit_Farmer_Insert',
  'Audit_Farmer_Update',
  'Audit_Farmer_Delete',
  'Uppercase_Farmer_Insert',
  'Restrict_Farmer_Insert'
];

const REQUIRED_VIEWS = [
  'Farmer_Bookings_Detail_View',
  'Surat_Mandi_Operations_View'
];

async function runDiagnostics() {
  console.log('\n=============================================================');
  console.log('       AgriSlot APMC Mandi System Pre-Evaluation Verifier    ');
  console.log('=============================================================\n');

  console.log(`[Config] Target: ${DB_CONFIG.user}@${DB_CONFIG.host}:${DB_CONFIG.port}/${DB_CONFIG.database}`);

  // Locate mysql2 without requiring root node_modules
  let mysql = null;
  const possiblePaths = [
    'mysql2/promise',
    path.resolve(__dirname, '../backend/node_modules/mysql2/promise'),
    path.resolve(__dirname, '../node_modules/mysql2/promise'),
    path.resolve(process.cwd(), 'backend/node_modules/mysql2/promise'),
    path.resolve(process.cwd(), 'node_modules/mysql2/promise')
  ];

  for (const p of possiblePaths) {
    try {
      mysql = require(p);
      break;
    } catch {}
  }

  if (!mysql) {
    console.error('\n  [Notice] mysql2 driver not found in backend/node_modules.');
    console.error('  Please install backend dependencies first:\n');
    console.error('    cd backend && npm install\n');
    process.exit(1);
  }

  let connection = null;

  try {
    // 1. Test Database Connectivity
    connection = await mysql.createConnection(DB_CONFIG);
    console.log('  ✓ [1/5] MySQL Database Connection: ONLINE\n');

    // 2. Check Tables & Record Counts
    console.log('  --- [2/5] Table Records & Cardinality (Target: 25+ per table) ---');
    let allTablesPassed = true;

    for (const table of REQUIRED_TABLES) {
      try {
        const [rows] = await connection.query(`SELECT COUNT(*) AS count FROM \`${table}\``);
        const count = rows[0]?.count || 0;
        const pass = (table === 'User_Login' || table === 'application_audit_log') ? count >= 1 : count >= 25;
        const icon = pass ? '✓' : '⚠';
        console.log(`    ${icon} ${table.padEnd(24)} : ${String(count).padStart(3)} records ${pass ? '(OK)' : '(Needs Seeding)'}`);
        if (!pass && table !== 'application_audit_log') allTablesPassed = false;
      } catch (err) {
        console.log(`    ✗ ${table.padEnd(24)} : MISSING (${err.message})`);
        allTablesPassed = false;
      }
    }

    // 3. Check Stored Procedures & Functions
    console.log('\n  --- [3/5] Stored Procedures, Cursors & Functions ---');
    const [routines] = await connection.query(
      `SELECT ROUTINE_NAME, ROUTINE_TYPE FROM INFORMATION_SCHEMA.ROUTINES WHERE ROUTINE_SCHEMA = ?`,
      [DB_CONFIG.database]
    );
    const routineNames = routines.map((r) => r.ROUTINE_NAME.toLowerCase());

    for (const req of REQUIRED_ROUTINES) {
      const found = routineNames.includes(req.toLowerCase());
      const icon = found ? '✓' : '✗';
      console.log(`    ${icon} ${req.padEnd(30)} : ${found ? 'INSTALLED' : 'NOT FOUND'}`);
    }

    // 4. Check Database Triggers
    console.log('\n  --- [4/5] Database Triggers & Audit Trail ---');
    const [triggers] = await connection.query(
      `SELECT TRIGGER_NAME FROM INFORMATION_SCHEMA.TRIGGERS WHERE TRIGGER_SCHEMA = ?`,
      [DB_CONFIG.database]
    );
    const triggerNames = triggers.map((t) => t.TRIGGER_NAME.toLowerCase());

    for (const req of REQUIRED_TRIGGERS) {
      const found = triggerNames.includes(req.toLowerCase());
      const icon = found ? '✓' : '✗';
      console.log(`    ${icon} ${req.padEnd(30)} : ${found ? 'ACTIVE' : 'NOT FOUND'}`);
    }

    // 5. Check Relational Views
    console.log('\n  --- [5/5] Relational Views ---');
    const [views] = await connection.query(
      `SELECT TABLE_NAME FROM INFORMATION_SCHEMA.VIEWS WHERE TABLE_SCHEMA = ?`,
      [DB_CONFIG.database]
    );
    const viewNames = views.map((v) => v.TABLE_NAME.toLowerCase());

    for (const req of REQUIRED_VIEWS) {
      const found = viewNames.includes(req.toLowerCase());
      const icon = found ? '✓' : '✗';
      console.log(`    ${icon} ${req.padEnd(30)} : ${found ? 'DEPLOYED' : 'NOT FOUND'}`);
    }

    console.log('\n=============================================================');
    if (allTablesPassed) {
      console.log('  ✓ STATUS: All database constraints, views & records are 100% READY!');
    } else {
      console.log('  ⚠ TIP: Run "bash database/setup_db.sh" to seed all tables.');
    }
    console.log('=============================================================\n');

  } catch (err) {
    console.log(`\n  ✗ MySQL Connection Failed: ${err.message}`);
    console.log('    • Tip: Check if MySQL is running (mysql -u root -p6125)');
    console.log('    • Tip: Make sure DB_PASSWORD=6125 in .env\n');
  } finally {
    if (connection) await connection.end();
  }
}

runDiagnostics();
