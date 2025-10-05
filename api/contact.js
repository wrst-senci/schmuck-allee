// api/contact.js
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ ok: false, error: 'Method not allowed' });
  }

  try {
    const { name, email, phone, message } = req.body || {};

    if (!name || !email || !message) {
      return res.status(400).json({
        ok: false,
        error: 'Missing required fields',
        details: { name: !!name, email: !!email, message: !!message },
      });
    }

    const from = process.env.CONTACT_FROM;
    const to = process.env.CONTACT_TO;     // your private inbox/server-side only
    if (!from || !to) {
      return res.status(500).json({
        ok: false,
        error: 'Server misconfiguration',
        detail: 'CONTACT_FROM and CONTACT_TO must be set',
      });
    }

    const result = await resend.emails.send({
      from,
      to,
      reply_to: email,
      subject: `New website message from ${name}`,
      text: message,
      html: `
        <div style="font-family:system-ui,sans-serif;line-height:1.5">
          <p><strong>Name:</strong> ${escapeHtml(name)}</p>
          <p><strong>Email:</strong> ${escapeHtml(email)}</p>
          <p><strong>Telefon:</strong> ${escapeHtml(phone)}</p>
          <p><strong>Nachricht:</strong><br/>${escapeHtml(message).replace(/\n/g, '<br/>')}</p>
        </div>
      `,
    });

    if (result.error) {
      return res.status(502).json({
        ok: false,
        error: 'Resend error',
        detail: result.error?.message || result.error,
      });
    }

    return res.status(200).json({ ok: true, id: result.data?.id || null, message: 'Sent successfully' });
  } catch (err) {
    const detail =
      err?.response?.data?.message ||
      err?.message ||
      'Unknown server error';
    return res.status(500).json({ ok: false, error: 'Failed to send', detail });
  }
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}
