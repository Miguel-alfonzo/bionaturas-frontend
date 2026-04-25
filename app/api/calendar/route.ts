import { google } from 'googleapis';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { fechaInicio, fechaFin } = await req.json();

    // 1. Configuramos la autenticación con las llaves del .env.local
    const auth = new google.auth.JWT(
      process.env.GOOGLE_CLIENT_EMAIL,
      null,
      process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'), // Arregla los saltos de línea
      ['https://www.googleapis.com/auth/calendar.readonly']
    );

    const calendar = google.calendar({ version: 'v3', auth });

    // 2. Le preguntamos a Google: "¿Qué horas están ocupadas?"
    const response = await calendar.freebusy.query({
      requestBody: {
        timeMin: fechaInicio, // Ejemplo: 2024-05-24T00:00:00Z
        timeMax: fechaFin,    // Ejemplo: 2024-05-24T23:59:59Z
        items: [{ id: process.env.GOOGLE_CALENDAR_ID }],
      },
    });

    const ocupados = response.data.calendars?.[process.env.GOOGLE_CALENDAR_ID!]?.busy || [];

    return NextResponse.json({ ocupados });
  } catch (error: any) {
    console.error("Error en Google Calendar:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}