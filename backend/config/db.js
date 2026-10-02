const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(
      process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/pho_hang_ma',
      {
        maxPoolSize: 25, // Tối ưu connection pool cho xử lý đồng thời
        minPoolSize: 5,  // Duy trì sẵn kết nối để giảm độ trễ khởi tạo
        serverSelectionTimeoutMS: 5000,
        socketTimeoutMS: 45000,
        autoIndex: process.env.NODE_ENV !== 'production', // Chỉ auto build index khi dev
      }
    );

    console.log(`✅ MongoDB Connected: ${conn.connection.host}/${conn.connection.name} (Pool: 5-25)`);

    mongoose.connection.on('error', (err) => {
      console.error(`❌ MongoDB connection error: ${err.message}`);
    });

    mongoose.connection.on('disconnected', () => {
      console.warn('⚠️ MongoDB connection lost. Trying to reconnect...');
    });

    mongoose.connection.on('reconnected', () => {
      console.log('🔄 MongoDB reconnected successfully');
    });
  } catch (error) {
    console.error(`❌ Error connecting to MongoDB: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;
