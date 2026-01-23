export default function handler(req, res) {
  return res.status(200).json({
    ok: true,
    envs: {
      hasGmailUser: !!process.env.GMAIL_USER,
      hasGmailPass: !!process.env.GMAIL_PASS,
      hasClientEmail: !!process.env.GCAL_CLIENT_EMAIL,
      hasPrivateKey: !!process.env.GCAL_PRIVATE_KEY
    }
  });
}
