const { MongoClient } = require('mongodb');
require('dotenv').config();

const faqs = [
  {
    question: "How can I track my parcel?",
    answer: "You can track your parcel by entering your unique tracking ID on our 'Track Shipment' page. This will provide you with real-time updates on your parcel's current location and status.",
    order: 1,
    category: "Tracking",
    isActive: true,
    helpfulCount: Math.floor(Math.random() * 50),
    createdAt: new Date().toISOString()
  },
  {
    question: "What are your delivery hours?",
    answer: "Our standard delivery hours are from 9:00 AM to 8:00 PM, Saturday through Thursday. Special weekend deliveries are available for express shipments in major city hubs.",
    order: 2,
    category: "Delivery",
    isActive: true,
    helpfulCount: Math.floor(Math.random() * 50),
    createdAt: new Date().toISOString()
  },
  {
    question: "How is the delivery fee calculated?",
    answer: "Delivery fees are calculated based on three factors: the parcel's weight, the delivery distance, and the selected service type (Express vs. Standard). Our base fare starts as low as 60 BDT.",
    order: 3,
    category: "Pricing",
    isActive: true,
    helpfulCount: Math.floor(Math.random() * 50),
    createdAt: new Date().toISOString()
  },
  {
    question: "Do you offer international shipping?",
    answer: "Currently, Gram2City focuses on connecting villages to cities within the country. However, we are planning to launch cross-border logistics services in the near future. Stay tuned!",
    order: 4,
    category: "Service Area",
    isActive: true,
    helpfulCount: Math.floor(Math.random() * 50),
    createdAt: new Date().toISOString()
  },
  {
    question: "What should I do if my parcel is delayed?",
    answer: "If your parcel hasn't arrived within the estimated delivery window, please check the tracking status first. If there's no update for over 24 hours, contact our 24/7 support line for immediate assistance.",
    order: 5,
    category: "Support",
    isActive: true,
    helpfulCount: Math.floor(Math.random() * 50),
    createdAt: new Date().toISOString()
  },
  {
    question: "Can I change the delivery address after the parcel is picked up?",
    answer: "Yes, you can request an address change through our app or by calling support. Please note that changing the destination may affect the delivery time and cost.",
    order: 6,
    category: "Modification",
    isActive: true,
    helpfulCount: Math.floor(Math.random() * 50),
    createdAt: new Date().toISOString()
  }
];

async function seedFAQs() {
  const client = new MongoClient(process.env.MONGODB_URI);
  try {
    await client.connect();
    const db = client.db(process.env.DB_NAME);
    const faqsCollection = db.collection('faqs');

    console.log('--- FAQ Seeding Started ---');
    
    // Clear existing FAQs to avoid duplicates during testing
    await faqsCollection.deleteMany({});
    console.log('Cleared existing FAQs.');

    await faqsCollection.insertMany(faqs);
    console.log(`Successfully seeded ${faqs.length} FAQs.`);

    console.log('--- FAQ Seeding Complete ---');
  } catch (error) {
    console.error('Error seeding FAQs:', error);
  } finally {
    await client.close();
  }
}

seedFAQs();
