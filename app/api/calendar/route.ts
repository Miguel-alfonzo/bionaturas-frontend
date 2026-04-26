import { google } from 'googleapis';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { fechaInicio, fechaFin } = await req.json();

    const clientEmail = process.env.GOOGLE_CLIENT_EMAIL as string;
    const privateKey = (process.env.GOOGLE_PRIVATE_KEY as string).replace(/\\n/g, '\n');
    const calendarId = process.env.GOOGLE_CALENDAR_ID as string;

    // EL CAMBIO: Misma estructura de objeto {}
    const auth = new google.auth.JWT({
      email: clientEmail,
      key: privateKey,
      scopes: ['https://www.googleapis.com/auth/calendar.readonly']
    });

    const calendar = google.calendar({ version: 'v3', auth });

    const response = await calendar.freebusy.query({
      requestBody: {
        timeMin: fechaInicio,
        timeMax: fechaFin,
        items: [{ id: calendarId }],
      },
    });

    const ocupados = response.data.calendars?.[calendarId]?.busy || [];

    return NextResponse.json({ ocupados });
  } catch (error: any) {
    console.error("Error en Google Calendar:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}