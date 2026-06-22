/**
 * makeAdmin.js
 * Usage:
 *   node scripts/makeAdmin.js                     → creates default admin
 *   node scripts/makeAdmin.js you@company.com     → promotes existing user to admin
 */

require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../src/models/User');

const MONGO_URI = process.env.MONGO_URI;
const targetEmail = process.argv[2] || 'admin@opsmind.ai';
const defaultPassword = 'Admin@123';

async function run() {
  console.log('\n🔧 OpsMind AI — Admin Setup\n');
  await mongoose.connect(MONGO_URI);
  console.log('✅ Connected to MongoDB\n');

  let user = await User.findOne({ email: targetEmail });

  if (user) {
   
    user.role = 'admin';
    await user.save();
    console.log(`✅ Promoted existing user to admin:`);
    console.log(`   Email : ${user.email}`);
    console.log(`   Name  : ${user.name}`);
    console.log(`   Role  : ${user.role}`);
  } else {
    // Create a new admin account
    user = new User({
      name: 'Admin',
      email: targetEmail,
      password: defaultPassword,
      role: 'admin',
    });
    await user.save();
    console.log(`✅ Created new admin account:`);
    console.log(`   Email    : ${targetEmail}`);
    console.log(`   Password : ${defaultPassword}`);
    console.log(`   Role     : admin`);
    console.log(`\n⚠️  Change the password after first login!`);
  }

  console.log('\n🚀 You can now sign in at http://localhost:5173\n');
  await mongoose.disconnect();
}

run().catch((err) => {
  console.error('❌ Error:', err.message);
  process.exit(1);
});
