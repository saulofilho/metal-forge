import React, { useEffect, useRef, useState, useCallback } from "react";
import { AudioEngine } from "../audio/audioEngine";
import { AmpParams } from "../types";
import {
  Activity,
  Maximize2,
  Minimize2,
  Volume2,
  Play,
  Zap,
  Sliders,
  Radio,
  Eye,
  Layers,
} from "lucide-react";

interface SpectralAnalyzerProps {
  params: AmpParams;
  onTestRiff?: (type: "chug" | "gallop" | "add9" | "breakdown") => void;
}

type VisualizerMode = "spectrum-curve" | "bars-rta" | "oscilloscope";

export const SpectralAnalyzer: React.FC<SpectralAnalyzerProps> = ({
  params,
  onTestRiff,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const animFrameIdRef = useRef<number | null>(null);

  const [mode, setMode] = useState<VisualizerMode>("spectrum-curve");
  const [showEqCurve, setShowEqCurve] = useState<boolean>(true);
  const [showFrequencyBands, setShowFrequencyBands] = useState<boolean>(true);
  const [isExpanded, setIsExpanded] = useState<boolean>(false);
  const [peakFreq, setPeakFreq] = useState<number>(0);
  const [peakDb, setPeakDb] = useState<number>(-90);
  const [rmsDb, setRmsDb] = useState<number>(-90);

  const peakHoldRef = useRef<Float32Array>(new Float32Array(256));
  const peakHoldTimeRef = useRef<Float32Array>(new Float32Array(256));

  const audioEngine = AudioEngine.getInstance();

  // Key Metal frequency bands for Drop C (C2 = ~65.4 Hz)
  const frequencyBands = [
    { label: "SUB DROP", range: "20-60Hz", min: 20, max: 60, color: "#9333ea" },
    { label: "DROP C CHUG", range: "60-250Hz", min: 60, max: 250, color: "#3b82f6" },
    { label: "LOW MID BODY", range: "250-500Hz", min: 250, max: 500, color: "#06b6d4" },
    { label: "TS9 MID PUNCH", range: "500-2kHz", min: 500, max: 2000, color: "#CCFF00" },
    { label: "ATTACK / CLANK", range: "2k-6kHz", min: 2000, max: 6000, color: "#f59e0b" },
    { label: "CAB AIR", range: "6k-20kHz", min: 6000, max: 20000, color: "#ef4444" },
  ];

  // Draw loop
  useEffect(() => {
    let active = true;

    const draw = () => {
      if (!active) return;
      const canvas = canvasRef.current;
      if (!canvas) {
        animFrameIdRef.current = requestAnimationFrame(draw);
        return;
      }

      const ctx = canvas.getContext("2d");
      if (!ctx) {
        animFrameIdRef.current = requestAnimationFrame(draw);
        return;
      }

      const dpr = window.devicePixelRatio || 1;
      const width = canvas.clientWidth;
      const height = canvas.clientHeight;

      if (canvas.width !== width * dpr || canvas.height !== height * dpr) {
        canvas.width = width * dpr;
        canvas.height = height * dpr;
      }

      ctx.save();
      ctx.scale(dpr, dpr);

      // Background
      ctx.fillStyle = "#0A0A0B";
      ctx.fillRect(0, 0, width, height);

      // Draw Grid lines (-60dB to 0dB)
      ctx.strokeStyle = "#1A1A1E";
      ctx.lineWidth = 1;
      const dbLevels = [0, -12, -24, -36, -48, -60];
      dbLevels.forEach((db) => {
        const y = ((0 - db) / 60) * (height - 30) + 15;
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();

        ctx.fillStyle = "#4B5563";
        ctx.font = "9px monospace";
        ctx.fillText(`${db}dB`, 6, y - 3);
      });

      // Frequency Grid Markers (Logarithmic)
      const freqMarkers = [30, 65, 125, 250, 500, 1000, 2000, 4000, 8000, 16000];
      const minLog = Math.log10(20);
      const maxLog = Math.log10(20000);

      const freqToX = (freq: number) => {
        const clamped = Math.max(20, Math.min(20000, freq));
        const log = Math.log10(clamped);
        return ((log - minLog) / (maxLog - minLog)) * width;
      };

      freqMarkers.forEach((f) => {
        const x = freqToX(f);
        ctx.strokeStyle = f === 65 ? "#CCFF0044" : "#1A1A1E";
        ctx.lineWidth = f === 65 ? 1.5 : 1;
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height - 16);
        ctx.stroke();

        ctx.fillStyle = f === 65 ? "#CCFF00" : "#4B5563";
        ctx.font = f === 65 ? "bold 9px monospace" : "9px monospace";
        const label = f >= 1000 ? `${f / 1000}k` : f === 65 ? "65(C2)" : `${f}`;
        ctx.fillText(label, x - (label.length * 2.5), height - 4);
      });

      // Shaded Frequency Band Zones (Optional)
      if (showFrequencyBands) {
        frequencyBands.forEach((band) => {
          const x1 = freqToX(band.min);
          const x2 = freqToX(band.max);
          ctx.fillStyle = `${band.color}08`;
          ctx.fillRect(x1, 0, x2 - x1, height - 18);

          ctx.fillStyle = `${band.color}60`;
          ctx.font = "8px monospace";
          ctx.fillText(band.label, x1 + 4, 12);
        });
      }

      // Theoretical EQ / Cab Response Curve (calculated from current Amp parameters)
      if (showEqCurve) {
        ctx.beginPath();
        ctx.strokeStyle = "rgba(204, 255, 0, 0.25)";
        ctx.setLineDash([4, 4]);
        ctx.lineWidth = 1.5;

        for (let px = 0; px < width; px += 4) {
          const logVal = minLog + (px / width) * (maxLog - minLog);
          const freq = Math.pow(10, logVal);

          // Approximate frequency response based on Amp EQ, Presence, Resonance and Cab IR
          let gainDb = 0;

          // Bass boost/cut around 100Hz
          const bassDiff = (params.bass - 5) * 1.8;
          const bassWeight = Math.exp(-Math.pow(Math.log2(freq / 100), 2) / 0.8);
          gainDb += bassDiff * bassWeight;

          // Middle boost/cut around 750Hz
          const midDiff = (params.middle - 5) * 1.8;
          const midWeight = Math.exp(-Math.pow(Math.log2(freq / 750), 2) / 1.0);
          gainDb += midDiff * midWeight;

          // Treble boost/cut around 3500Hz
          const trebDiff = (params.treble - 5) * 1.8;
          const trebWeight = Math.exp(-Math.pow(Math.log2(freq / 3500), 2) / 0.9);
          gainDb += trebDiff * trebWeight;

          // Presence boost around 5500Hz
          const presDiff = (params.presence - 5) * 1.5;
          const presWeight = Math.exp(-Math.pow(Math.log2(freq / 5500), 2) / 0.8);
          gainDb += presDiff * presWeight;

          // Depth / Resonance sub boost around 65Hz (Drop C resonance)
          const resDiff = (params.depth - 5) * 1.6;
          const resWeight = Math.exp(-Math.pow(Math.log2(freq / 65), 2) / 0.5);
          gainDb += resDiff * resWeight;

          // TS9 Mid Hump if engaged (~720Hz)
          if (params.driveEnabled && params.driveMidBoost) {
            const ts9Weight = Math.exp(-Math.pow(Math.log2(freq / 720), 2) / 0.6);
            gainDb += 6.0 * ts9Weight;
          }

          // Cab high-cut roll off above 4.5kHz
          if (freq > 4500) {
            const rolloff = Math.log2(freq / 4500) * 8;
            gainDb -= rolloff;
          }
          // Cab sub-cut below 55Hz
          if (freq < 55) {
            const subroll = Math.log2(55 / freq) * 10;
            gainDb -= subroll;
          }

          // Map gainDb (-30 to +18 dB) to canvas Y
          const centerDb = -18;
          const y = ((centerDb - gainDb) / 60) * (height - 30) + 15;
          const clampedY = Math.max(10, Math.min(height - 20, y));

          if (px === 0) {
            ctx.moveTo(px, clampedY);
          } else {
            ctx.lineTo(px, clampedY);
          }
        }
        ctx.stroke();
        ctx.setLineDash([]);
      }

      // Live Audio Analyser Output Data
      const analyser = audioEngine.analyserNode;
      if (analyser) {
        const bufferLength = analyser.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);
        const sampleRate = audioEngine.ctx ? audioEngine.ctx.sampleRate : 48000;

        if (mode === "oscilloscope") {
          // Time Domain / Waveform Mode
          analyser.getByteTimeDomainData(dataArray);
          ctx.beginPath();
          ctx.lineWidth = 2;
          ctx.strokeStyle = "#CCFF00";
          ctx.shadowColor = "#CCFF00";
          ctx.shadowBlur = 8;

          const sliceWidth = width / bufferLength;
          let x = 0;
          for (let i = 0; i < bufferLength; i++) {
            const v = dataArray[i] / 128.0;
            const y = (v * (height - 30)) / 2 + 10;
            if (i === 0) {
              ctx.moveTo(x, y);
            } else {
              ctx.lineTo(x, y);
            }
            x += sliceWidth;
          }
          ctx.stroke();
          ctx.shadowBlur = 0;
        } else if (mode === "bars-rta") {
          // 48-Band RTA Graphic Bars
          analyser.getByteFrequencyData(dataArray);
          const barCount = 48;
          const barWidth = width / barCount;

          let maxVal = 0;
          let maxFreqHz = 0;
          let sumSquares = 0;

          for (let b = 0; b < barCount; b++) {
            // Logarithmic bin mapping
            const frac1 = b / barCount;
            const frac2 = (b + 1) / barCount;
            const f1 = Math.pow(10, minLog + frac1 * (maxLog - minLog));
            const f2 = Math.pow(10, minLog + frac2 * (maxLog - minLog));

            const bin1 = Math.max(0, Math.floor((f1 * bufferLength) / (sampleRate / 2)));
            const bin2 = Math.min(bufferLength - 1, Math.ceil((f2 * bufferLength) / (sampleRate / 2)));

            let sum = 0;
            let count = 0;
            for (let k = bin1; k <= bin2; k++) {
              sum += dataArray[k];
              count++;
            }
            const avg = count > 0 ? sum / count : 0;
            const normalized = avg / 255;

            sumSquares += normalized * normalized;
            if (avg > maxVal) {
              maxVal = avg;
              maxFreqHz = Math.round((f1 + f2) / 2);
            }

            const barHeight = normalized * (height - 35);
            const x = b * barWidth + 1;
            const y = height - 18 - barHeight;

            // Bar Gradient
            const gradient = ctx.createLinearGradient(0, height - 18, 0, y);
            gradient.addColorStop(0, "#CCFF0022");
            gradient.addColorStop(0.7, "#CCFF00");
            gradient.addColorStop(1, "#f97316");

            ctx.fillStyle = gradient;
            ctx.fillRect(x, y, barWidth - 2, barHeight);

            // Neon top cap
            ctx.fillStyle = "#CCFF00";
            ctx.fillRect(x, y, barWidth - 2, 2);
          }

          // Telemetry Peak Calc
          const currentPeakDb = maxVal > 0 ? Math.round(20 * Math.log10(maxVal / 255)) : -90;
          const currentRmsDb =
            sumSquares > 0 ? Math.round(20 * Math.log10(Math.sqrt(sumSquares / barCount))) : -90;

          setPeakFreq(maxFreqHz);
          setPeakDb(currentPeakDb);
          setRmsDb(currentRmsDb);
        } else {
          // Spectrum Curve Mode (Smooth Spline + Filled Glow Gradient + Peak Hold)
          analyser.getByteFrequencyData(dataArray);

          const samplePoints = 120;
          const points: { x: number; y: number }[] = [];
          let maxVal = 0;
          let maxFreqHz = 0;
          let sumSquares = 0;

          for (let i = 0; i < samplePoints; i++) {
            const frac = i / (samplePoints - 1);
            const freq = Math.pow(10, minLog + frac * (maxLog - minLog));
            const bin = Math.min(
              bufferLength - 1,
              Math.max(0, Math.round((freq * bufferLength) / (sampleRate / 2)))
            );

            // Interpolate nearby bins for smoothing
            let sum = 0;
            let weight = 0;
            for (let offset = -1; offset <= 1; offset++) {
              const targetBin = bin + offset;
              if (targetBin >= 0 && targetBin < bufferLength) {
                sum += dataArray[targetBin];
                weight += 1;
              }
            }
            const val = weight > 0 ? sum / weight : dataArray[bin];
            const normalized = val / 255;

            sumSquares += normalized * normalized;
            if (val > maxVal) {
              maxVal = val;
              maxFreqHz = Math.round(freq);
            }

            const x = frac * width;
            const y = height - 18 - normalized * (height - 35);
            points.push({ x, y });

            // Peak hold decay
            if (y < peakHoldRef.current[i] || peakHoldRef.current[i] === 0) {
              peakHoldRef.current[i] = y;
              peakHoldTimeRef.current[i] = performance.now();
            } else {
              // Slow gravity falloff
              peakHoldRef.current[i] += 0.8;
              if (peakHoldRef.current[i] > height - 18) {
                peakHoldRef.current[i] = height - 18;
              }
            }
          }

          // Telemetry
          const currentPeakDb = maxVal > 0 ? Math.round(20 * Math.log10(maxVal / 255)) : -90;
          const currentRmsDb =
            sumSquares > 0
              ? Math.round(20 * Math.log10(Math.sqrt(sumSquares / samplePoints)))
              : -90;

          setPeakFreq(maxFreqHz);
          setPeakDb(currentPeakDb);
          setRmsDb(currentRmsDb);

          // Draw Peak Hold Line
          ctx.beginPath();
          ctx.strokeStyle = "rgba(204, 255, 0, 0.4)";
          ctx.lineWidth = 1;
          for (let i = 0; i < samplePoints; i++) {
            const px = (i / (samplePoints - 1)) * width;
            const py = peakHoldRef.current[i];
            if (i === 0) ctx.moveTo(px, py);
            else ctx.lineTo(px, py);
          }
          ctx.stroke();

          // Draw Filled Spectrum Gradient
          if (points.length > 0) {
            ctx.beginPath();
            ctx.moveTo(0, height - 18);
            points.forEach((p) => ctx.lineTo(p.x, p.y));
            ctx.lineTo(width, height - 18);
            ctx.closePath();

            const gradient = ctx.createLinearGradient(0, 0, 0, height - 18);
            gradient.addColorStop(0, "rgba(204, 255, 0, 0.45)");
            gradient.addColorStop(0.5, "rgba(204, 255, 0, 0.2)");
            gradient.addColorStop(1, "rgba(204, 255, 0, 0.0)");
            ctx.fillStyle = gradient;
            ctx.fill();

            // Outline Curve
            ctx.beginPath();
            ctx.moveTo(points[0].x, points[0].y);
            for (let i = 1; i < points.length; i++) {
              ctx.lineTo(points[i].x, points[i].y);
            }
            ctx.strokeStyle = "#CCFF00";
            ctx.lineWidth = 2;
            ctx.shadowColor = "#CCFF00";
            ctx.shadowBlur = 6;
            ctx.stroke();
            ctx.shadowBlur = 0;
          }
        }
      }

      ctx.restore();
      animFrameIdRef.current = requestAnimationFrame(draw);
    };

    animFrameIdRef.current = requestAnimationFrame(draw);
    return () => {
      active = false;
      if (animFrameIdRef.current) cancelAnimationFrame(animFrameIdRef.current);
    };
  }, [mode, showEqCurve, showFrequencyBands, params]);

  return (
    <div
      ref={containerRef}
      className={`bg-[#141416] border border-[#222226] rounded-2xl shadow-xl transition-all duration-300 relative overflow-hidden flex flex-col ${
        isExpanded ? "p-5" : "p-4"
      }`}
    >
      {/* Header Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#222226]">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-[#0A0A0B] border border-[#222226] flex items-center justify-center text-[#CCFF00] shadow-[0_0_10px_rgba(204,255,0,0.2)]">
            <Activity className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-xs sm:text-sm font-bold text-white font-mono uppercase tracking-wider">
                REAL-TIME SPECTRAL ANALYZER
              </h3>
              <span className="px-2 py-0.5 rounded bg-[#CCFF00]/10 text-[#CCFF00] text-[9px] font-mono font-bold border border-[#CCFF00]/30 animate-pulse">
                LIVE FFT
              </span>
            </div>
            <p className="text-[11px] text-gray-400 font-mono">
              Frequency distribution & DSP response for <strong className="text-gray-200">{params.ampModel}</strong>
            </p>
          </div>
        </div>

        {/* Action Controls & Mode Switcher */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Visualizer Mode Toggle */}
          <div className="flex items-center bg-[#0A0A0B] border border-[#222226] rounded-lg p-0.5 text-xs font-mono">
            <button
              type="button"
              onClick={() => setMode("spectrum-curve")}
              className={`px-2 py-1 rounded transition-all cursor-pointer ${
                mode === "spectrum-curve"
                  ? "bg-[#1D1D21] text-[#CCFF00] font-bold shadow"
                  : "text-gray-400 hover:text-gray-200"
              }`}
              title="Continuous FFT Spectral Curve"
            >
              Curve
            </button>
            <button
              type="button"
              onClick={() => setMode("bars-rta")}
              className={`px-2 py-1 rounded transition-all cursor-pointer ${
                mode === "bars-rta"
                  ? "bg-[#1D1D21] text-[#CCFF00] font-bold shadow"
                  : "text-gray-400 hover:text-gray-200"
              }`}
              title="48-Band RTA Graphic Bars"
            >
              RTA Bars
            </button>
            <button
              type="button"
              onClick={() => setMode("oscilloscope")}
              className={`px-2 py-1 rounded transition-all cursor-pointer ${
                mode === "oscilloscope"
                  ? "bg-[#1D1D21] text-[#CCFF00] font-bold shadow"
                  : "text-gray-400 hover:text-gray-200"
              }`}
              title="Time Domain Oscilloscope"
            >
              Wave
            </button>
          </div>

          {/* EQ Curve & Bands Toggles */}
          <button
            type="button"
            onClick={() => setShowEqCurve(!showEqCurve)}
            className={`px-2 py-1 rounded-lg text-xs font-mono font-bold border transition-all cursor-pointer flex items-center gap-1 ${
              showEqCurve
                ? "bg-[#CCFF00]/10 text-[#CCFF00] border-[#CCFF00]/40"
                : "bg-[#0A0A0B] text-gray-400 border-[#222226]"
            }`}
            title="Toggle theoretical EQ curve overlay"
          >
            <Sliders className="w-3 h-3" />
            <span className="hidden sm:inline">EQ Curve</span>
          </button>

          <button
            type="button"
            onClick={() => setShowFrequencyBands(!showFrequencyBands)}
            className={`px-2 py-1 rounded-lg text-xs font-mono font-bold border transition-all cursor-pointer flex items-center gap-1 ${
              showFrequencyBands
                ? "bg-[#CCFF00]/10 text-[#CCFF00] border-[#CCFF00]/40"
                : "bg-[#0A0A0B] text-gray-400 border-[#222226]"
            }`}
            title="Toggle metal frequency band zones"
          >
            <Layers className="w-3 h-3" />
            <span className="hidden sm:inline">Bands</span>
          </button>

          {/* Size toggle */}
          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1.5 rounded-lg bg-[#0A0A0B] text-gray-400 hover:text-gray-200 border border-[#222226] cursor-pointer"
            title={isExpanded ? "Collapse height" : "Expand height"}
          >
            {isExpanded ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* Main Canvas Display Stage */}
      <div className="relative mt-3 rounded-xl overflow-hidden border border-[#222226] bg-[#0A0A0B]">
        <canvas
          ref={canvasRef}
          className={`w-full block ${isExpanded ? "h-64 sm:h-80" : "h-44 sm:h-52"}`}
        />

        {/* Live Frequency Telemetry Overlay */}
        <div className="absolute top-2 right-2 flex items-center gap-2 bg-[#141416]/90 backdrop-blur border border-[#222226] px-2.5 py-1 rounded-lg text-[10px] font-mono pointer-events-none">
          <div className="flex items-center gap-1">
            <span className="text-gray-500">PEAK:</span>
            <strong className="text-[#CCFF00]">{peakFreq > 0 ? `${peakFreq} Hz` : "--"}</strong>
          </div>
          <span className="text-gray-600">|</span>
          <div className="flex items-center gap-1">
            <span className="text-gray-500">PEAK dB:</span>
            <strong className={peakDb > -12 ? "text-amber-400" : "text-gray-200"}>
              {peakDb > -80 ? `${peakDb} dB` : "-∞"}
            </strong>
          </div>
          <span className="text-gray-600">|</span>
          <div className="flex items-center gap-1">
            <span className="text-gray-500">RMS:</span>
            <strong className="text-gray-300">{rmsDb > -80 ? `${rmsDb} dB` : "-∞"}</strong>
          </div>
        </div>
      </div>

      {/* Bottom Metal Frequency Band Legend & Riff Triggers */}
      <div className="mt-3 pt-3 border-t border-[#222226] flex flex-col lg:flex-row lg:items-center justify-between gap-3 text-xs font-mono">
        {/* Frequency Band Legend */}
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5">
          {frequencyBands.map((band) => (
            <div
              key={band.label}
              className="px-2 py-1 rounded-lg bg-[#0A0A0B] border border-[#222226] flex flex-col"
            >
              <div className="flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: band.color }} />
                <span className="text-[9px] font-bold truncate text-gray-300">{band.label}</span>
              </div>
              <span className="text-[8.5px] text-gray-500">{band.range}</span>
            </div>
          ))}
        </div>

        {/* Quick Test Audio Riff Buttons */}
        {onTestRiff && (
          <div className="flex items-center gap-1.5 shrink-0 flex-wrap">
            <span className="text-[10px] text-gray-500 font-bold uppercase flex items-center gap-1">
              <Zap className="w-3 h-3 text-[#CCFF00]" /> Send Tone:
            </span>
            <button
              type="button"
              onClick={() => onTestRiff("chug")}
              className="px-2 py-1 rounded-lg bg-[#0A0A0B] hover:bg-[#CCFF00] hover:text-black text-gray-300 border border-[#222226] text-[10.5px] font-bold transition-all flex items-center gap-1 cursor-pointer"
            >
              <Play className="w-2.5 h-2.5 fill-current" /> 0-0-0 Chug
            </button>
            <button
              type="button"
              onClick={() => onTestRiff("gallop")}
              className="px-2 py-1 rounded-lg bg-[#0A0A0B] hover:bg-[#CCFF00] hover:text-black text-gray-300 border border-[#222226] text-[10.5px] font-bold transition-all flex items-center gap-1 cursor-pointer"
            >
              <Play className="w-2.5 h-2.5 fill-current" /> Gallop
            </button>
            <button
              type="button"
              onClick={() => onTestRiff("breakdown")}
              className="px-2 py-1 rounded-lg bg-[#0A0A0B] hover:bg-[#CCFF00] hover:text-black text-gray-300 border border-[#222226] text-[10.5px] font-bold transition-all flex items-center gap-1 cursor-pointer"
            >
              <Play className="w-2.5 h-2.5 fill-current" /> Breakdown
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
