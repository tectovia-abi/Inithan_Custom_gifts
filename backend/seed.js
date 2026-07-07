require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');
const Product = require('./models/Product');

mongoose.connect(process.env.MONGO_URI)
  .then(async () => {
    // Remove old admin if exists to cleanly reset password
    await User.deleteOne({ email: 'admin@gmail.com' });

    // Create Admin with password 123456 (and 123465)
    await User.create({
      fullName: 'System Admin',
      email: 'admin@gmail.com',
      phone: '9999999999',
      password: '123456',
      isAdmin: true
    });
    console.log('👑 Created Admin user account (admin@gmail.com) with password 123456!');

    // Seed Initial Catalog Products into MongoDB if catalog is empty
    const prodCount = await Product.countDocuments();
    if (prodCount === 0) {
      await Product.insertMany([
        {
          name: 'Personalized Photo Mug',
          code: 'MUG-001',
          price: 499,
          keywords: 'mug, photo, ceramic, gift',
          imageUrl: 'images/custom-mug.png'
        },
        {
          name: 'Engraved Wooden Frame',
          code: 'FRM-002',
          price: 899,
          keywords: 'frame, wooden, photo, engraved',
          imageUrl: 'images/custom-frame.png'
        },
        {
          name: 'Engraved Metal Keychain',
          code: 'KEY-003',
          price: 349,
          keywords: 'keychain, metal, engraved, accessory',
          imageUrl: 'images/custom-keychain.png'
        },
        {
          name: 'Custom Printed Pillow',
          code: 'PIL-004',
          price: 699,
          keywords: 'pillow, cushion, printed, apparel',
          imageUrl: 'images/custom-pillow.png'
        },
        {
          name: 'Custom Printed T-Shirt',
          code: 'TSH-005',
          price: 599,
          keywords: 'tshirt, apparel, printed, fashion',
          imageUrl: 'images/custom-tshirt.png'
        },
        {
          name: 'Custom Gold Pendant',
          code: 'JWL-006',
          price: 1499,
          keywords: 'jewelry, pendant, gold, accessory',
          imageUrl: 'images/custom-jewelry.png'
        }
      ]);
      console.log('🎁 Seeded initial catalog products into MongoDB!');
    }

    const allUsers = await User.find({}, 'fullName email phone isAdmin');
    const allProducts = await Product.find({}, 'name code price imageUrl');
    console.log('REGISTERED ACCOUNTS:', JSON.stringify(allUsers, null, 2));
    console.log('MONGODB PRODUCTS:', JSON.stringify(allProducts, null, 2));
    process.exit(0);
  })
  .catch(err => {
    console.error('❌ Seeding error:', err);
    process.exit(1);
  });
