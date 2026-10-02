const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config();

const BACKUP_DIR = path.join(__dirname, '../backup');

async function migrate() {
  const targetUri = process.env.TARGET_MONGODB_URI || process.env.MONGODB_URI;

  if (!targetUri || targetUri.includes('127.0.0.1') || targetUri.includes('localhost')) {
    console.error('❌ Please specify a valid remote MongoDB connection string via TARGET_MONGODB_URI or MONGODB_URI environment variable.');
    console.error('Example: TARGET_MONGODB_URI="mongodb+srv://user:pass@cluster.mongodb.net/pho_hang_ma?retryWrites=true&w=majority" node scripts/migrateToAtlas.js');
    process.exit(1);
  }

  try {
    console.log(`Connecting to Target MongoDB Cluster...`);
    await mongoose.connect(targetUri);
    console.log(`✅ Connected successfully to: ${mongoose.connection.host}/${mongoose.connection.name}`);

    if (!fs.existsSync(BACKUP_DIR)) {
      console.error(`❌ Backup directory not found at ${BACKUP_DIR}. Please run backupLocalDb.js first.`);
      process.exit(1);
    }

    const files = fs.readdirSync(BACKUP_DIR).filter((f) => f.endsWith('.json') && f !== 'manifest.json');
    console.log(`Found ${files.length} collection dumps to migrate.`);

    for (const file of files) {
      const colName = path.basename(file, '.json');
      const filePath = path.join(BACKUP_DIR, file);
      const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));

      if (!Array.isArray(data) || data.length === 0) {
        console.log(`- Skipping ${colName} (0 documents)`);
        continue;
      }

      // Convert raw string dates / ObjectIds
      const parsedDocs = data.map((doc) => {
        const item = { ...doc };
        if (item._id && typeof item._id === 'string' && item._id.length === 24) {
          try { item._id = new mongoose.Types.ObjectId(item._id); } catch (e) {}
        }
        return item;
      });

      const col = mongoose.connection.db.collection(colName);
      
      // Clean existing target collection safely
      await col.deleteMany({});
      await col.insertMany(parsedDocs);

      console.log(`✓ Restored ${colName}: ${parsedDocs.length} documents into target DB.`);
    }

    console.log('\n🎉 ALL DATA MIGRATED TO TARGET MONGODB ATLAS SUCCESSFULLY!');
  } catch (err) {
    console.error('❌ Migration failed:', err);
  } finally {
    await mongoose.disconnect();
  }
}

migrate();
