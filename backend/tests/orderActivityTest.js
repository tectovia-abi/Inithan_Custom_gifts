const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const Order = require('../models/Order');
const User = require('../models/User');
require('dotenv').config();

const API_BASE = 'http://127.0.0.1:8081';

async function runTests() {
  console.log('=== STARTING ORDER ACTIVITY & AUDIT SYSTEM TESTS ===\n');

  await mongoose.connect(process.env.MONGO_URI);

  // 1. Get an admin user and regular user
  let adminUser = await User.findOne({ email: 'admin@gmail.com' });
  if (!adminUser) {
    adminUser = await User.findOne({ isAdmin: true });
  }

  let customerUser = await User.findOne({ email: 'abineshprakash25@gmail.com' });

  const adminToken = jwt.sign({ id: adminUser._id }, process.env.JWT_SECRET);
  const customerToken = jwt.sign({ id: customerUser._id }, process.env.JWT_SECRET);

  // Create a clean fresh test order for testing
  const testOrder = await Order.create({
    orderNumber: 'ICG-TEST-' + Date.now(),
    razorpayOrderId: 'order_test_' + Date.now(),
    razorpayPaymentId: 'pay_test_' + Date.now(),
    userId: customerUser._id,
    customer: {
      name: customerUser.fullName || 'Abinesh S P',
      email: customerUser.email,
      phone: '+91 99444 44834',
    },
    shippingAddress: {
      address1: '100 Test St',
      city: 'Erode',
      district: 'Erode',
      state: 'Tamil Nadu',
      pincode: '638452',
    },
    items: [{
      productId: null,
      name: 'Custom Wood Plaque',
      image: '',
      quantity: 1,
      unitPrice: 500,
      subtotal: 500,
      customText: 'Test Plaque',
      customImages: [],
    }],
    subtotal: 500,
    shippingCharge: 40,
    discount: 0,
    totalAmount: 540,
    paymentMethod: 'online',
    paymentProvider: 'razorpay',
    paymentStatus: 'paid',
    orderStatus: 'placed',
    lastHandledBy: {
      userId: customerUser._id,
      name: customerUser.fullName || 'Abinesh S P',
      role: 'customer',
    },
    lastUpdatedAt: new Date(),
    statusHistory: [{
      status: 'placed',
      changedAt: new Date(),
      changedBy: customerUser._id,
    }],
    activityLog: [
      {
        type: 'order_created',
        oldValue: null,
        newValue: 'placed',
        performedBy: {
          userId: customerUser._id,
          name: customerUser.fullName || 'Abinesh S P',
          role: 'customer',
        },
        note: 'Order created after successful Razorpay payment verification',
        createdAt: new Date(),
      },
      {
        type: 'payment_verified',
        oldValue: 'pending',
        newValue: 'paid',
        performedBy: {
          userId: customerUser._id,
          name: 'Razorpay Gateway',
          role: 'system',
        },
        note: 'Razorpay payment successfully verified',
        createdAt: new Date(),
      }
    ],
  });

  console.log(`Created Test Order: ${testOrder.orderNumber} (ID: ${testOrder._id})`);

  let passCount = 0;
  let totalTests = 0;

  function assert(name, condition, extra = '') {
    totalTests++;
    if (condition) {
      console.log(`  ✅ PASS: ${name} ${extra}`);
      passCount++;
    } else {
      console.error(`  ❌ FAIL: ${name} ${extra}`);
    }
  }

  // TEST 1: Placed -> Processing with Note
  console.log('\n[TEST 1] Placed ➔ Processing');
  let res = await fetch(`${API_BASE}/api/orders/${testOrder._id}/status`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${adminToken}` },
    body: JSON.stringify({ status: 'processing', note: 'Order accepted into workshop queue' }),
  });
  let data = await res.json();
  assert('Status updated to processing', data.success === true && data.order.orderStatus === 'processing');
  assert('lastHandledBy set to authenticated admin', data.order.lastHandledBy.name === adminUser.fullName || data.order.lastHandledBy.name === 'Admin User');
  assert('lastHandledBy role is admin', data.order.lastHandledBy.role === 'admin');
  assert('activityLog contains status_updated', data.order.activityLog.some(a => a.type === 'status_updated' && a.newValue === 'processing'));

  // TEST 2: Processing -> Shipped with Custom Note & Courier
  console.log('\n[TEST 2] Processing ➔ Shipped');
  res = await fetch(`${API_BASE}/api/orders/${testOrder._id}/status`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${adminToken}` },
    body: JSON.stringify({ status: 'shipped', note: 'Package handed over to BlueDart courier' }),
  });
  data = await res.json();
  assert('Status updated to shipped', data.success === true && data.order.orderStatus === 'shipped');
  const shippedAct = data.order.activityLog.find(a => a.newValue === 'shipped');
  assert('Activity records note correctly', shippedAct && shippedAct.note === 'Package handed over to BlueDart courier');

  // TEST 3: Invalid Transition Shipped -> Placed (Should Fail)
  console.log('\n[TEST 3] Invalid Transition: Shipped ➔ Placed');
  res = await fetch(`${API_BASE}/api/orders/${testOrder._id}/status`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${adminToken}` },
    body: JSON.stringify({ status: 'placed' }),
  });
  data = await res.json();
  assert('Backend rejects invalid transition', res.status === 400 && data.success === false);

  // TEST 4: Shipped -> Delivered
  console.log('\n[TEST 4] Shipped ➔ Delivered');
  res = await fetch(`${API_BASE}/api/orders/${testOrder._id}/status`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${adminToken}` },
    body: JSON.stringify({ status: 'delivered', note: 'Customer signed for delivery' }),
  });
  data = await res.json();
  assert('Status updated to delivered', data.success === true && data.order.orderStatus === 'delivered');

  // TEST 5: Delivered -> Processing (Should Fail)
  console.log('\n[TEST 5] Invalid Transition: Delivered ➔ Processing');
  res = await fetch(`${API_BASE}/api/orders/${testOrder._id}/status`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${adminToken}` },
    body: JSON.stringify({ status: 'processing' }),
  });
  data = await res.json();
  assert('Backend rejects transition from delivered', res.status === 400 && data.success === false);

  // TEST 5b: Mandatory Note Requirement (Reject Empty Note)
  console.log('\n[TEST 5b] Mandatory Note Requirement (Reject Empty Note)');
  res = await fetch(`${API_BASE}/api/orders/${testOrder._id}/status`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${adminToken}` },
    body: JSON.stringify({ status: 'delivered', note: '' }),
  });
  data = await res.json();
  assert('Backend rejects status change with empty note', res.status === 400 && data.success === false);

  // TEST 6: Impersonation Protection (Security)
  console.log('\n[TEST 6] Impersonation Protection');
  // Create another order to test cancellation with fake handler
  const testOrder2 = await Order.create({
    orderNumber: 'ICG-IMPERSONATION-' + Date.now(),
    userId: customerUser._id,
    customer: { name: 'Test', email: 'test@inithat.com', phone: '9999999999' },
    shippingAddress: { address1: '1', city: 'Erode', district: 'Erode', state: 'Tamil Nadu', pincode: '638452' },
    items: [{ name: 'Item', quantity: 1, unitPrice: 10, subtotal: 10 }],
    subtotal: 10, totalAmount: 10,
    paymentStatus: 'paid', orderStatus: 'placed',
  });

  res = await fetch(`${API_BASE}/api/orders/${testOrder2._id}/status`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${adminToken}` },
    body: JSON.stringify({
      status: 'cancelled',
      note: 'Admin cancelled order for test',
      handledBy: 'Fake Master Admin',
      performedBy: { name: 'Impersonated User', role: 'superadmin' }
    }),
  });
  data = await res.json();
  assert('Backend ignored spoofed handledBy in lastHandledBy', data.order.lastHandledBy.name !== 'Fake Master Admin');
  assert('Backend recorded true authenticated admin name', data.order.lastHandledBy.name === adminUser.fullName || data.order.lastHandledBy.name === 'Admin User');
  const cancelAct = data.order.activityLog.find(a => a.type === 'cancelled');
  assert('Activity log actor is authenticated admin', cancelAct && cancelAct.performedBy.name !== 'Impersonated User');

  // TEST 7: Add Admin Note endpoint
  console.log('\n[TEST 7] POST /api/orders/:id/note');
  res = await fetch(`${API_BASE}/api/orders/${testOrder._id}/note`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${adminToken}` },
    body: JSON.stringify({ note: 'Customer called to thank for the great packaging!' }),
  });
  data = await res.json();
  assert('Admin note saved to activityLog', data.success === true && data.order.activityLog.some(a => a.type === 'note_added' && a.note.includes('thank for the great packaging')));

  // TEST 8: Add Tracking Details endpoint
  console.log('\n[TEST 8] POST /api/orders/:id/tracking');
  res = await fetch(`${API_BASE}/api/orders/${testOrder._id}/tracking`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${adminToken}` },
    body: JSON.stringify({ courierName: 'BlueDart Express', trackingNumber: 'BD749204820IN', note: 'Air Express' }),
  });
  data = await res.json();
  assert('Tracking added to activityLog', data.success === true && data.order.activityLog.some(a => a.type === 'tracking_added' && a.newValue === 'BD749204820IN'));

  // TEST 9: Customer Privacy Protection
  console.log('\n[TEST 9] Customer Privacy in GET /api/orders/mine');
  res = await fetch(`${API_BASE}/api/orders/mine`, {
    headers: { 'Authorization': `Bearer ${customerToken}` },
  });
  data = await res.json();
  const customerViewOrder = data.orders.find(o => o._id.toString() === testOrder._id.toString());
  assert('Customer orders fetched successfully', data.success === true && !!customerViewOrder);
  const leakedNotes = customerViewOrder ? customerViewOrder.activityLog.filter(a => a.type === 'note_added') : [];
  assert('Internal admin notes are sanitized from customer view', leakedNotes.length === 0);

  // Clean up test orders
  await Order.findByIdAndDelete(testOrder._id);
  await Order.findByIdAndDelete(testOrder2._id);

  console.log(`\n==============================================`);
  console.log(`TEST SUMMARY: ${passCount} / ${totalTests} TESTS PASSED`);
  console.log(`==============================================\n`);

  await mongoose.disconnect();
  process.exit(passCount === totalTests ? 0 : 1);
}

runTests().catch(err => {
  console.error('Test Suite Failed:', err);
  process.exit(1);
});
