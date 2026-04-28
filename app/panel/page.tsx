"use client";
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { 
  Search, Calendar, TrendingUp, AlertTriangle, 
  HeartHandshake, DollarSign, Clock, Activity, Loader2, ChevronRight
} from 'lucide-react';

export default function Panel() {
  const router = useRouter();
  const [pacientesHoy, setPacientesHoy] = useState<any[]>([]);
  const [cuentasPorCobrar, setCuentasPorCobrar] = useState<any[]>([]);
  const [todosLosPacientes, setTodosLosPacientes] = useState<any[]>([]); // Para el buscador
  const [resultadosBusqueda, setResultadosBusqueda] = useState<any[]>([]); // Para el menú desplegable
  const [cargando, setCargando] = useState(true);
  const [busqueda, setBusqueda] = useState('');
  
  const [finanzas, setFinanzas] = useState({
    hoy: 0,
    semana: 0,
    mes: 0,
    ano: 0,
    donacionesMes: 0,
    donacionesAno: 0
  });

  const fechaHoyHeader = new Date().toLocaleDateString('es-VE', { 
    weekday: 'long', day: 'numeric', month: 'long' 
  });
  const fechaHeaderCapitalizada = fechaHoyHeader.charAt(0).toUpperCase() + fechaHoyHeader.slice(1);

  useEffect(() => {
    const cargarDatos = async () => {
      setCargando(true);
      const { data: pacientes } = await supabase.from('historias_clinicas').select('*');
      
      if (pacientes) {
        setTodosLosPacientes(pacientes); // Guardamos todos para buscar rápido

        const hoy = new Date();
        const dHoy = hoy.getDate();
        const mHoy = hoy.getMonth();
        const yHoy = hoy.getFullYear();

        const diaSemana = hoy.getDay() === 0 ? 6 : hoy.getDay() - 1;
        const inicioSemana = new Date(yHoy, mHoy, dHoy - diaSemana, 0, 0, 0);
        const finSemana = new Date(yHoy, mHoy, dHoy - diaSemana + 6, 23, 59, 59);

        let ingHoy = 0, ingSem = 0, ingMes = 0, ingAno = 0;
        let donMes = 0, donAno = 0;
        const agendaHoy: any[] = [];
        const deudores: any[] = [];

        pacientes.forEach(p => {
          if (p.saldo_pendiente > 0) deudores.push(p);

          const hoyStr = `${String(dHoy).padStart(2, '0')}/${String(mHoy + 1).padStart(2, '0')}/${yHoy}`;
          if (p.proxima_cita && p.proxima_cita.includes(hoyStr)) {
            const hora = p.proxima_cita.split(' a las ')[1] || 'Sin hora';
            agendaHoy.push({ ...p, hora_cita_corta: hora });
          }

          if (p.historial_consultas && Array.isArray(p.historial_consultas)) {
            p.historial_consultas.forEach((visita: any) => {
              if (!visita.fecha || !visita.finanzas) return;
              
              const match = visita.fecha.match(/(\d{1,2})[/-](\d{1,2})[/-](\d{4})/) || visita.fecha.match(/(\d{4})[/-](\d{1,2})[/-](\d{1,2})/);
              if (!match) return;

              let vD, vM, vY;
              if (match[3].length === 4) { 
                vD = parseInt(match[1]); vM = parseInt(match[2]) - 1; vY = parseInt(match[3]);
              } else { 
                vY = parseInt(match[1]); vM = parseInt(match[2]) - 1; vD = parseInt(match[3]);
              }

              const fechaV = new Date(vY, vM, vD);
              const monto = Number(visita.finanzas.pagado) || 0;
              const esDonacion = visita.finanzas.tipoPago === 'Donacion';
              const valorDonado = esDonacion ? (Number(visita.finanzas.costo) || 0) : 0;

              if (vD === dHoy && vM === mHoy && vY === yHoy) ingHoy += monto;
              if (fechaV >= inicioSemana && fechaV <= finSemana) ingSem += monto;
              if (vM === mHoy && vY === yHoy) { ingMes += monto; donMes += valorDonado; }
              if (vY === yHoy) { ingAno += monto; donAno += valorDonado; }
            });
          }
        });

        setPacientesHoy(agendaHoy);
        setCuentasPorCobrar(deudores);
        setFinanzas({ hoy: ingHoy, semana: ingSem, mes: ingMes, ano: ingAno, donacionesMes: donMes, donacionesAno: donAno });
      }
      setCargando(false);
    };
    cargarDatos();
  }, []);

  // LÓGICA DEL BUSCADOR EN VIVO
  const manejarBusqueda = (texto: string) => {
    setBusqueda(texto);
    if (texto.length > 1) {
      const filtrados = todosLosPacientes.filter(p => 
        p.nombre_completo?.toLowerCase().includes(texto.toLowerCase())
      );
      setResultadosBusqueda(filtrados);
    } else {
      setResultadosBusqueda([]);
    }
  };

  const irAConsulta = (nombre: string) => {
    setBusqueda('');
    setResultadosBusqueda([]);
    router.push(`/consulta?nombre=${encodeURIComponent(nombre)}`);
  };

  const meses = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];
  const mesAct = meses[new Date().getMonth()].toUpperCase();
  const anoAct = new Date().getFullYear();

  if (cargando) {
    return <div className="min-h-screen flex items-center justify-center bg-[#F1F5F9]"><Loader2 size={40} className="text-[#0B5D34] animate-spin" /></div>;
  }

  return (
    <div className="min-h-screen bg-[#F1F5F9] font-sans pb-20">
      <header className="bg-white border-b border-gray-200 px-6 py-4 sticky top-0 z-40 shadow-sm">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#0B5D34] rounded-xl flex items-center justify-center text-white shadow-sm"><Activity size={20} /></div>
            <div>
              <h1 className="font-black text-gray-800 text-lg leading-tight">Centro de Mando</h1>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Miguel Espinoza • Naturópata</p>
            </div>
          </div>
          <div className="text-[#0B5D34] font-bold text-[11px] bg-green-50 px-4 py-2 rounded-full border border-green-100 uppercase tracking-widest">
            {fechaHeaderCapitalizada}
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto p-4 md:p-6 mt-2 space-y-6">
        
        {/* BUSCADOR CON MENÚ DESPLEGABLE */}
        <div className="relative z-50">
          <div className="bg-white p-1 rounded-2xl shadow-sm border border-gray-200 flex items-center gap-3 focus-within:border-[#0B5D34] focus-within:ring-2 focus-within:ring-green-50 transition-all">
            <div className="pl-4 text-[#0B5D34]"><Search size={20} /></div>
            <input 
              type="text" 
              placeholder="Buscar paciente por nombre..." 
              className="w-full bg-transparent outline-none py-3 text-gray-700 font-medium placeholder-gray-400" 
              value={busqueda} 
              onChange={(e) => manejarBusqueda(e.target.value)} 
              onKeyDown={(e) => e.key === 'Enter' && busqueda && irAConsulta(busqueda)} 
            />
          </div>
          
          {/* Resultados en vivo */}
          {resultadosBusqueda.length > 0 && (
            <div className="absolute top-full left-0 w-full mt-2 bg-white rounded-2xl shadow-xl border border-gray-100 max-h-60 overflow-y-auto z-50 animate-in fade-in slide-in-from-top-2">
              {resultadosBusqueda.map((p, i) => (
                <button 
                  key={i} 
                  onClick={() => irAConsulta(p.nombre_completo)} 
                  className="w-full text-left px-6 py-4 border-b border-gray-50 hover:bg-green-50 flex items-center justify-between group transition-colors"
                >
                  <div>
                    <p className="font-bold text-gray-800 group-hover:text-[#0B5D34]">{p.nombre_completo}</p>
                    <p className="text-[10px] text-gray-400 font-bold uppercase mt-1">Tel: {p.telefono || 'Sin registro'}</p>
                  </div>
                  <ChevronRight size={16} className="text-gray-300 group-hover:text-[#0B5D34]" />
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* COLUMNA PACIENTES (Izquierda) */}
          <div className="lg:col-span-2 space-y-4">
            <h2 className="text-xs font-black text-[#0B5D34] uppercase tracking-widest flex items-center gap-2"><Calendar size={16} /> Pacientes de Hoy</h2>
            {pacientesHoy.length === 0 ? (
              <div className="bg-white rounded-3xl p-8 text-center border border-gray-100 border-dashed">
                <p className="text-gray-400 font-medium">No hay pacientes en agenda para el día de hoy.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {pacientesHoy.map((p, i) => (
                  <button key={i} onClick={() => irAConsulta(p.nombre_completo)} className="bg-white p-5 rounded-3xl shadow-sm border border-gray-100 hover:border-[#0B5D34]/50 hover:shadow-md transition-all text-left">
                    <div className="text-[10px] font-black text-[#0B5D34] bg-green-50 px-2 py-1 rounded-md inline-block mb-3"><Clock size={10} className="inline mr-1"/> {p.hora_cita_corta}</div>
                    <h3 className="font-bold text-gray-800 text-lg leading-tight mb-1">{p.nombre_completo}</h3>
                    <p className="text-xs text-gray-500 line-clamp-1"><Activity size={12} className="inline opacity-50 mr-1"/> {p.enfoque_actual || 'Evaluación General'}</p>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* COLUMNA FINANZAS (Derecha) */}
          <div className="space-y-6">
            
            {/* TARJETA FINANCIERA COMPACTA Y ELEGANTE */}
            <div className="bg-gradient-to-br from-[#0f172a] to-[#1e293b] rounded-3xl p-6 shadow-xl text-white relative overflow-hidden">
              <DollarSign size={100} className="absolute -right-6 -bottom-6 opacity-10 text-green-400" />
              <h2 className="text-[10px] font-black text-green-400 uppercase tracking-widest flex items-center gap-2 mb-6 opacity-90"><TrendingUp size={14} /> Reporte de Ingresos</h2>
              
              <div className="space-y-5 relative z-10">
                
                {/* Hoy y Semana */}
                <div className="grid grid-cols-2 gap-4 border-b border-white/10 pb-4">
                  <div>
                    <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-1">Hoy</p>
                    <p className="text-2xl font-black text-green-400">${finanzas.hoy.toFixed(2)}</p>
                  </div>
                  <div>
                    <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-1">Semana</p>
                    <p className="text-2xl font-black text-white">${finanzas.semana.toFixed(2)}</p>
                  </div>
                </div>

                {/* Mes y Año */}
                <div className="grid grid-cols-2 gap-4 border-b border-white/10 pb-4">
                  <div>
                    <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-1">Mes ({mesAct})</p>
                    <p className="text-lg font-bold text-white">${finanzas.mes.toFixed(2)}</p>
                  </div>
                  <div>
                    <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-1">Año ({anoAct})</p>
                    <p className="text-lg font-bold text-blue-300">${finanzas.ano.toFixed(2)}</p>
                  </div>
                </div>

                {/* Donaciones */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-[9px] font-bold text-purple-400/80 uppercase tracking-widest mb-1">Donado Mes</p>
                    <p className="text-sm font-bold text-purple-300 flex items-center gap-1"><HeartHandshake size={12}/> ${finanzas.donacionesMes.toFixed(2)}</p>
                  </div>
                  <div>
                    <p className="text-[9px] font-bold text-purple-400/80 uppercase tracking-widest mb-1">Donado Año</p>
                    <p className="text-sm font-bold text-purple-300 flex items-center gap-1"><HeartHandshake size={12}/> ${finanzas.donacionesAno.toFixed(2)}</p>
                  </div>
                </div>

              </div>
            </div>

            {/* CUENTAS POR COBRAR */}
            <div className="bg-red-50 p-5 rounded-3xl border border-red-100 shadow-sm">
              <h2 className="text-[10px] font-black text-red-600 uppercase tracking-widest flex items-center gap-2 mb-4"><AlertTriangle size={14} /> Por Cobrar ({cuentasPorCobrar.length})</h2>
              {cuentasPorCobrar.length === 0 ? (
                <p className="text-[11px] text-gray-500 font-bold uppercase tracking-wider">No hay deudas pendientes.</p>
              ) : (
                <div className="space-y-2 max-h-[250px] overflow-y-auto pr-1">
                  {cuentasPorCobrar.map((p, i) => (
                    <button key={i} onClick={() => irAConsulta(p.nombre_completo)} className="w-full flex justify-between items-center bg-white p-3 rounded-xl border border-red-100 shadow-sm hover:border-red-300 transition-colors text-left group">
                      <div className="truncate pr-2">
                        <p className="text-xs font-bold text-gray-800 group-hover:text-red-600 truncate">{p.nombre_completo}</p>
                      </div>
                      <span className="bg-red-100 text-red-700 text-[11px] font-black px-2 py-1 rounded-md shrink-0">${p.saldo_pendiente}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}