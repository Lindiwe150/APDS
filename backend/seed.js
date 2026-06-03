const mongoose = require('mongoose');
require('dotenv').config();
const User = require('./models/User');

const users = [
  {
    fullName: 'Lindiwe Chauke',
    idNumber: '9901015800086',
    accountNumber: '1054083600',
    username: 'Lindiwe',
    password: 'Lindiwe@0701',
    role: 'employee'
  },
  {
    fullName: 'John Ndlovu',
    idNumber: '9505025800081',
    accountNumber: '2067891234',
    username: 'JohnN',
    password: 'John@2024!',
    role: 'customer'
  },
  {
    fullName: 'Sarah Mokoena',
    idNumber: '9803015800083',
    accountNumber: '3078901234',
    username: 'SarahM',
    password: 'Sarah@2024!',
    role: 'customer'
  }
];

async function seed() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    await User.deleteMany({});
    console.log('Cleared existing users');

    for (const userData of users) {
      const user = new User(userData);
      await user.save();
      console.log(`Created ${user.role}: ${user.username} (${user.accountNumber})`);
    }

    console.log('\nSeed complete. Credentials:');
    console.log('─'.repeat(50));
    users.forEach(u => {
      console.log(`  ${u.role.toUpperCase()}: ${u.username} | Account: ${u.accountNumber} | Pass: ${u.password}`);
    });

    process.exit(0);
  } catch (err) {
    console.error('Seed failed:', err.message);
    process.exit(1);
  }
}

seed();
