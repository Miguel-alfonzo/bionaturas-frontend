"use client";
import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { ChevronLeft, Clock, ArrowRight, ChevronDown, Loader2, HeartHandshake, CheckCircle2, Globe, UserCheck, AlertCircle } from 'lucide-react';

const SERVICIOS = [
  { id: 'presencial', nombre: 'Consulta Presencial', duracion: 20, icon: '🩺' },
  { id: 'distancia', nombre: 'Consulta a Distancia', duracion: 20, icon: '🌐' },
  { id: 'infantil', nombre: 'Consulta Infantil', duracion: 20, icon: '👶' },
  { id: 'ajuste', nombre: 'Ajuste de Columna', duracion: 10, icon: '🦴' },
  { id: 't-corta', nombre: 'Terapia Corta', duracion: 30, icon: '🌿' },
  { id: 't-larga', nombre: 'Terapia Larga', duracion: 60, icon: '🧘' },
  { id: 'apiterapia', nombre: 'Apiterapia', duracion: 7, icon: '🐝' },
  { id: 'pediluvio', nombre: 'Desintoxicación Iónica', duracion: 20, icon: '🦶' },
  { id: 'peso', nombre: 'Plan Control de Peso', duracion: 40, icon: '⚖️' },
  { id: 'acupuntura', nombre: 'Acupuntura', duracion: 40, icon: '📍' },
];

const formatoAMPM = (hora24: string) => {
  if (!hora24) return "";
  const [h, m] = hora24.split(':');
  let hours = parseInt(h, 10);
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12;
  hours = hours ? hours : 12; 
  return `${hours.toString().padStart(2, '0')}:${m} ${ampm}`;
};

function AgendaContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nombre = searchParams.get('nombre') || 'Consultante';
  
  const primerNombre = nombre.split(' ')[0];

  const [servicio, setServicio] = useState<any>(null);
  const [diaIdx, setDiaIdx] = useState<number | null>(null);
  const [hora, setHora] = useState<string | null>(null);
  
  const [isServiceOpen, setIsServiceOpen] = useState(false);
  const [cargandoHoras, setCargandoHoras] = useState(false);
  
  const [citaConfirmada, setCitaConfirmada] = useState(false);
  const [guardandoCita, setGuardandoCita] = useState(false);
  const [esNuevo, setEsNuevo] = useState(true);

  useEffect(() => {
    const verificarPaciente = async () => {
      const { data } = await supabase
        .from('historias_clinicas')
        .select('fecha_nacimiento')
        .eq('nombre_completo', nombre)
        .maybeSingle();
      
      if (data && data.fecha_nacimiento) setEsNuevo(false);
    };
    verificarPaciente();
  }, [nombre]);

  const obtenerProximosDias = () => {
    const dias = [];
    let fechaActual = new Date();
    while (dias.length < 6) {
      if (fechaActual.getDay() !== 0) {
        const year = fechaActual.getFullYear();
        const month = String(fechaActual.getMonth() + 1).padStart(2, '0');
        const day = String(fechaActual.getDate()).padStart(2, '0');
        
        const fechaVenezolana = `${day}/${month}/${year}`;

        dias.push({
          label: fechaActual.toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric' }),
          full: `${year}-${month}-${day}`, 
          formatoVzla: fechaVenezolana 
        });
      }
      fechaActual.setDate(fechaActual.getDate() + 1);
    }
    return dias;
  };
  const proximosDias = obtenerProximosDias();
  const baseManana = ["08:00", "08:30", "09:00", "09:30", "10:00", "10:30", "11:00", "11:30"];
  const baseTarde = ["14:00", "14:30", "15:00", "15:30", "16:00", "16:30", "17:00", "17:30"];
  const [huecos, setHuecos] = useState({ mañana: [] as string[], tarde: [] as string[] });

  useEffect(() => {
    const consultarDisponibilidad = async () => {
      if (!servicio || diaIdx === null) return;
      setCargandoHoras(true);
      setHora(null);
      try {
        const diaSeleccionado = proximosDias[diaIdx].full;
        const inicioDia = new Date(`${diaSeleccionado}T00:00:00-04:00`);
        const finDia = new Date(`${diaSeleccionado}T23:59:59-04:00`);
        
        const res = await fetch('/api/calendar', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ fechaInicio: inicioDia.toISOString(), fechaFin: finDia.toISOString() })
        });
        const data = await res.json();
        const ocupados = data.ocupados || [];

        const filtrarHuecos = (horasBase: string[]) => {
          const disponibles = horasBase.filter((horaStr) => {
            const [h, m] = horaStr.split(':');
            const slotInicio = new Date(`${diaSeleccionado}T${h}:${m}:00-04:00`);
            const slotFin = new Date(slotInicio.getTime() + servicio.duracion * 60000);
            const choca = ocupados.some((evento: any) => {
              const eventoInicio = new Date(evento.start);
              const eventoFin = new Date(evento.end);
              return slotInicio < eventoFin && slotFin > eventoInicio;
            });
            return !choca;
          });
          if (disponibles.length <= 3) return disponibles;
          const midIdx = Math.floor(disponibles.length / 2);
          return [disponibles[0], disponibles[midIdx], disponibles[disponibles.length - 1]];
        };
        setHuecos({ mañana: filtrarHuecos(baseManana), tarde: filtrarHuecos(baseTarde) });
      } catch (error) {
        console.error(error);
      } finally {
        setCargandoHoras(false);
      }
    };
    consultarDisponibilidad();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [diaIdx, servicio]);

  const handleConfirmar = async () => {
    setGuardandoCita(true);
    try {
      // 1. Agendar en Google Calendar
      const res = await fetch('/api/calendar/book', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nombre: nombre,
          servicio: servicio.nombre,
          duracion: servicio.duracion,
          fecha: proximosDias[diaIdx!].full,
          hora: hora 
        })
      });

      if (res.ok) {
        const horaAMPM = formatoAMPM(hora!);
        const fechaParaBaseDeDatos = `${proximosDias[diaIdx!].formatoVzla} a las ${horaAMPM}`;
        
        const { data: pacienteExiste } = await supabase
          .from('historias_clinicas')
          .select('id')
          .eq('nombre_completo', nombre)
          .maybeSingle();

        if (pacienteExiste) {
          // AHORA EL CÓDIGO ESCUCHA SI HAY ERROR AL ACTUALIZAR
          const { error: updateError } = await supabase
            .from('historias_clinicas')
            .update({ proxima_cita: fechaParaBaseDeDatos })
            .eq('nombre_completo', nombre);
            
          if (updateError) {
            alert("Error al guardar en base de datos: " + JSON.stringify(updateError));
            setGuardandoCita(false);
            return; // Detiene el proceso si hay error
          }
        } else {
          // AHORA EL CÓDIGO ESCUCHA SI HAY ERROR AL INSERTAR
          const { error: insertError } = await supabase
            .from('historias_clinicas')
            .insert({ 
              nombre_completo: nombre, 
              proxima_cita: fechaParaBaseDeDatos,
              enfoque_actual: 'Evaluación Inicial de Bienestar'
            });
            
          if (insertError) {
            alert("Error al crear paciente: " + JSON.stringify(insertError));
            setGuardandoCita(false);
            return; // Detiene el proceso si hay error
          }
        }

        setCitaConfirmada(true); // Solo confirma si todo salió perfecto

      } else {
        const errorData = await res.json();
        alert(`Error en Google Calendar: ${errorData.error}`);
      }
    } catch (error) {
      console.error(error);
      alert("Error de red al intentar agendar.");
    } finally {
      setGuardandoCita(false);
    }
  };

  useEffect(() => {
    if (citaConfirmada) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [citaConfirmada]);

  if (citaConfirmada) {
    return (
      <div className="min-h-screen bg-[#0B5D34] flex flex-col items-center justify-center p-6 font-sans text-white animate-in zoom-in-95 duration-700">
        <div className="relative mb-6">
          <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center shadow-2xl overflow-hidden border-4 border-white/20">
            <img src="/valentina.jpg" alt="Valentina" className="w-full h-full object-cover" />
          </div>
          <div className="absolute bottom-0 right-0 bg-[#22C55E] w-6 h-6 rounded-full border-4 border-[#0B5D34]"></div>
        </div>

        <div className="bg-white text-[#1F2937] p-8 rounded-[2rem] rounded-tl-sm shadow-2xl max-w-sm w-full relative">
          <div className="mb-6">
            <p className="text-base leading-relaxed font-medium">
              ¡Hola, <span className="text-[#0B5D34] font-bold">{primerNombre}</span>! Soy Valentina 👋
              <br/><br/>
              Ya aseguré tu espacio para: <span className="font-bold">{servicio.nombre}</span> el día <span className="font-bold text-[#0B5D34]">{proximosDias[diaIdx!].formatoVzla}</span> a las <span className="font-bold">{formatoAMPM(hora!)}</span>.
            </p>
            <div className="flex items-center gap-2 mt-4 text-sm text-gray-500 bg-gray-50 p-3 rounded-xl border border-gray-100">
              <Clock size={18} className="text-[#0B5D34] shrink-0" />
              <span>Te enviaré un recordatorio por WhatsApp una hora antes.</span>
            </div>
          </div>

          <div className="border-t border-gray-100 pt-6">
            {esNuevo ? (
              <>
                <p className="text-sm font-bold text-gray-800 mb-4 flex items-start gap-2">
                  <AlertCircle size={18} className="text-orange-500 shrink-0 mt-0.5" />
                  Un último paso muy importante:
                </p>
                <p className="text-sm text-gray-600 mb-6 leading-relaxed">
                  Para evaluar tu caso correctamente, necesito que llenes tu ficha clínica ahora mismo.
                </p>
                <button 
                  onClick={() => router.push(`/ficha?nombre=${nombre}`)}
                  className="w-full py-4 bg-[#0B5D34] text-white font-bold rounded-2xl shadow-lg shadow-[#0B5D34]/30 hover:-translate-y-1 transition-all flex items-center justify-center gap-2"
                >
                  Completar ficha de seguimiento <ArrowRight size={18} />
                </button>
              </>
            ) : (
              <>
                <p className="text-sm text-gray-600 mb-6 text-center">
                  Tus datos clínicos ya están guardados en el sistema. ¡Nos vemos pronto!
                </p>
                <button 
                  onClick={() => router.push(`/perfiles?telefono=${searchParams.get('telefono') || ''}`)}
                  className="w-full py-4 bg-gray-100 text-[#1F2937] font-bold rounded-2xl hover:bg-gray-200 transition-all flex items-center justify-center gap-2"
                >
                  Volver a mis perfiles <UserCheck size={18} />
                </button>
              </>
            )}
          </div>
          <p className="text-[10px] text-gray-400 text-right mt-4 font-bold uppercase tracking-widest">Enviado ahora</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F3F4F6] p-4 md:p-12 font-sans flex flex-col items-center pb-32">
      <div className="w-full max-w-xl space-y-6 animate-in fade-in duration-700">
        
        <header className="flex items-center gap-4 mb-2">
          <button onClick={() => router.back()} className="p-3 bg-white rounded-2xl shadow-sm text-gray-400 hover:text-[#0B5D34] transition-all">
            <ChevronLeft size={24} />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-[#1F2937]">Agendar cita</h1>
            <p className="text-gray-500 text-sm italic font-medium">Para: {nombre}</p>
          </div>
        </header>

        <div className="relative z-30">
          <button onClick={() => setIsServiceOpen(!isServiceOpen)} className={`w-full p-5 rounded-[2rem] shadow-sm border flex items-center justify-between transition-all active:scale-[0.98] ${!servicio ? 'bg-[#0B5D34] text-white border-[#0B5D34] shadow-lg shadow-[#0B5D34]/20 animate-pulse-slow' : 'bg-white border-gray-100'}`}>
            <div className="flex items-center gap-4">
              {servicio ? (
                <><span className="text-2xl">{servicio.icon}</span><div className="text-left"><p className="text-[10px] font-black text-[#0B5D34] uppercase tracking-widest">Servicio elegido</p><p className="text-gray-800 font-bold">{servicio.nombre}</p></div></>
              ) : (
                <><div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center text-white"><HeartHandshake size={20} /></div><div className="text-left"><p className="text-white font-bold text-sm md:text-base">Haz clic aquí para elegir el servicio...</p></div></>
              )}
            </div>
            <div className="flex items-center gap-2">
               {servicio && <span className="text-xs font-bold text-gray-400 bg-gray-50 px-3 py-1 rounded-full">{servicio.duracion} min</span>}
               <ChevronDown className={`${!servicio ? 'text-white' : 'text-gray-400'} transition-transform ${isServiceOpen ? 'rotate-180' : ''}`} />
            </div>
          </button>

          {isServiceOpen && (
            <div className="absolute top-full left-0 right-0 mt-3 bg-white rounded-[2rem] shadow-2xl border border-gray-100 overflow-hidden animate-in zoom-in-95 duration-200 z-50 max-h-80 overflow-y-auto no-scrollbar">
              {SERVICIOS.map((s) => (
                <div key={s.id} onClick={() => { 
                  setServicio(s); 
                  setIsServiceOpen(false); 
                  setDiaIdx(null);
                  setHora(null);
                }} className={`p-5 hover:bg-gray-50 cursor-pointer flex items-center justify-between border-b border-gray-50 last:border-0 ${servicio?.id === s.id ? 'bg-[#0B5D34]/5' : ''}`}>
                  <div className="flex items-center gap-4"><span className="text-xl">{s.icon}</span><span className={`font-bold text-sm ${servicio?.id === s.id ? 'text-[#0B5D34]' : 'text-gray-600'}`}>{s.nombre}</span></div>
                  <span className="text-[10px] font-black text-gray-300 uppercase">{s.duracion} min</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className={`transition-all duration-700 ${servicio ? 'opacity-100 translate-y-0 block' : 'opacity-0 translate-y-8 hidden'}`}>
          <div className="bg-white rounded-[2.5rem] p-6 shadow-sm border border-gray-50">
            <p className="text-[10px] font-black text-gray-500 uppercase tracking-[0.25em] mb-5 ml-2">Selecciona una fecha</p>
            <div className="flex gap-3 overflow-x-auto pb-4 no-scrollbar">
              {proximosDias.map((dia, i) => (
                <button key={i} onClick={() => setDiaIdx(i)} className={`flex-shrink-0 w-20 h-24 rounded-2xl border-2 transition-all flex flex-col items-center justify-center gap-1 ${diaIdx === i ? 'border-[#0B5D34] bg-[#0B5D34] text-white shadow-lg shadow-[#0B5D34]/30 scale-105' : 'border-gray-50 bg-gray-50 text-gray-500 hover:border-gray-100'}`}>
                  <span className="text-[10px] uppercase font-bold opacity-70">{dia.label.split(' ')[0]}</span><span className="text-xl font-black">{dia.label.split(' ')[1]}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className={`transition-all duration-700 ${diaIdx !== null ? 'opacity-100 translate-y-0 block' : 'opacity-0 translate-y-8 hidden'}`}>
          <div className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-gray-100 relative overflow-hidden min-h-[200px]">
            <div className="flex justify-between items-center mb-6 ml-2">
              <p className="text-[10px] font-black text-gray-500 uppercase tracking-[0.25em]">Horarios disponibles</p>
              {cargandoHoras && <Loader2 size={16} className="text-[#0B5D34] animate-spin" />}
            </div>

            <div className="bg-blue-50/80 text-blue-700 p-3 rounded-2xl flex items-center justify-center gap-2 mb-8 border border-blue-100/50">
               <Globe size={16} className="opacity-80" />
               <p className="text-[10px] font-bold uppercase tracking-widest">Horarios en hora de Venezuela (UTC-4)</p>
            </div>

            <div className={`space-y-8 relative z-10 transition-opacity duration-300 ${cargandoHoras ? 'opacity-50 pointer-events-none' : 'opacity-100'}`}>
              {['mañana', 'tarde'].map((turno) => (
                <div key={turno}>
                  <div className="flex items-center gap-2 mb-4 text-gray-400"><Clock size={14} /><span className="text-[10px] font-black uppercase tracking-widest">{turno}</span></div>
                  <div className="grid grid-cols-3 gap-3">
                    {(huecos as any)[turno].map((h: string) => (
                      <button key={h} onClick={() => setHora(h)} className={`py-4 rounded-2xl font-bold text-sm transition-all ${hora === h ? 'bg-[#0B5D34] text-white shadow-md' : 'bg-gray-50 text-gray-600 hover:bg-gray-100'}`}>{h}</button>
                    ))}
                    {(huecos as any)[turno].length === 0 && !cargandoHoras && (
                      <p className="text-xs text-gray-400 italic col-span-3">No hay espacios completos para este servicio en la {turno}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {hora && servicio && (
          <div className="fixed bottom-8 left-4 right-4 max-w-xl mx-auto animate-in slide-in-from-bottom-8 duration-500 z-40">
            <button 
              onClick={handleConfirmar}
              disabled={guardandoCita}
              className="w-full py-6 bg-[#0B5D34] text-white font-black rounded-[2rem] shadow-2xl shadow-[#0B5D34]/40 hover:bg-[#084b29] hover:-translate-y-1 active:scale-95 transition-all flex items-center justify-center gap-4 text-lg tracking-widest disabled:opacity-50"
            >
              {guardandoCita ? 'Sincronizando Agenda...' : `CONFIRMAR ${servicio.nombre.toUpperCase()}`}
              {!guardandoCita && <CheckCircle2 size={24} />}
            </button>
          </div>
        )}

      </div>
    </div>
  );
}

export default function Agenda() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center text-gray-400">Cargando agenda Bionatura's...</div>}>
      <AgendaContent />
    </Suspense>
  );
}