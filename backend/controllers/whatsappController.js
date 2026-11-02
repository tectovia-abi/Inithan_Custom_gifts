const WhatsAppMessage = require('../models/WhatsAppMessage');
const whatsappService = require('../services/whatsappService');

/**
 * Meta WhatsApp Webhook Handshake Verification (GET)
 * Meta calls this when configuring the callback URL in the App Dashboard
 */
const verifyWebhook = (req, res) => {
  try {
    let mode = req.query ? req.query['hub.mode'] : undefined;
    let token = req.query ? req.query['hub.verify_token'] : undefined;
    let challenge = req.query ? req.query['hub.challenge'] : undefined;

    // Fallback: extract directly from originalUrl in case middleware stripped keys containing dots (e.g. express-mongo-sanitize)
    if (!mode || !token || !challenge) {
      try {
        const parsedUrl = new URL(req.originalUrl || req.url, 'http://localhost');
        mode = mode || parsedUrl.searchParams.get('hub.mode');
        token = token || parsedUrl.searchParams.get('hub.verify_token');
        challenge = challenge || parsedUrl.searchParams.get('hub.challenge');
      } catch (_) {}
    }

    const expectedToken = (process.env.WHATSAPP_VERIFY_TOKEN || 'inithan_wa_verify_token_2026').trim();

    if (mode && token) {
      if (mode === 'subscribe' && token === expectedToken) {
        console.log('✅ [WhatsApp Webhook] Meta handshake verified successfully!');
        return res.status(200).type('text/plain').send(challenge);
      } else {
        console.warn('❌ [WhatsApp Webhook] Verification token mismatch. Received:', token, 'Expected:', expectedToken);
        return res.status(403).type('text/plain').send('Verification token mismatch');
      }
    }

    return res.status(400).type('text/plain').send('Missing required hub parameters');
  } catch (error) {
    console.error('❌ [WhatsApp Webhook] Error during verification:', error);
    return res.status(500).type('text/plain').send('Internal verification error');
  }
};

/**
 * Meta WhatsApp Event Intake (POST)
 * Receives incoming customer messages, OTP/delivery status updates, and interactive replies
 */
const handleWebhook = async (req, res) => {
  // 1. Immediately acknowledge receipt to Meta within 3 seconds to prevent retries
  res.status(200).send('EVENT_RECEIVED');

  // 2. Process payload asynchronously in the background
  const body = req.body;

  if (!body || body.object !== 'whatsapp_business_account') {
    return;
  }

  try {
    const entries = Array.isArray(body.entry) ? body.entry : [];

    for (const entry of entries) {
      const changes = Array.isArray(entry.changes) ? entry.changes : [];

      for (const change of changes) {
        const value = change.value;
        if (!value) continue;

        const phoneNumberId = value.metadata?.phone_number_id || '';
        const contacts = value.contacts || [];

        // ── 1. Process Incoming Messages & Customer Replies ─────────────
        if (Array.isArray(value.messages) && value.messages.length > 0) {
          for (const message of value.messages) {
            const messageId = message.id;
            const from = message.from;
            const msgType = message.type;
            const contact = contacts.find(c => c.wa_id === from);
            const senderName = contact?.profile?.name || '';

            let bodyText = '';
            if (msgType === 'text') {
              bodyText = message.text?.body || '';
            } else if (msgType === 'interactive') {
              bodyText = message.interactive?.button_reply?.title || message.interactive?.list_reply?.title || '';
            } else if (msgType === 'button') {
              bodyText = message.button?.text || '';
            } else if (msgType === 'image') {
              bodyText = message.image?.caption || '[Image received]';
            } else {
              bodyText = `[${msgType} message]`;
            }

            console.log(`📩 [WhatsApp Webhook] Incoming message from ${from} (${senderName}): "${bodyText}" [ID: ${messageId}]`);

            // Save incoming message in database
            try {
              await WhatsAppMessage.create({
                messageId,
                phoneNumberId,
                direction: 'incoming',
                type: msgType,
                from,
                senderName,
                body: bodyText,
                status: 'received',
                metadata: message
              });
            } catch (dbErr) {
              // Ignore duplicate messageId errors if already logged
              if (dbErr.code !== 11000) {
                console.error('[WhatsApp Webhook] DB error logging incoming message:', dbErr.message);
              }
            }

            // Mark message as read
            whatsappService.markMessageAsRead(messageId).catch(() => {});

            // Auto-respond to customer reply
            whatsappService.handleCustomerReply(from, bodyText, senderName, messageId).catch(err => {
              console.error('[WhatsApp Webhook] Auto-reply error:', err.message);
            });
          }
        }

        // ── 2. Process OTP & Outgoing Message Status Updates ────────────
        // (sent, delivered, read, failed)
        if (Array.isArray(value.statuses) && value.statuses.length > 0) {
          for (const statusObj of value.statuses) {
            const messageId = statusObj.id;
            const status = statusObj.status; // 'sent', 'delivered', 'read', 'failed'
            const recipientId = statusObj.recipient_id;
            const timestamp = statusObj.timestamp ? new Date(parseInt(statusObj.timestamp, 10) * 1000) : new Date();

            console.log(`📊 [WhatsApp Webhook] Status update for message ${messageId} (${recipientId}): ${status.toUpperCase()}`);

            try {
              await WhatsAppMessage.findOneAndUpdate(
                { messageId },
                {
                  $set: { status, to: recipientId },
                  $push: {
                    statusHistory: {
                      status,
                      timestamp,
                      error: statusObj.errors || null
                    }
                  }
                },
                { upsert: false }
              );
            } catch (statusErr) {
              console.error('[WhatsApp Webhook] DB error updating message status:', statusErr.message);
            }
          }
        }
      }
    }
  } catch (error) {
    console.error('❌ [WhatsApp Webhook] Processing error:', error);
  }
};

/**
 * Diagnostic / status endpoint
 */
const getStatus = (req, res) => {
  const config = whatsappService.getWhatsAppConfig();
  res.json({
    status: 'active',
    endpoint: 'https://inithancustomgifts.com/api/whatsapp/webhook',
    features: {
      incomingMessages: true,
      statusUpdates: true,
      customerReplies: true,
      otpReady: true
    },
    configured: {
      hasVerifyToken: Boolean(process.env.WHATSAPP_VERIFY_TOKEN),
      hasAccessToken: Boolean(config.token),
      hasPhoneNumberId: Boolean(config.phoneNumberId)
    }
  });
};

module.exports = {
  verifyWebhook,
  handleWebhook,
  getStatus
};

