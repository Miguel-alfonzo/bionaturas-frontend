"use client";
import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { 
  ChevronLeft, ClipboardList, Activity, Sparkles, 
  Save, User, MapPin, Calendar, Clock, 
  Upload, Loader2, Info, History, ChevronDown, ChevronUp, Stethoscope, Zap, Scale, DollarSign, HeartHandshake, AlertTriangle
} from 'lucide-react';

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

  // ESTADOS DE LA SESIÓN ACTUAL
  const [peso, setPeso] = useState('');
  const [mediciones, setMediciones] = useState('');
  const [protocolo, setProtocolo] = useState('');
  const [observaciones, setObservaciones] = useState('');
  const [historialAbierto, setHistorialAbierto] = useState<number | null>(null);

  // ESTADOS FINANCIEROS
  const [tipoPago, setTipoPago] = useState('Completo'); 
  const [costoTotal, setCostoTotal] = useState('');
  const [montoPagado, setMontoPagado] = useState('');

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
        setObservaciones(data.observaciones || '');
        
        const respaldo = localStorage.getItem(`respaldo_${nombre}`);
        if (respaldo) {
          const { pe, m, p, o } = JSON.parse(respaldo);
          if (!data.peso_aproximado && pe) setPeso(pe);
          if (!data.mediciones && m) setMediciones(m);
          if (!data.protocolo && p) setProtocolo(p);
          if (!data.observaciones && o) setObservaciones(o);
        }
      }
      setCargando(false);
    };
    fetchPaciente();
  }, [nombre]);

  useEffect(() => {
    if (nombre && (peso || mediciones || protocolo || observaciones)) {
      const datos = { pe: peso, m: mediciones, p: protocolo, o: observaciones };
      localStorage.setItem(`respaldo_${nombre}`, JSON.stringify(datos));
    }
  }, [peso, mediciones, protocolo, observaciones, nombre]);

  const aplicarCapitalizacion = (texto: string, setter: any) => {
    const corregido = texto.replace(/(^\s*|[.!?]\s+)([a-z])/g, (m, separador, letra) => separador + letra.toUpperCase());
    setter(corregido);
  };

  const archivarVisita = async (tipo: 'Consulta' | 'Terapia') => {
    if (!mediciones && !protocolo && !observaciones && !peso) {
      alert("No hay información nueva para archivar.");
      return;
    }

    setGuardando(true);
    setAccionActiva(tipo);

    // LÓGICA FINANCIERA ACTUALIZADA
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
      // costoReal se mantiene intacto para saber cuánto donaste
    }

    const saldoPendienteActualizado = (parseFloat(paciente.saldo_pendiente) || 0) + deudaGenerada;

    const nuevaEntrada = {
      fecha: new Date().toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }),
      tipo,
      peso,
      mediciones,
      protocolo,
      observaciones,
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
          mediciones: '',
          protocolo: '',
          observaciones: '',
          ultima_consulta: new Date().toISOString()
        })
        .eq('nombre_completo', nombre);

      if (error) throw error;
      
      setPaciente({ ...paciente, historial_consultas: nuevoHistorial, peso_aproximado: peso, saldo_pendiente: saldoPendienteActualizado });
      setMediciones('');
      setProtocolo('');
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
        .update({ peso_aproximado: peso, mediciones, protocolo, observaciones })
        .eq('nombre_completo', nombre);
      if (error) throw error;
    } catch (err) {
      console.error(err);
    } finally {
      setGuardando(false);
      setAccionActiva('');
    }
  };

  if (cargando) return <div className="min-h-screen flex items-center justify-center text-[#0B5D34] font-bold animate-pulse">Abriendo expediente...</div>;

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

      <main className="max-w-5xl mx-auto p-4 md:p-8">
        
        {tabActiva === 'ficha' && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <div className="bg-white rounded-[2.5rem] p-6 shadow-sm border border-gray-100">
              <h3 className="font-bold text-gray-800 flex items-center gap-2 mb-6 border-b pb-4"><Info size={18} className="text-[#0B5D34]"/> Datos Base y Antecedentes</h3>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div><p className="text-[10px] font-black text-gray-400 uppercase">Edad y Origen</p><p className="font-bold text-gray-700">{paciente.edad || '--'} años • {paciente.lugar_nacimiento || 'No registrado'}</p></div>
                  <div><p className="text-[10px] font-black text-gray-400 uppercase">Hora de nacimiento</p><p className="font-bold text-gray-700">{paciente.hora_nacimiento || 'No sabe'}</p></div>
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
            <div className="bg-gray-100/50 border-2 border-dashed border-gray-200 rounded-[2.5rem] p-10 text-center">
              <Upload size={32} className="mx-auto text-gray-400 mb-2" />
              <p className="text-sm font-bold text-gray-500">Subir exámenes o fotos (Fase 3)</p>
            </div>
          </div>
        )}

        {tabActiva === 'evolucion' && (
          <div className="space-y-6 animate-in fade-in duration-500">
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

        {tabActiva === 'consulta' && (
          <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
            
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

            <div className="bg-[#0B5D34] rounded-[2.5rem] p-6 shadow-xl shadow-[#0B5D34]/20">
              <h3 className="font-bold text-white flex items-center gap-2 mb-4"><ClipboardList size={18}/> Protocolo y Receta</h3>
              <textarea value={protocolo} spellCheck="true" onChange={(e) => setProtocolo(e.target.value)} onBlur={(e) => aplicarCapitalizacion(e.target.value, setProtocolo)} placeholder="Suplementos, dosis y terapias..." className="w-full bg-white/10 border border-white/20 rounded-2xl p-5 text-white placeholder-green-100/50 outline-none focus:bg-white/20 min-h-[200px] transition-all"/>
            </div>

            <div className="bg-white rounded-[2.5rem] p-6 shadow-sm border border-gray-100">
              <h3 className="font-bold text-gray-800 flex items-center gap-2 mb-4 text-sm opacity-60">Notas Privadas</h3>
              <textarea value={observaciones} spellCheck="true" onChange={(e) => setObservaciones(e.target.value)} onBlur={(e) => aplicarCapitalizacion(e.target.value, setObservaciones)} placeholder="Solo tú verás esto..." className="w-full bg-gray-50 border-0 rounded-2xl p-5 text-gray-700 outline-none min-h-[100px] text-sm"/>
            </div>

            {/* SECCIÓN DE CIERRE FINANCIERO (ACTUALIZADA) */}
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

        {tabActiva === 'astro' && (
           <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
           <div className="bg-white rounded-[3rem] p-10 shadow-sm border border-gray-100 text-center min-h-[400px] flex flex-col items-center justify-center">
             <div className="w-64 h-64 border-4 border-dashed border-gray-100 rounded-full flex items-center justify-center relative">
               <Sparkles size={48} className="text-gray-100 animate-pulse" />
               <p className="absolute -bottom-10 text-xs font-black text-gray-300 uppercase tracking-[0.3em]">Preparando Motor Radix...</p>
             </div>
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