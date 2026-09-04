const express  = require('express');
const router   = express.Router();
const mongoose = require('mongoose');
const Razorpay = require('razorpay');
const crypto   = require('crypto');
const path     = require('path');
const dotenv   = require('dotenv');

const { protect }                    = require('../middleware/authMiddleware');
const Product                        = require('../models/Product');
const Order                          = require('../models/Order');
const { validatePincodeAgainstAddress } = require('../services/addressService');

// ── Dynamic env reload ────────────────────────────────────────────────────────
function loadEnv() {
  try {
    dotenv.config({ path: path.join(__dirname, '..', '.env') });
  } catch (_) {}
}

function getRazorpay() {
  loadEnv();
  const key_id = (process.env.RAZORPAY_KEY_ID || '').trim();
  const key_secret = (process.env.RAZORPAY_KEY_SECRET || '').trim();

  if (!key_id || !key_secret) {
    const errorMsg = 'Razorpay API keys (RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET) are missing or not configured in server environment variables.';
    console.error('❌ ' + errorMsg);
    throw new Error(errorMsg);
  }

  return new Razorpay({
    key_id,
    key_secret,
  });
}

// ── Distance & Zone-based Shipping Fee Calculator ───────────────────────────
// Origin warehouse: Tamil Nadu, India
function calculateShipping(state) {
  const normState = (state || '').toLowerCase().trim();

  // Zone 1: Local / Home State & UT (0 - 400 km) -> ₹40
  const zone1 = ['tamil nadu', 'puducherry'];
  if (zone1.some(s => normState.includes(s))) {
    return 40;
  }

  // Zone 2: South India Regional (400 - 900 km) -> ₹60
  const zone2 = ['kerala', 'karnataka', 'andhra pradesh', 'telangana'];
  if (zone2.some(s => normState.includes(s))) {
    return 60;
  }

  // Zone 3: Remote / Special Regions / Islands / Hill Stations -> ₹120
  const zone3 = [
    'jammu and kashmir', 'ladakh', 'himachal pradesh', 'uttarakhand',
    'assam', 'meghalaya', 'manipur', 'mizoram', 'nagaland', 'tripura', 'arunachal pradesh', 'sikkim',
    'andaman and nicobar islands', 'lakshadweep'
  ];
  if (zone3.some(s => normState.includes(s))) {
    return 120;
  }

  // Zone 4: Rest of India (900+ km: Maharashtra, Gujarat, Delhi, UP, Rajasthan, MP, WB, etc.) -> ₹80
  return 80;
}

