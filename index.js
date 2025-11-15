require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { Resend } = require('resend');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(express.json());
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*', // set your frontend domain in prod
}));

// Initialize Resend client
const resend = new Resend(process.env.RESEND_API_KEY);

app.get('/', (req, res) => {
  res.send('Contact server is running (Resend version).');
});

app.post('/api/contact', async (req, res) => {
  try {
    const { name, email, phone, area, message } = req.body;

    if (!name || !email || !area || !message) {
      return res.status(400).json({ message: 'Missing required fields.' });
    }

    const htmlBody = `
      <h3>New contact form submission</h3>
      <p><strong>Name:</strong> ${escapeHtml(name)}</p>
      <p><strong>Email:</strong> ${escapeHtml(email)}</p>
      <p><strong>Phone:</strong> ${escapeHtml(phone || 'N/A')}</p>
      <p><strong>Area of Interest:</strong> ${escapeHtml(area)}</p>
      <p><strong>Message:</strong><br/>${escapeHtml(message).replace(/\n/g, '<br/>')}</p>
      <hr/>
      <p>Sent from Mammoth website contact form.</p>
    `;

    // Send email via Resend
    const data = await resend.emails.send({
      from: process.env.FROM_EMAIL || 'Website Contact <onboarding@resend.dev>',
      to: process.env.TO_EMAIL,
      subject: `Website Contact: ${name} — ${area}`,
      reply_to: email,
      html: htmlBody,
    });

    console.log('Email sent via Resend:', data?.id || data);
    return res.status(200).json({ message: 'Message sent successfully!' });
  } catch (err) {
    console.error('Error sending contact mail via Resend:', err);
    return res.status(500).json({ message: 'Failed to send email.' });
  }
});

app.listen(PORT, () => {
  console.log(`Contact server (Resend) listening on port ${PORT}`);
});

// simple helper to sanitize basic HTML
function escapeHtml(str = '') {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
