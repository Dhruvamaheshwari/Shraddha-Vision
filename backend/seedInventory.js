const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Dealer = require('./models/Dealer');
const LensInventory = require('./models/LensInventory');

dotenv.config();

mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/nayan')
  .then(async () => {
    console.log('Connected to MongoDB');
    
    // Clear existing data
    await Dealer.deleteMany({});
    await LensInventory.deleteMany({});
    console.log('Cleared existing Dealers and LensInventory');

    // Create Dealer
    const dealer = await Dealer.create({
      name: 'Rajesh ji',
      whatsappNumber: '919876543210',
      companyName: 'OptiLens India',
      address: 'Mumbai',
    });
    console.log('Created Dealer:', dealer.name);

    // Create Inventory
    const lenses = [
      { material: '1.60 Blue-cut', variant: 'Medium', currentStock: 12, threshold: 20, dealer: dealer._id },
      { material: 'Photochromic Brown', variant: '1.56', currentStock: 7, threshold: 15, dealer: dealer._id },
      { material: 'Kids Flex Temple', variant: 'Small', currentStock: 9, threshold: 12, dealer: dealer._id },
      { material: 'Anti-glare Clear', variant: '1.56', currentStock: 84, threshold: 25, dealer: dealer._id },
      { material: 'Polarised Grey', variant: 'Sun', currentStock: 42, threshold: 20, dealer: dealer._id }
    ];
    
    await LensInventory.insertMany(lenses);
    console.log('Seeded Lens Inventory');
    
    mongoose.disconnect();
    console.log('Done!');
  })
  .catch(err => {
    console.error(err);
    process.exit(1);
  });
