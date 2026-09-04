const express = require('express');
const router  = express.Router();
const Order   = require('../models/Order');
const { protect, admin } = require('../middleware/authMiddleware');

// ── Valid status-transition map ───────────────────────────────────────────────
// Enforces business state transitions server-side.
const ALLOWED_TRANSITIONS = {
  placed:     ['processing', 'cancelled'],
  processing: ['shipped',    'cancelled'],
  shipped:    ['delivered'],
  delivered:  [],
  cancelled:  [],
};

// ── Helper: Extract authenticated handler identity ────────────────────────────
// SECURITY: Handler details are ALWAYS pulled from req.user, never from req.body.
function getAuthenticatedHandler(req) {
  return {
    userId: req.user._id,
    name:   req.user.fullName || req.user.name || 'System Admin',
    role:   req.user.isAdmin ? 'admin' : 'staff',
  };
}

// ── GET /api/orders/mine — Logged-in customer's own orders ────────────────────
// Returns customer-safe order data (excludes internal staff notes/audit trail).
router.get('/mine', protect, async (req, res) => {
  try {
    const rawOrders = await Order.find({ userId: req.user._id })
      .sort({ createdAt: -1 })
      .lean();

    // Sanitize internal admin notes for customer privacy
    const orders = rawOrders.map(order => {
      const safeActivity = (order.activityLog || []).filter(a => 
        ['order_created', 'payment_verified', 'status_updated', 'tracking_added'].includes(a.type)
      );

      return {
        ...order,
        activityLog: safeActivity,
      };
    });

    return res.status(200).json({ success: true, orders });
  } catch (err) {
    console.error('GET /orders/mine error:', err);
    return res.status(500).json({ success: false, message: 'Failed to fetch orders.' });
  }
});

// ── GET /api/orders/stats — Admin dashboard aggregate statistics ──────────────
router.get('/stats', protect, admin, async (req, res) => {
  try {
    const [result] = await Order.aggregate([
      {
        $facet: {
          byStatus: [{ $group: { _id: '$orderStatus', count: { $sum: 1 } } }],
          revenue:  [
            { $match: { paymentStatus: 'paid', orderStatus: { $ne: 'cancelled' } } },
            { $group: { _id: null, total: { $sum: '$totalAmount' } } },
          ],
          total: [{ $count: 'count' }],
        },
      },
    ]);

    const statusMap = {};
    (result.byStatus || []).forEach(s => { statusMap[s._id] = s.count; });

    return res.status(200).json({
      success: true,
      totalOrders:  (result.total[0] || {}).count || 0,
      totalRevenue: (result.revenue[0] || {}).total || 0,
      placed:       statusMap.placed       || 0,
      processing:   statusMap.processing   || 0,
      shipped:      statusMap.shipped      || 0,
      delivered:    statusMap.delivered    || 0,
      cancelled:    statusMap.cancelled    || 0,
    });
  } catch (err) {
    console.error('GET /orders/stats error:', err);
    return res.status(500).json({ success: false, message: 'Failed to fetch order stats.' });
  }
});

