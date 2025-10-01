// api/contact.js

module.exports = async (req, res) => {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  // Parse JSON body (Vercel doesn't auto-parse in Node functions)
  let body = {};
  try {
    body = req.body && typeof req.body === "object" ? req.body : JSON.parse(req.body || "{}");
  } catch {
    return res.status(400).json({ error: "Invalid JSON" });
  }

  const { name, email, message } = body;
  if (!name || !email || !message) {
    return res.status(400).json({ error: "Missing fields" });
  }

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "Schmuck Allee <onboarding@resend.dev>", // sandbox sender
        to: process.env.CONTACT_TO_EMAIL,              // your inbox (set in Vercel)
        subject: `Neue Nachricht von ${name}`,
        html: `
          <p><strong>Name:</strong> ${name}</p>
          <p><strong>Email:</strong> ${email}</p>
          <p><strong>Nachricht:</strong><br>${message}</p>
        `,
      }),
    });

    const text = await response.text();
    if (!response.ok) {
      console.error("Resend API error:", response.status, text);
      return res.status(502).json({ error: "Email send failed", detail: text });
    }

    return res.status(200).json({ success: true });
  } catch (err) {
    console.error("Contact API error:", err);
    return res.status(500).json({ error: "Server error" });
  }
};
