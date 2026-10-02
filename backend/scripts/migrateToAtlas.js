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

      // Recursive helper to restore ObjectIds and Dates
      const restoreTypes = (val) => {
        if (!val || typeof val !== 'object') {
          if (typeof val === 'string' && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(val)) {
            const d = new Date(val);
            if (!isNaN(d.getTime())) return d;
          }
          return val;
        }
        if (Array.isArray(val)) {
          return val.map(restoreTypes);
        }
        const obj = {};
        for (const [k, v] of Object.entries(val)) {
          if (
            (k === '_id' || k.endsWith('Id') || k === 'category' || k === 'parent' || k === 'user') &&
            typeof v === 'string' &&
            /^[0-9a-fA-F]{24}$/.test(v)
          ) {
            try {
              obj[k] = new mongoose.Types.ObjectId(v);
              continue;
            } catch (e) {}
          }
          obj[k] = restoreTypes(v);
        }
        return obj;
      };

      const parsedDocs = data.map(restoreTypes);

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
