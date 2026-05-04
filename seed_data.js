const { MongoClient, ObjectId } = require('mongodb');
require('dotenv').config();

const districts = ['Dhaka', 'Chittagong', 'Sylhet', 'Rajshahi', 'Khulna', 'Barisal', 'Rangpur', 'Mymensingh'];
const parcelTypes = ['Document', 'Not-Document'];
const statuses = ['pending', 'assigned', 'on_the_way', 'delivered', 'cancelled'];

async function seed() {
  const client = new MongoClient(process.env.MONGODB_URI);
  try {
    await client.connect();
    const db = client.db(process.env.DB_NAME);
    
    const usersCollection = db.collection('users');
    const ridersCollection = db.collection('riders');
    const parcelCollection = db.collection('parcels');
    const paymentCollection = db.collection('payments');
    const auditCollection = db.collection('audit_logs');

    console.log('--- Comprehensive Seeding Started ---');

    // 1. Clear some collections if you want a fresh start, 
    // but here we just append to avoid breaking existing user logins.

    // 2. Ensure we have at least 10 riders
    const riderCount = await ridersCollection.countDocuments();
    if (riderCount < 10) {
        const mockRiders = Array.from({ length: 10 - riderCount }).map((_, i) => ({
            name: `Rider ${i + riderCount + 1}`,
            email: `rider${i + riderCount + 1}@gram2city.com`,
            phone: `01711000${i + riderCount + 10}`,
            district: districts[Math.floor(Math.random() * districts.length)],
            status: 'approved',
            total_delivered: Math.floor(Math.random() * 50),
            average_rating: (Math.random() * 1) + 4,
            created_at: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
        }));
        await ridersCollection.insertMany(mockRiders);
        console.log(`Added ${mockRiders.length} mock riders.`);
    }

    const riders = await ridersCollection.find().toArray();

    // 3. Generate 100 random parcels over the last 30 days
    const mockParcels = [];
    for (let i = 0; i < 100; i++) {
        const daysAgo = Math.floor(Math.random() * 30);
        const creationDate = new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000);
        const status = statuses[Math.floor(Math.random() * statuses.length)];
        const cost = Math.floor(Math.random() * 500) + 100;
        const weight = Math.floor(Math.random() * 5) + 1;
        
        const parcel = {
            trackingId: `G2C-${Math.random().toString(36).substring(2, 9).toUpperCase()}`,
            parcelName: `Item ${i + 1}`,
            parcelType: parcelTypes[Math.floor(Math.random() * parcelTypes.length)],
            parcelWeight: weight,
            senderName: `Customer ${Math.floor(Math.random() * 50)}`,
            senderEmail: `user${Math.floor(Math.random() * 50)}@example.com`,
            receiverName: `Receiver ${i}`,
            receiverPhoneNumber: `01800000${i.toString().padStart(3, '0')}`,
            receiverDistrict: districts[Math.floor(Math.random() * districts.length)],
            deliveryAddress: `${Math.floor(Math.random() * 100)} Main St, ${districts[Math.floor(Math.random() * districts.length)]}`,
            deliveryDate: new Date(creationDate.getTime() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            delivery_status: status,
            creation_date: creationDate.toISOString(),
            createdAt: creationDate.toISOString(),
            cost: cost,
            price: cost,
            admin_profit: cost * 0.15,
            rider_earning: cost * 0.85,
            payment_status: status === 'delivered' ? 'paid' : 'pending'
        };

        if (status !== 'pending') {
            const rider = riders[Math.floor(Math.random() * riders.length)];
            parcel.assigned_rider_id = rider._id;
            parcel.assigned_rider_name = rider.name;
            parcel.assigned_rider_email = rider.email;
        }

        if (status === 'delivered') {
            parcel.delivered_at = new Date(creationDate.getTime() + (Math.random() * 48 + 24) * 60 * 60 * 1000).toISOString();
        }

        mockParcels.push(parcel);
    }

    await parcelCollection.insertMany(mockParcels);
    console.log(`Generated 100 mock parcels.`);

    // 4. Generate Payments for paid parcels
    const paidParcels = await parcelCollection.find({ payment_status: 'paid' }).toArray();
    const mockPayments = paidParcels.map(p => ({
        transactionId: `TXN-${Math.random().toString(36).substring(2, 10).toUpperCase()}`,
        amount: p.cost,
        currency: 'bdt',
        status: 'succeeded',
        userEmail: p.senderEmail,
        parcelId: p._id,
        createdAt: p.delivered_at || p.creation_date
    }));

    if (mockPayments.length > 0) {
        await paymentCollection.insertMany(mockPayments);
        console.log(`Generated ${mockPayments.length} payment records.`);
    }

    // 5. Audit Logs
    const mockLogs = Array.from({ length: 20 }).map((_, i) => ({
        admin_email: 'admin@gram2city.com',
        action: 'SYSTEM_GEN_SEED',
        details: `Bulk data generation for testing - Step ${i}`,
        timestamp: new Date().toISOString()
    }));
    await auditCollection.insertMany(mockLogs);

    console.log('--- Seeding Complete ---');
  } catch (error) {
    console.error('Error seeding data:', error);
  } finally {
    await client.close();
  }
}

seed();
