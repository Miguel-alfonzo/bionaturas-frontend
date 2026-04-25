import React from 'react';
import Image from 'next/image';

export default function Home() {
  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-md bg-[#FFFFFF] shadow-[0_10px_25px_-5px_rgba(11,93,52,0.05)] rounded-xl p-8 border border-gray-100 flex flex-col items-center">
        
        <div className="mb-10 text-center flex flex-col items-center">
          <Image 
            src="/logo-bionaturas.svg" 
            alt="Bionatura's Medicina Natural" 
            width={180} 
            height={60} 
            className="mb-6"
            priority 
          />
          
          <h1 className="text-2xl font-bold text-[#1F2937] tracking-tight mb-1">
            Portal Familiar
          </h1>
          <p className="text-sm font-medium text-gray-600 uppercase tracking-[0.1em]">
            Salud natural a tu alcance
          </p>
        </div>

        <div className="w-full mb-6">
          <label htmlFor="whatsapp-input" className="block text-[11px] font-bold text-gray-400 mb-2 uppercase tracking-widest text-center">
            Ingresa tu WhatsApp Registrado
          </label>
          <input
            type="text"
            id="whatsapp-input"
            className="w-full bg-[#F9FAFB] border border-gray-200 rounded-lg p-3 outline-none focus:ring-2 focus:ring-[#0B5D34]/20 focus:border-[#0B5D34] transition-all text-lg text-center text-gray-700"
            placeholder="Ej. +58 414 0000000"
          />
        </div>

        <div className="w-full flex flex-col space-y-4 mb-8">
          <button className="w-full bg-[#0B5D34] text-white font-semibold py-3.5 rounded-lg hover:bg-[#084b29] transition-all shadow-lg shadow-[#0B5D34]/20 text-lg">
            Solicitar Acceso
          </button>
          
          <div className="text-center">
            <button className="text-[#0B5D34] hover:underline text-sm font-medium transition-all">
              ¿Necesitas ayuda para ingresar?
            </button>
          </div>
        </div>

        <div className="w-full mt-auto pt-6 border-t border-gray-100 text-center text-xs text-gray-400 flex flex-col items-center gap-1">
          <div className="flex items-center gap-1.5 text-gray-500 font-semibold mb-1">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-[#0B5D34]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
            <span>Tus datos personales y clínicos están protegidos</span>
          </div>
          <p>Bionatura's Medicina Natural | RIF: J-1175529531</p>
        </div>

      </div>
    </div>
  );
}