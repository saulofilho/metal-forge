import React, { useState, useEffect } from "react";
import { AudioEngine } from "../audio/audioEngine";
import { MidiEngine } from "../audio/midiEngine";
import { FACTORY_PRESETS } from "../audio/presetLibrary";
import { AmpPreset } from "../types";
import {
  Flame,
  VolumeX,
  Volume2,
  Maximize2,
  Minimize2,
  Radio,
  Settings,
  Activity,
  Zap,
} from "lucide-react";

interface LivePerformanceHUDProps {
  onOpenMidiSettings: () => void;
}

export const LivePerformanceHUD: React.FC<LivePerformanceHUDProps> = ({ onOpenMidiSettings }) => {
  const audioEngine = AudioEngine.getInstance();
  const midiEngine = MidiEngine.getInstance();

  const [activePreset, setActivePreset] = useState<AmpPreset>(FACTORY_PRESETS[0]);
  const [isMuted, setIsMuted] = useState(false);
  const [driveEnabled, setDriveEnabled] = useState(true);
  const [delayEnabled, setDelayEnabled] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [lastMidiTrigger, setLastMidiTrigger] = useState<string | null>(null);
  const [bpm, setBpm] = useState(135);
  const [tapTimes, setTapTimes] = useState<number[]>([]);

  // Tap tempo
  const handleTapTempo = () => {
    const now = performance.now();
    const newTaps = [...tapTimes.slice(-3), now];
    setTapTimes(newTaps);

    if (newTaps.length >= 2) {
      let totalDiff = 0;
      for (let i = 1; i < newTaps.length; i++) {
        totalDiff += newTaps[i] - newTaps[i - 1];
      }
      const avgInterval = totalDiff / (newTaps.length - 1);
      const computedBpm = Math.round(60000 / avgInterval);
      if (computedBpm >= 40 && computedBpm <= 280) {
        setBpm(computedBpm);
        audioEngine.bpm = computedBpm;
      }
    }
  };

  // MIDI Listener hook
  useEffect(() => {
    const unsubscribe = midiEngine.addListener((mapping) => {
      setLastMidiTrigger(mapping.description);
      setTimeout(() => setLastMidiTrigger(null), 1200);

      if (mapping.action === "preset" && mapping.targetPresetId) {
        const found = FACTORY_PRESETS.find((p) => p.id === mapping.targetPresetId);
        if (found) {
          setActivePreset(found);
          audioEngine.applyAmpParams(found.params);
          setDriveEnabled(found.params.driveEnabled);
          setDelayEnabled(found.params.delayEnabled);
        }
      } else if (mapping.action === "toggle_drive") {
        setDriveEnabled((prev) => {
          const next = !prev;
          audioEngine.applyAmpParams({ ...activePreset.params, driveEnabled: next });
          return next;
        });
      } else if (mapping.action === "toggle_delay") {
        setDelayEnabled((prev) => {
          const next = !prev;
          audioEngine.applyAmpParams({ ...activePreset.params, delayEnabled: next });
          return next;
        });
      } else if (mapping.action === "toggle_mute") {
        const muted = audioEngine.toggleMute();
        setIsMuted(muted);
      } else if (mapping.action === "tap_tempo") {
        handleTapTempo();
      }
    });

    return () => unsubscribe();
  }, [activePreset]);

  // Keyboard Hotkey shortcuts for stage testing (1-6 for presets, B for boost, D for delay, M for mute, Space for tap tempo)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (["INPUT", "TEXTAREA"].includes((e.target as HTMLElement)?.tagName)) return;

      if (e.key >= "1" && e.key <= "6") {
        const idx = Number(e.key) - 1;
        if (FACTORY_PRESETS[idx]) {
          const p = FACTORY_PRESETS[idx];
          setActivePreset(p);
          audioEngine.applyAmpParams(p.params);
          setDriveEnabled(p.params.driveEnabled);
          setDelayEnabled(p.params.delayEnabled);
          midiEngine.simulateMidi("pc", idx);
        }
      } else if (e.key.toLowerCase() === "b") {
        setDriveEnabled((prev) => {
          const next = !prev;
          audioEngine.applyAmpParams({ ...activePreset.params, driveEnabled: next });
          return next;
        });
        midiEngine.simulateMidi("cc", 64);
      } else if (e.key.toLowerCase() === "d") {
        setDelayEnabled((prev) => {
          const next = !prev;
          audioEngine.applyAmpParams({ ...activePreset.params, delayEnabled: next });
          return next;
        });
        midiEngine.simulateMidi("cc", 65);
      } else if (e.key.toLowerCase() === "m") {
        const muted = audioEngine.toggleMute();
        setIsMuted(muted);
        midiEngine.simulateMidi("cc", 66);
      } else if (e.code === "Space") {
        e.preventDefault();
        handleTapTempo();
        midiEngine.simulateMidi("cc", 67);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [activePreset]);

  const handleSelectLivePreset = (preset: AmpPreset) => {
    setActivePreset(preset);
    audioEngine.applyAmpParams(preset.params);
    setDriveEnabled(preset.params.driveEnabled);
    setDelayEnabled(preset.params.delayEnabled);
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  return (
    <div
      id="live-performance-hud"
      className={`space-y-6 transition-all ${
        isFullscreen ? "p-6 bg-[#0A0A0B] min-h-screen fixed inset-0 z-50 overflow-y-auto" : ""
      }`}
    >
      {/* Stage Header Bento Banner */}
      <div className="bg-[#141416] border border-[#222226] rounded-3xl p-5 sm:p-7 shadow-2xl flex flex-col md:flex-row md:items-center justify-between gap-5 relative overflow-hidden">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-[#0A0A0B] border border-[#222226] flex items-center justify-center text-[#CCFF00] font-black shadow-[0_0_20px_rgba(204,255,0,0.25)]">
            <Radio className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#CCFF00] shadow-[0_0_10px_rgba(204,255,0,0.9)] animate-pulse" />
              <h2 className="text-xl sm:text-2xl font-black font-mono tracking-wider text-white">
                LIVE PERFORMANCE HUD
              </h2>
            </div>
            <p className="text-xs text-gray-400 font-mono mt-0.5">
              High-Visibility Stage Mode • Instant MIDI Foot Controller Response (0.0ms Latency)
            </p>
          </div>
        </div>

        {/* Global Live Info Tiles (BPM, Tuner, MIDI Indicator, Fullscreen) */}
        <div className="flex items-center gap-3 flex-wrap">
          {/* Last MIDI Trigger Flash */}
          {lastMidiTrigger && (
            <div className="px-3 py-1.5 rounded-xl bg-[#CCFF00] text-black font-black text-xs font-mono animate-bounce shadow-lg">
              MIDI: {lastMidiTrigger}
            </div>
          )}

          {/* Tap Tempo & BPM Display */}
          <button
            id="live-hud-tap-tempo"
            onClick={handleTapTempo}
            className="flex items-center gap-2.5 bg-[#0A0A0B] hover:bg-[#1D1D21] border border-[#222226] rounded-2xl px-4 py-2.5 transition-all active:scale-95 shadow-md cursor-pointer"
            title="Tap Tempo (or press Spacebar)"
          >
            <Zap className="w-4 h-4 text-[#CCFF00] fill-current animate-pulse" />
            <div className="text-left font-mono">
              <div className="text-[9px] text-gray-500 uppercase font-bold tracking-widest">TAP TEMPO</div>
              <div className="text-base font-black text-[#CCFF00]">{bpm} BPM</div>
            </div>
          </button>

          {/* MIDI Config Button */}
          <button
            id="btn-live-midi-settings"
            onClick={onOpenMidiSettings}
            className="flex items-center gap-2 bg-[#0A0A0B] hover:bg-[#1D1D21] border border-[#222226] rounded-2xl px-3.5 py-2.5 transition-all text-gray-200 font-mono text-xs cursor-pointer"
          >
            <Settings className="w-4 h-4 text-[#CCFF00]" />
            <span className="font-bold">MIDI RIG</span>
          </button>

          {/* Fullscreen Toggle */}
          <button
            id="btn-live-fullscreen"
            onClick={toggleFullscreen}
            className="p-3 bg-[#0A0A0B] hover:bg-[#1D1D21] border border-[#222226] rounded-2xl text-gray-400 hover:text-white transition-all cursor-pointer"
            title="Toggle Stage Fullscreen"
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Active Rig Status Bento Card */}
      <div className="bg-[#141416] border border-[#222226] rounded-3xl p-6 shadow-2xl flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-3">
            <span className="px-3 py-1 rounded-lg bg-[#CCFF00] text-black font-black text-xs font-mono uppercase">
              ACTIVE SCENE: {activePreset.subgenre}
            </span>
            <span className="text-xs font-mono text-gray-400">AMP: {activePreset.params.ampModel}</span>
          </div>
          <h3 className="text-2xl sm:text-3xl font-black text-white font-mono mt-2 tracking-tight">
            {activePreset.name}
          </h3>
          <p className="text-xs text-gray-400 mt-1 max-w-2xl">{activePreset.description}</p>
        </div>

        {/* Big Stomp Status Toggles */}
        <div className="flex items-center gap-3">
          {/* Boost / Drive Stomp */}
          <button
            id="live-stomp-drive"
            onClick={() => {
              const next = !driveEnabled;
              setDriveEnabled(next);
              audioEngine.applyAmpParams({ ...activePreset.params, driveEnabled: next });
            }}
            className={`w-28 h-28 rounded-2xl border-2 flex flex-col items-center justify-center font-mono font-black transition-all transform active:scale-95 shadow-xl cursor-pointer ${
              driveEnabled
                ? "bg-[#CCFF00] text-black border-[#CCFF00] shadow-[0_0_20px_rgba(204,255,0,0.4)]"
                : "bg-[#0A0A0B] text-gray-500 border-[#222226]"
            }`}
          >
            <Flame className="w-7 h-7 mb-1" />
            <span className="text-xs">TS9 BOOST</span>
            <span className="text-[10px] mt-0.5">{driveEnabled ? "ENGAGED" : "OFF"}</span>
          </button>

          {/* Delay Stomp */}
          <button
            id="live-stomp-delay"
            onClick={() => {
              const next = !delayEnabled;
              setDelayEnabled(next);
              audioEngine.applyAmpParams({ ...activePreset.params, delayEnabled: next });
            }}
            className={`w-28 h-28 rounded-2xl border-2 flex flex-col items-center justify-center font-mono font-black transition-all transform active:scale-95 shadow-xl cursor-pointer ${
              delayEnabled
                ? "bg-cyan-400 text-black border-cyan-400 shadow-[0_0_20px_rgba(34,211,238,0.4)]"
                : "bg-[#0A0A0B] text-gray-500 border-[#222226]"
            }`}
          >
            <Activity className="w-7 h-7 mb-1" />
            <span className="text-xs">DELAY</span>
            <span className="text-[10px] mt-0.5">{delayEnabled ? "ACTIVE" : "OFF"}</span>
          </button>

          {/* Mute / Tuner Stomp */}
          <button
            id="live-stomp-mute"
            onClick={() => {
              const muted = audioEngine.toggleMute();
              setIsMuted(muted);
            }}
            className={`w-28 h-28 rounded-2xl border-2 flex flex-col items-center justify-center font-mono font-black transition-all transform active:scale-95 shadow-xl cursor-pointer ${
              isMuted
                ? "bg-red-500 text-white border-red-400 shadow-[0_0_20px_rgba(239,68,68,0.5)] animate-pulse"
                : "bg-[#0A0A0B] text-gray-400 border-[#222226]"
            }`}
          >
            {isMuted ? <VolumeX className="w-7 h-7 mb-1" /> : <Volume2 className="w-7 h-7 mb-1" />}
            <span className="text-xs">MUTE / TUNE</span>
            <span className="text-[10px] mt-0.5">{isMuted ? "MUTED" : "LIVE"}</span>
          </button>
        </div>
      </div>

      {/* Giant Stage Preset Selector Tiles */}
      <div>
        <div className="flex items-center justify-between pb-3">
          <h4 className="text-xs font-mono font-bold uppercase text-gray-400 tracking-wider">
            STAGE FOOT PEDAL SLOTS (HOTKEYS 1-6 / MIDI PC 0-5)
          </h4>
          <span className="text-xs font-mono text-[#CCFF00]">Click tile or press MIDI pedalboard switch</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {FACTORY_PRESETS.slice(0, 6).map((preset, idx) => {
            const isSelected = activePreset.id === preset.id;
            return (
              <button
                key={preset.id}
                id={`live-pedal-slot-${idx + 1}`}
                onClick={() => handleSelectLivePreset(preset)}
                className={`p-6 rounded-3xl border text-left transition-all relative overflow-hidden flex flex-col justify-between min-h-[140px] transform active:scale-95 cursor-pointer ${
                  isSelected
                    ? "bg-[#1D1D21] text-white border-[#CCFF00] shadow-[0_0_25px_rgba(204,255,0,0.3)] scale-[1.02] ring-1 ring-[#CCFF00]"
                    : "bg-[#141416] border-[#222226] hover:border-[#333338] text-white"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span
                      className={`w-7 h-7 rounded-xl flex items-center justify-center font-mono font-black text-xs ${
                        isSelected ? "bg-[#CCFF00] text-black" : "bg-[#0A0A0B] text-gray-400 border border-[#222226]"
                      }`}
                    >
                      {idx + 1}
                    </span>
                    <span
                      className={`text-xs font-mono font-bold uppercase ${
                        isSelected ? "text-[#CCFF00]" : "text-gray-400"
                      }`}
                    >
                      {preset.subgenre}
                    </span>
                  </div>

                  {isSelected && (
                    <span className="px-2.5 py-0.5 rounded-full bg-[#CCFF00] text-black font-mono text-[10px] font-bold">
                      ACTIVE
                    </span>
                  )}
                </div>

                <div className="mt-4">
                  <h3
                    className="text-lg sm:text-xl font-black font-mono leading-tight text-white"
                  >
                    {preset.name}
                  </h3>
                  <p
                    className="text-xs mt-1 font-mono line-clamp-1 text-gray-400"
                  >
                    {preset.description}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
