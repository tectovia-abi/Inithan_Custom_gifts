const nodemailer = require('nodemailer');
const BulkInquiry = require('../models/BulkInquiry');

// ─── Helper: HTML-escape user input to prevent XSS in email ───────────────────
function escHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// ─── Helper: Simple email format validator (no extra package needed) ──────────
function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

// ─── Configure NodeMailer with Connection Pooling ─────────────────────────────
const transporter = nodemailer.createTransport({
  service: 'gmail',
  pool: true,
  maxConnections: 5,
  maxMessages: 100,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

// ─── Verify SMTP connection at startup ────────────────────────────────────────
if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
  transporter.verify((error, success) => {
    if (error) {
      console.error('❌ SMTP Connection Error:', error.message);
    } else {
      console.log('✅ SMTP Server is ready to send emails');
    }
  });
}

// ─── Email Sender (runs in background after response) ─────────────────────────
async function sendBulkInquiryEmails(inquiry) {
  const timestamp = Date.now();
  const data = inquiry.toObject ? inquiry.toObject() : inquiry;

  // Escape all user-supplied values
  const referenceId     = escHtml(data.referenceId || 'N/A');
  const name            = escHtml(data.name);
  const email           = escHtml(data.email);
  const phone           = escHtml(data.phone);
  const whatsapp        = escHtml(data.whatsapp);
  const company         = escHtml(data.company);
  const city            = escHtml(data.city);
  const state           = escHtml(data.state);
  const quantity        = escHtml(data.quantity);
  const budgetRange     = escHtml(data.budgetRange);
  const customization   = escHtml(data.customization);
  const occasion        = escHtml(data.occasion);
  const packaging       = escHtml(data.packaging);
  const productDesc     = escHtml(data.productDescription);
  const designNotes     = escHtml(data.designNotes);
  const notes           = escHtml(data.notes);
  const products        = (data.products || []).map(escHtml).join(', ');
  const deliveryDate    = data.deliveryDate
    ? new Date(data.deliveryDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })
    : 'Flexible / Standard';

  const sharedHeaders = {
    'X-Mailer':   'Inithan Creations Mailer',
    'X-Priority': '3',
    'Date':        new Date().toUTCString()
  };

  const adminMailOptions = {
    from: {
      name:    'Inithan Creations – Orders',
      address:  process.env.EMAIL_USER
    },
    to:       'inithanorders@gmail.com',
    replyTo:   data.email,
    subject:  `📦 New Bulk Order – ${name} (${company || 'N/A'})`,
    messageId: `<${timestamp}-admin@inithancreations.com>`,
    date:      new Date(),
    headers:   sharedHeaders,
    text: [
      'NEW BULK ORDER INQUIRY',
      '========================',
      `Name     : ${data.name}`,
      `Company  : ${data.company || 'N/A'}`,
      `Email    : ${data.email}`,
      `Phone    : ${data.phone}`,
      `WhatsApp : ${data.whatsapp || 'N/A'}`,
      `Location : ${data.city}, ${data.state || 'N/A'}`,
      '',
      `Products : ${(data.products || []).join(', ')}`,
      `Quantity : ${data.quantity}`,
      `Budget   : ${data.budgetRange}`,
      `Delivery : ${deliveryDate}`,
      '',
      `Customization : ${data.customization}`,
      `Occasion      : ${data.occasion}`,
      `Packaging     : ${data.packaging || 'Standard'}`,
      '',
      `Product Description: ${data.productDescription}`,
      `Design Notes       : ${data.designNotes || 'None'}`,
      `Additional Notes   : ${data.notes || 'None'}`
    ].join('\n'),
    html: `
      <div style="font-family:Arial,sans-serif;max-width:680px;margin:0 auto;color:#222;border:1px solid #ddd;border-radius:8px;overflow:hidden;">
        <div style="background:#1A1A2E;padding:20px 30px;border-bottom:4px solid #C41E3A;">
          <h2 style="color:#fff;margin:0;font-size:20px;">📦 New Bulk Order Inquiry</h2>
          <p style="color:#D4AF37;margin:4px 0 0;font-size:13px;">Inithan Creations – Order Notifications</p>
        </div>
        <div style="padding:25px 30px;">
          <h3 style="background:#f4f4f4;padding:10px 12px;border-radius:5px;font-size:14px;text-transform:uppercase;letter-spacing:.5px;color:#555;margin-top:0;">Contact Details</h3>
          <table style="width:100%;border-collapse:collapse;font-size:15px;margin-bottom:20px;">
            <tr><td style="padding:5px 0;color:#777;width:140px;"><strong>Name</strong></td><td style="color:#222;">${name}</td></tr>
            <tr><td style="padding:5px 0;color:#777;"><strong>Company</strong></td><td style="color:#222;">${company || 'N/A'}</td></tr>
            <tr><td style="padding:5px 0;color:#777;"><strong>Email</strong></td><td><a href="mailto:${email}" style="color:#C41E3A;">${email}</a></td></tr>
            <tr><td style="padding:5px 0;color:#777;"><strong>Phone</strong></td><td style="color:#222;">${phone}</td></tr>
            <tr><td style="padding:5px 0;color:#777;"><strong>WhatsApp</strong></td><td style="color:#222;">${whatsapp || 'N/A'}</td></tr>
            <tr><td style="padding:5px 0;color:#777;"><strong>Location</strong></td><td style="color:#222;">${city}, ${state || 'N/A'}</td></tr>
          </table>
          <h3 style="background:#f4f4f4;padding:10px 12px;border-radius:5px;font-size:14px;text-transform:uppercase;letter-spacing:.5px;color:#555;">Order Details</h3>
          <table style="width:100%;border-collapse:collapse;font-size:15px;margin-bottom:20px;">
            <tr><td style="padding:5px 0;color:#777;width:140px;"><strong>Products</strong></td><td style="color:#222;">${products}</td></tr>
            <tr><td style="padding:5px 0;color:#777;"><strong>Quantity</strong></td><td style="color:#222;">${quantity}</td></tr>
            <tr><td style="padding:5px 0;color:#777;"><strong>Budget</strong></td><td style="color:#222;">${budgetRange}</td></tr>
            <tr><td style="padding:5px 0;color:#777;"><strong>Delivery By</strong></td><td style="color:#222;">${deliveryDate}</td></tr>
          </table>
          <h3 style="background:#f4f4f4;padding:10px 12px;border-radius:5px;font-size:14px;text-transform:uppercase;letter-spacing:.5px;color:#555;">Customization & Logistics</h3>
          <table style="width:100%;border-collapse:collapse;font-size:15px;margin-bottom:20px;">
            <tr><td style="padding:5px 0;color:#777;width:140px;"><strong>Type</strong></td><td style="color:#222;">${customization}</td></tr>
            <tr><td style="padding:5px 0;color:#777;"><strong>Occasion</strong></td><td style="color:#222;">${occasion}</td></tr>
            <tr><td style="padding:5px 0;color:#777;"><strong>Packaging</strong></td><td style="color:#222;">${packaging || 'Standard'}</td></tr>
          </table>
          <h3 style="background:#f4f4f4;padding:10px 12px;border-radius:5px;font-size:14px;text-transform:uppercase;letter-spacing:.5px;color:#555;">Notes & Description</h3>
          <p style="background:#fafafa;padding:12px;border-left:4px solid #C41E3A;font-size:14px;margin:0 0 10px;"><strong>Product Description:</strong><br>${productDesc}</p>
          <p style="background:#fafafa;padding:12px;border-left:4px solid #C41E3A;font-size:14px;margin:0 0 10px;"><strong>Design Notes:</strong><br>${designNotes || 'None'}</p>
          <p style="background:#fafafa;padding:12px;border-left:4px solid #C41E3A;font-size:14px;margin:0;"><strong>Additional Notes:</strong><br>${notes || 'None'}</p>
        </div>
        <div style="background:#f9f9f9;padding:15px 30px;text-align:center;border-top:1px solid #eee;font-size:12px;color:#999;">
          &copy; 2026 Inithat Custom Gifts. All rights reserved. &nbsp;|&nbsp; This is an automated system notification.
        </div>
      </div>
    `
  };

  const customerMailOptions = {
    from: {
      name:    'Inithat Custom Gifts',
      address:  process.env.EMAIL_USER
    },
    to:       data.email,
    replyTo:  'inithancustomgifts@gmail.com',
    subject:  `✅ Bulk Order Inquiry Received – Inithat Custom Gifts`,
    messageId: `<${timestamp}-customer@inithancreations.com>`,
    date:      new Date(),
    headers:   sharedHeaders,
    text: [
      `Hi ${data.name},`,
      '',
      'Thank you for choosing Inithat Custom Gifts!',
      `We have successfully received your bulk order request for ${data.quantity} units of: ${(data.products || []).join(', ')}.`,
      '',
      'Our dedicated corporate gifting specialist is reviewing your requirements and will contact you within 24 working hours with a personalized quotation.',
      '',
      '--- ORDER SUMMARY ---',
      `Products  : ${(data.products || []).join(', ')}`,
      `Budget    : ${data.budgetRange}`,
      `Delivery  : ${deliveryDate}`,
      '',
      'For urgent queries, reply to this email or reach us at inithancustomgifts@gmail.com.',
      '',
      'Warm Regards,',
      'Team Inithat Custom Gifts'
    ].join('\n'),
    html: `
      <!DOCTYPE html>
      <html lang="en">
      <head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
      <body style="margin:0;padding:0;background-color:#f0f0f0;font-family:'Helvetica Neue',Arial,sans-serif;">
        <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="background:#f0f0f0;padding:30px 0;">
          <tr>
            <td align="center">
              <table role="presentation" width="600" border="0" cellspacing="0" cellpadding="0" style="background:#ffffff;border-radius:10px;overflow:hidden;box-shadow:0 4px 20px rgba(0,0,0,0.08);">
                <tr>
                  <td style="background-color:#1A1A2E;padding:35px 30px;text-align:center;border-bottom:5px solid #C41E3A;">
                    <h1 style="color:#ffffff;margin:0;font-size:26px;font-weight:800;letter-spacing:2px;text-transform:uppercase;">Inithat Custom Gifts</h1>
                    <p style="color:#D4AF37;margin:8px 0 0;font-size:13px;font-style:italic;letter-spacing:1px;">Crafted with Love ✦ Made for You</p>
                  </td>
                </tr>
                <tr>
                  <td style="background:linear-gradient(135deg,#C41E3A 0%,#9B1B30 100%);padding:25px 30px;text-align:center;">
                    <h2 style="color:#ffffff;margin:0;font-size:20px;font-weight:700;">🎉 Order Request Confirmed!</h2>
                    <p style="color:rgba(255,255,255,0.85);margin:8px 0 0;font-size:14px;">We have received your bulk order inquiry</p>
                  </td>
                </tr>
                <tr>
                  <td style="padding:35px 30px;">
                    <p style="font-size:16px;color:#333;margin-top:0;">Hi <strong>${name}</strong>,</p>
                    <p style="font-size:15px;color:#555;line-height:1.7;">Thank you for choosing <strong>Inithat Custom Gifts</strong> for your corporate gifting needs. We have officially received your inquiry for <strong>${quantity} units</strong> and your request is now in our queue.</p>
                    <p style="font-size:15px;color:#555;line-height:1.7;">Our dedicated bulk order specialist will review your requirements and contact you within <strong>24 working hours</strong> with a personalized quotation tailored to your needs.</p>
                    <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="margin:25px 0;border:1px solid #eaeaea;border-radius:8px;overflow:hidden;">
                      <tr>
                        <td style="background:#f8f8f8;padding:14px 20px;border-bottom:1px solid #eaeaea;">
                          <h3 style="margin:0;font-size:13px;text-transform:uppercase;letter-spacing:1px;color:#C41E3A;font-weight:700;">📋 Order Summary</h3>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding:0;">
                          <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0">
                            <tr style="border-bottom:1px solid #f0f0f0;">
                              <td style="padding:12px 20px;color:#777;font-size:14px;width:40%;"><strong>Products Requested</strong></td>
                              <td style="padding:12px 20px;color:#333;font-size:14px;">${products}</td>
                            </tr>
                            <tr style="border-bottom:1px solid #f0f0f0;background:#fafafa;">
                              <td style="padding:12px 20px;color:#777;font-size:14px;"><strong>Quantity</strong></td>
                              <td style="padding:12px 20px;color:#333;font-size:14px;">${quantity} units</td>
                            </tr>
                            <tr style="border-bottom:1px solid #f0f0f0;">
                              <td style="padding:12px 20px;color:#777;font-size:14px;"><strong>Budget Range</strong></td>
                              <td style="padding:12px 20px;color:#333;font-size:14px;">${budgetRange}</td>
                            </tr>
                            <tr>
                              <td style="padding:12px 20px;color:#777;font-size:14px;"><strong>Expected Delivery</strong></td>
                              <td style="padding:12px 20px;color:#333;font-size:14px;">${deliveryDate}</td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                    </table>
                    <p style="font-size:15px;color:#555;line-height:1.7;">If you have any urgent queries, design files, or brand guidelines to share, simply reply to this email and our team will respond promptly.</p>
                    <p style="font-size:15px;color:#333;margin-bottom:5px;">Warm Regards,</p>
                    <p style="font-size:16px;color:#1A1A2E;font-weight:700;margin-top:0;">Team Inithat Custom Gifts</p>
                  </td>
                </tr>
                <tr>
                  <td style="background:#1A1A2E;padding:25px 30px;text-align:center;">
                    <p style="color:#aaa;font-size:12px;margin:0 0 8px;">
                      📧 <a href="mailto:inithancustomgifts@gmail.com" style="color:#D4AF37;text-decoration:none;">inithancustomgifts@gmail.com</a>
                      &nbsp;&nbsp;|&nbsp;&nbsp;
                      🌐 <a href="http://localhost:5000" style="color:#D4AF37;text-decoration:none;">inithat.com</a>
                    </p>
                    <p style="color:#666;font-size:11px;margin:0;">&copy; 2026 Inithat Custom Gifts. All rights reserved.</p>
                    <p style="color:#555;font-size:11px;margin:5px 0 0;">This is an official automated communication. Please do not reply to this automated notice.</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `
  };

  try {
    const adminInfo = await transporter.sendMail(adminMailOptions);
    console.log(`✅ Admin email sent | MessageID: ${adminInfo.messageId} | Response: ${adminInfo.response}`);
  } catch (err) {
    console.error('❌ Admin email failed:', err.message);
  }

  try {
    const customerInfo = await transporter.sendMail(customerMailOptions);
    console.log(`✅ Customer email sent | MessageID: ${customerInfo.messageId} | Response: ${customerInfo.response}`);
  } catch (err) {
    console.error('❌ Customer email failed (admin was still sent):', err.message);
  }
}