// ── POST /api/create-order ────────────────────────────────────────────────────
// Authenticated. Backend reads product prices from DB and calculates shipping from state.
router.post('/create-order', protect, async (req, res) => {
  try {
    const { items, shippingAddress } = req.body;

    // ── Validate items ─────────────────────────────────────────────────────
    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ success: false, message: 'Cart is empty.' });
    }

    // ── Validate shipping address (Street, Town/City, District, State, Pincode) ──
    const { address1, city, district, state, pincode } = shippingAddress || {};
    if (!address1 || !address1.trim()) {
      return res.status(400).json({ success: false, message: 'Street address is required.' });
    }
    if (!city || !city.trim()) {
      return res.status(400).json({ success: false, message: 'Town / City is required.' });
    }
    if (!district || !district.trim()) {
      return res.status(400).json({ success: false, message: 'District is required.' });
    }
    if (!state || !state.trim()) {
      return res.status(400).json({ success: false, message: 'State is required.' });
    }
    if (!pincode || !/^[1-9][0-9]{5}$/.test(pincode.trim())) {
      return res.status(400).json({ success: false, message: 'A valid 6-digit Pincode is required.' });
    }

    // ── Fetch products and compute prices from DB ──────────────────────────
    const validObjectIds = items
      .map(i => i.productId)
      .filter(id => id && mongoose.Types.ObjectId.isValid(id))
      .map(id => new mongoose.Types.ObjectId(id));
    const products   = validObjectIds.length ? await Product.find({ _id: { $in: validObjectIds } }).lean() : [];
    const productMap = Object.fromEntries(products.map(p => [p._id.toString(), p]));

    let subtotal = 0;
    const orderItems = [];

    for (const item of items) {
      const product = item.productId && productMap[item.productId.toString()];
      const qty = Math.max(1, parseInt(item.quantity) || 1);
      const unitPrice = product
        ? (product.offerPrice || product.discountPrice || product.price)
        : (Number(item.price) || 10);
      const itemSubtotal = unitPrice * qty;
      subtotal += itemSubtotal;

      orderItems.push({
        productId:    product ? product._id : (item.productId && mongoose.Types.ObjectId.isValid(item.productId) ? new mongoose.Types.ObjectId(item.productId) : null),
        name:         product ? product.name : (item.name || 'Custom Gift Item'),
        image:        product ? (product.imageUrl || '') : (item.image || item.imageUrl || ''),
        quantity:     qty,
        unitPrice,
        subtotal:     itemSubtotal,
        customText:   item.customText   || '',
        customImages: item.customImages || [],
      });
    }

    const shippingCharge = calculateShipping(state);
    const discount       = 0;   // Future: coupon logic here
    const totalINR       = subtotal + shippingCharge - discount;
    const amountInPaise  = Math.round(totalINR * 100);

    if (amountInPaise < 100) {
      return res.status(400).json({ success: false, message: 'Minimum order amount is ₹1.' });
    }

    // ── Create Razorpay order ─────────────────────────────────────────────
    const razorpayOrder = await getRazorpay().orders.create({
      amount:   amountInPaise,
      currency: 'INR',
      receipt:  `rcpt_${Date.now()}`,
    });

    console.log('RAZORPAY ORDER CREATED:', razorpayOrder.id, `₹${totalINR} (Subtotal: ₹${subtotal} + Shipping: ₹${shippingCharge})`);

    return res.status(200).json({
      success: true,
      order_id:       razorpayOrder.id,
      amount:         razorpayOrder.amount,
      currency:       razorpayOrder.currency,
      key_id:         process.env.RAZORPAY_KEY_ID,
      // Return calculated values so frontend can display them
      breakdown: { subtotal, shippingCharge, discount, totalINR },
      orderItems,
    });
  } catch (err) {
    console.error('CREATE ORDER ERROR:', err);
    if (err.statusCode === 401) {
      return res.status(401).json({ success: false, message: 'Razorpay authentication failed.' });
    }
    return res.status(500).json({
      success: false,
      message: err.error?.description || err.message || 'Failed to create order.',
    });
  }
});

