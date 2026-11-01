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
    database: process.env.DB_NAME || 'agrislot',
    multipleStatements: true
  });

  console.log('1. Creating User_Login table...');
  await conn.query(`
    CREATE TABLE IF NOT EXISTS User_Login (
      User_ID INT AUTO_INCREMENT PRIMARY KEY,
      Username VARCHAR(100) NOT NULL UNIQUE,
      Password_Hash VARCHAR(255) NOT NULL,
      User_Role ENUM('Admin', 'Mandi_Officer', 'Trader', 'Farmer') NOT NULL DEFAULT 'Farmer',
      Account_Status ENUM('Active', 'Suspended', 'Inactive') NOT NULL DEFAULT 'Active',
      Google_Sub VARCHAR(100) UNIQUE NULL,
      Email VARCHAR(150) UNIQUE NULL,
      Full_Name VARCHAR(150) NULL,
      Avatar_Url VARCHAR(500) NULL,
      Farmer_ID INT NULL,
      Created_At TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      Last_Login TIMESTAMP NULL,
      INDEX idx_user_google_sub (Google_Sub),
      INDEX idx_user_email (Email),
      CONSTRAINT fk_user_farmer
          FOREIGN KEY (Farmer_ID)
          REFERENCES Farmers(Farmer_ID)
          ON DELETE SET NULL
    );
  `);

  console.log('2. Creating application_audit_log table...');
  await conn.query(`
    CREATE TABLE IF NOT EXISTS application_audit_log (
      Audit_ID INT AUTO_INCREMENT PRIMARY KEY,
      Table_Name VARCHAR(50) NOT NULL,
      Operation_Type VARCHAR(20) NOT NULL,
      Record_ID VARCHAR(50) NOT NULL,
      Old_Data JSON NULL,
      New_Data JSON NULL,
      Changed_By VARCHAR(100) NULL,
      Changed_At TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);

  console.log('3. Creating notifications table...');
  await conn.query(`
    CREATE TABLE IF NOT EXISTS notifications (
      Notification_ID INT AUTO_INCREMENT PRIMARY KEY,
      User_ID INT NULL,
      Farmer_ID INT NULL,
      Title VARCHAR(150) NOT NULL,
      Message TEXT NOT NULL,
      Type VARCHAR(50) DEFAULT 'INFO',
      Related_Entity_Type VARCHAR(50) NULL,
      Related_Entity_ID VARCHAR(50) NULL,
      Is_Read BOOLEAN DEFAULT FALSE,
      Created_At TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_notif_farmer (Farmer_ID),
      INDEX idx_notif_user (User_ID),
      INDEX idx_notif_read (Is_Read)
    );
  `);

  console.log('4. Seeding default users (admin, officer, farmer)...');
  await conn.query(`
    INSERT INTO User_Login (Username, Password_Hash, User_Role, Account_Status)
    VALUES 
    ('admin', '$2a$10$AOon9VKAk6jpNK565cxwv.bUMfcumCdP5HYKdPMg9VhmFvxbIuGii', 'Admin', 'Active'),
    ('officer', '$2a$10$A96Vwg4xrirPXMosjCFI3OgopW9fjDZKzHx8RoAsd6XUfLCWdENuG', 'Mandi_Officer', 'Active'),
    ('farmer', '$2a$10$JcuhIdBWuyALP7WW1fsxUeF823ppAd6qqxbmfNslm5OPSndq9E.ty', 'Farmer', 'Active')
    ON DUPLICATE KEY UPDATE Password_Hash = VALUES(Password_Hash), User_Role = VALUES(User_Role);
  `);

  // Link farmer user to Farmer_ID 1 if exists
  await conn.query(`
    UPDATE User_Login SET Farmer_ID = 1 WHERE Username = 'farmer' AND Farmer_ID IS NULL;
  `);

  console.log('5. Creating Views...');
  await conn.query(`
    CREATE OR REPLACE VIEW Farmer_Bookings_Detail_View AS
    SELECT 
        b.Booking_ID,
        b.Token_Number,
        b.Booking_Status,
        b.Estimated_Weight_Tons,
        b.Created_At,
        f.Farmer_ID,
        f.Name AS Farmer_Name,
        f.Phone AS Farmer_Phone,
        f.Village AS Farmer_Village,
        s.Slot_ID,
        s.Slot_Date,
        s.Start_Time,
        s.End_Time,
        m.Mandi_ID,
        m.Mandi_Name,
        m.District AS Mandi_District,
        p.Produce_Name
    FROM Bookings b
    JOIN Farmers f ON b.Farmer_ID = f.Farmer_ID
    JOIN Slots s ON b.Slot_ID = s.Slot_ID
    JOIN Mandis m ON s.Mandi_ID = m.Mandi_ID
    JOIN Produce p ON b.Produce_ID = p.Produce_ID;
  `);

  await conn.query(`
    CREATE OR REPLACE VIEW Surat_Mandi_Operations_View AS
    SELECT 
        m.Mandi_ID,
        m.Mandi_Name,
        m.District,
        s.Slot_ID,
        s.Slot_Date,
        s.Start_Time,
        s.End_Time,
        s.Max_Capacity_Tons,
        s.Booked_Capacity_Tons,
        (s.Max_Capacity_Tons - s.Booked_Capacity_Tons) AS Remaining_Capacity_Tons
    FROM Mandis m
    JOIN Slots s ON m.Mandi_ID = s.Mandi_ID
    WHERE m.District = 'Surat';
  `);

  console.log('6. Creating Display_Surat_Operations_View procedure...');
  await conn.query(`DROP PROCEDURE IF EXISTS Display_Surat_Operations_View`);
  await conn.query(`
    CREATE PROCEDURE Display_Surat_Operations_View()
    BEGIN
        SELECT * FROM Surat_Mandi_Operations_View;
    END;
  `);

  console.log('7. Attempting triggers with try/catch...');
  try {
    await conn.query(`DROP TRIGGER IF EXISTS Uppercase_Farmer_Insert`);
    await conn.query(`
      CREATE TRIGGER Uppercase_Farmer_Insert
      BEFORE INSERT ON Farmers
      FOR EACH ROW
      BEGIN
          SET NEW.Name = UPPER(TRIM(NEW.Name));
          IF NEW.Village IS NOT NULL THEN
              SET NEW.Village = UPPER(TRIM(NEW.Village));
          END IF;
      END;
    `);
    console.log('   Trigger Uppercase_Farmer_Insert created.');
  } catch (err) {
    console.log('   Notice on Uppercase_Farmer_Insert:', err.message);
  }

  try {
    await conn.query(`DROP TRIGGER IF EXISTS Validate_Booking_Slot_Capacity`);
    await conn.query(`
      CREATE TRIGGER Validate_Booking_Slot_Capacity
      BEFORE INSERT ON Bookings
      FOR EACH ROW
      BEGIN
          DECLARE v_Remaining DECIMAL(8,2);
          SELECT (Max_Capacity_Tons - Booked_Capacity_Tons)
          INTO v_Remaining
          FROM Slots
          WHERE Slot_ID = NEW.Slot_ID;
          
          IF v_Remaining IS NULL THEN
              SIGNAL SQLSTATE '45000'
                  SET MESSAGE_TEXT = 'Specified Slot ID does not exist';
          ELSEIF NEW.Estimated_Weight_Tons > v_Remaining THEN
              SIGNAL SQLSTATE '45000'
                  SET MESSAGE_TEXT = 'Estimated weight exceeds remaining slot capacity';
          END IF;
      END;
    `);
    console.log('   Trigger Validate_Booking_Slot_Capacity created.');
  } catch (err) {
    console.log('   Notice on Validate_Booking_Slot_Capacity:', err.message);
  }

  console.log('9. Creating Composite Indexes if missing...');
  const indexes = [
    { name: 'idx_bookings_farmer_slot', table: 'Bookings', cols: '(Farmer_ID, Slot_ID)' },
    { name: 'idx_slots_mandi_date', table: 'Slots', cols: '(Mandi_ID, Slot_Date)' },
    { name: 'idx_farmers_village', table: 'Farmers', cols: '(Village)' },
    { name: 'idx_transactions_payment_status', table: 'Transactions', cols: '(Payment_Status)' },
    { name: 'idx_mandis_district', table: 'Mandis', cols: '(District)' }
  ];

  for (const idx of indexes) {
    try {
      await conn.query(`CREATE INDEX ${idx.name} ON ${idx.table} ${idx.cols}`);
      console.log(`   Created index ${idx.name}`);
    } catch (e) {
      if (e.code === 'ER_DUP_KEYNAME') {
        console.log(`   Index ${idx.name} already exists`);
      } else {
        console.log(`   Notice for index ${idx.name}: ${e.message}`);
      }
    }
  }

  console.log('\nAll missing schema components deployed successfully!');
  await conn.end();
})();
