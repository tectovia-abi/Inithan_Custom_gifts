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
    apiVersion: (process.env.WHATSAPP_API_VERSION || 'v21.0').trim(),
    otpTemplateName: (process.env.WHATSAPP_OTP_TEMPLATE_NAME || '').trim(),
    otpTemplateLang: (process.env.WHATSAPP_OTP_TEMPLATE_LANG || 'en_US').trim(),
    orderConfirmationTemplate: (process.env.WHATSAPP_ORDER_CONFIRMATION_TEMPLATE_NAME || '').trim(),
    orderCancellationTemplate: (process.env.WHATSAPP_ORDER_CANCELLATION_TEMPLATE_NAME || '').trim()
  };
};

/**
 * Standardize phone number:
 * Strips non-digits, strips leading zeros, and adds Indian country code '91'
 * if exactly 10 digits are provided.
 */
function formatPhoneNumber(phone) {
  let clean = String(phone || '').replace(/[^0-9]/g, '');
  clean = clean.replace(/^0+/, '');
  if (clean.length === 10) {
    clean = '91' + clean;
  }
  return clean;
}

/**
 * Checks if real Meta credentials have been provided (not placeholder strings or empty)
 */
function isConfigured(token, phoneNumberId) {
  if (!token || !phoneNumberId) return false;
  const t = token.trim().toLowerCase();
  const p = phoneNumberId.trim().toLowerCase();
  if (t.includes('your_') || t.includes('placeholder') || p.includes('your_') || p.includes('placeholder')) {
    return false;
  }
  return true;
}

/**
 * Send an outbound text message via WhatsApp Cloud API
 */
async function sendTextMessage(to, bodyText) {
  const { token, phoneNumberId, apiVersion } = getWhatsAppConfig();
  const cleanTo = formatPhoneNumber(to);

  if (!isConfigured(token, phoneNumberId)) {
    console.warn('[WhatsApp Service] Meta credentials missing or placeholder. Outbound text message simulated.');
    return { success: false, message: 'WhatsApp credentials not configured', simulated: true };
  }

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

    return { success: true, data, messageId };
  } catch (err) {
    console.error('[WhatsApp Service] Network exception sending message:', err.message);
    return { success: false, error: err.message };
  }
}

/**
 * Send an OTP via WhatsApp Cloud API
 * 1. Checks if Meta credentials are present; if not, logs simulated OTP for local dev/testing.
 * 2. If an approved template is configured (WHATSAPP_OTP_TEMPLATE_NAME), sends via template.
 * 3. Falls back to text message if template is not configured or fails.
 */
async function sendWhatsAppOtp(to, otpCode) {
  const { token, phoneNumberId, apiVersion, otpTemplateName, otpTemplateLang } = getWhatsAppConfig();
  const cleanTo = formatPhoneNumber(to);
  const bodyText = `*Inithan Custom Gifts*\n\nYour One-Time Password (OTP) for password reset is: *${otpCode}*\n\nValid for 10 minutes. Please do not share this OTP with anyone.`;

  // Simulated OTP mode when credentials are not yet entered
  if (!isConfigured(token, phoneNumberId)) {
    const simMessageId = `sim_otp_${Date.now()}`;
    console.log(`\n========================================`);
    console.log(`📱 [WhatsApp Service: DEV / SIMULATED MODE]`);
    console.log(`   To: +${cleanTo}`);
    console.log(`   OTP Code: ${otpCode}`);
    console.log(`   (Configure WHATSAPP_ACCESS_TOKEN and WHATSAPP_PHONE_NUMBER_ID in .env for live Meta delivery)`);
    console.log(`========================================\n`);

    try {
      await WhatsAppMessage.create({
        messageId: simMessageId,
        phoneNumberId: phoneNumberId || 'simulated',
        direction: 'outgoing',
        type: 'otp',
        to: cleanTo,
        body: bodyText,
        status: 'sent',
        metadata: { simulated: true, otpCode }
      });
    } catch (_) {}

    return {
      success: true,
      simulated: true,
      messageId: simMessageId,
      message: 'Simulated WhatsApp OTP dispatched in development mode.'
    };
  }

  // 1. Try sending via Meta Approved Message Template (Mandatory for business-initiated OTP outside 24h)
  if (otpTemplateName) {
    try {
      const url = `https://graph.facebook.com/${apiVersion}/${phoneNumberId}/messages`;
      const templatePayload = {
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        to: cleanTo,
        type: 'template',
        template: {
          name: otpTemplateName,
          language: { code: otpTemplateLang || 'en_US' },
          components: [
            {
              type: 'body',
              parameters: [
                { type: 'text', text: String(otpCode) }
              ]
            },
            {
              type: 'button',
              sub_type: 'url',
              index: '0',
              parameters: [
                { type: 'text', text: String(otpCode) }
              ]
            }
          ]
        }
      };

      console.log(`🚀 [WhatsApp Service] Attempting template OTP dispatch via "${otpTemplateName}" to +${cleanTo}...`);
      let response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(templatePayload)
      });

      let data = await response.json();

      // If button component failed (e.g. template does not have button), retry with body parameters only
      if (!response.ok && data?.error?.message?.includes('button')) {
        console.warn('[WhatsApp Service] Template button component rejected, retrying with body-only parameters...');
        templatePayload.template.components = [
          {
            type: 'body',
            parameters: [{ type: 'text', text: String(otpCode) }]
          }
        ];
        response = await fetch(url, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(templatePayload)
        });
        data = await response.json();
      }

      if (response.ok) {
        const messageId = data?.messages?.[0]?.id || `out_${Date.now()}`;
        console.log(`✅ [WhatsApp Service] Template OTP delivered to Meta Graph API! Message ID: ${messageId}`);

        try {
          await WhatsAppMessage.create({
            messageId,
            phoneNumberId,
            direction: 'outgoing',
            type: 'otp',
            to: cleanTo,
            body: `Template: ${otpTemplateName} | Code: ${otpCode}`,
            status: 'sent',
            metadata: data
          });
        } catch (_) {}

        return { success: true, mode: 'template', messageId, data };
      } else {
        console.warn('⚠️ [WhatsApp Service] Template dispatch failed, falling back to text message:', data);
      }
    } catch (templateErr) {
      console.warn('⚠️ [WhatsApp Service] Template exception, trying text fallback:', templateErr.message);
    }
  }

  // 2. Fallback to direct text message (works within 24hr window or during sandbox testing)
  console.log(`💬 [WhatsApp Service] Sending OTP via direct text message to +${cleanTo}...`);
  return await sendTextMessage(cleanTo, bodyText);
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

