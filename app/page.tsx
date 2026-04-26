"use client";
import React, { useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';

export default function Home() {
  const router = useRouter();
  
  const [telefono, setTelefono] = useState('');
  const [error, setError] = useState('');

  const handleIngresar = () => {
    // EL GUARDIA DE SEGURIDAD (Regex)
    const formatoValido = /^[+\d\s]{10,15}$/;

    if (!telefono.trim()) {
      setError('Por favor, ingresa tu número de teléfono.');
      return;
    }

    if (!formatoValido.test(telefono.trim())) {
      setError('Formato inválido. Usa solo números (Ej: +584141234567)');
      return;
    }

    // AHORA SÍ: Pasamos el teléfono de forma segura a la URL
    router.push(`/perfiles?telefono=${encodeURIComponent(telefono.trim())}`); 
  };

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-md bg-[#FFFFFF] shadow-[0_10px_25px_-5px_rgba(11,93,52,0.05)] rounded-xl p-8 border border-gray-100 flex flex-col items-center">
        
        <div className="mb-10 text-center flex flex-col items-center">
          <Image src="/logo-bionaturas.svg" alt="Bionatura's" width={180} height={60} className="mb-6" priority />
          <h1 className="text-2xl font-bold text-[#1F2937] tracking-tight mb-1">Portal Familiar</h1>
          <p className="text-sm font-medium text-gray-600 uppercase tracking-[0.1em]">Salud natural a tu alcance</p>
        </div>

        <div className="w-full mb-6">
          <label htmlFor="whatsapp-input" className="block text-[11px] font-bold text-gray-400 mb-2 uppercase tracking-widest text-center">
            Ingresa tu WhatsApp Registrado
          </label>
          <input
            type="tel"
            id="whatsapp-input"
            value={telefono}
            onChange={(e) => { setTelefono(e.target.value); setError(''); }}
            className={`w-full bg-[#F9FAFB] border ${error ? 'border-red-400 ring-2 ring-red-400/20' : 'border-gray-200 focus:ring-[#0B5D34]/20 focus:border-[#0B5D34]'} rounded-lg p-3 outline-none transition-all text-lg text-center text-gray-700`}
            placeholder="Ej. +58 414 0000000"
          />
          {error && <p className="text-red-500 text-xs font-bold text-center mt-2 animate-in slide-in-from-top-1">{error}</p>}
        </div>

        <div className="w-full flex flex-col space-y-4 mb-8">
          <button onClick={handleIngresar} className="w-full bg-[#0B5D34] text-white font-semibold py-3.5 rounded-lg hover:bg-[#084b29] transition-all shadow-lg shadow-[#0B5D34]/20 text-lg active:scale-[0.98]">
            Solicitar Acceso
          </button>
          
          <div className="text-center">
            <a 
              href="https://wa.me/584140000000?text=Hola%20Valentina,%20necesito%20ayuda%20para%20ingresar%20al%20portal%20de%20Bionaturas." 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-[#0B5D34] hover:underline text-sm font-medium transition-all"
            >
              ¿Necesitas ayuda para ingresar?
            </a>
          </div>
        </div>

        <div className="w-full mt-auto pt-6 border-t border-gray-100 text-center text-xs text-gray-400 flex flex-col items-center gap-1">
          <p>Bionatura's Medicina Natural | RIF: J-1175529531</p>
        </div>

      </div>
    </div>
  );
}