const createInquiry = async (req, res) => {
  try {
    const data = req.body;

    if (!data.email || !isValidEmail(data.email)) {
      return res.status(400).json({ success: false, message: 'A valid customer email address is required.' });
    }

    const newInquiry = new BulkInquiry(data);
    await newInquiry.save();

    res.status(201).json({ success: true, message: 'Inquiry submitted successfully', data: newInquiry });

    if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
      sendBulkInquiryEmails(newInquiry).catch(err =>
        console.error('❌ Background email error:', err)
      );
    } else {
      console.log('⚠️ Emails NOT sent: EMAIL_USER or EMAIL_PASS missing in .env');
    }

  } catch (error) {
    console.error('❌ Error saving bulk inquiry:', error);
    res.status(500).json({ success: false, message: 'Server error processing your request.' });
  }
};

const getInquiriesByUser = async (req, res) => {
  try {
    const userEmail = req.params.email;
    const inquiries = await BulkInquiry.find({ 
      $or: [{ userEmail: userEmail }, { email: userEmail }] 
    }).lean().sort({ submittedAt: -1 });
    res.status(200).json({ success: true, count: inquiries.length, inquiries });
  } catch (error) {
    console.error('❌ Error fetching user inquiries:', error);
    res.status(500).json({ success: false, message: 'Server error fetching user inquiries.' });
  }
};