// ── GET /api/orders — Admin: Paginated list with filters ──────────────────────
router.get('/', protect, admin, async (req, res) => {
  try {
    const page          = Math.max(1, parseInt(req.query.page)  || 1);
    const limit         = Math.min(100, parseInt(req.query.limit) || 20);
    const skip          = (page - 1) * limit;
    const { status, paymentStatus, search } = req.query;

    const filter = {};
    if (status        && status !== 'all')        filter.orderStatus   = status;
    if (paymentStatus && paymentStatus !== 'all') filter.paymentStatus = paymentStatus;
    if (search) {
      const re = new RegExp(search, 'i');
      filter.$or = [
        { orderNumber:         re },
        { 'customer.name':     re },
        { 'customer.email':    re },
        { 'customer.phone':    re },
        { razorpayPaymentId:   re },
        { razorpayOrderId:     re },
      ];
    }

    // Date range filter
    if (req.query.dateRange) {
      const now = new Date();
      if (req.query.dateRange === 'today') {
        const start = new Date(now); start.setHours(0,0,0,0);
        filter.createdAt = { $gte: start };
      } else if (req.query.dateRange === '7d') {
        filter.createdAt = { $gte: new Date(now - 7 * 864e5) };
      } else if (req.query.dateRange === '30d') {
        filter.createdAt = { $gte: new Date(now - 30 * 864e5) };
      }
    }

    const [orders, total] = await Promise.all([
      Order.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      Order.countDocuments(filter),
    ]);

    // Backward-compatible safe defaults for existing orders
    const normalizedOrders = orders.map(order => ({
      ...order,
      lastHandledBy: order.lastHandledBy || {
        userId: order.userId,
        name:   order.customer?.name || 'Customer',
        role:   'customer',
      },
      lastUpdatedAt: order.lastUpdatedAt || order.updatedAt || order.createdAt,
      activityLog:   order.activityLog || [],
    }));

    return res.status(200).json({
      success: true,
      orders: normalizedOrders,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (err) {
    console.error('GET /orders error:', err);
    return res.status(500).json({ success: false, message: 'Failed to fetch orders.' });
  }
});

// ── GET /api/orders/:id — Single order details (Owner or Admin) ───────────────
router.get('/:id', protect, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id).lean();
    if (!order) return res.status(404).json({ success: false, message: 'Order not found.' });

    const isOwner = order.userId.toString() === req.user._id.toString();
    if (!isOwner && !req.user.isAdmin) {
      return res.status(403).json({ success: false, message: 'Access denied.' });
    }

    // Normalize backward-compatible fields
    order.lastHandledBy = order.lastHandledBy || {
      userId: order.userId,
      name:   order.customer?.name || 'Customer',
      role:   'customer',
    };
    order.lastUpdatedAt = order.lastUpdatedAt || order.updatedAt || order.createdAt;
    order.activityLog   = order.activityLog || [];

    // Hide internal notes from customer
    if (!req.user.isAdmin) {
      order.activityLog = order.activityLog.filter(a =>
        ['order_created', 'payment_verified', 'status_updated', 'tracking_added'].includes(a.type)
      );
    }

    return res.status(200).json({ success: true, order });
  } catch (err) {
    console.error('GET /orders/:id error:', err);
    return res.status(500).json({ success: false, message: 'Failed to fetch order.' });
  }
});

// ── PUT /api/orders/:id/status — Admin: Update order status with audit log ────
router.put('/:id/status', protect, admin, async (req, res) => {
  try {
    const { status, note } = req.body;
    if (!status) {
      return res.status(400).json({ success: false, message: 'New status is required.' });
    }

    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ success: false, message: 'Order not found.' });

    const allowed = ALLOWED_TRANSITIONS[order.orderStatus] || [];
    if (!allowed.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Cannot transition status from '${order.orderStatus}' to '${status}'.`,
      });
    }

    if (!note || !note.trim()) {
      return res.status(400).json({
        success: false,
        message: 'A note or reason is required for status changes to maintain the audit trail.',
      });
    }

    const oldStatus = order.orderStatus;
    const handler   = getAuthenticatedHandler(req);
    const now       = new Date();

    // 1. Update order status
    order.orderStatus   = status;
    order.lastHandledBy = handler;
    order.lastUpdatedAt = now;

    // 2. Append to statusHistory
    order.statusHistory.push({
      status,
      changedAt: now,
      changedBy: req.user._id,
    });

    // 3. Append to activityLog
    const activityType = status === 'cancelled' ? 'cancelled' : 'status_updated';

    order.activityLog.push({
      type: activityType,
      oldValue: oldStatus,
      newValue: status,
      performedBy: handler,
      note: note.trim(),
      createdAt: now,
    });

    // 4. Save everything atomically
    await order.save();

    console.log(`[AUDIT] Order #${order.orderNumber} status changed: '${oldStatus}' -> '${status}' by ${handler.name} (${handler.role})`);

    return res.status(200).json({
      success: true,
      message: `Order status updated to '${status}'.`,
      order,
    });
  } catch (err) {
    console.error('PUT /orders/:id/status error:', err);
    return res.status(500).json({ success: false, message: 'Failed to update order status.' });
  }
});

