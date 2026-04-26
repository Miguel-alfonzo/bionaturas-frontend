import { google } from 'googleapis';
import { NextResponse } from 'next/server';

// CORRECCIÓN: Ahora se envían los datos como un único objeto con llaves {}
const auth = new google.auth.JWT({
  email: process.env.GOOGLE_CLIENT_EMAIL,
  key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  scopes: ['https://www.googleapis.com/auth/calendar']
});

const calendar = google.calendar({ version: 'v3', auth });
const CALENDAR_ID = process.env.GOOGLE_CALENDAR_ID;

export async function POST(req: Request) {
  try {
    const { nombre, fechaTexto } = await req.json();

    if (!nombre || !fechaTexto) {
      return NextResponse.json({ error: 'Faltan datos para la cancelación' }, { status: 400 });
    }

    // fechaTexto viene como "28/04/2026 a las 04:00 PM"
    const partes = fechaTexto.split(' ');
    const fechaVzla = partes[0]; 
    const [d, m, y] = fechaVzla.split('/');
    
    const inicioBusqueda = `${y}-${m}-${d}T00:00:00-04:00`;
    const finBusqueda = `${y}-${m}-${d}T23:59:59-04:00`;

    const response = await calendar.events.list({
      calendarId: CALENDAR_ID,
      timeMin: new Date(inicioBusqueda).toISOString(),
      timeMax: new Date(finBusqueda).toISOString(),
      q: nombre, 
      singleEvents: true,
    });

    const eventos = response.data.items || [];

    if (eventos.length > 0) {
      for (const evento of eventos) {
        await calendar.events.delete({
          calendarId: CALENDAR_ID,
          eventId: evento.id!,
        });
      }
      return NextResponse.json({ message: 'Cita liberada en Google Calendar' });
    }

    return NextResponse.json({ message: 'No se encontraron eventos para borrar' });

  } catch (error: any) {
    console.error('Error en el motor de borrado:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}