/**
 * Send an Order Confirmation notification via WhatsApp Cloud API
 */
async function sendOrderConfirmation(order) {
  if (!order || !order.customer || !order.customer.phone) {
    console.warn('[WhatsApp Service] Order or customer phone missing, skipping order confirmation.');
    return { success: false, message: 'Customer phone missing' };
  }

  const { token, phoneNumberId, apiVersion, orderConfirmationTemplate, otpTemplateLang } = getWhatsAppConfig();
  const cleanTo = formatPhoneNumber(order.customer.phone);
  const customerName = order.customer.name || 'Valued Customer';
  const orderNumber = order.orderNumber || 'ICG-ORDER';
  const totalAmount = Number(order.totalAmount || 0).toLocaleString('en-IN');

  // Format items list
  const itemsSummary = (order.items || [])
    .map(i => `• ${i.quantity}x ${i.name}`)
    .slice(0, 5)
    .join('\n');
  const moreItemsCount = (order.items || []).length > 5 ? `\n...and ${(order.items || []).length - 5} more item(s)` : '';

  const bodyText = `🎉 *Order Confirmed!* - *Inithan Custom Gifts*\n\n` +
    `Hello *${customerName}*! 👋\n` +
    `Thank you for shopping with us! Your order *#${orderNumber}* has been successfully placed.\n\n` +
    `📦 *Items in your order:*\n${itemsSummary}${moreItemsCount}\n\n` +
    `💰 *Total Paid:* ₹${totalAmount} (via Razorpay)\n` +
    `📍 *Shipping To:* ${order.shippingAddress?.city || 'Your City'}, ${order.shippingAddress?.state || ''} - ${order.shippingAddress?.pincode || ''}\n\n` +
    `You can track your order live anytime here:\n` +
    `🔗 https://inithancustomgifts.com/my-orders.html\n\n` +
    `_Made with Love by Inithan Custom Gifts ✨_`;

  if (!isConfigured(token, phoneNumberId)) {
    const simId = `sim_order_conf_${Date.now()}`;
    console.log(`\n========================================`);
    console.log(`📱 [WhatsApp Service: DEV / SIMULATED ORDER CONFIRMATION]`);
    console.log(`   To: +${cleanTo} (${customerName})`);
    console.log(`   Order: #${orderNumber} | Amount: ₹${totalAmount}`);
    console.log(`========================================\n`);

    try {
      await WhatsAppMessage.create({
        messageId: simId,
        phoneNumberId: phoneNumberId || 'simulated',
        direction: 'outgoing',
        type: 'order_confirmation',
        to: cleanTo,
        body: bodyText,
        status: 'sent',
        metadata: { simulated: true, orderNumber, totalAmount }
      });
    } catch (_) {}

    return { success: true, simulated: true, messageId: simId };
  }

  // 1. Try template if configured
  if (orderConfirmationTemplate) {
    try {
      const url = `https://graph.facebook.com/${apiVersion}/${phoneNumberId}/messages`;
      const templatePayload = {
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        to: cleanTo,
        type: 'template',
        template: {
          name: orderConfirmationTemplate,
          language: { code: otpTemplateLang || 'en_US' },
          components: [
            {
              type: 'body',
              parameters: [
                { type: 'text', text: customerName },
                { type: 'text', text: orderNumber },
                { type: 'text', text: `₹${totalAmount}` }
              ]
            }
          ]
        }
      };

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(templatePayload)
      });

      const data = await response.json();
      if (response.ok) {
        const messageId = data?.messages?.[0]?.id || `out_${Date.now()}`;
        try {
          await WhatsAppMessage.create({
            messageId,
            phoneNumberId,
            direction: 'outgoing',
            type: 'order_confirmation',
            to: cleanTo,
            body: `Template: ${orderConfirmationTemplate} | Order: #${orderNumber}`,
            status: 'sent',
            metadata: data
          });
        } catch (_) {}
        return { success: true, mode: 'template', messageId, data };
      }
    } catch (err) {
      console.warn('⚠️ [WhatsApp Service] Template order confirmation failed, using text fallback:', err.message);
    }
  }

  // Fallback to text message
  return await sendTextMessage(cleanTo, bodyText);
}

