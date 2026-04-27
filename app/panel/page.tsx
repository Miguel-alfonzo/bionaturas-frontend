"use client";
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Search, Calendar, Clock, ChevronRight, Activity, Users, Loader2, CheckCircle2, DollarSign, TrendingUp, AlertTriangle, Wallet, HeartHandshake } from 'lucide-react';

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
  const mesAnioActualStr = `${mesHoy}/${anioHoy}`; 

  useEffect(() => {
    const cargarPacientes = async () => {
      setCargando(true);
      const { data, error } = await supabase
        .from('historias_clinicas')
        .select('id, nombre_completo, telefono, proxima_cita, enfoque_actual, historial_consultas, saldo_pendiente')
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
  
  // 🧮 LÓGICA DE CÁLCULO DE FECHAS (Semana actual)
  const inicioSemana = new Date(hoy);
  const diaSemana = inicioSemana.getDay();
  const diff = inicioSemana.getDate() - diaSemana + (diaSemana === 0 ? -6 : 1); 
  inicioSemana.setDate(diff);
  inicioSemana.setHours(0,0,0,0);

  // 🧮 MOTOR FINANCIERO Y ESTADÍSTICO
  let ingresosHoy = 0;
  let ingresosSemana = 0;
  let ingresosMes = 0;
  let donacionesMes = 0;
  let deudores = [] as any[];

  pacientes.forEach(p => {
    if (parseFloat(p.saldo_pendiente) > 0) {
      deudores.push(p);
    }

    if (p.historial_consultas && Array.isArray(p.historial_consultas)) {
      p.historial_consultas.forEach((visita: any) => {
        if (visita.finanzas) {
          const pago = parseFloat(visita.finanzas.pagado) || 0;
          const costo = parseFloat(visita.finanzas.costo) || 0;
          const tipoPago = visita.finanzas.tipoPago;
          
          const fechaVisitaStr = visita.fecha.split(',')[0]; 
          const [dia, mes, anio] = fechaVisitaStr.split('/');
          const visitaDate = new Date(Number(anio), Number(mes) - 1, Number(dia));

          const esHoy = fechaVisitaStr === fechaHoyStr;
          const esMes = fechaVisitaStr.includes(mesAnioActualStr);
          const esSemana = visitaDate >= inicioSemana && visitaDate <= hoy;

          if (tipoPago === 'Donacion') {
            if (esMes) donacionesMes += costo;
          } else {
            if (esHoy) ingresosHoy += pago;
            if (esSemana) ingresosSemana += pago;
            if (esMes) ingresosMes += pago;
          }
        }
      });
    }
  });

  const abrirExpediente = (nombre: string, telefono: string) => {
    router.push(`/consulta?nombre=${encodeURIComponent(nombre)}&telefono=${encodeURIComponent(telefono || '')}`);
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-24 font-sans text-[#1F2937]">
      
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40 shadow-sm">
        <div className="max-w-5xl mx-auto px-4 md:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#0B5D34] rounded-lg flex items-center justify-center text-white shadow-md">
              <Activity size={20} />
            </div>
            <div>
              <h1 className="font-bold text-lg leading-none text-gray-800">Centro de Mando</h1>
              <p className="text-xs text-gray-500 font-medium mt-0.5">Miguel Espinoza • Naturópata</p>
            </div>
          </div>
          <div className="text-right hidden md:block">
            <p className="text-sm font-bold text-[#0B5D34] capitalize">
              {hoy.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}
            </p>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 md:px-8 mt-6 md:mt-8 space-y-8 animate-in fade-in duration-500">
        
        <div className="relative">
          <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
            <Search className="text-gray-400" size={20} />
          </div>
          <input
            type="text"
            placeholder="Buscar paciente para consulta o cobro..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className="w-full bg-white border-2 border-gray-200 rounded-2xl py-4 pl-12 pr-4 text-gray-800 font-medium outline-none focus:border-[#0B5D34] focus:ring-4 focus:ring-[#0B5D34]/10 transition-all shadow-sm"
          />
        </div>

        {cargando ? (
          <div className="flex flex-col items-center justify-center py-20 text-gray-400">
            <Loader2 className="animate-spin mb-4 text-[#0B5D34]" size={32} />
            <p className="font-medium text-sm">Calculando finanzas y sincronizando citas...</p>
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
                  <div className="flex items-center gap-3">
                    {parseFloat(p.saldo_pendiente) > 0 && <span className="text-[10px] bg-red-100 text-red-700 font-black px-2 py-1 rounded-md">DEUDA: ${p.saldo_pendiente}</span>}
                    <ChevronRight className="text-gray-300 group-hover:text-[#0B5D34] transition-colors" />
                  </div>
                </button>
              ))
            ) : (
              <div className="text-center py-12 bg-white rounded-2xl border border-dashed border-gray-200">
                <p className="text-gray-500 font-medium">No se encontraron pacientes.</p>
              </div>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            <div className="lg:col-span-2 space-y-8">
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
                    <p className="font-bold text-gray-700">No hay citas programadas para hoy.</p>
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-6">
              
              <div className="bg-gray-900 rounded-[2rem] p-6 text-white shadow-xl relative overflow-hidden">
                <div className="absolute -right-6 -top-6 text-white/5 rotate-12"><Wallet size={120}/></div>
                <h2 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-6 relative z-10 flex items-center gap-2">
                  <TrendingUp size={14} className="text-green-400"/> Resumen Financiero
                </h2>
                
                <div className="space-y-4 relative z-10">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-1">Ingresos Hoy</p>
                      <p className="text-2xl font-black text-white flex items-center gap-1"><DollarSign size={20} className="text-green-400"/>{ingresosHoy.toFixed(2)}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-1">Esta Semana</p>
                      <p className="text-2xl font-black text-white flex items-center gap-1"><DollarSign size={20} className="text-green-400"/>{ingresosSemana.toFixed(2)}</p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-700/50">
                    <div>
                      <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-1">Mes ({hoy.toLocaleString('es-ES', { month: 'short' })})</p>
                      <p className="text-xl font-black text-gray-200 flex items-center gap-1"><DollarSign size={18} className="text-gray-400"/>{ingresosMes.toFixed(2)}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-1">Donaciones (Mes)</p>
                      <p className="text-xl font-black text-purple-300 flex items-center gap-1"><HeartHandshake size={18} className="text-purple-400"/>{donacionesMes.toFixed(2)}</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-[2rem] p-6 shadow-sm border border-gray-100">
                <h2 className="text-[10px] font-black text-red-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                  <AlertTriangle size={14}/> Cuentas por Cobrar ({deudores.length})
                </h2>
                
                {deudores.length > 0 ? (
                  <div className="space-y-3">
                    {deudores.map((d, i) => (
                      <button key={i} onClick={() => abrirExpediente(d.nombre_completo, d.telefono)} className="w-full text-left bg-red-50/50 p-3 rounded-xl border border-red-100 hover:bg-red-50 transition-all flex items-center justify-between group active:scale-[0.98]">
                        <div className="overflow-hidden">
                          <p className="font-bold text-xs text-gray-800 truncate">{d.nombre_completo}</p>
                          <p className="text-[10px] text-gray-500 mt-0.5 truncate">Tel: {d.telefono || 'N/A'}</p>
                        </div>
                        <span className="font-black text-red-600 text-sm bg-white px-2 py-1 rounded-md shadow-sm border border-red-100">${d.saldo_pendiente}</span>
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-6 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                    <CheckCircle2 size={24} className="mx-auto text-green-400 mb-2" />
                    <p className="text-xs font-bold text-gray-500">Cartera sana</p>
                    <p className="text-[10px] text-gray-400 mt-1">Nadie tiene deudas pendientes.</p>
                  </div>
                )}
              </div>

            </div>

          </div>
        )}
      </main>
    </div>
  );
}