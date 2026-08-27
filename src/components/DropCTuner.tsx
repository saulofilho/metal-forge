import React, { useState, useEffect } from "react";
import { AudioEngine } from "../audio/audioEngine";
import { DROP_C_STRINGS, TUNING_PRESETS_MAP } from "../audio/dropCData";
import { TuningPreset, TunerResult } from "../types";
import {
  Activity,
  Volume2,
  Mic,
  MicOff,
  CheckCircle2,
  Info,
} from "lucide-react";

export const DropCTuner: React.FC = () => {
  const audioEngine = AudioEngine.getInstance();
  const [selectedTuning, setSelectedTuning] = useState<TuningPreset>("Drop C (C-G-C-F-A-D)");
  const [tunerData, setTunerData] = useState<TunerResult | null>(null);
  const [isListening, setIsListening] = useState(false);

  // Poll pitch from AudioEngine
  useEffect(() => {
    let animId: number;
    const poll = () => {
      if (isListening) {
        const res = audioEngine.getTunerData(selectedTuning);
        setTunerData(res);
      }
      animId = requestAnimationFrame(poll);
    };
    animId = requestAnimationFrame(poll);
    return () => cancelAnimationFrame(animId);
  }, [isListening, selectedTuning]);

  const handleToggleListening = async () => {
    if (isListening) {
      setIsListening(false);
    } else {
      await audioEngine.init();
      if (!audioEngine.isDirectInputActive) {
        await audioEngine.enableLiveInput(256);
      }
      setIsListening(true);
    }
  };

  // Play Reference Tone for a string
  const handlePlayReferencePitch = (freq: number) => {
    if (!audioEngine.ctx) {
      audioEngine.init().then(() => playTone(freq));
    } else {
      playTone(freq);
    }
  };

  const playTone = (freq: number) => {
    if (!audioEngine.ctx) return;
    const ctx = audioEngine.ctx;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(freq, now);
    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(0.3, now + 0.05);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 1.2);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 1.25);
  };

  const targetStrings = TUNING_PRESETS_MAP[selectedTuning] || DROP_C_STRINGS;
  const cents = tunerData ? tunerData.cents : 0;
  const isInTune = tunerData?.isInTune;

  return (
    <div id="drop-c-tuner" className="space-y-6">
      {/* Tuner Main Chassis */}
      <div className="bg-[#141416] border border-[#222226] rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6 relative overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-[#222226]">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-xl bg-[#0A0A0B] border border-[#222226] text-[#CCFF00]">
                <Activity className="w-5 h-5" />
              </span>
              <h2 className="text-xl sm:text-2xl font-black font-mono tracking-tight text-white uppercase">
                PRECISION DROP C STROBE TUNER
              </h2>
            </div>
            <p className="text-xs sm:text-sm text-gray-400 mt-1">
              Real-time autocorrelation pitch detector with sub-cent accuracy, string tension guidance & audio references.
            </p>
          </div>

          {/* Tuning Preset Selector */}
          <div className="flex items-center gap-2 bg-[#0A0A0B] px-3 py-2 rounded-xl border border-[#222226]">
            <span className="text-[10px] font-mono text-gray-500 uppercase font-bold tracking-widest">TUNING:</span>
            <select
              id="tuner-preset-select"
              value={selectedTuning}
              onChange={(e) => setSelectedTuning(e.target.value as TuningPreset)}
              className="bg-transparent text-xs font-mono font-bold text-[#CCFF00] outline-none cursor-pointer"
            >
              {Object.keys(TUNING_PRESETS_MAP).map((t) => (
                <option key={t} value={t} className="bg-[#141416] text-white">
                  {t}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Big Strobe Tuner Meter Screen */}
        <div className="bg-[#0A0A0B] rounded-2xl border border-[#222226] p-6 sm:p-8 shadow-inner flex flex-col items-center justify-center relative">
          {/* Target Note Display */}
          <div className="text-center">
            <div className="text-[10px] font-mono font-bold text-gray-500 uppercase tracking-widest">DETECTED NOTE</div>
            <div className="text-6xl sm:text-7xl font-black font-mono text-white mt-1 flex items-baseline justify-center gap-1">
              <span className={isInTune ? "text-[#CCFF00] drop-shadow-[0_0_20px_rgba(204,255,0,0.8)]" : "text-white"}>
                {tunerData ? tunerData.note : "--"}
              </span>
              <span className="text-2xl text-gray-500 font-normal">
                {tunerData ? tunerData.octave : ""}
              </span>
            </div>

            {/* Frequency readout */}
            <div className="mt-1 font-mono text-sm text-[#CCFF00] font-bold">
              {tunerData ? `${tunerData.frequency} Hz` : "Play a string to detect pitch"}
            </div>

            {/* In Tune Banner */}
            {isInTune && (
              <div className="mt-2 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#1D1D21] text-[#CCFF00] border border-[#CCFF00]/40 text-xs font-mono font-bold animate-pulse shadow-[0_0_12px_rgba(204,255,0,0.3)]">
                <CheckCircle2 className="w-4 h-4" /> PERFECTLY IN TUNE
              </div>
            )}
          </div>

          {/* Strobe Meter Deviation Needle */}
          <div className="w-full max-w-xl mt-8">
            <div className="flex justify-between text-[10px] font-mono text-gray-500 uppercase tracking-widest mb-1.5 px-1 font-bold">
              <span>-50 Cents (Flat)</span>
              <span className="text-[#CCFF00]">0 CENTS (PERFECT)</span>
              <span>+50 Cents (Sharp)</span>
            </div>

            {/* Scale Bar */}
            <div className="h-6 bg-[#141416] rounded-xl border border-[#222226] relative overflow-hidden flex items-center justify-center shadow-inner">
              {/* Center in-tune zone (green mark) */}
              <div className="absolute w-6 h-full bg-[#CCFF00]/10 border-x border-[#CCFF00]/30" />
              <div className="absolute w-0.5 h-full bg-[#CCFF00] z-10" />

              {/* Tick markers */}
              {[-40, -30, -20, -10, 10, 20, 30, 40].map((tick) => (
                <div
                  key={tick}
                  className="absolute w-px h-3 bg-[#333338]"
                  style={{ left: `${((tick + 50) / 100) * 100}%` }}
                />
              ))}

              {/* Dynamic Needle */}
              {tunerData && (
                <div
                  className={`absolute w-3 h-full rounded-sm transition-all duration-75 shadow-lg ${
                    isInTune
                      ? "bg-[#CCFF00] shadow-[0_0_12px_rgba(204,255,0,1)]"
                      : cents < 0
                      ? "bg-amber-400 shadow-[0_0_10px_rgba(251,191,36,0.8)]"
                      : "bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.8)]"
                  }`}
                  style={{
                    left: `calc(${((cents + 50) / 100) * 100}% - 6px)`,
                  }}
                />
              )}
            </div>

            {/* Numeric Cents offset */}
            <div className="text-center mt-2 font-mono text-xs">
              <span className="text-gray-500 font-bold uppercase text-[10px] tracking-widest">Deviation: </span>
              <span
                className={`font-bold ${
                  isInTune ? "text-[#CCFF00]" : cents > 0 ? "text-red-400" : "text-amber-400"
                }`}
              >
                {tunerData ? `${cents > 0 ? `+${cents}` : cents} cents` : "0 cents"}
              </span>
            </div>
          </div>

          {/* Toggle Mic Listener Button */}
          <div className="mt-8">
            <button
              id="btn-tuner-listen-toggle"
              onClick={handleToggleListening}
              className={`px-6 py-3 rounded-2xl font-mono text-sm font-bold flex items-center gap-2.5 transition-all shadow-xl cursor-pointer ${
                isListening
                  ? "bg-red-500 text-white animate-pulse shadow-red-500/40"
                  : "bg-[#CCFF00] hover:bg-[#b8e600] text-black shadow-[0_0_15px_rgba(204,255,0,0.25)]"
              }`}
            >
              {isListening ? (
                <>
                  <Mic className="w-5 h-5" /> TUNER LISTENING (CLICK TO STOP)
                </>
              ) : (
                <>
                  <MicOff className="w-5 h-5 text-black" /> START LIVE GUITAR TUNING
                </>
              )}
            </button>
          </div>
        </div>

        {/* Target Strings Guide & Reference Audio Generator */}
        <div className="bg-[#0A0A0B] rounded-2xl p-5 border border-[#222226] space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-white flex items-center gap-2">
              <Volume2 className="w-4 h-4 text-[#CCFF00]" /> {selectedTuning} TARGET STRINGS (CLICK TO HEAR PITCH):
            </h3>
            <span className="text-[10px] text-gray-500 font-mono font-bold uppercase tracking-widest">Audio Tone Generator</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
            {targetStrings.map((str) => {
              const isCurrentString = tunerData?.targetString?.stringNumber === str.stringNumber;
              return (
                <button
                  key={str.stringNumber}
                  id={`tuner-string-${str.stringNumber}`}
                  onClick={() => handlePlayReferencePitch(str.targetFreq)}
                  className={`p-3.5 rounded-xl border text-center transition-all flex flex-col items-center justify-between cursor-pointer ${
                    isCurrentString
                      ? "bg-[#CCFF00] text-black border-[#CCFF00] font-bold shadow-[0_0_15px_rgba(204,255,0,0.4)] scale-105"
                      : "bg-[#141416] border-[#222226] hover:border-[#333338] text-gray-200"
                  }`}
                >
                  <span className={`text-[9px] font-mono font-bold uppercase tracking-widest ${isCurrentString ? "text-black/70" : "text-gray-500"}`}>STRING {str.stringNumber}</span>
                  <span className="text-xl font-black font-mono mt-1">{str.name}</span>
                  <span className={`text-[10px] font-mono mt-1 font-bold ${isCurrentString ? "text-black" : "text-[#CCFF00]"}`}>{str.targetFreq} Hz</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Recommended String Gauges for Drop C Setup */}
        <div className="bg-[#0A0A0B] rounded-2xl p-5 border border-[#222226] space-y-3">
          <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-white flex items-center gap-2">
            <Info className="w-4 h-4 text-[#CCFF00]" /> RECOMMENDED STRING GAUGES FOR DROP C TENSION:
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
            <div className="p-3 rounded-xl bg-[#141416] border border-[#222226] space-y-1">
              <span className="font-bold text-[#CCFF00] font-mono">10-52 (Skinny Top / Heavy Bottom)</span>
              <p className="text-gray-400 text-[11px]">
                Standard 25.5" scale (Fender / Ibanez / ESP). Light high strings for shredding leads with heavy bottom
                for tight 0-0-0 chugs.
              </p>
            </div>
            <div className="p-3 rounded-xl bg-[#141416] border border-[#222226] space-y-1">
              <span className="font-bold text-amber-400 font-mono">11-56 (Heavy Metalcore Standard)</span>
              <p className="text-gray-400 text-[11px]">
                Ideal for 24.75" scale (Gibson / PRS) and hard-hitting rhythm players. Eliminates string floppiness on
                low C string.
              </p>
            </div>
            <div className="p-3 rounded-xl bg-[#141416] border border-[#222226] space-y-1">
              <span className="font-bold text-purple-400 font-mono">12-60 (Baritone / Ultra Tight Djent)</span>
              <p className="text-gray-400 text-[11px]">
                Maximum low-end tension for aggressive pick attack, downpicking endurance, and crystal clear pitch
                stability.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
