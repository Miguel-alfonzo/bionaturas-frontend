import { google } from 'googleapis';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { nombre, servicio, fecha, hora, duracion } = await req.json();

    const clientEmail = process.env.GOOGLE_CLIENT_EMAIL as string;
    const privateKey = (process.env.GOOGLE_PRIVATE_KEY as string).replace(/\\n/g, '\n');
    const calendarId = process.env.GOOGLE_CALENDAR_ID as string;

    // EL CAMBIO: Ahora enviamos un solo bloque {} con los datos
    const auth = new google.auth.JWT({
      email: clientEmail,
      key: privateKey,
      scopes: ['https://www.googleapis.com/auth/calendar']
    });

    const calendar = google.calendar({ version: 'v3', auth });

    // Calculamos el fin de la cita basándonos en la duración del servicio
    const inicio = new Date(`${fecha}T${hora}:00-04:00`);
    const fin = new Date(inicio.getTime() + duracion * 60000);

    const event = {
      summary: `${servicio} - ${nombre}`,
      description: `Cita agendada automáticamente desde el Portal Familiar de Bionaturas.`,
      start: { dateTime: inicio.toISOString(), timeZone: 'America/Caracas' },
      end: { dateTime: fin.toISOString(), timeZone: 'America/Caracas' },
      reminders: { useDefault: true },
    };

    await calendar.events.insert({
      calendarId: calendarId,
      requestBody: event,
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error al agendar en Google:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}