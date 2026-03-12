import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { name, email, message } = req.body;

  if (!name || !email || !message) {
    return res.status(400).json({ error: '必須項目が入力されていません' });
  }

  try {
    await resend.emails.send({
      from: 'はやしごと <noreply@shigoto.dev>',
      to: 'hay@shigoto.dev',
      replyTo: email,
      subject: `【お問い合わせ】${name} さんより`,
      text: `名前: ${name}\nメール: ${email}\n\n${message}`,
    });

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('Resend error:', error);
    return res.status(500).json({ error: 'メール送信に失敗しました' });
  }
}
