"use client";
import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { ChevronLeft, ArrowRight, Heart, Sparkles, Loader2, Info, CheckCircle2, ClipboardList, AlertCircle, MessageCircle } from 'lucide-react';

// FUNCIONES DE CAPITALIZACIÓN INTELIGENTE
const capitalizeWords = (str: string) => str.replace(/\b\w/g, c => c.toUpperCase());
const capitalizeFirst = (str: string) => str ? str.charAt(0).toUpperCase() + str.slice(1) : '';

function FichaContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nombre = searchParams.get('nombre') || 'Consultante';
  const primerNombre = nombre.split(' ')[0];

  const [cargando, setCargando] = useState(false);
  const [guardadoExitox, setGuardadoExitoso] = useState(false);
  const [errores, setErrores] = useState<string[]>([]);

  const [fechaNacimiento, setFechaNacimiento] = useState('');
  const [edadCalculada, setEdadCalculada] = useState('');
  
  const [pais, setPais] = useState('');
  const [ciudad, setCiudad] = useState('');
  const [hora, setHora] = useState('12');
  const [minutos, setMinutos] = useState('00');
  const [ampm, setAmpm] = useState('AM');
  const [noSabeHora, setNoSabeHora] = useState(false);

  const [cedula, setCedula] = useState('');
  const [sexo, setSexo] = useState('');
  const [ocupacion, setOcupacion] = useState('');
  const [direccion, setDireccion] = useState('');

  const [enfermedades, setEnfermedades] = useState('');
  const [cirugias, setCirugias] = useState('');
  const [alergias, setAlergias] = useState('');
  const [medicamentos, setMedicamentos] = useState('');
  const [familiares, setFamiliares] = useState('');

  useEffect(() => {
    if (fechaNacimiento) {
      const hoy = new Date();
      const cumpleanos = new Date(fechaNacimiento);
      let edad = hoy.getFullYear() - cumpleanos.getFullYear();
      const m = hoy.getMonth() - cumpleanos.getMonth();
      if (m < 0 || (m === 0 && hoy.getDate() < cumpleanos.getDate())) {
        edad--;
      }
      setEdadCalculada(edad.toString());
    } else {
      setEdadCalculada('');
    }
  }, [fechaNacimiento]);

  const getInputClass = (id: string) => {
    const base = "w-full rounded-2xl p-4 outline-none font-medium transition-all border-2 ";
    if (errores.includes(id)) {
      return base + "border-red-400 bg-red-50 focus:ring-4 focus:ring-red-100 text-red-900 placeholder-red-300";
    }
    return base + "bg-gray-50 border-gray-100 focus:border-[#0B5D34] focus:ring-4 focus:ring-[#0B5D34]/10 text-gray-800";
  };

  const getLabelClass = (id: string) => {
    const base = "text-xs font-black uppercase ml-2 mb-2 block tracking-wider ";
    return base + (errores.includes(id) ? "text-red-500" : "text-gray-600");
  };

  const validarYEnviar = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const nuevosErrores: string[] = [];
    if (!sexo) nuevosErrores.push('sexo');
    if (!fechaNacimiento) nuevosErrores.push('fechaNacimiento');
    if (!pais.trim()) nuevosErrores.push('pais');
    if (!ciudad.trim()) nuevosErrores.push('ciudad');
    if (!ocupacion.trim()) nuevosErrores.push('ocupacion');
    if (!direccion.trim()) nuevosErrores.push('direccion');
    if (!enfermedades.trim()) nuevosErrores.push('enfermedades');
    if (!cirugias.trim()) nuevosErrores.push('cirugias');
    if (!alergias.trim()) nuevosErrores.push('alergias');
    if (!medicamentos.trim()) nuevosErrores.push('medicamentos');
    if (!familiares.trim()) nuevosErrores.push('familiares');

    if (nuevosErrores.length > 0) {
      setErrores(nuevosErrores);
      const primerErrorEl = document.getElementById(nuevosErrores[0]);
      if (primerErrorEl) {
        primerErrorEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
        primerErrorEl.focus();
      }
      return; 
    }

    setErrores([]);
    setCargando(true);

    const lugarNacimientoFinal = `${ciudad}, ${pais}`;
    const horaNacimientoFinal = noSabeHora ? 'Desconocida' : `${hora}:${minutos} ${ampm}`;

    try {
      const { error } = await supabase
        .from('historias_clinicas')
        .update({
          fecha_nacimiento: fechaNacimiento,
          hora_nacimiento: horaNacimientoFinal,
          lugar_nacimiento: lugarNacimientoFinal,
          cedula_identidad: cedula,
          sexo: sexo,
          edad: edadCalculada,
          ocupacion_profesion: ocupacion,
          direccion_corta: direccion,
          antecedentes_enfermedades: enfermedades,
          cirugias_realizadas: cirugias,
          alergias: alergias,
          medicamentos_actuales: medicamentos,
          antecedentes_familiares: familiares
        })
        .eq('nombre_completo', nombre);

      if (error) throw error;
      
      // ELIMINADO EL SETTIMEOUT: La pantalla se queda estática
      setGuardadoExitoso(true);

    } catch (err) {
      console.error(err);
      alert('Hubo un error al guardar tu ficha. Por favor, intenta de nuevo.');
      setCargando(false);
    }
  };

  // PANTALLA FINAL ESTÁTICA PREMIUM
  if (guardadoExitox) {
    return (
      <div className="min-h-screen bg-[#0B5D34] flex flex-col items-center justify-center p-6 font-sans text-white animate-in zoom-in-95 duration-700">
        <div className="relative mb-6">
          <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center shadow-2xl overflow-hidden border-4 border-white/20">
            <img src="/valentina.jpg" alt="Valentina" className="w-full h-full object-cover" />
          </div>
          <div className="absolute bottom-0 right-0 bg-[#22C55E] w-6 h-6 rounded-full border-4 border-[#0B5D34]"></div>
        </div>

        <div className="bg-white text-[#1F2937] p-8 rounded-[2rem] rounded-tl-sm shadow-2xl max-w-sm w-full relative text-center">
          <CheckCircle2 size={60} className="mx-auto mb-4 text-[#22C55E] drop-shadow-sm" />
          <h1 className="text-2xl font-bold mb-4 text-gray-800">¡Expediente completado!</h1>
          <p className="text-sm font-medium text-gray-600 mb-8 leading-relaxed">
            Gracias por tu confianza, <span className="text-[#0B5D34] font-bold">{primerNombre}</span>. 
            El especialista Miguel Espinoza ya tiene tu información para preparar tu evaluación integral.
          </p>
          
          <button 
            onClick={() => window.location.href = 'https://wa.me/584220245420'} // PON TU NÚMERO DE WHATSAPP AQUÍ
            className="w-full py-4 bg-[#25D366] text-white font-bold rounded-2xl shadow-lg shadow-[#25D366]/30 hover:-translate-y-1 active:scale-95 transition-all flex items-center justify-center gap-2"
          >
            <MessageCircle size={20} /> Volver al chat
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F3F4F6] pb-32 font-sans relative">
      
      <div className="bg-[#0B5D34] pt-12 pb-8 px-6 rounded-b-[3rem] shadow-lg sticky top-0 z-40">
        <div className="max-w-xl mx-auto flex gap-4 items-center">
          <button onClick={() => router.back()} className="text-white hover:bg-white/20 p-2 rounded-xl active:scale-95 transition-all">
            <ChevronLeft size={28} />
          </button>
          <div className="w-16 h-16 rounded-full overflow-hidden shrink-0 border-2 border-white/30 shadow-md">
            <img src="/valentina.jpg" alt="Valentina" className="w-full h-full object-cover" />
          </div>
          <div>
            <h1 className="text-white font-bold text-lg leading-tight">¡Hola de nuevo, {primerNombre}!</h1>
            <p className="text-green-100 text-xs mt-1 leading-relaxed font-medium">
              Ayúdame a completar tus datos clínicos. Prometo que será muy rápido y nos ayudará a darte la mejor atención.
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={validarYEnviar} className="max-w-xl mx-auto px-4 mt-8 space-y-6">
        
        {errores.length > 0 && (
          <div className="bg-red-50 border-2 border-red-200 text-red-700 p-4 rounded-2xl flex items-start gap-3 animate-in fade-in">
            <AlertCircle className="shrink-0 mt-0.5" size={20} />
            <p className="text-sm font-bold">Por favor, completa los campos marcados en rojo para poder continuar.</p>
          </div>
        )}

        <div className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-gray-100 animate-in slide-in-from-bottom-4">
          <h2 className="text-[#1F2937] font-bold flex items-center gap-2 mb-6 border-b border-gray-50 pb-4">
            <Sparkles size={20} className="text-[#0B5D34]" /> Datos de Origen
          </h2>

          <div className="space-y-6">
            <div id="sexo" className="scroll-mt-32">
              <label className={getLabelClass('sexo')}>Género biológico</label>
              <div className="flex gap-3">
                <button type="button" onClick={() => {setSexo('Femenino'); setErrores(e => e.filter(x => x !== 'sexo'))}} className={`flex-1 py-4 rounded-2xl border-2 font-bold transition-all active:scale-95 ${sexo === 'Femenino' ? 'border-[#0B5D34] bg-[#0B5D34]/5 text-[#0B5D34] shadow-sm' : errores.includes('sexo') ? 'border-red-300 bg-red-50 text-red-700' : 'border-gray-100 bg-white text-gray-500 hover:bg-gray-50'}`}>Femenino</button>
                <button type="button" onClick={() => {setSexo('Masculino'); setErrores(e => e.filter(x => x !== 'sexo'))}} className={`flex-1 py-4 rounded-2xl border-2 font-bold transition-all active:scale-95 ${sexo === 'Masculino' ? 'border-[#0B5D34] bg-[#0B5D34]/5 text-[#0B5D34] shadow-sm' : errores.includes('sexo') ? 'border-red-300 bg-red-50 text-red-700' : 'border-gray-100 bg-white text-gray-500 hover:bg-gray-50'}`}>Masculino</button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div id="fechaNacimiento" className="scroll-mt-32">
                <label className={getLabelClass('fechaNacimiento')}>Fecha nacimiento</label>
                <input type="date" value={fechaNacimiento} onChange={(e) => {setFechaNacimiento(e.target.value); setErrores(err => err.filter(x => x !== 'fechaNacimiento'))}} className={getInputClass('fechaNacimiento')} />
              </div>
              <div>
                <label className="text-xs font-black text-gray-600 uppercase ml-2 mb-2 block tracking-wider">Edad calculada</label>
                <div className="w-full bg-gray-50 border-2 border-gray-100 rounded-2xl p-4 text-gray-500 font-bold flex items-center h-[58px]">
                  {edadCalculada ? <span className="text-[#0B5D34] text-lg">{edadCalculada} años</span> : '--'}
                </div>
              </div>
            </div>

            <div>
              <label className="text-xs font-black text-gray-600 uppercase ml-2 mb-2 flex justify-between items-center tracking-wider">
                <span>Hora de nacimiento</span>
                <div className="flex items-center gap-1 text-blue-600 bg-blue-50 px-2 py-1 rounded-full">
                  <Info size={14} /> <span className="text-[10px] normal-case font-bold">Dato cosmobiológico</span>
                </div>
              </label>
              
              {!noSabeHora && (
                <div className="flex gap-2 mb-3">
                  <select value={hora} onChange={(e) => setHora(e.target.value)} className="flex-1 bg-gray-50 border-2 border-gray-100 rounded-2xl p-4 outline-none text-gray-800 text-center font-bold appearance-none focus:border-[#0B5D34] transition-all">
                    {Array.from({length: 12}, (_, i) => i + 1).map(h => <option key={h} value={h}>{h.toString().padStart(2, '0')}</option>)}
                  </select>
                  <span className="flex items-center text-gray-400 font-bold text-xl">:</span>
                  <select value={minutos} onChange={(e) => setMinutos(e.target.value)} className="flex-1 bg-gray-50 border-2 border-gray-100 rounded-2xl p-4 outline-none text-gray-800 text-center font-bold appearance-none focus:border-[#0B5D34] transition-all">
                    {['00','15','30','45'].map(m => <option key={m} value={m}>{m}</option>)}
                  </select>
                  <div className="flex bg-gray-50 border-2 border-gray-100 rounded-2xl overflow-hidden p-1">
                    <button type="button" onClick={() => setAmpm('AM')} className={`px-4 rounded-xl font-bold text-sm transition-all ${ampm === 'AM' ? 'bg-[#0B5D34] text-white shadow-md' : 'text-gray-500 hover:bg-gray-200/50'}`}>AM</button>
                    <button type="button" onClick={() => setAmpm('PM')} className={`px-4 rounded-xl font-bold text-sm transition-all ${ampm === 'PM' ? 'bg-[#0B5D34] text-white shadow-md' : 'text-gray-500 hover:bg-gray-200/50'}`}>PM</button>
                  </div>
                </div>
              )}

              <label className="flex items-center gap-3 mt-3 ml-2 cursor-pointer w-max">
                <input type="checkbox" checked={noSabeHora} onChange={(e) => setNoSabeHora(e.target.checked)} className="w-5 h-5 accent-[#0B5D34] rounded border-gray-300" />
                <span className="text-sm text-gray-600 font-bold">No conozco mi hora exacta</span>
              </label>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div id="pais" className="scroll-mt-32">
                <label className={getLabelClass('pais')}>País Natal</label>
                {/* APLICANDO CAPITALIZACIÓN INTELIGENTE A CADA PALABRA */}
                <input type="text" value={pais} onChange={(e) => {setPais(capitalizeWords(e.target.value)); setErrores(err => err.filter(x => x !== 'pais'))}} placeholder="Ej: Venezuela" className={getInputClass('pais')} />
              </div>
              <div id="ciudad" className="scroll-mt-32">
                <label className={getLabelClass('ciudad')}>Ciudad Natal</label>
                {/* APLICANDO CAPITALIZACIÓN INTELIGENTE A CADA PALABRA */}
                <input type="text" value={ciudad} onChange={(e) => {setCiudad(capitalizeWords(e.target.value)); setErrores(err => err.filter(x => x !== 'ciudad'))}} placeholder="Ej: Calabozo" className={getInputClass('ciudad')} />
              </div>
            </div>

            <div>
              <label className="text-xs font-black text-gray-600 uppercase ml-2 mb-2 block tracking-wider">Cédula o Pasaporte (Opcional)</label>
              <input type="text" value={cedula} onChange={(e) => setCedula(e.target.value.toUpperCase())} placeholder="Ej: V-12345678" className="w-full bg-gray-50 border-2 border-gray-100 rounded-2xl p-4 outline-none focus:border-[#0B5D34] text-gray-800 font-medium transition-all" />
            </div>

          </div>
        </div>

        {/* SECCIÓN 2: ESTILO DE VIDA */}
        <div className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-gray-100 animate-in slide-in-from-bottom-4" style={{animationDelay: '100ms'}}>
          <h2 className="text-[#1F2937] font-bold flex items-center gap-2 mb-6 border-b border-gray-50 pb-4">
            <Heart size={20} className="text-[#0B5D34]" /> Estilo de vida
          </h2>
          <div className="space-y-6">
            <div id="ocupacion" className="scroll-mt-32">
              <label className={getLabelClass('ocupacion')}>Ocupación / Profesión</label>
              {/* APLICANDO CAPITALIZACIÓN A LA PRIMERA LETRA */}
              <input type="text" value={ocupacion} onChange={(e) => {setOcupacion(capitalizeFirst(e.target.value)); setErrores(err => err.filter(x => x !== 'ocupacion'))}} placeholder="¿A qué te dedicas en tu día a día?" className={getInputClass('ocupacion')} />
            </div>
            <div id="direccion" className="scroll-mt-32">
              <label className={getLabelClass('direccion')}>Dirección Corta</label>
              <input type="text" value={direccion} onChange={(e) => {setDireccion(capitalizeFirst(e.target.value)); setErrores(err => err.filter(x => x !== 'direccion'))}} placeholder="Ciudad o Zona donde resides hoy" className={getInputClass('direccion')} />
            </div>
          </div>
        </div>

        {/* SECCIÓN 3: HISTORIAL MÉDICO */}
        <div className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-gray-100 animate-in slide-in-from-bottom-4" style={{animationDelay: '200ms'}}>
          <h2 className="text-[#1F2937] font-bold flex items-center gap-2 mb-2">
            <ClipboardList size={20} className="text-[#0B5D34]" /> Historial Médico
          </h2>
          <p className="text-sm text-[#0B5D34] mb-6 font-bold ml-1 bg-green-50 p-3 rounded-xl">Por favor completa todos los campos. Si no aplica, escribe "Ninguna" o "No".</p>
          
          <div className="space-y-6">
            <div id="enfermedades" className="scroll-mt-32">
              <label className={getLabelClass('enfermedades')}>Enfermedades Previas</label>
              <textarea rows={2} value={enfermedades} onChange={(e) => {setEnfermedades(capitalizeFirst(e.target.value)); setErrores(err => err.filter(x => x !== 'enfermedades'))}} placeholder="Ej: Hipertensión, Asma, Diabetes. (O escribe 'Ninguna')" className={`${getInputClass('enfermedades')} resize-none`} />
            </div>
            <div id="cirugias" className="scroll-mt-32">
              <label className={getLabelClass('cirugias')}>Cirugías Realizadas</label>
              <textarea rows={2} value={cirugias} onChange={(e) => {setCirugias(capitalizeFirst(e.target.value)); setErrores(err => err.filter(x => x !== 'cirugias'))}} placeholder="Ej: Apendicitis en 2015. (O escribe 'Ninguna')" className={`${getInputClass('cirugias')} resize-none`} />
            </div>
            <div id="alergias" className="scroll-mt-32">
              <label className={getLabelClass('alergias')}>Alergias</label>
              <input type="text" value={alergias} onChange={(e) => {setAlergias(capitalizeFirst(e.target.value)); setErrores(err => err.filter(x => x !== 'alergias'))}} placeholder="Ej: Penicilina, Mariscos, Polvo. (O escribe 'Ninguna')" className={getInputClass('alergias')} />
            </div>
            <div id="medicamentos" className="scroll-mt-32">
              <label className={getLabelClass('medicamentos')}>Medicamentos Actuales</label>
              <textarea rows={2} value={medicamentos} onChange={(e) => {setMedicamentos(capitalizeFirst(e.target.value)); setErrores(err => err.filter(x => x !== 'medicamentos'))}} placeholder="¿Tomas alguna pastilla regularmente? (O escribe 'Ninguno')" className={`${getInputClass('medicamentos')} resize-none`} />
            </div>
            <div id="familiares" className="scroll-mt-32">
              <label className={getLabelClass('familiares')}>Antecedentes Familiares</label>
              <textarea rows={2} value={familiares} onChange={(e) => {setFamiliares(capitalizeFirst(e.target.value)); setErrores(err => err.filter(x => x !== 'familiares'))}} placeholder="Ej: Madre con tiroides, Padre diabético. (O escribe 'Ninguno')" className={`${getInputClass('familiares')} resize-none`} />
            </div>
          </div>
        </div>

        {/* BOTÓN FINAL ACTIVO */}
        <div className="pt-4 pb-8 w-full">
          <button 
            type="submit"
            disabled={cargando}
            className="w-full py-5 bg-[#0B5D34] text-white font-black rounded-3xl shadow-2xl shadow-[#0B5D34]/40 hover:-translate-y-1 active:scale-95 transition-all flex items-center justify-center gap-3 text-lg uppercase tracking-widest disabled:opacity-50"
          >
            {cargando ? <Loader2 className="animate-spin" size={24} /> : 'GUARDAR MI FICHA'}
            {!cargando && <ArrowRight size={22} />}
          </button>
        </div>

      </form>
    </div>
  );
}

export default function FichaSeguimiento() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center text-[#0B5D34]">Preparando ficha...</div>}>
      <FichaContent />
    </Suspense>
  );
}