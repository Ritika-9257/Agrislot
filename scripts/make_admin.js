#!/usr/bin/env node
/**
 * AgriSlot - Administrative Account Provisioning Script
 * 
 * Usage:
 *   node scripts/make_admin.js <email-or-username>
 * 
 * Example:
 *   node scripts/make_admin.js myemail@gmail.com
 *   node scripts/make_admin.js gouravgodara
 */

const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const mysql = require('mysql2/promise');

async function makeAdmin() {
  const targetIdentifier = process.argv[2];

  if (!targetIdentifier || !targetIdentifier.trim()) {
    console.error('\n\x1b[31m[ERROR] Please provide an email address or username.\x1b[0m');
    console.log('\nUsage:');
    console.log('  node scripts/make_admin.js <email-or-username>\n');
    console.log('Example:');
    console.log('  node scripts/make_admin.js user@example.com\n');
    process.exit(1);
  }

  const cleanIdentifier = targetIdentifier.trim().toLowerCase();

  console.log(`\n\x1b[36mConnecting to MySQL (${process.env.DB_HOST || '127.0.0.1'}:${process.env.DB_PORT || 3306}/${process.env.DB_NAME || 'agrislot'})...\x1b[0m`);

  let connection;
  try {
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || '127.0.0.1',
      port: parseInt(process.env.DB_PORT, 10) || 3306,
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'agrislot'
    });
  } catch (err) {
    console.error(`\x1b[31m[ERROR] Failed to connect to MySQL database: ${err.message}\x1b[0m`);
    process.exit(1);
  }

  try {
    // 1. Locate the target user by Email or Username
    const [rows] = await connection.query(
      'SELECT User_ID, Username, Email, User_Role, Account_Status FROM User_Login WHERE LOWER(Email) = ? OR LOWER(Username) = ?',
      [cleanIdentifier, cleanIdentifier]
    );

    if (rows.length === 0) {
      console.error(`\n\x1b[31m[ERROR] No account found with email or username: '${targetIdentifier}'\x1b[0m`);
      console.log('\x1b[33mTo assign admin access to your email:\x1b[0m');
      console.log('  1. Open http://localhost:3000 in your browser.');
      console.log('  2. Click "Log In" -> "Create Account" or "Sign in with Google" using your email.');
      console.log('  3. Re-run this command: node scripts/make_admin.js ' + targetIdentifier + '\n');
      process.exit(1);
    }

    const user = rows[0];

    if (user.User_Role === 'Admin') {
      console.log(`\n\x1b[33m[INFO] User '${user.Username}' (${user.Email || 'No email'}) is ALREADY an Administrator.\x1b[0m\n`);
      process.exit(0);
    }

    const previousRole = user.User_Role;

    // 2. Update role to Admin
    await connection.query(
      'UPDATE User_Login SET User_Role = "Admin" WHERE User_ID = ?',
      [user.User_ID]
    );

    // 3. Insert audit log record
    try {
      await connection.query(
        `INSERT INTO application_audit_log (table_name, operation_type, record_id, old_data, new_data, changed_by)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [
          'User_Login',
          'ADMIN_ELEVATION_CLI',
          String(user.User_ID),
          JSON.stringify({ role: previousRole }),
          JSON.stringify({ role: 'Admin', email: user.Email, username: user.Username }),
          'CLI_SETUP_SCRIPT'
        ]
      );
    } catch {
      // Audit log table might be optional
    }

    console.log('\n\x1b[32m======================================================================\x1b[0m');
    console.log(`\x1b[32m  ✓ SUCCESS: Administrator privileges granted to ${user.Email || user.Username}!\x1b[0m`);
    console.log('\x1b[32m======================================================================\x1b[0m');
    console.log(`  User ID:       ${user.User_ID}`);
    console.log(`  Username:      ${user.Username}`);
    console.log(`  Email:         ${user.Email || '(not set)'}`);
    console.log(`  Previous Role: ${previousRole}`);
    console.log(`  New Role:      \x1b[32mAdmin\x1b[0m`);
    console.log('\n\x1b[36mNext Steps:\x1b[0m');
    console.log('  1. Open http://localhost:3000 in your browser.');
    console.log('  2. Sign in with this email account.');
    console.log('  3. You will have full access to the Mandi Officer Desk at http://localhost:3000/admin\n');

  } catch (err) {
    console.error(`\x1b[31m[ERROR] Operation failed: ${err.message}\x1b[0m`);
    process.exit(1);
  } finally {
    await connection.end();
  }
}

makeAdmin();
