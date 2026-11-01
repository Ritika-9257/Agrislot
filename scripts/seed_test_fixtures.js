const mysql = require('mysql2/promise');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: path.resolve(__dirname, '../.env') });

(async () => {
  const conn = await mysql.createConnection({
    host: process.env.DB_HOST || '127.0.0.1',
    port: parseInt(process.env.DB_PORT, 10) || 3306,
    user: process.env.DB_USER || 'agrislot_dba',
    password: process.env.DB_PASSWORD || 'DbaDemo_123!',
    database: process.env.DB_NAME || 'agrislot'
  });

  console.log('Seeding Farmer 31...');
  await conn.query(`
    INSERT INTO Farmers (Farmer_ID, Name, Phone, Aadhar_No, UPI_ID, Village)
    VALUES (31, 'Vikram Singhania', '9988011223', '998801122334', 'vikram@upi', 'Surat')
    ON DUPLICATE KEY UPDATE Name = VALUES(Name), Phone = VALUES(Phone)
  `);

  console.log('Seeding User_Login for Farmer 31...');
  await conn.query(`
    INSERT INTO User_Login (User_ID, Username, Password_Hash, User_Role, Account_Status, Farmer_ID)
    VALUES (10, '9988011223', '$2a$10$AOon9VKAk6jpNK565cxwv.bUMfcumCdP5HYKdPMg9VhmFvxbIuGii', 'Farmer', 'Active', 31)
    ON DUPLICATE KEY UPDATE Farmer_ID = 31, Account_Status = 'Active'
  `);

  console.log('Seeding future slots 26 to 35...');
  const futureDate = '2026-11-15';
  for (let id = 26; id <= 35; id++) {
    await conn.query(`
      INSERT INTO Slots (Slot_ID, Mandi_ID, Slot_Date, Start_Time, End_Time, Max_Capacity_Tons, Booked_Capacity_Tons)
      VALUES (?, 1, ?, '08:00:00', '12:00:00', 50.00, 0.00)
      ON DUPLICATE KEY UPDATE Slot_Date = VALUES(Slot_Date), Booked_Capacity_Tons = 0.00
    `, [id, futureDate]);
  }

  console.log('Test fixtures ready!');
  await conn.end();
})();