// ── POST /api/verify-payment ──────────────────────────────────────────────────
// Authenticated. Verifies Razorpay HMAC signature, then creates the MongoDB
// Order. This is the ONLY place an order is written to the database.
//
// Body: {
//   razorpay_order_id, razorpay_payment_id, razorpay_signature,
//   orderPayload: { customer, shippingAddress, items, breakdown }
// }
router.post('/verify-payment', protect, async (req, res) => {
  try {
    loadEnv();
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      orderPayload,
    } = req.body;

    // ── 1. Required fields ────────────────────────────────────────────────
    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !orderPayload) {
      return res.status(400).json({
        success: false,
        message: 'Missing required payment verification fields.',
      });
    }

    // ── 2. HMAC signature verification ────────────────────────────────────
    const keySecret = (process.env.RAZORPAY_KEY_SECRET || '').trim();
    if (!keySecret) {
      console.error('❌ RAZORPAY_KEY_SECRET is missing during verify-payment.');
      return res.status(500).json({ success: false, message: 'Server payment configuration error.' });
    }

    const body              = `${razorpay_order_id}|${razorpay_payment_id}`;
    const expectedSignature = crypto
      .createHmac('sha256', keySecret)
      .update(body)
      .digest('hex');

    if (expectedSignature !== razorpay_signature) {
      console.error('RAZORPAY SIGNATURE MISMATCH for order:', razorpay_order_id);
      return res.status(400).json({ success: false, message: 'Invalid payment signature.' });
    }

    console.log('RAZORPAY PAYMENT VERIFIED:', razorpay_payment_id);

    // ── 3. Duplicate payment guard ────────────────────────────────────────
    const existingOrder = await Order.findOne({ razorpayPaymentId: razorpay_payment_id });
    if (existingOrder) {
      console.warn('Duplicate payment attempt blocked:', razorpay_payment_id);
      return res.status(200).json({
        success: true,
        message: 'Order already exists.',
        order:   existingOrder,
      });
    }

    // ── 4. Server-side address validation ─────────────────────────────────
    const { customer, shippingAddress, items, breakdown } = orderPayload;
    const { address1, city, district, state, pincode }    = shippingAddress || {};

    if (!address1 || !address1.trim() || !city || !city.trim() || !district || !district.trim() || !state || !state.trim() || !pincode || !/^[1-9][0-9]{5}$/.test(pincode.trim())) {
      return res.status(400).json({ success: false, message: 'Complete and valid shipping address is required.' });
    }

    // ── 5. Re-read product prices from DB ─────────────────────────────────
    const validObjectIds = (items || [])
      .map(i => i.productId)
      .filter(id => id && mongoose.Types.ObjectId.isValid(id))
      .map(id => new mongoose.Types.ObjectId(id));
    const products   = validObjectIds.length ? await Product.find({ _id: { $in: validObjectIds } }).lean() : [];
    const productMap = Object.fromEntries(products.map(p => [p._id.toString(), p]));

    let subtotal = 0;
    const orderItems = [];

    for (const item of (items || [])) {
      const product = item.productId && productMap[item.productId.toString()];
      const qty        = Math.max(1, parseInt(item.quantity) || 1);
      const unitPrice  = product
        ? (product.offerPrice || product.discountPrice || product.price)
        : (Number(item.price) || (breakdown && breakdown.subtotal) || 10);
      const itemSubtotal = unitPrice * qty;
      subtotal += itemSubtotal;

      orderItems.push({
        productId:    product ? product._id : (item.productId && mongoose.Types.ObjectId.isValid(item.productId) ? new mongoose.Types.ObjectId(item.productId) : null),
        name:         product ? product.name : (item.name || 'Custom Gift Item'),
        image:        product ? (product.imageUrl || '') : (item.image || item.imageUrl || ''),
        quantity:     qty,
        unitPrice,
        subtotal:     itemSubtotal,
        customText:   item.customText   || '',
        customImages: item.customImages || [],
      });
    }

    const shippingCharge = calculateShipping(state);
    const discount       = 0;
    const totalAmount    = subtotal + shippingCharge - discount;

    const customerName = customer.name || req.user.fullName || 'Customer';
    const handlerRole  = req.user.isAdmin ? 'admin' : 'customer';

    // ── 6. Create MongoDB order ───────────────────────────────────────────
    const order = await Order.create({
      razorpayOrderId:   razorpay_order_id,
      razorpayPaymentId: razorpay_payment_id,
      userId:            req.user._id,
      customer: {
        name:  customerName,
        email: customer.email || req.user.email,
        phone: customer.phone || req.user.phone || '',
      },
      shippingAddress: {
        address1:  address1,
        address2:  shippingAddress.address2 || '',
        city,
        district,
        state,
        pincode,
      },
      items:          orderItems,
      subtotal,
      shippingCharge,
      discount,
      totalAmount,
      paymentMethod:   'online',
      paymentProvider: 'razorpay',
      paymentStatus:   'paid',
      orderStatus:     'placed',
      lastHandledBy: {
        userId: req.user._id,
        name:   customerName,
        role:   handlerRole,
      },
      lastUpdatedAt: new Date(),
      statusHistory: [{
        status:    'placed',
        changedAt: new Date(),
        changedBy: req.user._id,
      }],
      activityLog: [
        {
          type: 'order_created',
          oldValue: null,
          newValue: 'placed',
          performedBy: {
            userId: req.user._id,
            name:   customerName,
            role:   handlerRole,
          },
          note: 'Order created after successful Razorpay payment verification',
          createdAt: new Date(),
        },
        {
          type: 'payment_verified',
          oldValue: 'pending',
          newValue: 'paid',
          performedBy: {
            userId: req.user._id,
            name:   'Razorpay Gateway',
            role:   'system',
          },
          note: `Razorpay payment successfully verified (${razorpay_payment_id})`,
          createdAt: new Date(),
        },
      ],
    });

    console.log('ORDER CREATED IN DB:', order.orderNumber);

    return res.status(201).json({
      success: true,
      message: 'Payment verified and order created.',
      order: {
        _id:         order._id,
        orderNumber: order.orderNumber,
        totalAmount: order.totalAmount,
        orderStatus: order.orderStatus,
      },
    });
  } catch (err) {
    // Duplicate key error (race condition — payment already saved)
    if (err.code === 11000) {
      console.warn('Duplicate order insert blocked (11000):', err.keyValue);
      const existing = await Order.findOne({ razorpayPaymentId: req.body.razorpay_payment_id });
      return res.status(200).json({ success: true, message: 'Order already exists.', order: existing });
    }

    console.error('VERIFY PAYMENT ERROR:', err);
    return res.status(500).json({ success: false, message: 'Payment verification failed.' });
  }
});

module.exports = router;
