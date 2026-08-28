import React, { useEffect, useState, useRef } from "react";
import { AudioEngine } from "../audio/audioEngine";
import { Activity, Radio, Volume2, VolumeX, Eye, Sparkles, Sliders } from "lucide-react";

interface FooterVuMeterProps {
  isMuted: boolean;
  isLiveInputActive: boolean;
}

type ScopeSource = "input" | "output";

export const FooterVuMeter: React.FC<FooterVuMeterProps> = ({ isMuted, isLiveInputActive }) => {
  const [outputAmp, setOutputAmp] = useState<number>(0);
  const [inputAmp, setInputAmp] = useState<number>(0);
  const [peakAmp, setPeakAmp] = useState<number>(0);
  const [dbReadout, setDbReadout] = useState<string>("-inf dB");
  const [scopeSource, setScopeSource] = useState<ScopeSource>("input");
  const [scopeGain, setScopeGain] = useState<number>(1.5);
  const [isHovered, setIsHovered] = useState<boolean>(false);

  const peakHoldRef = useRef<number>(0);
  const peakDecayTimerRef = useRef<number>(0);

  // Oscilloscope Canvas & Data Refs
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const scopeDataRef = useRef<Uint8Array>(new Uint8Array(1024));
  const vppRef = useRef<number>(0);

  const audioEngine = AudioEngine.getInstance();

  useEffect(() => {
    let animId: number;

    const updateMeterAndScope = () => {
      // 1. Update VU Meter Levels
      if (isMuted) {
        setOutputAmp(0);
        setInputAmp(0);
        setPeakAmp(0);
        setDbReadout("MUTED");
      } else {
        const outLevel = audioEngine.outputLevel || 0;
        const inLevel = audioEngine.inputLevel || 0;

        // Smooth decay / quick attack
        setOutputAmp((prev) => {
          if (outLevel > prev) {
            return outLevel;
          }
          return Math.max(0, prev * 0.88);
        });

        setInputAmp((prev) => {
          if (inLevel > prev) {
            return inLevel;
          }
          return Math.max(0, prev * 0.85);
        });

        // Peak Hold
        if (outLevel > peakHoldRef.current) {
          peakHoldRef.current = outLevel;
          peakDecayTimerRef.current = Date.now() + 800; // Hold peak for 800ms
        } else if (Date.now() > peakDecayTimerRef.current) {
          peakHoldRef.current = Math.max(0, peakHoldRef.current * 0.94);
        }
        setPeakAmp(peakHoldRef.current);

        // dB calculation
        if (outLevel > 0.001) {
          const db = 20 * Math.log10(outLevel);
          const formatted = db >= 0 ? `+${db.toFixed(1)} dB` : `${db.toFixed(1)} dB`;
          setDbReadout(formatted);
        } else if (inLevel > 0.001) {
          const db = 20 * Math.log10(inLevel);
          setDbReadout(`${db.toFixed(1)} dB IN`);
        } else {
          setDbReadout("-inf dB");
        }
      }

      // 2. Render Real-Time Oscilloscope Waveform on Canvas
      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext("2d");
        if (ctx) {
          const dpr = window.devicePixelRatio || 1;
          const rect = canvas.getBoundingClientRect();
          const displayWidth = Math.max(80, Math.floor(rect.width));
          const displayHeight = Math.max(28, Math.floor(rect.height));

          if (canvas.width !== displayWidth * dpr || canvas.height !== displayHeight * dpr) {
            canvas.width = displayWidth * dpr;
            canvas.height = displayHeight * dpr;
          }

          ctx.save();
          ctx.scale(dpr, dpr);

          // Clear Background
          ctx.fillStyle = "#070709";
          ctx.fillRect(0, 0, displayWidth, displayHeight);

          // Draw CRT / Graticule Background Grid
          ctx.strokeStyle = "#16161A";
          ctx.lineWidth = 1;

          // Center Horizontal Zero Line
          const midY = displayHeight / 2;
          ctx.beginPath();
          ctx.setLineDash([2, 4]);
          ctx.moveTo(0, midY);
          ctx.lineTo(displayWidth, midY);
          ctx.stroke();

          // Vertical Division Lines
          const cols = 6;
          const colWidth = displayWidth / cols;
          ctx.beginPath();
          for (let c = 1; c < cols; c++) {
            ctx.moveTo(c * colWidth, 0);
            ctx.lineTo(c * colWidth, displayHeight);
          }
          ctx.stroke();
          ctx.setLineDash([]);

          // Fetch Audio Waveform Data
          const dataArray = scopeDataRef.current;
          let hasData = false;

          if (!isMuted) {
            if (scopeSource === "input") {
              hasData = audioEngine.getInputTimeDomainData(dataArray);
            } else {
              hasData = audioEngine.getOutputTimeDomainData(dataArray);
            }
          }

          // Zero-Crossing Trigger Search for Phase Stabilization (Locks guitar waveforms without jitter)
          let triggerIndex = 0;
          if (hasData && !isMuted) {
            const searchLimit = Math.min(256, dataArray.length - displayWidth);
            for (let i = 0; i < searchLimit; i++) {
              if (dataArray[i] <= 128 && dataArray[i + 1] > 128) {
                triggerIndex = i;
                break;
              }
            }
          }

          // Measure Peak-to-Peak (Vpp)
          let minVal = 255;
          let maxVal = 0;
          const sampleCount = Math.min(displayWidth, dataArray.length - triggerIndex);

          for (let i = 0; i < sampleCount; i++) {
            const val = dataArray[triggerIndex + i];
            if (val < minVal) minVal = val;
            if (val > maxVal) maxVal = val;
          }
          const vpp = hasData && !isMuted ? (maxVal - minVal) / 255 : 0;
          vppRef.current = vpp;

          const isWaveformActive = vpp > 0.03 && !isMuted;

          // Draw Waveform Trace
          ctx.beginPath();
          ctx.lineWidth = isWaveformActive ? 1.75 : 1.2;

          if (isMuted) {
            ctx.strokeStyle = "rgba(239, 68, 68, 0.45)"; // Dim Red Flatline
            ctx.shadowBlur = 0;
          } else if (scopeSource === "input") {
            ctx.strokeStyle = isWaveformActive ? "#CCFF00" : "rgba(204, 255, 0, 0.35)"; // Electric Volt Lime
            ctx.shadowColor = isWaveformActive ? "rgba(204, 255, 0, 0.8)" : "transparent";
            ctx.shadowBlur = isWaveformActive ? 4 : 0;
          } else {
            ctx.strokeStyle = isWaveformActive ? "#38BDF8" : "rgba(56, 189, 248, 0.35)"; // Sky Blue DSP Out
            ctx.shadowColor = isWaveformActive ? "rgba(56, 189, 248, 0.8)" : "transparent";
            ctx.shadowBlur = isWaveformActive ? 4 : 0;
          }

          const pointsToDraw = Math.max(16, displayWidth);
          const step = Math.max(1, (dataArray.length - triggerIndex) / pointsToDraw);

          for (let i = 0; i < pointsToDraw; i++) {
            const dataIdx = Math.min(dataArray.length - 1, triggerIndex + Math.floor(i * step));
            let normalized = 0;

            if (hasData && !isMuted) {
              const raw = (dataArray[dataIdx] - 128) / 128; // -1.0 to 1.0
              normalized = raw * scopeGain;
            } else {
              // Idle noise trace simulation when dormant
              normalized = Math.sin(Date.now() * 0.003 + i * 0.05) * 0.015;
            }

            const y = midY - normalized * (displayHeight * 0.42);
            const clampedY = Math.max(1.5, Math.min(displayHeight - 1.5, y));
            const x = (i / (pointsToDraw - 1)) * displayWidth;

            if (i === 0) {
              ctx.moveTo(x, clampedY);
            } else {
              ctx.lineTo(x, clampedY);
            }
          }

          ctx.stroke();
          ctx.shadowBlur = 0;
          ctx.restore();
        }
      }

      animId = requestAnimationFrame(updateMeterAndScope);
    };

    animId = requestAnimationFrame(updateMeterAndScope);

    return () => {
      cancelAnimationFrame(animId);
    };
  }, [isMuted, scopeSource, scopeGain]);

  const outputPercent = Math.min(100, Math.round(outputAmp * 100));
  const inputPercent = Math.min(100, Math.round(inputAmp * 100));
  const peakPercent = Math.min(100, Math.round(peakAmp * 100));

  // Pulse intensity calculated from live amplitude (0 to 1)
  const effectiveAmp = Math.max(outputAmp, inputAmp);
  const isSignalActive = effectiveAmp > 0.02 && !isMuted;
  const isClipping = effectiveAmp > 0.92 && !isMuted;

  // Dynamic glow and pulse style based on real-time amplitude
  const pulseStyle: React.CSSProperties = isSignalActive
    ? {
        boxShadow: isClipping
          ? `0 0 ${16 + effectiveAmp * 16}px rgba(239, 68, 68, ${0.4 + effectiveAmp * 0.6})`
          : `0 0 ${8 + effectiveAmp * 20}px rgba(204, 255, 0, ${0.25 + effectiveAmp * 0.65})`,
        transition: "box-shadow 60ms ease-out, filter 60ms ease-out",
        filter: `brightness(${1 + effectiveAmp * 0.4})`,
      }
    : {
        boxShadow: "none",
        transition: "box-shadow 200ms ease-out",
      };

  const handleToggleScopeSource = () => {
    setScopeSource((prev) => (prev === "input" ? "output" : "input"));
  };

  const handleCycleGain = () => {
    setScopeGain((prev) => (prev === 1.0 ? 1.8 : prev === 1.8 ? 3.0 : 1.0));
  };

  return (
    <footer
      id="bento-telemetry-footer"
      className="bg-[#141416] border-t border-[#222226] py-3 px-4 sm:px-6 text-xs text-gray-400 font-mono transition-colors duration-150"
    >
      <div className="max-w-7xl mx-auto flex flex-col lg:flex-row items-center justify-between gap-4">
        {/* Left Telemetry Badges */}
        <div className="flex items-center gap-5 sm:gap-7 flex-wrap justify-center sm:justify-start">
          <div className="flex items-center gap-2">
            <span
              className={`w-2 h-2 rounded-full transition-all duration-100 ${
                isSignalActive
                  ? isClipping
                    ? "bg-red-500 shadow-[0_0_10px_rgba(239,68,68,1)] animate-ping"
                    : "bg-[#CCFF00] shadow-[0_0_8px_rgba(204,255,0,0.9)] animate-pulse"
                  : "bg-gray-600"
              }`}
            />
            <div className="flex flex-col">
              <span className="text-[9px] uppercase tracking-widest text-gray-500 font-bold">DSP Engine</span>
              <span className="text-[11px] font-bold text-gray-200">
                {isMuted ? "MUTED" : isSignalActive ? "ACTIVE (DSP)" : "IDLE (0.0ms)"}
              </span>
            </div>
          </div>

          <div className="flex flex-col">
            <span className="text-[9px] uppercase tracking-widest text-gray-500 font-bold">Audio Buffer</span>
            <span className="text-[11px] font-bold text-gray-200">128 Samples (2.7ms)</span>
          </div>

          <div className="flex flex-col">
            <span className="text-[9px] uppercase tracking-widest text-gray-500 font-bold">Sample Rate</span>
            <span className="text-[11px] font-bold text-gray-200">96.0 kHz / 24-bit</span>
          </div>

          <div className="flex flex-col">
            <span className="text-[9px] uppercase tracking-widest text-gray-500 font-bold">Drop C Tuning</span>
            <span className="text-[11px] font-bold text-[#CCFF00]">C2 - G2 - C3 - F3 - A3 - D4</span>
          </div>
        </div>

        {/* Right Section: Real-time Oscilloscope Canvas Visualizer + Input Monitor + Master VU Meter */}
        <div className="flex items-center gap-3 sm:gap-4.5 w-full lg:w-auto justify-end flex-wrap sm:flex-nowrap">
          {/* Real-time Oscilloscope Waveform Monitor */}
          <div
            id="footer-oscilloscope-container"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            className="flex items-center gap-2 bg-[#0C0C0E] border border-[#222226] hover:border-[#333338] px-2.5 py-1 rounded-lg transition-all"
            title="Real-time guitar waveform oscilloscope (click source/zoom to toggle)"
          >
            <div className="flex flex-col items-start min-w-[58px]">
              <div className="flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-[#CCFF00] animate-pulse" />
                <span className="text-[8.5px] uppercase tracking-wider font-bold text-gray-400">
                  {scopeSource === "input" ? "GUITAR IN" : "DSP OUT"}
                </span>
              </div>
              <div className="flex items-center gap-1 mt-0.5">
                <button
                  id="btn-scope-source-toggle"
                  onClick={handleToggleScopeSource}
                  className="text-[8px] font-mono px-1 py-0.2 rounded bg-[#18181C] hover:bg-[#CCFF00] hover:text-black text-gray-400 hover:font-bold border border-zinc-800 transition-colors cursor-pointer"
                  title="Switch oscilloscope signal between raw Guitar In and DSP Out"
                >
                  {scopeSource === "input" ? "SRC:IN" : "SRC:OUT"}
                </button>
                <button
                  id="btn-scope-gain-cycle"
                  onClick={handleCycleGain}
                  className="text-[8px] font-mono px-1 py-0.2 rounded bg-[#18181C] hover:bg-[#CCFF00] hover:text-black text-gray-400 hover:font-bold border border-zinc-800 transition-colors cursor-pointer"
                  title="Cycle waveform zoom/gain (1x, 1.8x, 3x)"
                >
                  {scopeGain === 1.0 ? "1x" : scopeGain === 1.8 ? "2x" : "3x"}
                </button>
              </div>
            </div>

            {/* Canvas Oscilloscope Screen */}
            <div
              id="footer-oscilloscope-screen"
              className="relative w-28 sm:w-36 md:w-44 h-8 bg-[#070709] rounded overflow-hidden border border-[#1A1A1E] shadow-inner flex items-center"
            >
              <canvas
                id="footer-oscilloscope-canvas"
                ref={canvasRef}
                className="w-full h-full block cursor-crosshair"
              />

              {/* Status Badge Overlay */}
              {isMuted && (
                <div className="absolute inset-0 bg-black/60 backdrop-blur-[1px] flex items-center justify-center pointer-events-none">
                  <span className="text-[9px] font-bold text-red-400 uppercase tracking-widest">MUTED</span>
                </div>
              )}
            </div>
          </div>

          {/* Input Level Monitor (If Live Input active) */}
          {isLiveInputActive && (
            <div className="hidden sm:flex items-center gap-1.5">
              <span className="text-[9px] uppercase tracking-widest text-gray-500 font-bold">IN</span>
              <div className="h-3.5 w-14 bg-[#0A0A0B] rounded-sm relative overflow-hidden border border-[#222226]">
                <div
                  className="h-full bg-gradient-to-r from-[#CCFF00] to-emerald-400 transition-all duration-75"
                  style={{ width: `${inputPercent}%` }}
                />
              </div>
            </div>
          )}

          {/* Master Output VU Meter Chassis with Dynamic Pulse CSS Animation */}
          <div className="flex items-center gap-2.5">
            <div className="flex items-center gap-1.5 text-gray-400">
              {isMuted ? (
                <VolumeX className="w-3.5 h-3.5 text-red-400" />
              ) : (
                <Volume2
                  className={`w-3.5 h-3.5 transition-colors ${
                    isSignalActive ? "text-[#CCFF00]" : "text-gray-500"
                  }`}
                />
              )}
              <span className="text-[9px] uppercase tracking-widest text-gray-400 font-bold hidden sm:inline">
                MASTER
              </span>
            </div>

            {/* Pulsing VU Meter Track */}
            <div
              id="footer-vu-meter-chassis"
              style={pulseStyle}
              className={`h-4 w-32 sm:w-44 md:w-52 bg-[#0A0A0B] rounded-md relative overflow-hidden border transition-all duration-100 flex items-center p-0.5 ${
                isClipping
                  ? "border-red-500"
                  : isSignalActive
                  ? "border-[#CCFF00]/60"
                  : "border-[#222226]"
              }`}
            >
              {/* Dynamic VU Meter Amplitude Fill Bar */}
              <div
                id="footer-vu-meter-bar"
                className={`h-full rounded-xs transition-all duration-60 ease-out ${
                  isClipping
                    ? "bg-gradient-to-r from-emerald-500 via-[#CCFF00] to-red-500 animate-vu-clip"
                    : isSignalActive
                    ? "bg-gradient-to-r from-emerald-500 via-[#CCFF00] to-amber-400"
                    : "bg-gray-800"
                }`}
                style={{
                  width: `${outputPercent}%`,
                }}
              />

              {/* Peak Hold Tick Indicator */}
              {peakPercent > 0 && !isMuted && (
                <div
                  className={`absolute top-0 bottom-0 w-0.5 z-10 transition-all duration-100 ${
                    peakPercent > 90 ? "bg-red-400 shadow-[0_0_6px_rgba(239,68,68,1)]" : "bg-[#CCFF00]"
                  }`}
                  style={{ left: `${Math.min(99, peakPercent)}%` }}
                />
              )}

              {/* Graticule / Segmentation Ticks */}
              <div className="absolute inset-0 grid grid-cols-8 divide-x divide-[#141416]/70 pointer-events-none" />
            </div>

            {/* Numeric dB Readout */}
            <div
              className={`min-w-[56px] text-right font-mono text-xs font-bold transition-colors ${
                isMuted
                  ? "text-red-400"
                  : isClipping
                  ? "text-red-400 animate-pulse"
                  : isSignalActive
                  ? "text-[#CCFF00]"
                  : "text-gray-500"
              }`}
            >
              {dbReadout}
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

