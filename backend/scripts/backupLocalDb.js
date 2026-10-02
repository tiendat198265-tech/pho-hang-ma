const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');

const BACKUP_DIR = path.join(__dirname, '../backup');

async function backup() {
  try {
    if (!fs.existsSync(BACKUP_DIR)) {
      fs.mkdirSync(BACKUP_DIR, { recursive: true });
    }

    const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/pho_hang_ma';
    console.log(`Connecting to local MongoDB: ${uri}`);
    await mongoose.connect(uri);

    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log(`Found ${collections.length} collections.`);

    const manifest = {};

    for (const col of collections) {
      const colName = col.name;
      if (colName.startsWith('system.')) continue;

      const docs = await mongoose.connection.db.collection(colName).find({}).toArray();
      const filePath = path.join(BACKUP_DIR, `${colName}.json`);
      fs.writeFileSync(filePath, JSON.stringify(docs, null, 2), 'utf-8');
      console.log(`✓ Exported ${colName}: ${docs.length} documents -> ${filePath}`);
      manifest[colName] = docs.length;
    }

    fs.writeFileSync(
      path.join(BACKUP_DIR, 'manifest.json'),
      JSON.stringify({ exportedAt: new Date().toISOString(), collections: manifest }, null, 2),
      'utf-8'
    );

    console.log('✅ Local MongoDB backup completed successfully!');
  } catch (err) {
    console.error('❌ Backup failed:', err);
  } finally {
    await mongoose.disconnect();
  }
}

backup();
