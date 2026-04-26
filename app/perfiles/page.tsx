"use client";
import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Calendar, ArrowRight, AlertCircle, Edit2, XCircle, PlusCircle, UserPlus, Heart, X, Clock, Loader2 } from 'lucide-react';

function PerfilesContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const telefono = searchParams.get('telefono') || 'Sin Teléfono';
  
  const [familiares, setFamiliares] = useState<any[]>([]);
  const [seleccionado, setSeleccionado] = useState<string | null>(null);
  const [citaPendiente, setCitaPendiente] = useState<string | null>(null);
  const [cargando, setCargando] = useState(true);
  
  const [mostrarForm, setMostrarForm] = useState(false);
  const [nuevoNombre, setNuevoNombre] = useState('');
  const [nuevoParentesco, setNuevoParentesco] = useState('');
  const [guardandoFamiliar, setGuardandoFamiliar] = useState(false);
  const [mensajeTiempo, setMensajeTiempo] = useState('');
  const [modalCancelar, setModalCancelar] = useState(false);
  const [cancelandoCita, setCancelandoCita] = useState(false);

  const cargarPerfiles = async () => {
    setCargando(true);
    const { data, error } = await supabase
      .from('historias_clinicas')
      .select('nombre_completo, relacion_parentesco, proxima_cita')
      .eq('telefono', telefono);

    if (data && data.length > 0) {
      setFamiliares(data);
    } else {
      setFamiliares([{ nombre_completo: 'Andrés', relacion_parentesco: 'Titular' }]);
    }
    setCargando(false);
  };

  useEffect(() => {
    cargarPerfiles();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [telefono]);

  const calcularTiempoRestante = (citaTexto: string) => {
    if (!citaTexto) return { mensaje: "", caduco: false };
    
    try {
      const ahora = new Date();
      let fechaCita = new Date();
      let esValida = false;

      if (citaTexto.includes('/')) {
        const partes = citaTexto.split(' a las ');
        const [diaStr, mesStr, anioStr] = partes[0].split('/');
        const matchHora = partes[1]?.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);

        if (matchHora) {
          let hora = parseInt(matchHora[1], 10);
          const min = parseInt(matchHora[2], 10);
          const ampm = matchHora[3].toUpperCase();
          
          if (ampm === 'PM' && hora < 12) hora += 12;
          if (ampm === 'AM' && hora === 12) hora = 0;

          const iso = `${anioStr}-${mesStr.padStart(2,'0')}-${diaStr.padStart(2,'0')}T${String(hora).padStart(2,'0')}:${String(min).padStart(2,'0')}:00-04:00`;
          fechaCita = new Date(iso);
          esValida = true;
        }
      } 
      else {
        const match = citaTexto.match(/(\d+)\b.*(\d{1,2}:\d{2})\s*(AM|PM)/i);
        if (match) {
          const diaCita = parseInt(match[1], 10);
          let [hora, min] = match[2].split(':').map(Number);
          const ampm = match[3].toUpperCase();
          
          if (ampm === 'PM' && hora < 12) hora += 12;
          if (ampm === 'AM' && hora === 12) hora = 0;

          for (let i = -1; i < 7; i++) {
            let d = new Date();
            d.setDate(d.getDate() + i);
            if (d.getDate() === diaCita) {
              fechaCita = d;
              fechaCita.setHours(hora, min, 0, 0);
              esValida = true;
              break;
            }
          }
        }
      }

      if (!esValida || isNaN(fechaCita.getTime())) {
        console.warn("No se pudo descifrar matemáticamente la fecha:", citaTexto);
        return { mensaje: "Fecha registrada.", caduco: false };
      }

      const diffHoras = (fechaCita.getTime() - ahora.getTime()) / (1000 * 60 * 60);

      if (diffHoras < -2) return { mensaje: "", caduco: true };
      
      if (diffHoras <= 24 && diffHoras >= 0) return { mensaje: "¡Prepárate! Tu cita es en menos de 24 horas.", caduco: false };
      
      const diasFaltantes = Math.ceil(diffHoras / 24);
      return { mensaje: `Faltan ${diasFaltantes} días para tu cita. ¡Te esperamos!`, caduco: false };

    } catch (e) {
      console.error("Error crítico leyendo fecha:", e);
      return { mensaje: "", caduco: false };
    }
  };

  useEffect(() => {
    if (!seleccionado) return;
    const perfil = familiares.find(f => f.nombre_completo === seleccionado);
    const cita = perfil?.proxima_cita || null;
    
    if (cita) {
      const { mensaje, caduco } = calcularTiempoRestante(cita);
      if (caduco) {
        setCitaPendiente(null);
        setMensajeTiempo('');
      } else {
        setCitaPendiente(cita);
        setMensajeTiempo(mensaje);
      }
    } else {
      setCitaPendiente(null);
      setMensajeTiempo('');
    }
  }, [seleccionado, familiares]);

  const handleNombreChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const capitalizado = e.target.value.replace(/\b\w/g, char => char.toUpperCase());
    setNuevoNombre(capitalizado);
  };

  const handleParentescoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const capitalizado = e.target.value.replace(/\b\w/g, char => char.toUpperCase());
    setNuevoParentesco(capitalizado);
  };

  const handleGuardarFamiliar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nuevoNombre || !nuevoParentesco) return;

    setGuardandoFamiliar(true);

    const { error } = await supabase
      .from('historias_clinicas')
      .insert({
        nombre_completo: nuevoNombre, 
        relacion_parentesco: nuevoParentesco,  
        telefono: telefono,
        enfoque_actual: 'Evaluación de ingreso'
      });

    if (!error) {
      setNuevoNombre('');
      setNuevoParentesco('');
      setMostrarForm(false); 
      cargarPerfiles();      
    } else {
      alert("Error detallado de Supabase: " + JSON.stringify(error));
    }
    setGuardandoFamiliar(false);
  };

  const handleCancelarCita = async () => {
    if (!seleccionado) return;
    setCancelandoCita(true);

    try {
      await fetch('/api/calendar/cancel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nombre: seleccionado, fechaTexto: citaPendiente })
      });

      const { error } = await supabase
        .from('historias_clinicas')
        .update({ proxima_cita: null })
        .eq('nombre_completo', seleccionado);

      if (!error) {
        setCitaPendiente(null);
        setMensajeTiempo('');
        setModalCancelar(false);
        cargarPerfiles(); 
      } else {
        alert("Ocurrió un error al limpiar tu expediente.");
      }
    } catch (err) {
      console.error(err);
      alert("Error de red al intentar cancelar.");
    } finally {
      setCancelandoCita(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F3F4F6] flex flex-col items-center p-6 md:p-12 pb-32 font-sans relative">
      <div className="w-full max-w-lg space-y-8 animate-in fade-in duration-700">
        
        <header className="text-center mt-8">
          <h1 className="text-3xl font-bold text-[#1F2937] transition-all">
            {seleccionado ? `¡Hola, ${seleccionado.split(' ')[0]}!` : '¿Quién nos visita hoy?'}
          </h1>
          <p className="text-gray-500 font-medium mt-2">
            {seleccionado ? 'Resumen de tu espacio de salud' : 'Elige un perfil para continuar'}
          </p>
        </header>

        <div className="space-y-4">
          {familiares
            .filter((f) => !seleccionado || seleccionado === f.nombre_completo)
            .map((f, i) => (
            <button
              key={i}
              onClick={() => setSeleccionado(seleccionado === f.nombre_completo ? null : f.nombre_completo)}
              // LA INYECCIÓN ESTÁ AQUÍ: active:scale-95 añadido a las clases
              className={`w-full p-6 rounded-3xl border-2 transition-all duration-300 flex items-center gap-4 hover:-translate-y-1 hover:shadow-md active:scale-95 ${
                seleccionado === f.nombre_completo 
                ? 'border-[#0B5D34] bg-white shadow-xl shadow-[#0B5D34]/20 -translate-y-1 scale-[1.02]' 
                : 'border-transparent bg-white shadow-sm hover:border-gray-200'
              }`}
            >
              <div className={`w-14 h-14 rounded-full flex items-center justify-center text-xl font-bold ${
                seleccionado === f.nombre_completo ? 'bg-[#0B5D34] text-white' : 'bg-green-50 text-[#0B5D34]'
              }`}>
                {f.nombre_completo.charAt(0)}
              </div>
              <div className="text-left flex-1">
                <h2 className="text-xl font-bold text-gray-800">{f.nombre_completo}</h2>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">{f.relacion_parentesco || 'Titular'}</p>
              </div>
            </button>
          ))}

          {!seleccionado && (
            <button 
              onClick={() => setMostrarForm(true)}
              // INYECCIÓN AQUÍ TAMBIÉN PARA CONSISTENCIA: active:scale-95
              className="w-full p-6 rounded-3xl border-2 border-dashed border-gray-300 bg-gray-50/50 hover:bg-gray-100 hover:border-[#0B5D34]/50 transition-all flex items-center gap-4 text-gray-500 group active:scale-95"
            >
              <PlusCircle className="text-gray-400 group-hover:text-[#0B5D34]" size={30} />
              <div className="text-left">
                <h2 className="text-lg font-bold group-hover:text-[#0B5D34]">Agregar familiar</h2>
                <p className="text-xs font-bold opacity-60 uppercase">Nuevo expediente</p>
              </div>
            </button>
          )}
        </div>

        {seleccionado && (
          <div className="animate-in slide-in-from-bottom-8 duration-500 mt-8 space-y-4">
            {citaPendiente ? (
              <div className="bg-[#0B5D34] rounded-[2rem] p-6 text-white shadow-lg relative overflow-hidden">
                <Calendar className="absolute -right-4 -top-4 opacity-10" size={120} />
                <div className="relative z-10">
                  <p className="text-[10px] font-black uppercase tracking-widest text-green-200 mb-2">Cita programada</p>
                  <h3 className="text-xl font-bold mb-4">{citaPendiente}</h3>
                  <div className="flex gap-2 mb-4">
                    <button 
                      onClick={() => router.push(`/agenda?nombre=${seleccionado}`)}
                      className="flex-1 bg-white/20 hover:bg-white/30 text-white py-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all active:scale-95"
                    >
                      <Edit2 size={14} /> Reprogramar
                    </button>
                    <button 
                      onClick={() => setModalCancelar(true)}
                      className="flex-1 bg-white/20 hover:bg-orange-500/80 text-white py-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all active:scale-95"
                    >
                      <XCircle size={14} /> Cancelar
                    </button>
                  </div>
                  
                  {mensajeTiempo && (
                    <div className="flex items-center justify-center gap-2 text-xs text-white/90 font-medium bg-black/10 py-2 rounded-lg">
                      <Clock size={14} />
                      <p>{mensajeTiempo}</p>
                    </div>
                  )}
                  
                </div>
              </div>
            ) : (
              <div className="bg-gray-100 rounded-[2rem] p-6 text-center border border-gray-200">
                <AlertCircle size={32} className="mx-auto text-gray-400 mb-2" />
                <p className="text-gray-600 font-medium">No tienes citas próximas agendadas.</p>
              </div>
            )}

            <button 
              onClick={() => router.push(citaPendiente ? `/expediente?nombre=${seleccionado}` : `/agenda?nombre=${seleccionado}`)}
              className="w-full py-5 bg-[#0B5D34] text-white font-black rounded-3xl shadow-xl hover:-translate-y-1 active:scale-95 transition-all flex items-center justify-center gap-4 text-lg uppercase tracking-widest"
            >
              {citaPendiente ? 'Ver plan de tratamiento' : 'Agendar nueva cita'}
              <ArrowRight size={22} />
            </button>
          </div>
        )}

      </div>

      {mostrarForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-2xl w-full max-w-sm animate-in zoom-in-95 duration-300">
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center gap-2 text-[#0B5D34]">
                <UserPlus size={20} />
                <h3 className="font-bold uppercase text-xs tracking-widest">Nuevo integrante</h3>
              </div>
              <button onClick={() => setMostrarForm(false)} className="text-gray-300 hover:text-red-500 transition-colors bg-gray-50 rounded-full p-1"><X size={20}/></button>
            </div>

            <form onSubmit={handleGuardarFamiliar} className="space-y-5">
              <div>
                <label className="text-[10px] font-black text-gray-400 uppercase ml-2 mb-1 block">Nombre completo</label>
                <input 
                  autoFocus
                  required
                  type="text"
                  value={nuevoNombre}
                  onChange={handleNombreChange}
                  className="w-full bg-gray-50 border border-gray-100 rounded-2xl p-4 outline-none focus:ring-2 focus:ring-[#0B5D34]/20 focus:border-[#0B5D34] font-medium text-gray-800 transition-all"
                  placeholder="Ej: Aranza Valentina"
                />
              </div>
              <div>
                <label className="text-[10px] font-black text-gray-400 uppercase ml-2 mb-1 block">Parentesco / relación</label>
                <input 
                  required
                  type="text"
                  value={nuevoParentesco}
                  onChange={handleParentescoChange}
                  className="w-full bg-gray-50 border border-gray-100 rounded-2xl p-4 outline-none focus:ring-2 focus:ring-[#0B5D34]/20 focus:border-[#0B5D34] font-medium text-gray-800 transition-all"
                  placeholder="Ej: Hija, Abuela, Prima..."
                />
              </div>
              <button 
                type="submit"
                disabled={guardandoFamiliar}
                className="w-full py-4 mt-2 bg-[#0B5D34] text-white font-bold rounded-2xl shadow-xl shadow-[#0B5D34]/30 hover:-translate-y-0.5 active:scale-95 transition-all flex items-center justify-center gap-2"
              >
                {guardandoFamiliar ? <Loader2 className="animate-spin" /> : <><Heart size={18}/> Guardar en Bionatura's</>}
              </button>
            </form>
          </div>
        </div>
      )}

      {modalCancelar && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white p-8 rounded-[2.5rem] shadow-2xl w-full max-w-sm animate-in zoom-in-95 duration-300 text-center relative overflow-hidden">
            
            <div className="w-20 h-20 mx-auto mb-4 rounded-full overflow-hidden border-4 border-orange-50 shadow-sm relative z-10">
              <img src="/valentina.jpg" alt="Valentina" className="w-full h-full object-cover" />
            </div>
            
            <h3 className="text-xl font-bold text-gray-800 mb-2 relative z-10">¿Seguro que nos dejas?</h3>
            <p className="text-sm text-gray-600 mb-8 leading-relaxed relative z-10">
              ¡Hola, <span className="font-bold text-[#0B5D34]">{seleccionado?.split(' ')[0]}</span>! Entiendo que a veces surgen imprevistos, pero recuerda que la constancia es la llave de tu sanación.
              <br/><br/>
              ¿De verdad deseas cancelar tu espacio para el <strong>{citaPendiente}</strong>?
            </p>

            <div className="space-y-3 flex flex-col-reverse relative z-10">
              
              <button 
                onClick={handleCancelarCita}
                disabled={cancelandoCita}
                className="w-full py-3 text-orange-500 hover:bg-orange-50 font-bold rounded-2xl transition-all flex items-center justify-center gap-2 active:scale-95 text-sm"
              >
                {cancelandoCita ? <Loader2 className="animate-spin" size={18} /> : 'Sí, entiendo y quiero cancelar'}
              </button>

              <button 
                onClick={() => setModalCancelar(false)}
                disabled={cancelandoCita}
                className="w-full py-4 bg-[#0B5D34] hover:bg-[#084b29] text-white font-bold rounded-2xl transition-all active:scale-95 shadow-xl shadow-[#0B5D34]/30"
              >
                No, mejor mantendré mi cita
              </button>
            </div>

            <div className="absolute top-0 right-0 w-32 h-32 bg-orange-50 rounded-bl-full -z-0 opacity-50"></div>
          </div>
        </div>
      )}

    </div>
  );
}

export default function Perfiles() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center text-gray-400">Cargando perfiles...</div>}>
      <PerfilesContent />
    </Suspense>
  );
}