const getInquiries = async (req, res) => {
  try {
    const { search, status, startDate, endDate, product } = req.query;
    let query = {};

    if (status && status !== 'all') {
      query.status = status;
    }

    if (product && product !== 'all') {
      query.products = product;
    }

    if (startDate || endDate) {
      query.submittedAt = {};
      if (startDate) {
        query.submittedAt.$gte = new Date(startDate);
      }
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        query.submittedAt.$lte = end;
      }
    }

    if (search) {
      const searchRegex = new RegExp(search, 'i');
      query.$or = [
        { name: searchRegex },
        { email: searchRegex },
        { phone: searchRegex },
        { company: searchRegex },
        { referenceId: searchRegex },
        { city: searchRegex },
        { state: searchRegex }
      ];
    }

    const inquiries = await BulkInquiry.find(query).lean().sort({ submittedAt: -1 });
    res.status(200).json({ success: true, count: inquiries.length, inquiries });
  } catch (error) {
    console.error('❌ Error fetching inquiries:', error);
    res.status(500).json({ success: false, message: 'Server error fetching inquiries.' });
  }
};

const updateInquiryStatus = async (req, res) => {
  try {
    const { status } = req.body;
    if (!['New', 'Reviewed', 'Resolved', 'Cancelled'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status value.' });
    }

    const inquiry = await BulkInquiry.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );

    if (!inquiry) {
      return res.status(404).json({ success: false, message: 'Inquiry not found.' });
    }

    res.status(200).json({ success: true, message: 'Status updated successfully', inquiry });
  } catch (error) {
    console.error('❌ Error updating status:', error);
    res.status(500).json({ success: false, message: 'Server error updating status.' });
  }
};

const deleteInquiry = async (req, res) => {
  try {
    const inquiry = await BulkInquiry.findByIdAndDelete(req.params.id);
    if (!inquiry) {
      return res.status(404).json({ success: false, message: 'Inquiry not found.' });
    }
    res.status(200).json({ success: true, message: 'Inquiry deleted successfully' });
  } catch (error) {
    console.error('❌ Error deleting inquiry:', error);
    res.status(500).json({ success: false, message: 'Server error deleting inquiry.' });
  }
};

module.exports = {
  createInquiry,
  getInquiriesByUser,
  getInquiries,
  updateInquiryStatus,
  deleteInquiry
};
