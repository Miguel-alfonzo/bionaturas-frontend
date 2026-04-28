"use client";
import React from 'react';

// Símbolos puros vectoriales
const SIGNOS = [
  { icon: "♈\uFE0E", color: "#EF4444" }, 
  { icon: "♉\uFE0E", color: "#22C55E" }, 
  { icon: "♊\uFE0E", color: "#EAB308" }, 
  { icon: "♋\uFE0E", color: "#3B82F6" }, 
  { icon: "♌\uFE0E", color: "#F97316" }, 
  { icon: "♍\uFE0E", color: "#84CC16" }, 
  { icon: "♎\uFE0E", color: "#06B6D4" }, 
  { icon: "♏\uFE0E", color: "#8B5CF6" }, 
  { icon: "♐\uFE0E", color: "#EF4444" }, 
  { icon: "♑\uFE0E", color: "#22C55E" }, 
  { icon: "♒\uFE0E", color: "#EAB308" }, 
  { icon: "♓\uFE0E", color: "#3B82F6" }  
];

const PLANETAS: any = {
  Sol: { icon: "☉\uFE0E", color: "#F59E0B" },
  Luna: { icon: "☽\uFE0E", color: "#475569" },
  Mercurio: { icon: "☿\uFE0E", color: "#059669" },
  Venus: { icon: "♀\uFE0E", color: "#E11D48" }, 
  Marte: { icon: "♂\uFE0E", color: "#991B1B" }, 
  Júpiter: { icon: "♃\uFE0E", color: "#6D28D9" },
  Saturno: { icon: "♄\uFE0E", color: "#1E293B" },
  Urano: { icon: "♅\uFE0E", color: "#0284C7" },
  Neptuno: { icon: "♆\uFE0E", color: "#2563EB" },
  Plutón: { icon: "♇\uFE0E", color: "#7F1D1D" }
};

