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
    
    const match = citaTexto.match(/(\d+)\b.*(\d{1,2}:\d{2})\s*(AM|PM|a\.m\.|p\.m\.)?/i);
    if (!match) return { mensaje: "", caduco: false }; 
    
    const diaCita = parseInt(match[1]);
    let [hora, min] = match[2].split(':').map(Number);
    const ampm = match[3] ? match[3].toUpperCase() : null;

    if (ampm) {
      if (ampm.includes('PM') && hora < 12) hora += 12;
      if (ampm.includes('AM') && hora === 12) hora = 0;
    }

    let fechaCita = new Date();
    for(let i=-1; i<7; i++) {
      let d = new Date();
      d.setDate(d.getDate() + i);
      if (d.getDate() === diaCita) {
        fechaCita = d;
        fechaCita.setHours(hora, min, 0, 0);
        break;
      }
    }

    const ahora = new Date();
    const diffMs = fechaCita.getTime() - ahora.getTime();
    const diffHoras = diffMs / (1000 * 60 * 60);

    if (diffHoras < -0.5) return { mensaje: "", caduco: true };
    if (diffHoras <= 24) return { mensaje: "¡Prepárate! Tu cita es en menos de 24 horas.", caduco: false };
    
    const diasFaltantes = Math.ceil(diffHoras / 24);
    return { mensaje: `Faltan ${diasFaltantes} días para tu cita. ¡Te esperamos!`, caduco: false };
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

  return (
    <div className="min-h-screen bg-[#F3F4F6] flex flex-col items-center p-6 md:p-12 pb-32 font-sans relative">
      <div className="w-full max-w-lg space-y-8 animate-in fade-in duration-700">
        
        <header className="text-center mt-8">
          {/* FASE 1 APLICADA: Extraemos solo el primer nombre usando .split(' ')[0] */}
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
              className={`w-full p-6 rounded-3xl border-2 transition-all flex items-center gap-4 ${
                seleccionado === f.nombre_completo 
                ? 'border-[#0B5D34] bg-white shadow-xl shadow-[#0B5D34]/10 scale-[1.02]' 
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
              className="w-full p-6 rounded-3xl border-2 border-dashed border-gray-300 bg-gray-50/50 hover:bg-gray-100 hover:border-[#0B5D34]/50 transition-all flex items-center gap-4 text-gray-500 group"
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
                    <button className="flex-1 bg-white/20 hover:bg-white/30 text-white py-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all">
                      <Edit2 size={14} /> Reprogramar
                    </button>
                    <button className="flex-1 bg-white/20 hover:bg-red-500/80 text-white py-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all">
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