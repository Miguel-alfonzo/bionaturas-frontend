import { NextResponse } from 'next/server';
import { Body, Equator, Observer, SiderealTime } from 'astronomy-engine';

export async function POST(request: Request) {
  try {
    const { fecha, hora, latitud = 10.48, longitud = -66.90 } = await request.json();
    if (!fecha || fecha === "NULL") return NextResponse.json({ exito: false, error: "Falta fecha" });

    let anio, mes, dia;
    if (fecha.includes('-')) [anio, mes, dia] = fecha.split('-');
    else [dia, mes, anio] = fecha.split('/');

    let hrs = 12, mins = 0;
    if (hora && typeof hora === 'string') {
      const timeMatch = hora.match(/(\d{1,2}):(\d{2})\s*(AM|PM)?/i);
      if (timeMatch) {
        hrs = parseInt(timeMatch[1], 10);
        mins = parseInt(timeMatch[2], 10);
        const ampm = timeMatch[3]?.toUpperCase();
        if (ampm === 'PM' && hrs < 12) hrs += 12;
        if (ampm === 'AM' && hrs === 12) hrs = 0;
      }
    }

    const fechaUTC = new Date(Date.UTC(Number(anio), Number(mes) - 1, Number(dia), hrs + 4, mins));

    const observer = new Observer(latitud, longitud, 0);
    const planetasLista = [
      { id: 'Sol', body: Body.Sun }, { id: 'Luna', body: Body.Moon },
      { id: 'Mercurio', body: Body.Mercury }, { id: 'Venus', body: Body.Venus },
      { id: 'Marte', body: Body.Mars }, { id: 'Júpiter', body: Body.Jupiter },
      { id: 'Saturno', body: Body.Saturn }, { id: 'Urano', body: Body.Uranus },
      { id: 'Neptuno', body: Body.Neptune }, { id: 'Plutón', body: Body.Pluto }
    ];

    const posiciones = planetasLista.map(p => {
      const equ = Equator(p.body, fechaUTC, observer, true, true);
      let lon = Math.atan2(equ.vec.y, equ.vec.x) * (180 / Math.PI);
      if (lon < 0) lon += 360;
      return { nombre: p.id, longitud: lon, signo: Math.floor(lon / 30), grados: lon % 30 };
    });

    const st = SiderealTime(fechaUTC); 
    const lst = (st + longitud / 15 + 24) % 24; 
    const ramc = lst * 15; 
    const eps = 23.4392911; 
    const rad = Math.PI/180;

    let mc = Math.atan2(Math.tan(ramc * rad), Math.cos(eps * rad)) / rad;
    if (ramc > 90 && ramc <= 270) mc += 180;
    else if (ramc > 270) mc += 360;
    mc = mc % 360;

    let asc = Math.atan2(Math.cos(ramc * rad), - (Math.sin(ramc * rad) * Math.cos(eps * rad) + Math.tan(latitud * rad) * Math.sin(eps * rad))) / rad;
    asc = (asc + 360) % 360;

    const casas = Array.from({ length: 12 }, (_, i) => (asc + i * 30) % 360);

    const aspectos: any[] = [];
    for (let i = 0; i < posiciones.length; i++) {
      for (let j = i + 1; j < posiciones.length; j++) {
        const diff = Math.abs(posiciones[i].longitud - posiciones[j].longitud);
        const dist = diff > 180 ? 360 - diff : diff;

        // ORBES AMPLIADOS A ESTÁNDARES PROFESIONALES (8 a 10 grados)
        if (dist < 10) aspectos.push({ p1: posiciones[i].nombre, p2: posiciones[j].nombre, tipo: 'Conjunción', color: '#10B981' }); 
        else if (Math.abs(dist - 60) < 8) aspectos.push({ p1: posiciones[i].nombre, p2: posiciones[j].nombre, tipo: 'Sextil', color: '#3B82F6' }); 
        else if (Math.abs(dist - 90) < 8) aspectos.push({ p1: posiciones[i].nombre, p2: posiciones[j].nombre, tipo: 'Cuadratura', color: '#EF4444' }); 
        else if (Math.abs(dist - 120) < 8) aspectos.push({ p1: posiciones[i].nombre, p2: posiciones[j].nombre, tipo: 'Trígono', color: '#3B82F6' }); 
        else if (Math.abs(dist - 180) < 10) aspectos.push({ p1: posiciones[i].nombre, p2: posiciones[j].nombre, tipo: 'Oposición', color: '#EF4444' }); 
      }
    }

    return NextResponse.json({ exito: true, posiciones, casas, aspectos, ejes: { asc, mc } });
  } catch (error) {
    return NextResponse.json({ exito: false }, { status: 500 });
  }
}