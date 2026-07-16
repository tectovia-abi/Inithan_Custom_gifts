
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Category = require('./models/Category');

dotenv.config();

const predefinedCategories = [
  {
    name: "🎁 Photo Gifts",
    image: "images/gift-box.png",
    subcategories: ["Photo Frames", "Acrylic Photo Frames", "LED Photo Frames", "Wooden Photo Frames", "Collage Frames", "Photo Tiles", "Photo Blocks"]
  },
  {
    name: "☕ Drinkware",
    image: "images/custom-mug.png",
    subcategories: ["Magic Mug", "White Mug", "Color Handle Mug", "Couple Mug", "Steel Tumbler", "Water Bottle Print", "Sipper Bottle"]
  },
  {
    name: "🪵 Wooden Gifts",
    image: "images/gift-collection.png",
    subcategories: ["Wooden Engraving", "Wooden Name Board", "Wooden Clock", "Wooden Key Holder", "Wooden Photo Plaque", "Wooden Trophy"]
  },
  {
    name: "✨ Acrylic Gifts",
    image: "images/hero-gift-showcase.png",
    subcategories: ["Acrylic Name Plate", "Acrylic Lamp", "Acrylic Photo Stand", "Acrylic Keychain", "Acrylic Calendar", "Acrylic Sign Board"]
  },
  {
    name: "🔑 Keychains & Accessories",
    image: "images/custom-keychain.png",
    subcategories: ["Photo Keychain", "Metal Keychain", "Acrylic Keychain", "Leather Keychain", "Couple Keychain"]
  },
  {
    name: "🖼️ Home Decor",
    image: "images/custom-frame.png",
    subcategories: ["Wall Clock", "LED Name Board", "Canvas Print", "Wall Art", "Door Name Plate"]
  },
  {
    name: "👶 Baby & Kids Gifts",
    image: "images/gift-box.png",
    subcategories: ["Baby Milestone Frame", "Birth Details Frame", "Kids Name Board", "School Photo Gifts"]
  },
  {
    name: "💍 Couple & Wedding Gifts",
    image: "images/gift-collection.png",
    subcategories: ["Couple Frame", "Wedding Frame", "Anniversary Gifts", "Proposal Gifts", "Wedding Keepsakes"]
  },
  {
    name: "❤️ Hand Casting",
    image: "images/hero-gift-showcase.png",
    subcategories: ["Couple Hand Casting", "Family Hand Casting", "Baby Hand Casting"]
  },
  {
    name: "🏆 Awards & Corporate",
    image: "images/hero.jpeg",
    subcategories: ["Corporate Gifts", "Employee Awards", "Mementos", "Trophies", "Certificates", "Business Name Boards"]
  },
  {
    name: "🎂 Occasion Gifts",
    image: "images/hero-giftbox.png",
    subcategories: ["Birthday Gifts", "Anniversary Gifts", "Wedding Gifts", "Baby Shower Gifts", "Housewarming Gifts", "Valentine's Gifts", "Mother's Day Gifts", "Father's Day Gifts", "Friendship Day Gifts", "Teacher's Day Gifts", "Farewell Gifts", "Retirement Gifts"]
  },
  {
    name: "🎉 Party & Event Items",
    image: "images/gift-box.png",
    subcategories: ["Return Gifts", "Welcome Boards", "Cake Topper", "Event Sign Boards", "Photo Booth Props"]
  },
  {
    name: "🛍️ Personalized Accessories",
    image: "images/custom-pillow.png",
    subcategories: ["Mobile Cover Print", "Mouse Pad", "Cushion Print", "T-Shirt Print", "Cap Print", "Puzzle Photo", "Fridge Magnet"]
  },
  {
    name: "🖨️ Printing Services",
    image: "images/custom-tshirt.png",
    subcategories: ["UV Printing", "Fiber Laser Engraving", "CO₂ Laser Cutting & Engraving", "Sublimation Printing", "Custom Branding"]
  },
  {
    name: "📦 Bulk Orders",
    image: "images/hero.jpeg",
    subcategories: ["Corporate Orders", "School Orders", "College Orders", "Wedding Bulk Orders", "Promotional Gifts"]
  }
];

const seedDB = async () => {
  try {
    const mongoURI = process.env.MONGO_URI;
    if (!mongoURI) {
      console.error("❌ MONGO_URI is not defined in .env");
      process.exit(1);
    }

    await mongoose.connect(mongoURI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log("✅ MongoDB Connected");

    console.log("Deleting old categories...");
    await Category.deleteMany();

    console.log("Inserting predefined categories...");
    await Category.insertMany(predefinedCategories);

    console.log("🎉 Seeding completed successfully!");
    process.exit();
  } catch (error) {
    console.error(`❌ Error: ${error.message}`);
    process.exit(1);
  }
};

seedDB();
