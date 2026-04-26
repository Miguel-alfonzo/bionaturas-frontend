"use client";
import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { ChevronLeft, Pill, Utensils, Calendar, Scale, ArrowRight, Loader2, MessageCircle, CalendarClock } from 'lucide-react';

function ExpedienteContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nombre = searchParams.get('nombre') || 'Consultante';
  
  const primerNombre = nombre.split(' ')[0];

  const [datos, setDatos] = useState<any>(null);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    const fetchExpediente = async () => {
      setCargando(true);
      
      const { data, error } = await supabase
        .from('historias_clinicas')
        .select('protocolo, dieta, peso_aproximado, ultima_consulta')
        .eq('nombre_completo', nombre)
        .maybeSingle();

      console.log("Buscando a:", nombre);
      console.log("Respuesta de Supabase:", data);
      if (error) console.error("Error de Supabase:", error);

      if (data) {
        setDatos(data);
      }
      setCargando(false);
    };

    fetchExpediente();
  }, [nombre]);

  const calcularProximaConsulta = (fechaStr: string) => {
    if (!fechaStr) return "Pendiente";
    
    const fecha = new Date(fechaStr + "T12:00:00"); 
    
    if (isNaN(fecha.getTime())) return "A los 28 días"; 
    
    fecha.setDate(fecha.getDate() + 28);
    
    return fecha.toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' });
  };

  const formatearFecha = (fechaStr: string) => {
    if (!fechaStr) return "Sin registro";
    const fecha = new Date(fechaStr + "T12:00:00");
    if (isNaN(fecha.getTime())) return fechaStr;
    return fecha.toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' });
  };

  const proximaConsulta = datos?.ultima_consulta ? calcularProximaConsulta(datos.ultima_consulta) : "Pendiente";

  if (cargando) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#F3F4F6] text-[#0B5D34]">
        <Loader2 className="animate-spin mb-4" size={40} />
        <p className="font-bold animate-pulse">Consultando tu seguimiento clínico...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F3F4F6] flex flex-col items-center p-4 md:p-12 pb-32 font-sans relative">
      <div className="w-full max-w-xl space-y-6 animate-in fade-in duration-700">
        
        <header className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-4">
            <button onClick={() => router.back()} className="p-3 bg-white rounded-2xl shadow-sm text-gray-400 hover:text-[#0B5D34] transition-all">
              <ChevronLeft size={24} />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-[#1F2937]">Mi seguimiento</h1>
              <p className="text-[#0B5D34] text-sm font-bold">Bionatura's</p>
            </div>
          </div>
        </header>

        <div className="bg-white p-4 rounded-3xl shadow-sm border border-gray-100 flex items-center gap-4 relative overflow-hidden">
          <div className="w-16 h-16 rounded-full overflow-hidden shrink-0 border-2 border-[#0B5D34]/20 shadow-inner">
            <img src="/valentina.jpg" alt="Valentina" className="w-full h-full object-cover" />
          </div>
          <div className="relative z-10">
            <p className="text-sm text-gray-600 leading-relaxed">
              ¡Hola, <strong className="text-[#0B5D34]">{primerNombre}</strong>! Aquí tienes el resumen de tu <strong className="text-[#0B5D34]">consulta integral holística</strong>. Revisa tus indicaciones para mantener el rumbo.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white p-5 rounded-3xl shadow-sm border border-gray-100 flex flex-col justify-center">
            <div className="flex items-center gap-2 text-gray-400 mb-2">
              <Calendar size={16} />
              <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Última consulta</p>
            </div>
            <p className="text-sm font-bold text-gray-800 capitalize">
              {formatearFecha(datos?.ultima_consulta)}
            </p>
          </div>

          <div className="bg-[#0B5D34] p-5 rounded-3xl shadow-md border border-[#084b29] flex flex-col justify-center text-white relative overflow-hidden">
            <CalendarClock className="absolute -right-3 -top-3 opacity-10" size={80} />
            <div className="flex items-center gap-2 text-green-200 mb-2 relative z-10">
              <CalendarClock size={16} />
              <p className="text-[10px] font-black uppercase tracking-widest">Próxima consulta</p>
            </div>
            <p className="text-sm font-bold capitalize relative z-10">
              {proximaConsulta}
            </p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-3xl shadow-sm border border-gray-100 flex items-center justify-between relative overflow-hidden">
          <div>
            <div className="flex items-center gap-2 text-[#0B5D34] mb-1">
              <Scale size={16} />
              <p className="text-[10px] font-black uppercase tracking-widest">Peso registrado</p>
            </div>
            <p className="text-2xl font-black text-gray-800">{datos?.peso_aproximado || "--"} kg</p>
          </div>
          <Scale className="text-gray-50 opacity-80" size={60} />
        </div>

        {/* SECCIÓN: PROTOCOLO (CORREGIDO LA FUENTE ITALIC POR NORMAL/MEDIUM) */}
        <div className="bg-white rounded-[2rem] p-6 shadow-sm border border-gray-100">
          <div className="flex items-center gap-3 mb-6 border-b border-gray-50 pb-4">
            <div className="w-10 h-10 bg-[#0B5D34]/10 text-[#0B5D34] rounded-xl flex items-center justify-center">
              <Pill size={20} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-800">Protocolo de salud</h2>
              <p className="text-xs text-gray-500 font-medium">Apoyo terapéutico</p>
            </div>
          </div>

          <div className="bg-gray-50 p-5 rounded-2xl border border-gray-100">
            {datos?.protocolo ? (
              <p className="text-sm text-gray-700 leading-relaxed font-medium whitespace-pre-line">
                {datos.protocolo}
              </p>
            ) : (
              <p className="text-gray-400 italic text-sm">Aún no se ha cargado un protocolo para este paciente.</p>
            )}
          </div>
        </div>

        {/* SECCIÓN: DIETA */}
        <div className="bg-white rounded-[2rem] p-6 shadow-sm border border-gray-100">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-orange-50 text-orange-500 rounded-xl flex items-center justify-center">
              <Utensils size={20} />
            </div>
            <h2 className="text-lg font-bold text-gray-800">Mi dieta personalizada</h2>
          </div>
          <div className="bg-orange-50/50 p-5 rounded-2xl border border-orange-100/50">
            <p className="text-sm text-gray-700 leading-relaxed font-medium whitespace-pre-line">
              {datos?.dieta || "Tu especialista asignará una dieta en tu próxima consulta integral."}
            </p>
          </div>
        </div>

        {/* PENSAMIENTO DEL DR. YÉPEZ */}
        <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-gray-100 text-center relative mt-4">
          <p className="text-sm italic text-gray-600 leading-relaxed font-medium">
            "Y recuerde, mil personas pueden opinar acerca de su dolencia, cien acertarán un diagnóstico, diez tendrán el medicamento, pero solo uno podrá sanarle con la ayuda de Dios: <span className="font-bold text-[#0B5D34]">usted mismo con su constancia</span>."
          </p>
          <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mt-4">— Dr. Luis Alfonzo Yépez</p>
        </div>

        <div className="fixed bottom-8 left-4 right-4 max-w-xl mx-auto z-40">
          <button 
            onClick={() => alert("Pronto te conectaremos directo al chat de Valentina.")}
            className="w-full py-5 bg-[#0B5D34] text-white font-black rounded-[2rem] shadow-2xl shadow-[#0B5D34]/40 hover:bg-[#084b29] hover:-translate-y-1 active:scale-95 transition-all flex items-center justify-center gap-3 text-sm md:text-base uppercase tracking-widest"
          >
            <MessageCircle size={20} />
            Hablar con Valentina
            <ArrowRight size={20} className="ml-1 opacity-50" />
          </button>
        </div>

      </div>
    </div>
  );
}

export default function Expediente() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center text-[#0B5D34]">Cargando seguimiento Bionatura's...</div>}>
      <ExpedienteContent />
    </Suspense>
  );
}