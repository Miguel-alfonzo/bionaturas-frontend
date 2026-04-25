"use client";
import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Heart, Activity, Sparkles, Brain, ArrowRight, MessageSquareQuote } from 'lucide-react';

function DashboardContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const nombre = searchParams.get('nombre') || 'Consultante';
  
  const [seleccionados, setSeleccionados] = useState<string[]>([]);
  const [comentario, setComentario] = useState('');
  const [enfoqueValentina, setEnfoqueValentina] = useState('');
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    const fetchDatos = async () => {
      const { data } = await supabase
        .from('historias_clinicas')
        .select('enfoque_actual')
        .eq('nombre_completo', nombre)
        .maybeSingle();

      if (data) {
        setEnfoqueValentina(data.enfoque_actual || '');
      }
      setCargando(false);
    };
    fetchDatos();
  }, [nombre]);

  const opciones = [
    { id: 'vital', text: 'Vital y en equilibrio', icon: <Sparkles size={20} /> },
    { id: 'estable', text: 'Estable, con necesidad de ajuste', icon: <Activity size={20} /> },
    { id: 'agobiado', text: 'Emocionalmente agobiado/a', icon: <Brain size={20} /> },
    { id: 'malestar', text: 'Con malestar físico evidente', icon: <Heart size={20} /> },
  ];

  const toggleSeleccion = (id: string) => {
    setSeleccionados(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  const handleConfirmarCheckin = async () => {
    setGuardando(true);
    try {
      // Guardamos el desahogo en motivo_consulta antes de ir a la agenda
      await supabase
        .from('historias_clinicas')
        .update({ motivo_consulta: comentario })
        .eq('nombre_completo', nombre);
      
      // Aquí iríamos a la página de la agenda (Módulo 3)
      alert("Check-in guardado. Pasando a la agenda...");
      // router.push('/agenda'); 
    } catch (error) {
      console.error("Error al guardar check-in:", error);
    } finally {
      setGuardando(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F3F4F6] flex flex-col items-center p-6 md:p-12 font-sans">
      <div className="w-full max-w-2xl space-y-8">
        
        {/* HEADER LIMPIO Y PROFESIONAL */}
        <header className="animate-in fade-in duration-700">
          <h1 className="text-3xl font-bold text-[#1F2937]">Hola, {nombre}</h1>
          <p className="text-gray-500 font-medium mt-1">Tu espacio de sanación integral</p>
        </header>
          
        {/* TARJETA DE ENFOQUE (MEMORIA CLÍNICA) */}
        <div className="bg-[#0B5D34] rounded-[2.5rem] p-8 text-white shadow-2xl shadow-[#0B5D34]/30 relative overflow-hidden">
          <div className="relative z-10">
            <p className="text-[10px] font-black uppercase tracking-[0.25em] opacity-70 mb-2">Objetivo de Bienestar</p>
            <h2 className="text-2xl font-bold mb-3">
              {enfoqueValentina ? enfoqueValentina : "Hoy iniciamos un nuevo capítulo"}
            </h2>
            <p className="text-sm opacity-80 leading-relaxed font-medium max-w-md">
              {enfoqueValentina 
                ? "Este es el eje central de tu tratamiento actual. Abordaremos cualquier sensación de hoy bajo este enfoque integral."
                : "Toda la información que compartas hoy servirá para trazar tu próximo protocolo de salud holística."}
            </p>
          </div>
          <div className="absolute -right-8 -bottom-8 opacity-10 rotate-12 scale-150 text-white">
             <Activity size={180} />
          </div>
        </div>

        {/* CHECK-IN Y DESAHOGO */}
        <section className="bg-white rounded-[2.5rem] p-8 md:p-10 shadow-sm border border-gray-50">
          <h3 className="text-xl font-bold text-[#1F2937] mb-8 text-center md:text-left">
            ¿Cómo se manifiesta tu equilibrio hoy?
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {opciones.map((opc) => (
              <button
                key={opc.id}
                onClick={() => toggleSeleccion(opc.id)}
                className={`p-6 rounded-2xl border-2 text-left transition-all flex items-center gap-4 group ${
                  seleccionados.includes(opc.id) 
                  ? 'border-[#0B5D34] bg-[#0B5D34]/5 ring-4 ring-[#0B5D34]/5' 
                  : 'border-gray-50 bg-gray-50/30 hover:border-gray-100'
                }`}
              >
                <span className={seleccionados.includes(opc.id) ? 'text-[#0B5D34]' : 'text-gray-300'}>
                  {opc.icon}
                </span>
                <span className={`font-bold text-sm ${seleccionados.includes(opc.id) ? 'text-[#0B5D34]' : 'text-gray-500'}`}>
                  {opc.text}
                </span>
              </button>
            ))}
          </div>

          {/* DESPLIEGUE DE DESAHOGO */}
          {seleccionados.length > 0 && (
            <div className="mt-10 space-y-8 animate-in slide-in-from-top-6 duration-500">
              <div className="bg-[#F0F9FF] p-6 rounded-3xl border border-blue-50 flex gap-4">
                <MessageSquareQuote className="text-blue-400 shrink-0" size={24} />
                <p className="text-sm text-blue-900 font-semibold italic leading-relaxed">
                  "Tu voz es clave. Este espacio es para que te expreses libremente; tu especialista te leerá antes de tu sesión."
                </p>
              </div>

              <div className="space-y-3">
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">Espacio de Desahogo Integral</label>
                <textarea
                  value={comentario}
                  onChange={(e) => setComentario(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-100 rounded-[2rem] p-6 min-h-[150px] focus:border-[#0B5D34] focus:bg-white outline-none transition-all text-gray-700 shadow-inner"
                  placeholder="Escribe aquí todo lo que sientas necesario compartir..."
                />
              </div>

              <button 
                onClick={handleConfirmarCheckin}
                disabled={guardando}
                className="w-full py-6 bg-[#0B5D34] text-white font-black rounded-3xl shadow-xl shadow-[#0B5D34]/20 hover:bg-[#084b29] hover:-translate-y-1 active:scale-95 transition-all flex items-center justify-center gap-4 text-lg uppercase tracking-widest disabled:opacity-50"
              >
                {guardando ? 'Sincronizando...' : 'Confirmar y Ver Agenda'}
                {!guardando && <ArrowRight size={22} />}
              </button>
            </div>
          )}
        </section>

      </div>
    </div>
  );
}

export default function Dashboard() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center text-gray-400">Conectando con Bionaturas...</div>}>
      <DashboardContent />
    </Suspense>
  );
}