/**
 * Send an Order Cancellation notification via WhatsApp Cloud API
 */
async function sendOrderCancellation(order, reason, cancelledBy = 'Customer') {
  if (!order || !order.customer || !order.customer.phone) {
    console.warn('[WhatsApp Service] Order or customer phone missing, skipping order cancellation notification.');
    return { success: false, message: 'Customer phone missing' };
  }

  const { token, phoneNumberId, apiVersion, orderCancellationTemplate, otpTemplateLang } = getWhatsAppConfig();
  const cleanTo = formatPhoneNumber(order.customer.phone);
  const customerName = order.customer.name || 'Valued Customer';
  const orderNumber = order.orderNumber || 'ICG-ORDER';
  const totalAmount = Number(order.totalAmount || 0).toLocaleString('en-IN');
  const cancelReason = String(reason || 'Requested by customer').trim();

  const bodyText = `⚠️ *Order Cancelled* - *Inithan Custom Gifts*\n\n` +
    `Hello *${customerName}*,\n` +
    `Your order *#${orderNumber}* has been cancelled.\n\n` +
    `📝 *Reason:* ${cancelReason}\n` +
    `💳 *Refund Details:* If you completed payment online via Razorpay, a full refund of *₹${totalAmount}* will be processed back to your original payment method within 5-7 business days.\n\n` +
    `If you have questions or this was done in error, please reply directly to this WhatsApp message or email us at inithancustomgifts@gmail.com.\n\n` +
    `We hope to serve you again soon! ✨`;

  if (!isConfigured(token, phoneNumberId)) {
    const simId = `sim_order_cancel_${Date.now()}`;
    console.log(`\n========================================`);
    console.log(`📱 [WhatsApp Service: DEV / SIMULATED ORDER CANCELLATION]`);
    console.log(`   To: +${cleanTo} (${customerName})`);
    console.log(`   Order: #${orderNumber} | Reason: ${cancelReason}`);
    console.log(`========================================\n`);

    try {
      await WhatsAppMessage.create({
        messageId: simId,
        phoneNumberId: phoneNumberId || 'simulated',
        direction: 'outgoing',
        type: 'order_cancellation',
        to: cleanTo,
        body: bodyText,
        status: 'sent',
        metadata: { simulated: true, orderNumber, cancelReason, cancelledBy }
      });
    } catch (_) {}

    return { success: true, simulated: true, messageId: simId };
  }

  // 1. Try template if configured
  if (orderCancellationTemplate) {
    try {
      const url = `https://graph.facebook.com/${apiVersion}/${phoneNumberId}/messages`;
      const templatePayload = {
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        to: cleanTo,
        type: 'template',
        template: {
          name: orderCancellationTemplate,
          language: { code: otpTemplateLang || 'en_US' },
          components: [
            {
              type: 'body',
              parameters: [
                { type: 'text', text: customerName },
                { type: 'text', text: orderNumber },
                { type: 'text', text: cancelReason }
              ]
            }
          ]
        }
      };

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(templatePayload)
      });

      const data = await response.json();
      if (response.ok) {
        const messageId = data?.messages?.[0]?.id || `out_${Date.now()}`;
        try {
          await WhatsAppMessage.create({
            messageId,
            phoneNumberId,
            direction: 'outgoing',
            type: 'order_cancellation',
            to: cleanTo,
            body: `Template: ${orderCancellationTemplate} | Order: #${orderNumber}`,
            status: 'sent',
            metadata: data
          });
        } catch (_) {}
        return { success: true, mode: 'template', messageId, data };
      }
    } catch (err) {
      console.warn('⚠️ [WhatsApp Service] Template cancellation notice failed, using text fallback:', err.message);
    }
  }

  // Fallback to text message
  return await sendTextMessage(cleanTo, bodyText);
}

module.exports = {
  getWhatsAppConfig,
  formatPhoneNumber,
  sendTextMessage,
  markMessageAsRead,
  sendWhatsAppOtp,
  sendOrderConfirmation,
  sendOrderCancellation,
  handleCustomerReply
};
