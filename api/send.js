import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { name, email, message, website } = req.body;

  // Honeypot check
  if (website) {
    return res.status(200).json({ success: true });
  }

  if (!name || !email || !message) {
    return res.status(400).json({ error: '必須項目が入力されていません' });
  }

  if (String(name).length > 100) {
    return res.status(400).json({ error: '名前は100文字以内で入力してください' });
  }
  if (String(message).length > 5000) {
    return res.status(400).json({ error: 'メッセージは5000文字以内で入力してください' });
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({ error: 'メールアドレスの形式が正しくありません' });
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
