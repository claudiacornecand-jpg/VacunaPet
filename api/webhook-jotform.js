export default async function handler(req, res) {
  try {
    console.log("📩 Webhook recibido");

    const data = req.body || {};

    return res.status(200).json({
      ok: true,
      message: "Webhook funcionando correctamente 🎉",
      receivedData: data
    });

  } catch (err) {
    console.error("❌ Error:", err);
    return res.status(500).json({
      ok: false,
      error: err.message
    });
  }
}

