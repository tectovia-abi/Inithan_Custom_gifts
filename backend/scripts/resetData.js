const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '..', '.env') });

async function resetDB() {
  console.log('Connecting to MongoDB Atlas...');
  await mongoose.connect(process.env.MONGO_URI);
  console.log('Connected successfully.');

  const db = mongoose.connection.db;

  // 1. Delete all login logs
  const logsRes = await db.collection('loginlogs').deleteMany({});
  console.log('Login logs deleted:', logsRes.deletedCount);

  // 2. Delete all orders
  const ordersRes = await db.collection('orders').deleteMany({});
  console.log('Orders deleted:', ordersRes.deletedCount);

  // 3. Delete all bulk inquiries
  const inquiriesRes = await db.collection('bulkinquiries').deleteMany({});
  console.log('Bulk inquiries deleted:', inquiriesRes.deletedCount);

  // 4. Delete non-admin users only (keep isAdmin: true)
  const usersRes = await db.collection('users').deleteMany({ isAdmin: { $ne: true } });
  console.log('Non-admin users deleted:', usersRes.deletedCount);

  // 5. Delete products
  const productsRes = await db.collection('products').deleteMany({});
  console.log('Products deleted:', productsRes.deletedCount);

  // 6. Delete offers
  const offersRes = await db.collection('offers').deleteMany({});
  console.log('Offers deleted:', offersRes.deletedCount);

  // Verification
  console.log('\n--- Final Database Status ---');
  const collections = await db.listCollections().toArray();
  for (const c of collections) {
    const count = await db.collection(c.name).countDocuments();
    console.log(`${c.name}: ${count}`);
  }

  const remainingUsers = await db.collection('users').find({}, { projection: { password: 0 } }).toArray();
  console.log('\nActive Admin User:');
  console.log(JSON.stringify(remainingUsers, null, 2));

  await mongoose.disconnect();
  console.log('\nDisconnected cleanly.');
}

resetDB().catch((err) => {
  console.error('Reset error:', err);
  process.exit(1);
});
