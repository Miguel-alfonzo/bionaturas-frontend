"use client";
import React, { useState } from 'react';
import { useRouter } from 'next/navigation'; // 1. IMPORTAMOS EL GPS
import { supabase } from '@/lib/supabase';

interface Consultante {
  id: any;
  nombre: string;
  parentesco: string;
  inicial: string;
}

export default function Perfiles() {
  const router = useRouter(); // 2. ACTIVAMOS EL GPS DENTRO DE LA PÁGINA
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [nombreInput, setNombreInput] = useState('');
  const [parentescoInput, setParentescoInput] = useState('');
  const [cargando, setCargando] = useState(false);

  const [listaPerfiles, setListaPerfiles] = useState<Consultante[]>([
    { id: 1, nombre: 'Andrés', parentesco: 'Titular', inicial: 'A' },
    { id: 2, nombre: 'Valeria', parentesco: 'Hija', inicial: 'V' }
  ]);

  const handleGuardarPerfil = async () => {
    if (!nombreInput.trim()) return;
    setCargando(true);

    const nombreCap = nombreInput.toLowerCase().split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
    const parentescoCap = parentescoInput.toLowerCase().split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');

    try {
      const { data, error } = await supabase
        .from('historias_clinicas')
        .insert([{ nombre_completo: nombreCap, relacion_parentesco: parentescoCap }])
        .select();

      if (error) throw error;

      const nuevo = {
        id: data[0].id,
        nombre: nombreCap,
        parentesco: parentescoCap,
        inicial: nombreCap.charAt(0).toUpperCase()
      };

      setListaPerfiles([...listaPerfiles, nuevo]);
      setIsModalOpen(false);
      setNombreInput('');
      setParentescoInput('');
    } catch (error: any) {
      alert("Error: " + error.message);
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F3F4F6] flex flex-col items-center p-6 md:p-8 font-sans">
      <div className="w-full max-w-2xl mx-auto flex flex-col items-center mt-8 md:mt-12">
        <div className="text-center mb-10">
          <h1 className="text-3xl font-bold text-[#1F2937] mb-2 tracking-tight text-balance">Bienvenido a tu Portal Familiar</h1>
          <p className="text-gray-500 text-lg font-medium">¿Quién va a recibir atención hoy?</p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6 w-full">
          
          {/* AQUÍ SE "DIBUJAN" LAS TARJETAS */}
          {listaPerfiles.map((perfil) => (
            <div 
              key={perfil.id} 
              // 3. AQUÍ ESTÁ EL "GATILLO" (ONCLICK): NOS LLEVA AL DASHBOARD
              onClick={() => router.push(`/dashboard?nombre=${perfil.nombre}`)}
              className="bg-white rounded-2xl shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300 p-6 flex flex-col items-center justify-center cursor-pointer group min-h-[180px]"
            >
              <div className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-[#D1FAE5] text-[#065F46] flex items-center justify-center text-2xl md:text-3xl font-bold mb-4 group-hover:scale-105 transition-transform">
                {perfil.inicial}
              </div>
              <h2 className="font-semibold text-gray-800 text-lg capitalize">{perfil.nombre}</h2>
              <p className="text-xs text-gray-400 mt-0.5 capitalize">{perfil.parentesco}</p>
            </div>
          ))}

          {/* Botón Añadir */}
          <div onClick={() => setIsModalOpen(true)} className="rounded-2xl border-2 border-dashed border-gray-300 p-6 flex flex-col items-center justify-center cursor-pointer hover:border-[#0B5D34] hover:bg-[#0B5D34]/5 transition-all min-h-[180px]">
             <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center mb-3 shadow-sm text-gray-400">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
             </div>
             <h2 className="font-medium text-gray-500">Añadir Familiar</h2>
          </div>
        </div>
      </div>

      {/* Modal (Se mantiene igual) */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl w-full max-w-md p-8 shadow-2xl animate-in zoom-in-95 duration-300">
            <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">Nuevo Familiar</h2>
            <div className="space-y-4">
              <input type="text" value={nombreInput} onChange={(e) => setNombreInput(e.target.value)} className="w-full bg-gray-50 border border-gray-200 rounded-xl p-4 outline-none focus:border-[#0B5D34] capitalize" placeholder="Nombre Completo" />
              <input type="text" value={parentescoInput} onChange={(e) => setParentescoInput(e.target.value)} className="w-full bg-gray-50 border border-gray-200 rounded-xl p-4 outline-none focus:border-[#0B5D34] capitalize" placeholder="Parentesco" />
            </div>
            <div className="flex gap-3 mt-8">
              <button onClick={() => setIsModalOpen(false)} className="flex-1 py-4 text-gray-500 font-semibold hover:bg-gray-100 rounded-xl transition-colors">Cancelar</button>
              <button onClick={handleGuardarPerfil} disabled={cargando} className="flex-1 py-4 bg-[#0B5D34] text-white font-bold rounded-xl hover:bg-[#084b29] shadow-lg disabled:opacity-50">
                {cargando ? 'Guardando...' : 'Guardar Perfil'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}