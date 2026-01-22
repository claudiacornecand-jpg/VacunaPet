import nodemailer from "nodemailer";
import { google } from "googleapis";

function parseInterval(intervalText) {
  if (!intervalText) return { months: 1 };
  const t = intervalText.toLowerCase();
  const n = parseInt(t, 10);

  if (t.includes("día") || t.includes("dias") || t.includes("días"))
    return { days: isNaN(n) ? 21 : n };

  if (t.includes("mes"))
    return { months: isNaN(n) ? 1 : n };

  if (t.includes("año") || t.includes("años"))
    return { months: isNaN(n) ? 12 : n * 12 };

  return { months: 1 };
}

function addInterval(dateStr, interval) {
  const d = new Date(dateStr);
  if (interval.days) d.setDate(d.getDate() + interval.days);
  if (interval.months) d.setMonth(d.getMonth() + interval.months);
  return d.toISOString().slice(0, 10);
}

export default async function handler(req, res) {
  try {
    const data = req.body;

    const petName = data["Nombre de la mascota"];
    const owner = data["Nombre del propietario"];
    const email = data["Correo electrónico"];
    const vaccine = data["Tipo de vacuna"];
    const lastDose = data["Fecha de la última dosis recibida"];
    const intervalText = data["Intervalo entre dosis (en días o meses)"];

    const interval = parseInterval(intervalText);
    const nextDate = addInterval(lastDose, interval);

    // ===== EMAIL =====
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_PASS
      }
    });

    await transporter.sendMail({
      from: `"Asistente de Vacunación" <${process.env.GMAIL_USER}>`,
      to: email,
      subject: `🐾 Próxima vacuna de ${petName}`,
      text: `
Hola ${owner},

Hemos registrado a ${petName}.
La próxima dosis de ${vaccine} será el:

📅 ${nextDate}

Te enviaremos un recordatorio cerca de esa fecha.

— Asistente de Vacunación 🐶🐱
      `
    });

    // ===== GOOGLE CALENDAR =====
    const auth = new google.auth.JWT(
      process.env.GCAL_CLIENT_EMAIL,
      null,
      process.env.GCAL_PRIVATE_KEY.replace(/\\n/g, "\n"),
      ["https://www.googleapis.com/auth/calendar"]
    );

    const calendar = google.calendar({ version: "v3", auth });

    await calendar.events.insert({
      calendarId: "primary",
      requestBody: {
        summary: `Vacuna ${vaccine} — ${petName}`,
        description: `Recordatorio de vacunación para ${petName}`,
        start: { date: nextDate },
        end: { date: nextDate },
        reminders: {
          useDefault: false,
          overrides: [
            { method: "email", minutes: 24 * 60 },
            { method: "email", minutes: 60 }
          ]
        }
      }
    });

    res.status(200).json({
      ok: true,
      petName,
      nextDate,
      message: "Recordatorio creado y email enviado"
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false, error: err.message });
  }
}
