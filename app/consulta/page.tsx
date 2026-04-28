"use client";
import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import RadixChart from '../components/RadixChart';
import { 
  ChevronLeft, ClipboardList, Activity, Sparkles, 
  Save, User, MapPin, Calendar, Clock, 
  Upload, Loader2, Info, History, ChevronDown, ChevronUp, 
  Stethoscope, Zap, Scale, DollarSign, HeartHandshake, AlertTriangle, AlertCircle, Bot, Utensils
} from 'lucide-react';

// --- BASE DE DATOS DE TUS RECETAS COMUNES ---
const RECETAS_PREDEFINIDAS = [
  { nombre: "Renal 1", texto: "Renal 1: tomar de 5 - 7 a.m. y luego de 5 - 7 p.m." },
  { nombre: "Digestivo", texto: "Digestivo: tomar después del almuerzo." },
  { nombre: "Citovit", texto: "Citovit: tomar cada 12 h." },
  { nombre: "Proteinel", texto: "Proteinel: tomar dos capsulas en ayunas." },
  { nombre: "Hemático", texto: "Hemático: tomar en la noche." },
  { nombre: "Totumoral tisana", texto: "Totumoral tisana: tomar cada 12 h." },
  { nombre: "Circulatorio Gts", texto: "Circulatorio Gts: tomar 10 Gts bajo la lengua a media mañana y en la noche." },
  { nombre: "Neurotónico Gts", texto: "Neurotónico Gts: tomar 15 Gts bajo la lengua 3 veces al dia." },
  { nombre: "Femestrog", texto: "Femestrog: tomar 20 Gts bajo la lengua en ayunas y cada vez que presente dolor de vientre." },
  { nombre: "Expulsador", texto: "Expulsador: tomar 20 Gts bajo la lengua en ayunas y en la noche." },
  { nombre: "Inmunel", texto: "Inmunel: tomar 20 Gts bajo la lengua en ayunas." },
  { nombre: "Rescate", texto: "Rescate: tomar 15 Gts bajo la lengua 3 veces al dia." },
  { nombre: "Br-1 tisana", texto: "Br-1 tisana: tomar en ayunas." },
  { nombre: "Lipodren", texto: "Lipodren: tomar antes de almorzar y antes de cenar." },
  { nombre: "Pulmovid tisana", texto: "Pulmovid tisana: tomar cada 12 h." },
  { nombre: "Magnesio", texto: "Citrato de Magnesio: 2 cápsula de 500mg en la tarde." },
  { nombre: "Flavoxigen", texto: "Flavoxigen: tomar 2 capsulas cada 12 h." },
  { nombre: "Ñame salvaje", texto: "Ñame salvaje: tomar 2 capsulas en ayunas." },
  { nombre: "Hepático", texto: "Hepático: tomar 2 capsulas cada 12 h." }
];

function ConsultaContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nombre = searchParams.get('nombre') || '';

  const [paciente, setPaciente] = useState<any>(null);
  const [tabActiva, setTabActiva] = useState('consulta'); 
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [accionActiva, setAccionActiva] = useState('');
  const [filtroHistorial, setFiltroHistorial] = useState('todos');

  const [peso, setPeso] = useState('');
  const [mediciones, setMediciones] = useState('');
  const [protocolo, setProtocolo] = useState('');
  const [dieta, setDieta] = useState(''); // <-- CIRUGÍA: NUEVO ESTADO PARA LA DIETA
  const [observaciones, setObservaciones] = useState('');
  const [historialAbierto, setHistorialAbierto] = useState<number | null>(null);

  const [tipoPago, setTipoPago] = useState('Completo');
  const [costoTotal, setCostoTotal] = useState('');
  const [montoPagado, setMontoPagado] = useState('');

  const [datosRadix, setDatosRadix] = useState<any>(null);
  const [cargandoRadix, setCargandoRadix] = useState(false);

  const [fechaRect, setFechaRect] = useState('');
  const [horaRect, setHoraRect] = useState('12:00 PM');
  
  const [latitudRect, setLatitudRect] = useState('10.48'); 
  const [longitudRect, setLongitudRect] = useState('-66.90'); 

  const [analisisIA, setAnalisisIA] = useState<string>('');
  const [cargandoIA, setCargandoIA] = useState(false);

  useEffect(() => {
    const fetchPaciente = async () => {
      if (!nombre) return;
      setCargando(true);
      const { data } = await supabase
        .from('historias_clinicas')
        .select('*')
        .eq('nombre_completo', nombre)
        .maybeSingle();

      if (data) {
        setPaciente(data);
        setPeso(data.peso_aproximado || '');
        setMediciones(data.mediciones || '');
        setProtocolo(data.protocolo || '');
        setDieta(data.dieta || ''); // <-- CIRUGÍA: CARGAMOS LA DIETA SI YA EXISTE
        setObservaciones(data.observaciones || '');
        
        setFechaRect(data.fecha_nacimiento || '');
        setHoraRect(data.hora_nacimiento || '12:00 PM');

        if (data.lugar_nacimiento) {
          try {
            const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(data.lugar_nacimiento)}&limit=1`);
            const geoData = await res.json();
            if (geoData && geoData.length > 0) {
              setLatitudRect(parseFloat(geoData[0].lat).toFixed(2));
              setLongitudRect(parseFloat(geoData[0].lon).toFixed(2));
            }
          } catch (err) {
            console.error("Error localizando ciudad:", err);
          }
        }
        
        const respaldo = localStorage.getItem(`respaldo_${nombre}`);
        if (respaldo) {
          const { pe, m, p, d, o } = JSON.parse(respaldo); // <-- CIRUGÍA: 'd' PARA DIETA
          if (!data.peso_aproximado && pe) setPeso(pe);
          if (!data.mediciones && m) setMediciones(m);
          if (!data.protocolo && p) setProtocolo(p);
          if (!data.dieta && d) setDieta(d); // <-- CIRUGÍA: RESPALDO DE DIETA
          if (!data.observaciones && o) setObservaciones(o);
        }
      }
      setCargando(false);
    };
    fetchPaciente();
  }, [nombre]);

  useEffect(() => {
    if (nombre && (peso || mediciones || protocolo || dieta || observaciones)) {
      const datos = { pe: peso, m: mediciones, p: protocolo, d: dieta, o: observaciones };
      localStorage.setItem(`respaldo_${nombre}`, JSON.stringify(datos));
    }
  }, [peso, mediciones, protocolo, dieta, observaciones, nombre]);

  const aplicarCapitalizacion = (texto: string, setter: any) => {
    const corregido = texto.replace(/(^\s*|\n\s*|[.!?]\s+)([a-z])/g, (m, separador, letra) => separador + letra.toUpperCase());
    setter(corregido);
  };

  const agregarRecetaRapida = (textoAdicional: string) => {
    setProtocolo(prev => prev ? `${prev}\n- ${textoAdicional}` : `- ${textoAdicional}`);
  };

  const obtenerFechaHoraFormateada = () => {
    const ahora = new Date();
    const fechaVisual = ahora.toLocaleDateString('es-VE', { day: '2-digit', month: '2-digit', year: 'numeric' });
    const horaVisual = ahora.toLocaleTimeString('es-VE', { hour: '2-digit', minute: '2-digit', hour12: true }).toUpperCase();
    return `${fechaVisual} a las ${horaVisual}`;
  };

  const formatearFechaVisual = (fechaStr: string) => {
    if (!fechaStr) return '--';
    if (fechaStr.includes('-')) {
      const [y, m, d] = fechaStr.split('-');
      return `${d}/${m}/${y}`;
    }
    return fechaStr;
  };

  const archivarVisita = async (tipo: 'Consulta' | 'Terapia') => {
    if (!mediciones && !protocolo && !dieta && !observaciones && !peso) {
      alert("No hay información nueva para archivar.");
      return;
    }

    setGuardando(true);
    setAccionActiva(tipo);

    let deudaGenerada = 0;
    let costoReal = parseFloat(costoTotal) || 0;
    let pagoReal = parseFloat(montoPagado) || 0;

    if (tipoPago === 'Completo') {
      pagoReal = costoReal; 
    } else if (tipoPago === 'Parcial') {
      deudaGenerada = costoReal - pagoReal;
    } else if (tipoPago === 'Donacion') {
      pagoReal = 0;
      deudaGenerada = 0;
    }

    const saldoPendienteActualizado = (parseFloat(paciente.saldo_pendiente) || 0) + deudaGenerada;

    const nuevaEntrada = {
      fecha: obtenerFechaHoraFormateada(),
      tipo, peso, mediciones, protocolo, observaciones,
      finanzas: {
        tipoPago,
        costo: costoReal,
        pagado: pagoReal,
        deudaGenerada
      }
    };

    const nuevoHistorial = [nuevaEntrada, ...(paciente.historial_consultas || [])];

    try {
      const { error } = await supabase
        .from('historias_clinicas')
        .update({
          historial_consultas: nuevoHistorial,
          peso_aproximado: peso,
          saldo_pendiente: saldoPendienteActualizado, 
          mediciones: '', // Borramos esto de la caja para la proxima consulta
          protocolo: protocolo, // <-- CIRUGÍA: AHORA SÍ SE GUARDA PARA EL PACIENTE
          dieta: dieta, // <-- CIRUGÍA: GUARDAMOS LA DIETA PARA EL PACIENTE
          observaciones: '', // Borramos notas privadas de la caja
          ultima_consulta: new Date().toISOString()
        })
        .eq('nombre_completo', nombre);

      if (error) throw error;
      
      setPaciente({ ...paciente, historial_consultas: nuevoHistorial, peso_aproximado: peso, saldo_pendiente: saldoPendienteActualizado });
      setMediciones('');
      // No borramos setProtocolo('') ni setDieta('') de la UI para que sigas viéndolos, ya que ahora son fijos hasta que los cambies.
      setObservaciones('');
      setCostoTotal('');
      setMontoPagado('');
      setTipoPago('Completo');
      localStorage.removeItem(`respaldo_${nombre}`);
      
      setTabActiva('evolucion');

    } catch (err) {
      console.error(err);
      alert("Error al archivar visita.");
    } finally {
      setGuardando(false);
      setAccionActiva('');
    }
  };

  const handleGuardarBorrador = async () => {
    setGuardando(true);
    setAccionActiva('Borrador');
    try {
      const { error } = await supabase
        .from('historias_clinicas')
        .update({ peso_aproximado: peso, mediciones, protocolo, dieta, observaciones }) // <-- CIRUGÍA: AÑADIDO DIETA AL BORRADOR
        .eq('nombre_completo', nombre);
      if (error) throw error;
    } catch (err) {
      console.error(err);
    } finally {
      setGuardando(false);
      setAccionActiva('');
    }
  };

  // FUNCIÓN PARA CAMBIAR AM/PM MANUALMENTE
  const toggleAMPM = () => {
    setHoraRect(prev => {
      const parts = prev.split(' ');
      if (parts.length < 2) return prev;
      const newAMPM = parts[1] === 'AM' ? 'PM' : 'AM';
      return `${parts[0]} ${newAMPM}`;
    });
  };

  const modificarTiempo = (tipo: 'dia' | 'hora' | 'minuto', cantidad: number) => {
    if (!fechaRect) return;
    let anio, mes, dia;
    if (fechaRect.includes('-')) [anio, mes, dia] = fechaRect.split('-');
    else [dia, mes, anio] = fechaRect.split('/'); 
    
    let hrs = 12, mins = 0;
    const timeMatch = horaRect.match(/(\d{1,2}):(\d{2})\s*(AM|PM)?/i);
    if (timeMatch) {
      hrs = parseInt(timeMatch[1], 10);
      mins = parseInt(timeMatch[2], 10);
      if (timeMatch[3]?.toUpperCase() === 'PM' && hrs < 12) hrs += 12;
      if (timeMatch[3]?.toUpperCase() === 'AM' && hrs === 12) hrs = 0;
    }

    const d = new Date(Number(anio), Number(mes) - 1, Number(dia), hrs, mins);
    if (tipo === 'dia') d.setDate(d.getDate() + cantidad);
    if (tipo === 'hora') d.setHours(d.getHours() + cantidad);
    if (tipo === 'minuto') d.setMinutes(d.getMinutes() + cantidad);

    const nuevoDia = String(d.getDate()).padStart(2, '0');
    const nuevoMes = String(d.getMonth() + 1).padStart(2, '0');
    const nuevoAnio = d.getFullYear();
    setFechaRect(`${nuevoDia}/${nuevoMes}/${nuevoAnio}`);

    let h = d.getHours();
    const m = String(d.getMinutes()).padStart(2, '0');
    const ampm = h >= 12 ? 'PM' : 'AM';
    h = h % 12;
    h = h ? h : 12;
    setHoraRect(`${String(h).padStart(2, '0')}:${m} ${ampm}`);
  };

  const cargarRadix = async () => {
    if (!fechaRect) return;
    setCargandoRadix(true);
    try {
      const { error } = await supabase
        .from('historias_clinicas')
        .update({ fecha_nacimiento: fechaRect, hora_nacimiento: horaRect })
        .eq('nombre_completo', nombre);

      if (error) console.error("Error al actualizar la base de datos:", error);
      else setPaciente((prev: any) => ({ ...prev, fecha_nacimiento: fechaRect, hora_nacimiento: horaRect }));

      const res = await fetch('/api/radix', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          fecha: fechaRect, 
          hora: horaRect, 
          latitud: parseFloat(latitudRect) || 10.48, 
          longitud: parseFloat(longitudRect) || -66.90 
        })
      });
      const data = await res.json();
      if (data.exito) setDatosRadix(data);
    } catch (err) {
      console.error(err);
    } finally {
      setCargandoRadix(false);
    }
  };

  const analizarConValentina = async () => {
    if (!datosRadix || !paciente) return;
    setCargandoIA(true);
    setAnalisisIA(''); 
    
    try {
      const payload = {
        nombre_paciente: paciente.nombre_completo,
        fecha_nacimiento: paciente.fecha_nacimiento,
        hora_nacimiento: paciente.hora_nacimiento,
        fecha_consulta: new Date().toLocaleDateString('es-VE'),
        edad: paciente.edad,
        sexo: paciente.sexo || 'No especificado',
        profesion: paciente.ocupacion_profesion || paciente.ocupacion || paciente.profesion || 'No especificada',
        peso_aproximado: peso || paciente.peso_aproximado || 'No especificado',
        alergias: paciente.alergias || 'Ninguna',
        medicamentos_actuales: paciente.medicamentos_actuales || 'Ninguno',
        antecedentes_enfermedades: paciente.antecedentes_enfermedades || 'Ninguno',
        motivo_consulta: paciente.motivo_consulta || mediciones || 'Revisión General',
        observaciones: observaciones,
        posiciones_planetarias: datosRadix.posiciones,
        casas_astrologicas: datosRadix.casas,
        aspectos_principales: datosRadix.aspectos
      };

      const res = await fetch('/api/asistente', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (data.exito) {
        setAnalisisIA(data.analisis);
      } else {
        setAnalisisIA('Error de conexión con Valentina. Verifica que la API Key en el .env sea válida.');
      }
    } catch (error) {
      setAnalisisIA('Fallo en el servidor al contactar a la IA.');
    } finally {
      setCargandoIA(false);
    }
  };

  if (cargando) return <div className="min-h-screen flex items-center justify-center text-[#0B5D34] font-bold animate-pulse">Abriendo expediente...</div>;

  const SIGNO_ICONS = ["♈\uFE0E", "♉\uFE0E", "♊\uFE0E", "♋\uFE0E", "♌\uFE0E", "♍\uFE0E", "♎\uFE0E", "♏\uFE0E", "♐\uFE0E", "♑\uFE0E", "♒\uFE0E", "♓\uFE0E"];
  const PLANETA_ICONS: any = { Sol: "☉\uFE0E", Luna: "☽\uFE0E", Mercurio: "☿\uFE0E", Venus: "♀\uFE0E", Marte: "♂\uFE0E", Júpiter: "♃\uFE0E", Saturno: "♄\uFE0E", Urano: "♅\uFE0E", Neptuno: "♆\uFE0E", Plutón: "♇\uFE0E" };

  return (
    <div className="min-h-screen bg-[#F1F5F9] pb-32 font-sans">
      
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => router.back()} className="p-2 hover:bg-gray-100 rounded-full transition-all active:scale-90">
              <ChevronLeft size={24} className="text-gray-500" />
            </button>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-bold text-gray-800 leading-none">{paciente.nombre_completo}</h1>
                {paciente.saldo_pendiente > 0 && (
                  <span className="bg-red-100 text-red-700 text-[9px] font-black uppercase px-2 py-0.5 rounded-full flex items-center gap-1">
                    <AlertTriangle size={10}/> Debe ${paciente.saldo_pendiente}
                  </span>
                )}
              </div>
              <p className="text-[11px] font-bold text-[#0B5D34] uppercase mt-1 tracking-tighter">Panel Privado</p>
            </div>
          </div>
          {tabActiva === 'consulta' && (
             <button onClick={handleGuardarBorrador} disabled={guardando} className="bg-gray-100 text-[#0B5D34] px-4 py-2 rounded-xl font-bold text-xs flex items-center gap-2 active:scale-95 transition-all">
               {guardando && accionActiva === 'Borrador' ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />}
             </button>
          )}
        </div>

        <div className="max-w-5xl mx-auto px-4 flex border-t border-gray-50 overflow-x-auto no-scrollbar">
          {[
            { id: 'ficha', label: 'Ficha', icon: <User size={16} /> },
            { id: 'evolucion', label: 'Evolución', icon: <History size={16} /> },
            { id: 'consulta', label: 'Sesión', icon: <ClipboardList size={16} /> },
            { id: 'astro', label: 'Cosmobiología', icon: <Sparkles size={16} /> }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setTabActiva(tab.id)}
              className={`flex-1 py-4 text-[10px] md:text-xs font-black uppercase tracking-widest flex items-center justify-center gap-2 border-b-2 transition-all px-2 ${
                tabActiva === tab.id ? 'border-[#0B5D34] text-[#0B5D34] bg-green-50/30' : 'border-transparent text-gray-400'
              }`}
            >
              {tab.icon} <span className="hidden md:inline">{tab.label}</span>
            </button>
          ))}
        </div>
      </header>

      <main className="max-w-[1400px] mx-auto p-4 md:p-8">
        
        {/* --- PESTAÑAS FICHA Y EVOLUCIÓN --- */}
        {tabActiva === 'ficha' && (
          <div className="max-w-5xl mx-auto space-y-6 animate-in fade-in duration-300">
            <div className="bg-white rounded-[2.5rem] p-6 shadow-sm border border-gray-100">
              <h3 className="font-bold text-gray-800 flex items-center gap-2 mb-6 border-b pb-4"><Info size={18} className="text-[#0B5D34]"/> Datos Base y Antecedentes</h3>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div><p className="text-[10px] font-black text-gray-400 uppercase">Fecha de Nacimiento</p><p className="font-bold text-gray-700">{formatearFechaVisual(paciente.fecha_nacimiento)} ({paciente.edad || '--'} años)</p></div>
                  <div><p className="text-[10px] font-black text-gray-400 uppercase">Hora y Lugar</p><p className="font-bold text-gray-700">{paciente.hora_nacimiento || 'No sabe'} • {paciente.lugar_nacimiento || 'No registrado'}</p></div>
                  <div><p className="text-[10px] font-black text-[#0B5D34] uppercase mb-1">Motivo de ingreso:</p><p className="text-sm text-gray-600 leading-relaxed italic">"{paciente.motivo_consulta || 'Sin especificar'}"</p></div>
                  <div><p className="text-[10px] font-black text-[#0B5D34] uppercase mb-1">Enfermedades previas:</p><p className="text-sm text-gray-700 font-medium">{paciente.antecedentes_enfermedades || 'Ninguna'}</p></div>
                </div>
                <div className="space-y-4">
                  <div><p className="text-[10px] font-black text-[#0B5D34] uppercase mb-1">Cirugías:</p><p className="text-sm text-gray-700 font-medium">{paciente.cirugias_realizadas || 'Ninguna'}</p></div>
                  <div className="bg-red-50 p-3 rounded-xl border border-red-100"><p className="text-[10px] font-black text-red-500 uppercase mb-1">Alergias:</p><p className="text-sm text-red-900 font-bold">{paciente.alergias || 'Ninguna'}</p></div>
                  <div><p className="text-[10px] font-black text-[#0B5D34] uppercase mb-1">Medicamentos actuales:</p><p className="text-sm text-gray-700 font-medium">{paciente.medicamentos_actuales || 'Ninguno'}</p></div>
                  <div><p className="text-[10px] font-black text-[#0B5D34] uppercase mb-1">Antecedentes familiares:</p><p className="text-sm text-gray-700 font-medium">{paciente.antecedentes_familiares || 'Ninguno'}</p></div>
                </div>
              </div>
            </div>
          </div>
        )}

        {tabActiva === 'evolucion' && (
          <div className="max-w-5xl mx-auto space-y-6 animate-in fade-in duration-500">
             <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-white p-4 rounded-3xl shadow-sm border border-gray-100">
              <h2 className="font-bold text-gray-700 flex items-center gap-2">
                <History className="text-[#0B5D34]" size={20} /> Historial Clínico
              </h2>
              <div className="flex bg-gray-100 p-1 rounded-xl w-full md:w-auto">
                {['todos', 'Consulta', 'Terapia'].map(f => (
                  <button key={f} onClick={() => setFiltroHistorial(f)} className={`flex-1 md:flex-none px-4 py-2 rounded-lg text-[10px] font-black uppercase transition-all ${filtroHistorial === f ? 'bg-white text-[#0B5D34] shadow-sm' : 'text-gray-400'}`}>{f}</button>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              {(paciente.historial_consultas || [])
                .filter((h:any) => filtroHistorial === 'todos' || h.tipo === filtroHistorial)
                .map((visita: any, index: number) => (
                <div key={index} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                  <button 
                    onClick={() => setHistorialAbierto(historialAbierto === index ? null : index)}
                    className="w-full p-5 flex items-center justify-between hover:bg-gray-50 transition-all"
                  >
                    <div className="flex items-center gap-4 text-left">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${visita.tipo === 'Consulta' ? 'bg-blue-50 text-blue-600' : 'bg-orange-50 text-orange-600'}`}>
                        {visita.tipo === 'Consulta' ? <Stethoscope size={20}/> : <Zap size={20}/>}
                      </div>
                      <div>
                        <p className="text-xs font-black text-[#0B5D34] uppercase tracking-wider">{visita.fecha}</p>
                        <p className="font-bold text-gray-700 flex items-center gap-2">
                          {visita.tipo} 
                          {visita.peso && <span className="text-gray-400 font-medium text-xs">| {visita.peso} kg</span>}
                          {visita.finanzas && visita.finanzas.tipoPago === 'Donacion' && <span className="bg-purple-100 text-purple-700 text-[9px] px-2 py-0.5 rounded-md uppercase">Donado: ${visita.finanzas.costo}</span>}
                          {visita.finanzas && visita.finanzas.tipoPago === 'Parcial' && <span className="bg-yellow-100 text-yellow-700 text-[9px] px-2 py-0.5 rounded-md uppercase">Deuda: ${visita.finanzas.deudaGenerada}</span>}
                        </p>
                      </div>
                    </div>
                    {historialAbierto === index ? <ChevronUp className="text-gray-400"/> : <ChevronDown className="text-gray-400"/>}
                  </button>
                  
                  {historialAbierto === index && (
                    <div className="p-6 pt-0 border-t border-gray-50 bg-gray-50/30 animate-in slide-in-from-top-2">
                      <div className="grid md:grid-cols-2 gap-6 mt-4">
                        {visita.mediciones && (
                          <div className="bg-white p-4 rounded-xl border border-gray-100">
                            <p className="text-[10px] font-black text-gray-400 uppercase mb-2">Mediciones/Diagnóstico</p>
                            <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">{visita.mediciones}</p>
                          </div>
                        )}
                        <div className="bg-white p-4 rounded-xl border border-gray-100">
                          <p className="text-[10px] font-black text-gray-400 uppercase mb-2">Protocolo/Terapia</p>
                          <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">{visita.protocolo}</p>
                        </div>
                      </div>
                      {visita.observaciones && (
                        <div className="mt-4 bg-white p-4 rounded-xl border border-gray-100">
                          <p className="text-[10px] font-black text-gray-400 uppercase mb-2">Observaciones Especialista</p>
                          <p className="text-sm text-gray-600 italic whitespace-pre-wrap">"{visita.observaciones}"</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* --- PESTAÑA SESIÓN CON AUTO-RECETAS --- */}
        {tabActiva === 'consulta' && (
          <div className="max-w-5xl mx-auto space-y-6 animate-in slide-in-from-right-4 duration-300">
            
            <div className="bg-white rounded-[2.5rem] p-6 shadow-sm border border-gray-100 flex items-center gap-4">
              <div className="w-12 h-12 bg-green-50 text-[#0B5D34] rounded-2xl flex items-center justify-center shrink-0"><Scale size={24}/></div>
              <div className="w-full">
                <p className="text-[10px] font-black text-gray-400 uppercase mb-1">Peso Actual (Kg)</p>
                <input type="text" value={peso} onChange={(e) => setPeso(e.target.value)} placeholder="Ej: 75.5" className="w-full font-bold text-xl text-gray-800 outline-none placeholder-gray-300"/>
              </div>
            </div>

            <div className="bg-white rounded-[2.5rem] p-6 shadow-sm border border-gray-100">
              <h3 className="font-bold text-gray-800 flex items-center gap-2 mb-4"><Activity size={18} className="text-[#0B5D34]"/> Mediciones Diagnósticas</h3>
              <textarea value={mediciones} spellCheck="true" onChange={(e) => setMediciones(e.target.value)} onBlur={(e) => aplicarCapitalizacion(e.target.value, setMediciones)} placeholder="Dermatrón, Pulsos, lengua..." className="w-full bg-gray-50 border-0 rounded-2xl p-5 text-gray-700 outline-none focus:ring-4 focus:ring-[#0B5D34]/5 min-h-[150px] transition-all"/>
            </div>

            <div className="bg-[#0B5D34] rounded-[2.5rem] shadow-xl shadow-[#0B5D34]/20 overflow-hidden">
              <div className="bg-white p-6 flex flex-col items-center justify-center border-b border-gray-100">
                  <img src="/logo-bionaturas.svg" alt="Logo Bionatura's" className="h-16 w-auto mb-3 object-contain" /> 
                  <h3 className="font-bold text-[#0B5D34] flex items-center gap-2 text-center uppercase tracking-widest text-xs mt-2">
                      <ClipboardList size={14}/> Protocolo y Receta
                  </h3>
              </div>
              
              <div className="p-6">
                
                <div className="mb-4 bg-white/5 p-3 rounded-2xl border border-white/10">
                  <p className="text-[10px] text-green-100 uppercase tracking-widest font-bold mb-2 flex items-center gap-1"><Sparkles size={12}/> Autocompletar Receta:</p>
                  <div className="flex flex-wrap gap-2">
                    {RECETAS_PREDEFINIDAS.map((receta, index) => (
                      <button 
                        key={index}
                        onClick={() => agregarRecetaRapida(receta.texto)}
                        className="bg-white/10 hover:bg-white/20 text-white text-xs font-bold px-3 py-1.5 rounded-lg transition-colors border border-white/10 active:scale-95"
                      >
                        + {receta.nombre}
                      </button>
                    ))}
                  </div>
                </div>

                <textarea 
                  value={protocolo} 
                  spellCheck="true" 
                  onChange={(e) => setProtocolo(e.target.value)} 
                  onBlur={(e) => aplicarCapitalizacion(e.target.value, setProtocolo)} 
                  placeholder="Suplementos, dosis y terapias..." 
                  className="w-full bg-white/10 border border-white/20 rounded-2xl p-5 text-white placeholder-green-100/50 outline-none focus:bg-white/20 min-h-[200px] transition-all"
                />
              </div>
            </div>

            {/* --- CIRUGÍA: NUEVA SECCIÓN DE DIETA APROBADA --- */}
            <div className="bg-orange-500 rounded-[2.5rem] shadow-xl shadow-orange-500/20 overflow-hidden">
              <div className="bg-white p-6 flex flex-col items-center justify-center border-b border-gray-100">
                  <h3 className="font-bold text-orange-600 flex items-center gap-2 text-center uppercase tracking-widest text-xs mt-2">
                      <Utensils size={14}/> Dieta Aprobada (Para el paciente)
                  </h3>
                  <p className="text-[10px] text-gray-400 mt-1 text-center font-medium">Copia y pega aquí la dieta sugerida por Valentina</p>
              </div>
              
              <div className="p-6">
                <textarea 
                  value={dieta} 
                  spellCheck="true" 
                  onChange={(e) => setDieta(e.target.value)} 
                  onBlur={(e) => aplicarCapitalizacion(e.target.value, setDieta)} 
                  placeholder="Todo lo que pegues aquí aparecerá automáticamente en el portal del paciente..." 
                  className="w-full bg-white/10 border border-white/20 rounded-2xl p-5 text-white placeholder-orange-100/50 outline-none focus:bg-white/20 min-h-[200px] transition-all"
                />
              </div>
            </div>
            {/* ----------------------------------------------- */}

            <div className="bg-white rounded-[2.5rem] p-6 shadow-sm border border-gray-100">
              <h3 className="font-bold text-gray-800 flex items-center gap-2 mb-4 text-sm opacity-60">Notas Privadas</h3>
              <textarea value={observaciones} spellCheck="true" onChange={(e) => setObservaciones(e.target.value)} onBlur={(e) => aplicarCapitalizacion(e.target.value, setObservaciones)} placeholder="Solo tú verás esto..." className="w-full bg-gray-50 border-0 rounded-2xl p-5 text-gray-700 outline-none min-h-[100px] text-sm"/>
            </div>

            <div className="bg-gray-800 rounded-[2.5rem] p-6 shadow-lg text-white">
              <h3 className="font-bold flex items-center gap-2 mb-6"><DollarSign size={18} className="text-green-400"/> Cierre Financiero</h3>
              
              <div className="flex bg-gray-700 p-1 rounded-xl mb-6">
                {['Completo', 'Parcial', 'Donacion'].map(t => (
                  <button key={t} onClick={() => setTipoPago(t)} className={`flex-1 py-3 rounded-lg text-xs font-black uppercase transition-all flex items-center justify-center gap-2 ${tipoPago === t ? 'bg-green-500 text-white shadow-md' : 'text-gray-400 hover:text-white'}`}>
                    {t === 'Donacion' && <HeartHandshake size={14}/>} {t}
                  </button>
                ))}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className={`bg-gray-900/50 p-4 rounded-2xl border border-gray-700 transition-colors ${tipoPago === 'Donacion' ? 'focus-within:border-purple-500 col-span-2' : 'focus-within:border-green-500'}`}>
                  <p className="text-[10px] font-black text-gray-400 uppercase mb-1">
                    {tipoPago === 'Donacion' ? 'Valor Donado ($)' : 'Costo Total ($)'}
                  </p>
                  <input type="number" value={costoTotal} onChange={(e) => setCostoTotal(e.target.value)} placeholder="0" className={`w-full bg-transparent font-bold text-xl outline-none ${tipoPago === 'Donacion' ? 'text-purple-400' : ''}`}/>
                </div>
                {tipoPago === 'Parcial' && (
                  <div className="bg-gray-900/50 p-4 rounded-2xl border border-gray-700 focus-within:border-yellow-500 transition-colors">
                    <p className="text-[10px] font-black text-gray-400 uppercase mb-1">Monto Pagado ($)</p>
                    <input type="number" value={montoPagado} onChange={(e) => setMontoPagado(e.target.value)} placeholder="0" className="w-full bg-transparent font-bold text-xl outline-none text-yellow-400"/>
                  </div>
                )}
              </div>
            </div>

            <div className="flex gap-4 pt-2">
              <button onClick={() => archivarVisita('Terapia')} disabled={guardando} className="flex-1 py-5 bg-orange-600 text-white font-black rounded-3xl shadow-lg shadow-orange-600/20 active:scale-95 transition-all flex flex-col items-center justify-center gap-2 uppercase tracking-widest text-[10px] hover:-translate-y-1">
                {guardando && accionActiva === 'Terapia' ? <Loader2 className="animate-spin" size={24} /> : <Zap size={24} />}
                {guardando && accionActiva === 'Terapia' ? 'Archivando...' : 'Finalizar Terapia'}
              </button>
              <button onClick={() => archivarVisita('Consulta')} disabled={guardando} className="flex-1 py-5 bg-[#0B5D34] text-white font-black rounded-3xl shadow-lg shadow-[#0B5D34]/20 active:scale-95 transition-all flex flex-col items-center justify-center gap-2 uppercase tracking-widest text-[10px] hover:-translate-y-1">
                {guardando && accionActiva === 'Consulta' ? <Loader2 className="animate-spin" size={24} /> : <Stethoscope size={24} />}
                {guardando && accionActiva === 'Consulta' ? 'Archivando...' : 'Finalizar Consulta'}
              </button>
            </div>
          </div>
        )}

        {/* --- PESTAÑA COSMOBIOLOGÍA CON ESPACIO PARA LA IA --- */}
        {tabActiva === 'astro' && (
          <div className="space-y-6 animate-in fade-in duration-500">
            
            {/* Barra superior (Rectificación) */}
            <div className="bg-white rounded-3xl p-4 shadow-sm border border-gray-100 flex flex-col md:flex-row items-center justify-between gap-4 max-w-5xl mx-auto">
              <div className="flex items-center gap-2">
                <Clock className="text-[#0B5D34]" size={20}/>
                <span className="font-bold text-gray-700 text-sm">Rectificación de Carta</span>
              </div>
              
              <div className="flex flex-wrap items-center gap-2 md:gap-4 bg-gray-50 p-2 rounded-2xl border border-gray-200 justify-center">
                <div className="flex flex-col items-center px-3 border-r border-gray-200">
                  <span className="text-[9px] uppercase font-bold text-gray-400 mb-1">Días</span>
                  <div className="flex items-center gap-2 md:gap-3">
                    <button onClick={() => modificarTiempo('dia', -1)} className="text-red-500 font-bold text-lg hover:scale-110">-</button>
                    <span className="text-xs font-black text-gray-700 w-16 text-center">{fechaRect}</span>
                    <button onClick={() => modificarTiempo('dia', 1)} className="text-[#0B5D34] font-bold text-lg hover:scale-110">+</button>
                  </div>
                </div>
                <div className="flex flex-col items-center px-3 border-r border-gray-200">
                  <span className="text-[9px] uppercase font-bold text-gray-400 mb-1">Horas</span>
                  <div className="flex items-center gap-2 md:gap-3">
                    <button onClick={() => modificarTiempo('hora', -1)} className="text-red-500 font-bold text-lg hover:scale-110">-</button>
                    <span className="text-xs font-black text-gray-700 w-6 text-center">{horaRect.split(':')[0]}</span>
                    <button onClick={() => modificarTiempo('hora', 1)} className="text-[#0B5D34] font-bold text-lg hover:scale-110">+</button>
                  </div>
                </div>
                <div className="flex flex-col items-center px-3 border-r border-gray-200">
                  <span className="text-[9px] uppercase font-bold text-gray-400 mb-1">Mins</span>
                  <div className="flex items-center gap-2 md:gap-3">
                    <button onClick={() => modificarTiempo('minuto', -5)} className="text-red-500 font-bold text-lg hover:scale-110">-</button>
                    <span className="text-xs font-black text-gray-700 w-6 text-center">{horaRect.split(':')[1]?.split(' ')[0] || '00'}</span>
                    <button onClick={() => modificarTiempo('minuto', 5)} className="text-[#0B5D34] font-bold text-lg hover:scale-110">+</button>
                  </div>
                </div>
                
                {/* BOTÓN INTERACTIVO PARA AM/PM */}
                <button 
                  onClick={toggleAMPM}
                  className="px-4 py-1 hover:bg-green-100 rounded-lg transition-all active:scale-95 border-r border-gray-200"
                >
                   <span className="text-xs font-black text-[#0B5D34]">{horaRect.split(' ')[1] || ''}</span>
                </button>
                
                {/* CAMPOS DE LAT Y LON RE-INSERTADOS */}
                <div className="flex flex-col items-center px-3 border-r border-gray-200">
                  <span className="text-[9px] uppercase font-bold text-gray-400 mb-1">Lat</span>
                  <input type="text" value={latitudRect} onChange={(e) => setLatitudRect(e.target.value)} className="text-xs font-black text-gray-700 w-12 text-center bg-transparent border-b border-gray-300 outline-none" />
                </div>
                <div className="flex flex-col items-center px-3">
                  <span className="text-[9px] uppercase font-bold text-gray-400 mb-1">Lon</span>
                  <input type="text" value={longitudRect} onChange={(e) => setLongitudRect(e.target.value)} className="text-xs font-black text-gray-700 w-14 text-center bg-transparent border-b border-gray-300 outline-none" />
                </div>
              </div>

              <button onClick={cargarRadix} className="w-full md:w-auto px-6 py-3 bg-[#0B5D34] text-white rounded-xl font-bold shadow-md active:scale-95 flex items-center justify-center gap-2 text-sm">
                 {cargandoRadix ? <Loader2 size={16} className="animate-spin"/> : <Sparkles size={16}/>}
                 Recalcular
              </button>
            </div>

            {/* Layout de 3 columnas para la Carta Astral */}
            <div className="bg-white rounded-[3rem] p-4 md:p-8 shadow-sm border border-gray-100 min-h-[500px]">
              {!datosRadix ? (
                <div className="text-center space-y-6 py-20">
                  <Sparkles size={48} className="mx-auto text-gray-300" />
                  <p className="text-gray-400 font-medium uppercase tracking-[0.2em] px-4">Verifica la hora y presiona Recalcular</p>
                </div>
              ) : (
                <div className="w-full flex flex-col lg:flex-row gap-8 items-start justify-center">
                  
                  {/* COLUMNA IZQUIERDA: ASISTENTE IA */}
                  <div className="w-full lg:w-[400px] bg-gradient-to-b from-blue-50 to-white p-6 rounded-3xl border border-blue-100 shadow-inner flex flex-col" style={{ minHeight: '600px', maxHeight: '800px' }}>
                    <div className="flex items-center justify-between mb-4 border-b border-blue-200 pb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white shadow-md">
                          <Bot size={20} />
                        </div>
                        <div>
                          <h3 className="font-black text-blue-900 leading-none">Valentina</h3>
                          <p className="text-[9px] font-bold text-blue-500 uppercase tracking-widest mt-1">Cosmobiología Clínica</p>
                        </div>
                      </div>
                      
                      <button 
                        onClick={analizarConValentina}
                        disabled={cargandoIA}
                        className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white font-bold py-2 px-4 rounded-xl shadow-md transition-all text-xs flex justify-center items-center gap-2"
                      >
                        {cargandoIA ? <Loader2 size={14} className="animate-spin"/> : <Activity size={14}/>}
                        {cargandoIA ? "Analizando..." : "Analizar Caso"}
                      </button>
                    </div>
                    
                    {/* ZONA DONDE APARECE EL REPORTE */}
                    <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">
                      {analisisIA ? (
                        <div dangerouslySetInnerHTML={{ __html: analisisIA.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') }} />
                      ) : cargandoIA ? (
                        <div className="flex flex-col items-center justify-center h-full text-blue-400 space-y-4 opacity-70">
                          <Bot size={48} className="animate-bounce" />
                          <p className="text-xs font-bold uppercase tracking-widest text-center">Calculando vulnerabilidades<br/>y tránsitos...</p>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center justify-center h-full text-gray-400 space-y-4">
                          <Sparkles size={48} className="opacity-20" />
                          <p className="text-center text-xs font-medium px-4">Presiona "Analizar Caso" para que Valentina genere el reporte cosmobiológico.</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* COLUMNA CENTRAL: RADIX */}
                  <div className="flex-1 flex justify-center w-full min-w-[300px]">
                    <RadixChart data={datosRadix} />
                  </div>

                  {/* COLUMNA DERECHA: POSICIONES */}
                  <div className="w-full lg:w-[280px] bg-gray-50 p-6 rounded-3xl border border-gray-100">
                    <h3 className="font-bold text-[#0B5D34] uppercase text-[10px] tracking-widest border-b border-gray-200 pb-2 mb-4">Posiciones Exactas</h3>
                    <div className="grid gap-2">
                      {datosRadix.posiciones.map((p: any, i: number) => (
                        <div key={i} className="flex justify-between items-center text-xs border-b border-gray-100 pb-1.5">
                          <span className="font-bold text-gray-700 flex items-center gap-2">
                            <span className="text-lg text-[#0B5D34]">{PLANETA_ICONS[p.nombre]}</span> {p.nombre}
                          </span>
                          <span className="text-gray-500 font-black bg-white px-2 py-1 rounded shadow-sm border border-gray-100">
                            {Math.floor(p.grados)}° {SIGNO_ICONS[p.signo]}
                          </span>
                        </div>
                      ))}
                    </div>
                    <p className="text-[9px] font-bold text-gray-400 text-center mt-6 uppercase tracking-widest">Sistema: Casas Iguales</p>
                  </div>

                </div>
              )}
            </div>
          </div>
        )}

      </main>
    </div>
  );
}

export default function ConsultaDoctor() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Sincronizando...</div>}>
      <ConsultaContent />
    </Suspense>
  );
}