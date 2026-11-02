const express = require('express');
const router = express.Router();
const whatsappController = require('../controllers/whatsappController');

// @route   GET /api/whatsapp/webhook
// @desc    Meta WhatsApp Webhook verification handshake
// @access  Public (Meta verified via hub.verify_token)
router.get('/webhook', whatsappController.verifyWebhook);

// @route   POST /api/whatsapp/webhook
// @desc    Receive incoming WhatsApp messages, OTP/message status updates, customer replies
// @access  Public (Meta webhook)
router.post('/webhook', whatsappController.handleWebhook);

// @route   GET /api/whatsapp/status
// @desc    Check WhatsApp API service status and configuration
// @access  Public
router.get('/status', whatsappController.getStatus);

module.exports = router;

