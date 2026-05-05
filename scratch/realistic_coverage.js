const { MongoClient } = require('mongodb');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../gram2city-server/.env') });

async function updateCoverage() {
  const uri = process.env.MONGODB_URI;
  const client = new MongoClient(uri);

  try {
    await client.connect();
    const db = client.db(process.env.DB_NAME);
    const collection = db.collection('warehouses');

    // 1. Reset all to 'coming-soon'
    await collection.updateMany({}, { $set: { status: 'coming-soon' } });

    // 2. Set Major Hubs to 'active'
    const activeDistricts = [
      'Dhaka', 'Chattogram', 'Sylhet', 'Rajshahi', 
      'Khulna', 'Barisal', 'Rangpur', 'Mymensingh', 
      'Gazipur', 'Narayanganj', "Cox's Bazar"
    ];
    await collection.updateMany(
      { district: { $in: activeDistricts } }, 
      { $set: { status: 'active' } }
    );

    // 3. Set Tier 2 to 'limited'
    const limitedDistricts = [
      'Cumilla', 'Bogura', 'Jessore', 'Feni', 'Tangail', 'Narsingdi'
    ];
    await collection.updateMany(
      { district: { $in: limitedDistricts } }, 
      { $set: { status: 'limited' } }
    );

    console.log('✅ Realistic coverage tiers applied successfully.');
  } catch (error) {
    console.error('❌ Update failed:', error);
  } finally {
    await client.close();
  }
}

updateCoverage();
