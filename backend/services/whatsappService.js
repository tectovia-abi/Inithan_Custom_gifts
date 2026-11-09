const path = require('path');
const dotenv = require('dotenv');
const WhatsAppMessage = require('../models/WhatsAppMessage');

function loadEnv() {
  try {
    dotenv.config({ path: path.join(__dirname, '..', '.env') });
  } catch (_) {}
}

const getWhatsAppConfig = () => {
  loadEnv();
  return {
    token: (process.env.WHATSAPP_ACCESS_TOKEN || process.env.WHATSAPP_TOKEN || '').trim(),
    phoneNumberId: (process.env.WHATSAPP_PHONE_NUMBER_ID || '').trim(),
    apiVersion: (process.env.WHATSAPP_API_VERSION || 'v21.0').trim()
  };
};

/**
 * Send an outbound text message via WhatsApp Cloud API
 */
async function sendTextMessage(to, bodyText) {
  const { token, phoneNumberId, apiVersion } = getWhatsAppConfig();

  if (!token || !phoneNumberId) {
    console.warn('[WhatsApp Service] Credentials missing (WHATSAPP_ACCESS_TOKEN or WHATSAPP_PHONE_NUMBER_ID). Outbound message skipped.');
    return { success: false, message: 'WhatsApp credentials not configured' };
  }

  // Sanitize phone number (strip '+', spaces, dashes)
  const cleanTo = String(to).replace(/[^0-9]/g, '');

  const url = `https://graph.facebook.com/${apiVersion}/${phoneNumberId}/messages`;
  const payload = {
    messaging_product: 'whatsapp',
    recipient_type: 'individual',
    to: cleanTo,
    type: 'text',
    text: {
      preview_url: false,
      body: bodyText
    }
  };

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('[WhatsApp Service] Send error response:', data);
      return { success: false, error: data };
    }

    const messageId = data?.messages?.[0]?.id || `out_${Date.now()}`;

    // Record outgoing message in database
    try {
      await WhatsAppMessage.create({
        messageId,
        phoneNumberId,
        direction: 'outgoing',
        type: 'text',
        to: cleanTo,
        body: bodyText,
        status: 'sent',
        metadata: data
      });
    } catch (dbErr) {
      console.error('[WhatsApp Service] DB log error:', dbErr.message);
    }

    return { success: true, data };
  } catch (err) {
    console.error('[WhatsApp Service] Network exception sending message:', err.message);
    return { success: false, error: err.message };
  }
}

/**
 * Mark an incoming message as read
 */
async function markMessageAsRead(messageId) {
  const { token, phoneNumberId, apiVersion } = getWhatsAppConfig();
  if (!token || !phoneNumberId || !messageId) return;

  const url = `https://graph.facebook.com/${apiVersion}/${phoneNumberId}/messages`;
  try {
    await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        status: 'read',
        message_id: messageId
      })
    });
  } catch (err) {
    console.warn('[WhatsApp Service] Failed to mark message as read:', err.message);
  }
}

/**
 * Send an OTP via WhatsApp
 * Can use authentication template if configured or fallback text message
 */
async function sendWhatsAppOtp(to, otpCode) {
  const message = `*Inithan Custom Gifts*\n\nYour One-Time Password (OTP) is: *${otpCode}*\n\nValid for 10 minutes. Please do not share this OTP with anyone.`;
  return await sendTextMessage(to, message);
}

/**
 * Automated customer reply handler based on incoming customer messages
 */
async function handleCustomerReply(from, messageText, senderName, incomingMessageId) {
  if (!from) return;

  const text = (messageText || '').trim().toLowerCase();
  const name = senderName ? senderName.split(' ')[0] : 'there';

  let replyText = '';

  if (/^(hi|hello|hey|vanakkam|namaste|start|menu)\b/i.test(text)) {
    replyText = `Hello ${name}! 👋 Welcome to *Inithan Custom Gifts*.\n\nHow can we help you today?\n\n1️⃣ Track My Order\n2️⃣ Bulk / Corporate Orders\n3️⃣ Custom Gifts Catalog & Pricing\n4️⃣ Speak with Customer Support\n\n_Reply with 1, 2, 3, or 4, or type your query below!_`;
  } else if (text === '1' || text.includes('track') || text.includes('order status')) {
    replyText = `📦 *Track Your Order*\n\nPlease reply with your *Order ID* (for example: *ORD-10023*), or check your order history directly at:\n🔗 https://inithancustomgifts.com/my-orders.html`;
  } else if (text === '2' || text.includes('bulk') || text.includes('corporate')) {
    replyText = `🎁 *Bulk & Corporate Inquiries*\n\nWe provide personalized corporate gifts, custom-printed mugs, T-shirts, trophies, and bulk event mementos with tiered discounts.\n\nFill out our quick bulk form: https://inithancustomgifts.com/bulk-retail.html or reply with your required quantity and product type!`;
  } else if (text === '3' || text.includes('catalog') || text.includes('price') || text.includes('product')) {
    replyText = `✨ *Custom Gifts Catalog*\n\nExplore our latest personalized gifts:\n🔗 https://inithancustomgifts.com/products.html\n\nPopular items include Photo Frames, Customized Mugs, LED Lamps, and Anniversary Gifts. Let us know what you'd like to customize!`;
  } else if (text === '4' || text.includes('support') || text.includes('help') || text.includes('agent')) {
    replyText = `💬 *Customer Support Team*\n\nOur team has received your request. An executive will get back to you shortly.\n\nYou can also email us at:\n✉️ inithancustomgifts@gmail.com`;
  } else if (/^ord[-_ ]?\d+/i.test(text)) {
    replyText = `🔍 Thank you for providing your Order ID (*${messageText.trim().toUpperCase()}*). Our support desk is checking the fulfillment and delivery status. We will update you here shortly!`;
  } else {
    replyText = `Thank you for reaching out to *Inithan Custom Gifts*, ${name}! ✨\n\nWe have received your message: _"${messageText}"_.\nOur team will review your query and reply shortly.\n\n(Type *HI* anytime to view the main menu).`;
  }

  if (replyText) {
    await sendTextMessage(from, replyText);
  }
}

module.exports = {
  getWhatsAppConfig,
  sendTextMessage,
  markMessageAsRead,
  sendWhatsAppOtp,
  handleCustomerReply
};

