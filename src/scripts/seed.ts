import admin from 'firebase-admin';
import { usersCollection, ridersCollection, merchantsCollection, initDB } from '../db/db';
import { config } from '../config';

// Initialize Firebase Admin if not initialized
if (!admin.apps.length) {
  if (config.FB_SERVICE_KEY) {
    const serviceAccount = JSON.parse(
      Buffer.from(config.FB_SERVICE_KEY, 'base64').toString('utf8'),
    );
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
  } else {
    console.error('❌ FB_SERVICE_KEY is missing in env!');
    process.exit(1);
  }
}

const demoAccounts = [
  {
    email: 'admin@gram2city.com',
    password: 'Admin123!',
    displayName: 'Gram2City Super Admin',
    role: 'admin',
  },
  {
    email: 'rider@gram2city.com',
    password: 'Rider123!',
    displayName: 'Rahim (Gram Rider)',
    role: 'rider',
    phone: '01711002233',
    vehicle: 'Bike',
  },
  {
    email: 'merchant@gram2city.com',
    password: 'Merchant123!',
    displayName: 'Organic BD Shop',
    role: 'merchant',
    phone: '01822334455',
  },
  {
    email: 'user@gram2city.com',
    password: 'User123!',
    displayName: 'Anisur Rahman',
    role: 'user',
  },
];

async function seed() {
  console.log('🌱 Initializing Database Connection & Indexing...');
  await initDB();

  for (const account of demoAccounts) {
    let firebaseUser;
    try {
      firebaseUser = await admin.auth().getUserByEmail(account.email);
      await admin.auth().updateUser(firebaseUser.uid, {
        password: account.password,
        displayName: account.displayName,
      });
      console.log(`✅ Firebase user updated: ${account.email}`);
    } catch {
      try {
        firebaseUser = await admin.auth().createUser({
          email: account.email,
          password: account.password,
          displayName: account.displayName,
        });
        console.log(`✨ Firebase user created: ${account.email}`);
      } catch (e) {
        console.warn(`Firebase user skip/notice for ${account.email}`);
      }
    }

    const bcrypt = await import('bcryptjs');
    const hashedPassword = await bcrypt.hash(account.password, 10);

    // Upsert User in MongoDB usersCollection with hashed password
    await usersCollection.updateOne(
      { email: account.email },
      {
        $set: {
          email: account.email,
          password: hashedPassword,
          name: account.displayName,
          role: account.role as any,
          photoURL: `https://api.dicebear.com/7.x/lorelei/svg?seed=${account.role}`,
          isProfileComplete: true,
          updatedAt: new Date(),
        },
        $setOnInsert: {
          createdAt: new Date(),
        },
      },
      { upsert: true },
    );

    // Role-specific records
    if (account.role === 'rider') {
      await ridersCollection.updateOne(
        { email: account.email },
        {
          $set: {
            email: account.email,
            name: account.displayName,
            phone: account.phone,
            vehicle: account.vehicle,
            status: 'approved',
            workStatus: 'available',
            totalEarnings: 4500,
            cashoutPending: 0,
            updatedAt: new Date(),
          },
          $setOnInsert: {
            createdAt: new Date(),
          },
        },
        { upsert: true },
      );
    }

    if (account.role === 'merchant') {
      await merchantsCollection.updateOne(
        { email: account.email },
        {
          $set: {
            email: account.email,
            storeName: account.displayName,
            phone: account.phone,
            status: 'approved',
            codBalance: 12500,
            updatedAt: new Date().toISOString() as any,
          },
          $setOnInsert: {
            createdAt: new Date().toISOString() as any,
          },
        },
        { upsert: true },
      );
    }
  }

  console.log('🎉 Demo Seed Completed Successfully!');
  process.exit(0);
}

seed().catch((err) => {
  console.error('❌ Seed error:', err);
  process.exit(1);
});
