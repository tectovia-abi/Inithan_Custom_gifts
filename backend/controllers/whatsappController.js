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
    const currentHost = req.get('host') || 'inithancustomgifts.com';
    const callbackUrl = process.env.APP_URL 
      ? `${process.env.APP_URL.replace(/\/$/, '')}/api/whatsapp/webhook`
      : (process.env.RENDER_EXTERNAL_URL 
          ? `${process.env.RENDER_EXTERNAL_URL}/api/whatsapp/webhook`
          : `${req.protocol}://${currentHost}/api/whatsapp/webhook`);

    // 1. If accessed directly in a browser without Meta query params, show friendly status page
    if (!mode && !token && !challenge) {
      const acceptHeader = req.headers['accept'] || '';
      if (acceptHeader.includes('text/html')) {
        return res.status(200).send(`
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>WhatsApp Webhook - Inithan Custom Gifts</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background: #0b1120; color: #f8fafc; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; padding: 20px; box-sizing: border-box; }
    .card { background: #1e293b; border: 1px solid #334155; border-radius: 14px; max-width: 520px; width: 100%; padding: 32px; box-shadow: 0 15px 35px rgba(0,0,0,0.4); }
    .badge { display: inline-block; background: #10b981; color: #022c22; font-weight: 700; font-size: 11px; padding: 4px 10px; border-radius: 999px; margin-bottom: 16px; letter-spacing: 0.5px; text-transform: uppercase; }
    h1 { font-size: 20px; margin: 0 0 10px; color: #fff; font-weight: 700; }
    p { font-size: 14px; color: #94a3b8; line-height: 1.6; margin: 0 0 22px; }
    .box { background: #0f172a; border: 1px solid #334155; border-radius: 8px; padding: 12px 14px; margin-bottom: 12px; }
    .label { font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; color: #64748b; font-weight: 600; margin-bottom: 4px; }
    .value { font-family: ui-monospace, SFMono-Regular, Menlo, monospace; font-size: 13px; color: #38bdf8; word-break: break-all; }
    .notice { font-size: 12px; color: #cbd5e1; background: rgba(56, 189, 248, 0.1); border-left: 3px solid #38bdf8; padding: 12px; border-radius: 4px; line-height: 1.5; margin-top: 16px; }
  </style>
</head>
<body>
  <div class="card">
    <div class="badge">● Webhook Live & Ready</div>
    <h1>Inithan WhatsApp Cloud API</h1>
    <p>This endpoint receives automated webhook messages and delivery status receipts from Meta WhatsApp Business Platform.</p>
    <div class="box">
      <div class="label">Callback URL (for Meta Developer Dashboard)</div>
      <div class="value">${callbackUrl}</div>
    </div>
    <div class="box">
      <div class="label">Verify Token (for Meta Developer Dashboard)</div>
      <div class="value">${expectedToken}</div>
    </div>
    <div class="notice">
      💡 <strong>For Meta Setup:</strong> Paste both values above into your <em>Meta Developer Dashboard &gt; WhatsApp &gt; Configuration &gt; Edit Webhook</em> and click <strong>Verify and Save</strong>.
    </div>
  </div>
</body>
</html>
        `);
      }
      return res.status(400).type('text/plain').send('Missing required hub parameters');
    }

    // 2. Meta verification handshake
    if (mode && token) {
      if (mode.trim() === 'subscribe' && token.trim() === expectedToken) {
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
  const currentHost = req.get('host') || 'inithancustomgifts.com';
  const callbackUrl = process.env.APP_URL 
    ? `${process.env.APP_URL.replace(/\/$/, '')}/api/whatsapp/webhook`
    : (process.env.RENDER_EXTERNAL_URL 
        ? `${process.env.RENDER_EXTERNAL_URL}/api/whatsapp/webhook`
        : `${req.protocol}://${currentHost}/api/whatsapp/webhook`);
  res.json({
    status: 'active',
    endpoint: callbackUrl,
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

