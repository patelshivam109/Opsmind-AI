require('dotenv').config();
const { MongoClient } = require('mongodb');

async function run() {
  const client = new MongoClient(process.env.MONGO_URI);
  await client.connect();
  console.log('Connected.');

  const db = client.db();
  const users = db.collection('users');

  
  const all = await users.find({}, { projection: { email: 1, role: 1, name: 1 } }).toArray();
  console.log('\nAll users in DB:');
  all.forEach(u => console.log(' -', u.email, '|', u.role));

  
  const result = await users.updateOne(
    { email: 'admin@opsmind.ai' },
    { $set: { role: 'admin' } }
  );
  console.log('\nUpdate matched:', result.matchedCount, '| modified:', result.modifiedCount);

  
  const verify = await users.findOne({ email: 'admin@opsmind.ai' });
  console.log('\nVerified role:', verify?.role);

  await client.close();
  console.log('\n✅ Done.');
}

run().catch(console.error);
