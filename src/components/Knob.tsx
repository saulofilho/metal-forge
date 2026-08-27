import React, { useState, useRef, useEffect } from "react";

interface KnobProps {
  id?: string;
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  unit?: string;
  color?: "lime" | "orange" | "red" | "yellow" | "emerald" | "cyan" | "purple";
  size?: "sm" | "md" | "lg";
  onChange: (val: number) => void;
}

export const Knob: React.FC<KnobProps> = ({
  id,
  label,
  value,
  min,
  max,
  step = 0.1,
  unit = "",
  color = "lime",
  size = "md",
  onChange,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const startYRef = useRef(0);
  const startValRef = useRef(value);

  const range = max - min;
  const normalized = Math.max(0, Math.min(1, (value - min) / range));
  // Rotation from -135deg to +135deg (270deg sweep)
  const rotationDeg = -135 + normalized * 270;

  const colorClasses = {
    lime: "bg-[#CCFF00] shadow-[0_0_8px_rgba(204,255,0,0.9)]",
    orange: "bg-orange-500 shadow-[0_0_8px_rgba(249,115,22,0.8)]",
    red: "bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.8)]",
    yellow: "bg-yellow-400 shadow-[0_0_8px_rgba(250,204,21,0.8)]",
    emerald: "bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]",
    cyan: "bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.8)]",
    purple: "bg-purple-400 shadow-[0_0_8px_rgba(192,132,252,0.8)]",
  }[color] || "bg-[#CCFF00] shadow-[0_0_8px_rgba(204,255,0,0.9)]";

  const sizeClasses = {
    sm: "w-11 h-11 text-[10px]",
    md: "w-13 h-13 text-xs",
    lg: "w-16 h-16 text-sm",
  }[size];

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    startYRef.current = e.clientY;
    startValRef.current = value;
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    setIsDragging(true);
    startYRef.current = e.touches[0].clientY;
    startValRef.current = value;
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;
      const deltaY = startYRef.current - e.clientY;
      const sensitivity = 150; // pixels for full range
      const deltaVal = (deltaY / sensitivity) * range;
      let newVal = startValRef.current + deltaVal;
      newVal = Math.max(min, Math.min(max, newVal));
      if (step) {
        newVal = Math.round(newVal / step) * step;
      }
      onChange(Number(newVal.toFixed(2)));
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!isDragging) return;
      const deltaY = startYRef.current - e.touches[0].clientY;
      const sensitivity = 150;
      const deltaVal = (deltaY / sensitivity) * range;
      let newVal = startValRef.current + deltaVal;
      newVal = Math.max(min, Math.min(max, newVal));
      if (step) {
        newVal = Math.round(newVal / step) * step;
      }
      onChange(Number(newVal.toFixed(2)));
    };

    const handleMouseUp = () => setIsDragging(false);

    if (isDragging) {
      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);
      window.addEventListener("touchmove", handleTouchMove);
      window.addEventListener("touchend", handleMouseUp);
    }
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
      window.removeEventListener("touchmove", handleTouchMove);
      window.removeEventListener("touchend", handleMouseUp);
    };
  }, [isDragging, max, min, onChange, range, step]);

  const displayVal = typeof value === "number" ? value.toFixed(step < 1 ? 1 : 0) : value;

  return (
    <div id={id} className="flex flex-col items-center select-none group cursor-ns-resize">
      <div
        onMouseDown={handleMouseDown}
        onTouchStart={handleTouchStart}
        className={`relative ${sizeClasses} rounded-full bg-[#0A0A0B] border-2 border-[#222226] shadow-inner flex items-center justify-center transition-all ${
          isDragging ? "ring-2 ring-[#CCFF00] border-[#CCFF00] scale-105" : "hover:border-[#333338]"
        }`}
        title={`${label}: ${displayVal}${unit}`}
      >
        {/* Metal brushed face */}
        <div className="w-[82%] h-[82%] rounded-full bg-gradient-to-br from-[#141416] via-[#0A0A0B] to-[#141416] shadow-md flex items-center justify-center relative border border-[#222226]">
          {/* Indicator Notch */}
          <div
            className="absolute w-full h-full flex justify-center items-start pointer-events-none"
            style={{ transform: `rotate(${rotationDeg}deg)` }}
          >
            <div className={`w-1 h-3 rounded-full ${colorClasses} mt-0.5`} />
          </div>

          {/* Center cap */}
          <div className="w-3.5 h-3.5 rounded-full bg-[#0A0A0B] border border-[#333338] flex items-center justify-center">
            <div className="w-1 h-1 rounded-full bg-[#CCFF00]" />
          </div>
        </div>
      </div>

      <span className="text-[10px] font-bold tracking-widest uppercase text-gray-400 mt-1 text-center font-mono">
        {label}
      </span>
      <span className="text-[10px] text-gray-300 font-mono font-semibold">
        {displayVal}
        {unit}
      </span>
    </div>
  );
};
