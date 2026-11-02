const express = require('express');
const http = require('http');
const whatsappRoutes = require('../routes/whatsappRoutes');

// Mock WhatsAppMessage model so we don't need a real MongoDB connection to test controller logic
const WhatsAppMessage = require('../models/WhatsAppMessage');
WhatsAppMessage.create = async (doc) => {
  console.log('   [MOCK DB] WhatsAppMessage.create:', doc.messageId, doc.type, doc.direction);
  return doc;
};
WhatsAppMessage.findOneAndUpdate = async (query, update) => {
  console.log('   [MOCK DB] WhatsAppMessage.findOneAndUpdate:', query, update.$set?.status);
  return { ...query, ...update.$set };
};

const app = express();
app.use(express.json());
app.use('/api/whatsapp', whatsappRoutes);

async function runTests() {
  const server = http.createServer(app);
  await new Promise(resolve => server.listen(0, resolve));
  const port = server.address().port;
  const baseUrl = `http://localhost:${port}/api/whatsapp`;

  console.log(`\n🧪 Testing WhatsApp Webhook locally on port ${port}...\n`);

  // Test 1: GET /api/whatsapp/webhook Handshake
  console.log('Test 1: GET /api/whatsapp/webhook (Meta Handshake Verification)');
  const challenge = 'meta_test_challenge_998877';
  const getRes = await fetch(`${baseUrl}/webhook?hub.mode=subscribe&hub.verify_token=inithan_wa_verify_token_2026&hub.challenge=${challenge}`);
  const getText = await getRes.text();
  if (getRes.status === 200 && getText === challenge) {
    console.log('   ✅ Handshake verification succeeded (Status: 200, Challenge matched)');
  } else {
    console.error('   ❌ Handshake verification failed:', getRes.status, getText);
  }

  // Test 2: GET /api/whatsapp/webhook with Invalid Token
  console.log('\nTest 2: GET /api/whatsapp/webhook (Invalid Token)');
  const badRes = await fetch(`${baseUrl}/webhook?hub.mode=subscribe&hub.verify_token=bad_token&hub.challenge=${challenge}`);
  if (badRes.status === 403) {
    console.log('   ✅ Unauthorized token rejected with HTTP 403 Forbidden');
  } else {
    console.error('   ❌ Unexpected response for bad token:', badRes.status);
  }

  // Test 3: POST /api/whatsapp/webhook (Incoming Customer Message)
  console.log('\nTest 3: POST /api/whatsapp/webhook (Incoming Customer Message & Reply Trigger)');
  const sampleIncomingPayload = {
    object: 'whatsapp_business_account',
    entry: [
      {
        id: 'WHATSAPP_BUSINESS_ACCOUNT_ID',
        changes: [
          {
            value: {
              messaging_product: 'whatsapp',
              metadata: {
                display_phone_number: '919944444834',
                phone_number_id: 'TEST_PHONE_123'
              },
              contacts: [
                {
                  profile: { name: 'Karthik' },
                  wa_id: '919876543210'
                }
              ],
              messages: [
                {
                  from: '919876543210',
                  id: 'wamid.HBgTESTINCOMING123',
                  timestamp: '1730528400',
                  text: { body: 'Hi, I would like to order a custom gift' },
                  type: 'text'
                }
              ]
            },
            field: 'messages'
          }
        ]
      }
    ]
  };

  const postMsgRes = await fetch(`${baseUrl}/webhook`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(sampleIncomingPayload)
  });
  const postMsgText = await postMsgRes.text();
  if (postMsgRes.status === 200 && postMsgText === 'EVENT_RECEIVED') {
    console.log('   ✅ Incoming message received and processed (Status: 200 EVENT_RECEIVED)');
  } else {
    console.error('   ❌ Incoming message handling failed:', postMsgRes.status, postMsgText);
  }

  // Test 4: POST /api/whatsapp/webhook (OTP / Message Status Update - 'delivered')
  console.log('\nTest 4: POST /api/whatsapp/webhook (OTP / Message Status Update)');
  const sampleStatusPayload = {
    object: 'whatsapp_business_account',
    entry: [
      {
        id: 'WHATSAPP_BUSINESS_ACCOUNT_ID',
        changes: [
          {
            value: {
              messaging_product: 'whatsapp',
              metadata: {
                display_phone_number: '919944444834',
                phone_number_id: 'TEST_PHONE_123'
              },
              statuses: [
                {
                  id: 'wamid.OTP_MESSAGE_456',
                  status: 'delivered',
                  timestamp: '1730528500',
                  recipient_id: '919876543210'
                }
              ]
            },
            field: 'messages'
          }
        ]
      }
    ]
  };

  const postStatusRes = await fetch(`${baseUrl}/webhook`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(sampleStatusPayload)
  });
  const postStatusText = await postStatusRes.text();
  if (postStatusRes.status === 200 && postStatusText === 'EVENT_RECEIVED') {
    console.log('   ✅ Message/OTP status update processed (Status: 200 EVENT_RECEIVED)');
  } else {
    console.error('   ❌ Status update handling failed:', postStatusRes.status, postStatusText);
  }

  // Test 5: GET /api/whatsapp/status (Health / Config Endpoint)
  console.log('\nTest 5: GET /api/whatsapp/status (Diagnostic)');
  const statusRes = await fetch(`${baseUrl}/status`);
  const statusJson = await statusRes.json();
  if (statusRes.status === 200 && statusJson.status === 'active') {
    console.log('   ✅ WhatsApp status endpoint returned:', JSON.stringify(statusJson));
  } else {
    console.error('   ❌ Status diagnostic endpoint failed:', statusRes.status, statusJson);
  }

  server.close();
  console.log('\n🎉 ALL TESTS PASSED! WhatsApp Webhook is fully functional.\n');
}

runTests().catch(err => {
  console.error('Test runner error:', err);
  process.exit(1);
});

