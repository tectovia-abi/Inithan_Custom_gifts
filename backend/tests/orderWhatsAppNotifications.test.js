const request = require('supertest');
const app = require('../server');
const Order = require('../models/Order');
const User = require('../models/User');
const WhatsAppMessage = require('../models/WhatsAppMessage');
const jwt = require('jsonwebtoken');

describe('WhatsApp Notifications: Order Confirmation & Cancellation', () => {
  let customerUser;
  let adminUser;
  let customerToken;
  let adminToken;
  let sampleOrder;

  beforeEach(async () => {
    await Order.deleteMany({});
    await User.deleteMany({});
    await WhatsAppMessage.deleteMany({});

    customerUser = await User.create({
      fullName: 'Priya Sharma',
      email: 'priya@example.com',
      phone: '9840123456',
      password: 'Password123!'
    });

    adminUser = await User.create({
      fullName: 'Store Admin',
      email: 'admin@inithangifts.com',
      phone: '9944444834',
      password: 'AdminPassword123!',
      isAdmin: true
    });

    customerToken = jwt.sign({ id: customerUser._id }, process.env.JWT_SECRET || 'fallback_secret_key');
    adminToken = jwt.sign({ id: adminUser._id }, process.env.JWT_SECRET || 'fallback_secret_key');

    sampleOrder = await Order.create({
      orderNumber: 'ICG-20261109-112233',
      razorpayOrderId: 'order_test_123',
      razorpayPaymentId: 'pay_test_456',
      userId: customerUser._id,
      customer: {
        name: 'Priya Sharma',
        email: 'priya@example.com',
        phone: '9840123456'
      },
      shippingAddress: {
        address1: '12 Gandhi Street',
        city: 'Chennai',
        district: 'Chennai',
        state: 'Tamil Nadu',
        pincode: '600001'
      },
      items: [
        {
          name: 'Personalized Magic Mug',
          quantity: 2,
          unitPrice: 350,
          subtotal: 700
        }
      ],
      subtotal: 700,
      shippingCharge: 40,
      totalAmount: 740,
      orderStatus: 'placed',
      paymentStatus: 'paid'
    });
  });

  describe('WhatsApp Order Confirmation Dispatch', () => {
    it('should format order confirmation and persist message in WhatsAppMessage collection', async () => {
      const whatsappService = require('../services/whatsappService');
      const result = await whatsappService.sendOrderConfirmation(sampleOrder);

      expect(result.success).toBe(true);

      const msg = await WhatsAppMessage.findOne({ type: 'order_confirmation' });
      expect(msg).not.toBeNull();
      expect(msg.to).toBe('919840123456');
      expect(msg.body).toContain('ICG-20261109-112233');
      expect(msg.body).toContain('Personalized Magic Mug');
      expect(msg.body).toContain('740');
    });
  });

  describe('POST /api/orders/:id/cancel - Customer Order Cancellation', () => {
    it('should allow customer to cancel their placed order and send WhatsApp notification', async () => {
      const res = await request(app)
        .post(`/api/orders/${sampleOrder._id}/cancel`)
        .set('Authorization', `Bearer ${customerToken}`)
        .send({ reason: 'Changed my mind' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.order.orderStatus).toBe('cancelled');

      // Verify order updated in MongoDB
      const updated = await Order.findById(sampleOrder._id);
      expect(updated.orderStatus).toBe('cancelled');

      // Verify cancellation activity recorded
      const cancelLog = updated.activityLog.find(a => a.type === 'cancelled');
      expect(cancelLog).toBeDefined();
      expect(cancelLog.note).toBe('Changed my mind');

      // Verify WhatsApp cancellation message logged
      const msg = await WhatsAppMessage.findOne({ type: 'order_cancellation' });
      expect(msg).not.toBeNull();
      expect(msg.to).toBe('919840123456');
      expect(msg.body).toContain('ICG-20261109-112233');
      expect(msg.body).toContain('Changed my mind');
      expect(msg.body).toContain('740');
    });

    it('should reject cancellation if order has already been shipped', async () => {
      sampleOrder.orderStatus = 'shipped';
      await sampleOrder.save();

      const res = await request(app)
        .post(`/api/orders/${sampleOrder._id}/cancel`)
        .set('Authorization', `Bearer ${customerToken}`)
        .send({ reason: 'Need to cancel' });

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('shipped');
    });

    it('should prevent non-owner user from cancelling someone elses order', async () => {
      const otherUser = await User.create({
        fullName: 'Other User',
        email: 'other@example.com',
        phone: '9123456789',
        password: 'Password123!'
      });
      const otherToken = jwt.sign({ id: otherUser._id }, process.env.JWT_SECRET || 'fallback_secret_key');

      const res = await request(app)
        .post(`/api/orders/${sampleOrder._id}/cancel`)
        .set('Authorization', `Bearer ${otherToken}`)
        .send({ reason: 'Malicious attempt' });

      expect(res.status).toBe(403);
    });
  });

  describe('PUT /api/orders/:id/status - Admin cancellation dispatch', () => {
    it('should send WhatsApp cancellation notice when admin transitions status to cancelled', async () => {
      const res = await request(app)
        .put(`/api/orders/${sampleOrder._id}/status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ status: 'cancelled', note: 'Out of stock at supplier warehouse' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.order.orderStatus).toBe('cancelled');

      // Wait a moment for async dispatch
      await new Promise(r => setTimeout(r, 200));

      const msg = await WhatsAppMessage.findOne({ type: 'order_cancellation' });
      expect(msg).not.toBeNull();
      expect(msg.body).toContain('Out of stock at supplier warehouse');
    });
  });
});

