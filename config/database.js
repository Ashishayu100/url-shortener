const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI);

    console.log('✅ MongoDB Connected Successfully');
    console.log('🔹 Host:', conn.connection.host);
    console.log('🔹 Database:', conn.connection.name);
  } catch (error) {
    console.error('❌ MongoDB Connection Failed:', error.message);
    process.exit(1); // exit process with failure
  }
};

module.exports = connectDB;
