"use client";
import React from 'react';

const SIGNO_ICONS = ["♈", "♉", "♊", "♋", "♌", "♍", "♎", "♏", "♐", "♑", "♒", "♓"];
const PLANETA_ICONS: any = { Sol: "☉", Luna: "☽", Mercurio: "☿", Venus: "♀", Marte: "♂", Júpiter: "♃", Saturno: "♄", Urano: "♅", Neptuno: "♆", Plutón: "♇" };

export default function RadixChart({ data }: { data: any }) {
  if (!data) return null;

  const size = 500;
  const center = size / 2;
  const radius = size / 2 - 20;

  const getPos = (deg: number, r: number) => {
    const angle = (deg - 90) * (Math.PI / 180);
    return {
      x: center + r * Math.cos(angle),
      y: center + r * Math.sin(angle)
    };
  };

  return (
    <div className="flex flex-col items-center bg-white p-4 rounded-[2rem] shadow-inner">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="overflow-visible">
        {/* Anillo de Signos */}
        <circle cx={center} cy={center} r={radius} fill="none" stroke="#E2E8F0" strokeWidth="40" />
        {Array.from({ length: 12 }).map((_, i) => {
          const pos = getPos(i * 30 + 15, radius);
          return (
            <text key={i} x={pos.x} y={pos.y} textAnchor="middle" alignmentBaseline="middle" className="text-xl fill-gray-400 font-bold">
              {SIGNO_ICONS[i]}
            </text>
          );
        })}

        {/* Divisiones de Casas (Líneas definidas) */}
        {data.casas.map((deg: number, i: number) => {
          const p1 = getPos(deg, radius - 20);
          const p2 = getPos(deg, 100);
          return (
            <g key={i}>
              <line x1={p1.x} y1={p1.y} x2={p2.x} y2={p2.y} stroke="#CBD5E1" strokeWidth="1" strokeDasharray="4" />
              <text x={getPos(deg + 15, 120).x} y={getPos(deg + 15, 120).y} textAnchor="middle" className="text-[10px] fill-gray-300 font-black">{i + 1}</text>
            </g>
          );
        })}

        {/* Aspectos (Líneas de conexión) */}
        {data.aspectos.map((asp: any, i: number) => {
          const p1 = data.posiciones.find((p: any) => p.nombre === asp.p1);
          const p2 = data.posiciones.find((p: any) => p.nombre === asp.p2);
          const pos1 = getPos(p1.longitud, 180);
          const pos2 = getPos(p2.longitud, 180);
          return (
            <line key={i} x1={pos1.x} y1={pos1.y} x2={pos2.x} y2={pos2.y} stroke={asp.color} strokeWidth="1.5" opacity="0.6" />
          );
        })}

        {/* Planetas */}
        {data.posiciones.map((p: any, i: number) => {
          const pos = getPos(p.longitud, radius - 60);
          return (
            <g key={i}>
              <circle cx={pos.x} cy={pos.y} r="12" fill="white" stroke="#0B5D34" strokeWidth="1" />
              <text x={pos.x} y={pos.y} textAnchor="middle" alignmentBaseline="middle" className="text-base fill-[#0B5D34] font-bold">
                {PLANETA_ICONS[p.nombre]}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}