export default function RadixChart({ data }: { data: any }) {
  if (!data || !data.posiciones || !data.casas || !data.ejes) return null;

  const size = 600;
  const center = size / 2;
  
  // ESTRUCTURA DE 3 ANILLOS PROFESIONAL
  const rZodiacOuter = 290; // Borde exterior absoluto
  const rZodiacInner = 245; // Borde inferior de los signos
  const rTicksInner = 235;  // Pista delgadita para los grados/decanatos
  const rInner = 140;       // Centro donde empiezan los aspectos

  const getPos = (deg: number, r: number) => {
    const offset = data.ejes.asc;
    const angle = (offset - deg + 180) * (Math.PI / 180); // Sentido Anti-Horario
    return { x: center + r * Math.cos(angle), y: center + r * Math.sin(angle) };
  };

  return (
    <div className="w-full max-w-[600px] aspect-square mx-auto">
      <svg viewBox={`0 0 ${size} ${size}`} className="w-full h-full drop-shadow-sm bg-white rounded-full" preserveAspectRatio="xMidYMid meet">
        
        {/* CIRCUNFERENCIAS SÓLIDAS */}
        <circle cx={center} cy={center} r={rZodiacOuter} fill="none" stroke="#1E293B" strokeWidth="2.5" />
        <circle cx={center} cy={center} r={rZodiacInner} fill="none" stroke="#1E293B" strokeWidth="2" />
        <circle cx={center} cy={center} r={rTicksInner} fill="none" stroke="#1E293B" strokeWidth="1.5" />
        <circle cx={center} cy={center} r={rInner} fill="none" stroke="#1E293B" strokeWidth="1.5" />
        
        {/* 1. CONSTELACIONES Y MARCAS DE GRADOS (DECANATOS) */}
        {Array.from({ length: 12 }).map((_, i) => {
          const startDeg = i * 30;
          return (
            <g key={`sign-${i}`}>
              {/* División de la constelación (Línea Fuerte creando la "Caja") */}
              <line 
                x1={getPos(startDeg, rZodiacOuter).x} y1={getPos(startDeg, rZodiacOuter).y} 
                x2={getPos(startDeg, rTicksInner).x} y2={getPos(startDeg, rTicksInner).y} 
                stroke="#1E293B" strokeWidth="2" 
              />
              
              {/* Símbolo de la constelación centrado en su anillo */}
              <text 
                x={getPos(startDeg + 15, rZodiacOuter - 22).x} 
                y={getPos(startDeg + 15, rZodiacOuter - 22).y} 
                textAnchor="middle" alignmentBaseline="middle" 
                className="text-[34px] font-sans font-bold"
                fill={SIGNOS[i].color}
              >
                {SIGNOS[i].icon}
              </text>
            </g>
          )
        })}

        {/* PISTA DE GRADOS EXACTOS (Rayitas cada 2 grados) */}
        {[...Array(180)].map((_, j) => {
          const deg = j * 2;
          const isDecan = deg % 10 === 0; // Decanatos cada 10 grados
          
          const startR = rZodiacInner;
          const endR = isDecan ? rTicksInner : rZodiacInner - 5; // Las líneas de 10° cruzan toda la pista
          const strokeColor = isDecan ? "#1E293B" : "#94A3B8";
          const strokeW = isDecan ? "2" : "1";

          return (
            <line 
              key={`tick-${deg}`} 
              x1={getPos(deg, startR).x} y1={getPos(deg, startR).y} 
              x2={getPos(deg, endR).x} y2={getPos(deg, endR).y} 
              stroke={strokeColor} strokeWidth={strokeW} 
            />
          );
        })}

        {/* 2. LÍNEAS DE LAS CASAS (Atraviesan desde el centro hasta el borde exterior) */}
        {data.casas.map((deg: number, i: number) => {
          const isEjeFuerte = i === 0 || i === 3 || i === 6 || i === 9;
          const strokeColor = isEjeFuerte ? "#B91C1C" : "#EF4444"; 
          const strokeWidth = isEjeFuerte ? "3" : "1.5"; 
          
          return (
            <g key={`house-${i}`}>
              <line 
                x1={getPos(deg, rInner).x} y1={getPos(deg, rInner).y} 
                x2={getPos(deg, rZodiacOuter).x} y2={getPos(deg, rZodiacOuter).y} 
                stroke={strokeColor} strokeWidth={strokeWidth} opacity="0.8" 
              />
              {/* Número de casa justo afuera del anillo central */}
              <text 
                x={getPos(deg + 10, rInner + 20).x} y={getPos(deg + 10, rInner + 20).y} 
                textAnchor="middle" alignmentBaseline="middle" 
                className={`text-[16px] font-black ${isEjeFuerte ? 'fill-red-800' : 'fill-red-500'}`}
              >
                {i + 1}
              </text>
            </g>
          )
        })}

        {/* 3. PLANETAS (Ubicados en la franja del medio) */}
        {data.posiciones.map((p: any, i: number) => {
          const pos = getPos(p.longitud, rInner + 50); 
          const planetaDef = PLANETAS[p.nombre] || { icon: p.nombre, color: "#333" };
          
          return (
            <g key={`planeta-${i}`}>
              {/* Línea punteada que conecta al planeta con su grado exacto en la pista */}
              <line 
                x1={getPos(p.longitud, rTicksInner).x} y1={getPos(p.longitud, rTicksInner).y} 
                x2={getPos(p.longitud, rInner + 68).x} y2={getPos(p.longitud, rInner + 68).y} 
                stroke={planetaDef.color} strokeWidth="1.5" opacity="0.4" strokeDasharray="2,2"
              />
              <text 
                x={pos.x} y={pos.y} 
                textAnchor="middle" alignmentBaseline="middle" 
                className="text-[38px] font-sans font-black" 
                fill={planetaDef.color}
                stroke={planetaDef.color} strokeWidth="0.5" 
                style={{ textShadow: '0px 0px 5px white, 0px 0px 5px white, 0px 0px 10px white' }}
              >
                {planetaDef.icon}
              </text>
            </g>
          )
        })}

        {/* 4. ASPECTOS Y SUS SÍMBOLOS EN EL CENTRO */}
        {data.aspectos?.map((asp: any, i: number) => {
          const p1 = data.posiciones.find((p: any) => p.nombre === asp.p1);
          const p2 = data.posiciones.find((p: any) => p.nombre === asp.p2);
          if (!p1 || !p2) return null;
          
          let color = "#94A3B8"; 
          let icon = "";
          
          if (asp.tipo === 'Conjunción') { color = "#10B981"; icon = "☌"; }
          else if (asp.tipo === 'Sextil') { color = "#3B82F6"; icon = "⚹"; }
          else if (asp.tipo === 'Cuadratura') { color = "#EF4444"; icon = "□"; }
          else if (asp.tipo === 'Trígono') { color = "#3B82F6"; icon = "△"; }
          else if (asp.tipo === 'Oposición') { color = "#EF4444"; icon = "☍"; }

          const pos1 = getPos(p1.longitud, rInner);
          const pos2 = getPos(p2.longitud, rInner);
          
          // Coordenadas para colocar el símbolo justo en la mitad de la línea
          const midX = (pos1.x + pos2.x) / 2;
          const midY = (pos1.y + pos2.y) / 2;

          return (
            <g key={`asp-${i}`}>
              <line 
                x1={pos1.x} y1={pos1.y} 
                x2={pos2.x} y2={pos2.y} 
                stroke={color} strokeWidth="1.5" opacity="0.6" 
              />
              {/* Fondo blanquito para que el símbolo se lea claro */}
              <rect x={midX - 7} y={midY - 7} width="14" height="14" fill="white" opacity="0.8" rx="3" />
              <text x={midX} y={midY} textAnchor="middle" alignmentBaseline="middle" className="text-[12px] font-bold" fill={color}>
                {icon}
              </text>
            </g>
          );
        })}
        
        {/* Centro Absoluto */}
        <circle cx={center} cy={center} r="4" fill="#1E293B" />
      </svg>
    </div>
  );
}