// ── POST /api/orders/:id/note — Admin: Add an internal admin note ─────────────
router.post('/:id/note', protect, admin, async (req, res) => {
  try {
    const { note } = req.body;
    if (!note || !note.trim()) {
      return res.status(400).json({ success: false, message: 'Note content is required.' });
    }

    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ success: false, message: 'Order not found.' });

    const handler = getAuthenticatedHandler(req);
    const now     = new Date();

    order.lastHandledBy = handler;
    order.lastUpdatedAt = now;

    order.activityLog.push({
      type: 'note_added',
      oldValue: null,
      newValue: null,
      performedBy: handler,
      note: note.trim(),
      createdAt: now,
    });

    await order.save();

    return res.status(200).json({
      success: true,
      message: 'Admin note added successfully.',
      order,
    });
  } catch (err) {
    console.error('POST /orders/:id/note error:', err);
    return res.status(500).json({ success: false, message: 'Failed to add note.' });
  }
});

// ── POST /api/orders/:id/tracking — Admin: Add courier tracking details ───────
router.post('/:id/tracking', protect, admin, async (req, res) => {
  try {
    const { courierName, trackingNumber, note } = req.body;
    if (!trackingNumber || !trackingNumber.trim()) {
      return res.status(400).json({ success: false, message: 'Tracking number is required.' });
    }

    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ success: false, message: 'Order not found.' });

    const handler = getAuthenticatedHandler(req);
    const now     = new Date();

    order.lastHandledBy = handler;
    order.lastUpdatedAt = now;

    const courier = courierName ? courierName.trim() : 'Courier';
    const trackNo = trackingNumber.trim();
    const fullNote = `Courier: ${courier} | Tracking #: ${trackNo}${note ? ` (${note.trim()})` : ''}`;

    order.activityLog.push({
      type: 'tracking_added',
      oldValue: null,
      newValue: trackNo,
      performedBy: handler,
      note: fullNote,
      createdAt: now,
    });

    await order.save();

    return res.status(200).json({
      success: true,
      message: 'Tracking details recorded successfully.',
      order,
    });
  } catch (err) {
    console.error('POST /orders/:id/tracking error:', err);
    return res.status(500).json({ success: false, message: 'Failed to record tracking.' });
  }
});

// ── PUT /api/orders/:id/address — Admin/Owner: Update shipping address ────────
router.put('/:id/address', protect, async (req, res) => {
  try {
    const { address1, address2, city, district, state, pincode, note } = req.body;
    if (!address1 || !city || !district || !state || !pincode) {
      return res.status(400).json({ success: false, message: 'Complete shipping address is required.' });
    }

    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ success: false, message: 'Order not found.' });

    const isOwner = order.userId.toString() === req.user._id.toString();
    if (!isOwner && !req.user.isAdmin) {
      return res.status(403).json({ success: false, message: 'Access denied.' });
    }

    if (['delivered', 'cancelled'].includes(order.orderStatus)) {
      return res.status(400).json({ success: false, message: `Cannot update address for '${order.orderStatus}' order.` });
    }

    const oldAddress = { ...order.shippingAddress.toObject() };
    const newAddress = {
      address1: address1.trim(),
      address2: address2 ? address2.trim() : '',
      city:     city.trim(),
      district: district.trim(),
      state:    state.trim(),
      pincode:  pincode.trim(),
    };

    const handler = {
      userId: req.user._id,
      name:   req.user.fullName || req.user.name || (isOwner ? 'Customer' : 'Admin'),
      role:   req.user.isAdmin ? 'admin' : 'customer',
    };
    const now = new Date();

    order.shippingAddress = newAddress;
    order.lastHandledBy   = handler;
    order.lastUpdatedAt   = now;

    order.activityLog.push({
      type: 'address_updated',
      oldValue: `${oldAddress.address1}, ${oldAddress.city}, ${oldAddress.state} - ${oldAddress.pincode}`,
      newValue: `${newAddress.address1}, ${newAddress.city}, ${newAddress.state} - ${newAddress.pincode}`,
      performedBy: handler,
      note: note ? note.trim() : 'Shipping address updated',
      createdAt: now,
    });

    await order.save();

    return res.status(200).json({
      success: true,
      message: 'Shipping address updated successfully.',
      order,
    });
  } catch (err) {
    console.error('PUT /orders/:id/address error:', err);
    return res.status(500).json({ success: false, message: 'Failed to update shipping address.' });
  }
});

module.exports = router;
