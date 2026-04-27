"use client";
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Search, Calendar, User, Clock, ChevronRight, Activity, Users, Loader2, CheckCircle2 } from 'lucide-react';

export default function PanelEspecialista() {
  const router = useRouter();
  const [pacientes, setPacientes] = useState<any[]>([]);
  const [busqueda, setBusqueda] = useState('');
  const [cargando, setCargando] = useState(true);

  const hoy = new Date();
  const diaHoy = String(hoy.getDate()).padStart(2, '0');
  const mesHoy = String(hoy.getMonth() + 1).padStart(2, '0');
  const anioHoy = hoy.getFullYear();
  const fechaHoyStr = `${diaHoy}/${mesHoy}/${anioHoy}`;

  useEffect(() => {
    const cargarPacientes = async () => {
      setCargando(true);
      const { data, error } = await supabase
        .from('historias_clinicas')
        .select('id, nombre_completo, telefono, proxima_cita, enfoque_actual')
        .order('proxima_cita', { ascending: true });

      if (!error && data) {
        setPacientes(data);
      }
      setCargando(false);
    };

    cargarPacientes();
  }, []);

  const pacientesFiltrados = pacientes.filter(p => 
    p.nombre_completo.toLowerCase().includes(busqueda.toLowerCase()) ||
    (p.telefono && p.telefono.includes(busqueda))
  );

  const citasHoy = pacientes.filter(p => p.proxima_cita && p.proxima_cita.startsWith(fechaHoyStr));
  const proximasCitas = pacientes.filter(p => p.proxima_cita && !p.proxima_cita.startsWith(fechaHoyStr));

  const abrirExpediente = (nombre: string, telefono: string) => {
    router.push(`/consulta?nombre=${encodeURIComponent(nombre)}&telefono=${encodeURIComponent(telefono || '')}`);
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-24 font-sans text-[#1F2937]">
      
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40 shadow-sm">
        <div className="max-w-4xl mx-auto px-4 md:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#0B5D34] rounded-lg flex items-center justify-center text-white shadow-md">
              <Activity size={20} />
            </div>
            <div>
              <h1 className="font-bold text-lg leading-none text-gray-800">Panel del Especialista</h1>
              <p className="text-xs text-gray-500 font-medium mt-0.5">Miguel Espinoza • Naturópata</p>
            </div>
          </div>
          <div className="text-right hidden md:block">
            {/* AQUÍ ESTÁ LA CORRECCIÓN DE LA FECHA CON CAPITALIZE */}
            <p className="text-sm font-bold text-[#0B5D34] capitalize">
              {hoy.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}
            </p>
          </div>
        </div>
      </header>
      
      <main className="max-w-4xl mx-auto px-4 md:px-8 mt-6 md:mt-8 space-y-8 animate-in fade-in duration-500">
        
        <div className="relative">
          <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
            <Search className="text-gray-400" size={20} />
          </div>
          <input
            type="text"
            placeholder="Buscar paciente por nombre o teléfono..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className="w-full bg-white border-2 border-gray-200 rounded-2xl py-4 pl-12 pr-4 text-gray-800 font-medium outline-none focus:border-[#0B5D34] focus:ring-4 focus:ring-[#0B5D34]/10 transition-all shadow-sm"
          />
          {busqueda && (
            <div className="absolute right-4 top-4 text-xs font-bold text-[#0B5D34] bg-green-50 px-2 py-1 rounded-md">
              {pacientesFiltrados.length} res
            </div>
          )}
        </div>

        {cargando ? (
          <div className="flex flex-col items-center justify-center py-20 text-gray-400">
            <Loader2 className="animate-spin mb-4 text-[#0B5D34]" size={32} />
            <p className="font-medium text-sm">Sincronizando base de datos...</p>
          </div>
        ) : busqueda !== '' ? (
          <div className="space-y-3">
            <h2 className="text-sm font-black text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2">
              <Users size={16} /> Resultados de búsqueda
            </h2>
            {pacientesFiltrados.length > 0 ? (
              pacientesFiltrados.map((p, i) => (
                <button key={i} onClick={() => abrirExpediente(p.nombre_completo, p.telefono)} className="w-full text-left bg-white p-4 rounded-2xl border border-gray-100 hover:border-[#0B5D34]/50 hover:shadow-md transition-all flex items-center justify-between group active:scale-[0.99]">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center text-gray-500 font-bold border border-gray-100">
                      {p.nombre_completo.charAt(0)}
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-800">{p.nombre_completo}</h3>
                      <p className="text-xs text-gray-500 mt-0.5">{p.telefono || 'Sin teléfono'}</p>
                    </div>
                  </div>
                  <ChevronRight className="text-gray-300 group-hover:text-[#0B5D34] transition-colors" />
                </button>
              ))
            ) : (
              <div className="text-center py-12 bg-white rounded-2xl border border-dashed border-gray-200">
                <p className="text-gray-500 font-medium">No se encontraron pacientes.</p>
              </div>
            )}
          </div>
        ) : (
          <>
            <div>
              <h2 className="text-sm font-black text-[#0B5D34] uppercase tracking-widest mb-4 flex items-center gap-2">
                <Calendar size={16} /> Pacientes de Hoy
              </h2>
              
              {citasHoy.length > 0 ? (
                <div className="grid gap-3 md:grid-cols-2">
                  {citasHoy.map((p, i) => (
                    <button key={i} onClick={() => abrirExpediente(p.nombre_completo, p.telefono)} className="w-full text-left bg-white p-5 rounded-2xl border-2 border-[#0B5D34]/10 hover:border-[#0B5D34] hover:shadow-lg transition-all relative overflow-hidden group active:scale-[0.99]">
                      <div className="absolute top-0 right-0 w-16 h-16 bg-green-50 rounded-bl-full -z-10 group-hover:scale-110 transition-transform"></div>
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex items-center gap-2 text-[#0B5D34] bg-green-50 px-2 py-1 rounded-md">
                          <Clock size={14} />
                          <span className="text-xs font-black">{p.proxima_cita.split(' a las ')[1]}</span>
                        </div>
                      </div>
                      <h3 className="font-bold text-lg text-gray-800">{p.nombre_completo}</h3>
                      <p className="text-xs font-medium text-gray-500 mt-1 line-clamp-1">{p.enfoque_actual || 'Evaluación General'}</p>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="bg-white p-8 rounded-2xl border border-gray-100 text-center shadow-sm">
                  <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-3">
                    <CheckCircle2 className="text-green-400" size={32} />
                  </div>
                  <p className="font-bold text-gray-700">No hay más citas programadas para hoy.</p>
                  <p className="text-sm text-gray-500 mt-1">Busca un paciente arriba para abrir su expediente.</p>
                </div>
              )}
            </div>

            {proximasCitas.length > 0 && (
              <div className="pt-4 border-t border-gray-100">
                <h2 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                  <Clock size={14} /> Próximas Citas
                </h2>
                <div className="space-y-2">
                  {proximasCitas.slice(0, 5).map((p, i) => (
                    <button key={i} onClick={() => abrirExpediente(p.nombre_completo, p.telefono)} className="w-full text-left bg-white p-4 rounded-xl border border-gray-100 hover:bg-gray-50 transition-all flex items-center justify-between active:scale-[0.99]">
                      <div>
                        <h3 className="font-bold text-sm text-gray-700">{p.nombre_completo}</h3>
                        <p className="text-[10px] font-bold text-gray-400 uppercase mt-0.5">{p.proxima_cita}</p>
                      </div>
                      <ChevronRight size={16} className="text-gray-300" />
                    </button>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}