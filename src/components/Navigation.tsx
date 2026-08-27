import React from "react";
import {
  Flame,
  Sliders,
  Radio,
  Activity,
  Layers,
  Volume2,
  VolumeX,
  Mic,
  MicOff,
  Zap,
  BookOpen,
} from "lucide-react";

export type StudioTab = "transposer" | "amp-rig" | "live-hud" | "tuner" | "daw" | "metal-history";

interface NavigationProps {
  currentTab: StudioTab;
  onSelectTab: (tab: StudioTab) => void;
  onOpenMidiSettings: () => void;
  isLiveInputActive: boolean;
  onToggleLiveInput: () => void;
  isMuted: boolean;
  onToggleMute: () => void;
  connectedMidiCount: number;
}

export const Navigation: React.FC<NavigationProps> = ({
  currentTab,
  onSelectTab,
  onOpenMidiSettings,
  isLiveInputActive,
  onToggleLiveInput,
  isMuted,
  onToggleMute,
  connectedMidiCount,
}) => {
  const tabs = [
    {
      id: "transposer" as StudioTab,
      label: "DROP C TRANSPOSER",
      icon: Flame,
      badge: "AI Chords & Tabs",
    },
    {
      id: "amp-rig" as StudioTab,
      label: "AMP RIG & PEDALS",
      icon: Sliders,
      badge: "5150 / TS9 / IRs",
    },
    {
      id: "live-hud" as StudioTab,
      label: "LIVE STAGE HUD",
      icon: Radio,
      badge: "0ms MIDI Control",
    },
    {
      id: "tuner" as StudioTab,
      label: "PRECISION TUNER",
      icon: Activity,
      badge: "Strobe Meter",
    },
    {
      id: "daw" as StudioTab,
      label: "MULTITRACK DAW",
      icon: Layers,
      badge: "4-Track & Editor",
    },
    {
      id: "metal-history" as StudioTab,
      label: "METAL ENCYCLOPEDIA",
      icon: BookOpen,
      badge: "Eras & Subgenres",
    },
  ];

  return (
    <header className="sticky top-0 z-40 bg-[#0A0A0B]/90 backdrop-blur-md border-b border-[#222226]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 space-y-3">
        {/* Top Bento Header Bar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-[#141416] border border-[#222226] rounded-2xl p-3.5 sm:px-5">
          {/* Logo & Subtitle */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#CCFF00] flex items-center justify-center text-black shadow-[0_0_15px_rgba(204,255,0,0.35)] shrink-0">
              <Zap className="w-5 h-5 fill-current" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg sm:text-xl font-black font-mono tracking-tight text-white">
                  DROP<span className="text-[#CCFF00]">C</span> METALFORGE
                </h1>
                <span className="px-2 py-0.5 rounded bg-[#1D1D21] text-[#CCFF00] border border-[#333338] text-[10px] font-mono font-bold uppercase tracking-wider">
                  BENTO DSP v2.5
                </span>
              </div>
              <p className="text-[11px] text-gray-400 font-mono">
                Tuning: <strong className="text-gray-200">Drop C (C-G-C-F-A-D)</strong> • Zero-Latency Web Audio Engine
              </p>
            </div>
          </div>

          {/* Telemetry & Action Bar */}
          <div className="flex items-center gap-4 sm:gap-6 flex-wrap">
            {/* System Latency Telemetry */}
            <div className="hidden lg:flex flex-col items-end">
              <span className="text-[9px] uppercase tracking-widest text-gray-500 font-mono">System Latency</span>
              <span className="text-xs font-mono font-bold text-[#CCFF00]">0.8ms (ASIO)</span>
            </div>

            {/* CPU Load Telemetry */}
            <div className="hidden lg:flex flex-col items-end">
              <span className="text-[9px] uppercase tracking-widest text-gray-500 font-mono">CPU Load</span>
              <span className="text-xs font-mono font-bold text-[#CCFF00]">12%</span>
            </div>

            <div className="hidden sm:block h-7 w-[1px] bg-[#222226]"></div>

            {/* Live Guitar Input Button */}
            <button
              id="nav-btn-guitar-input"
              onClick={onToggleLiveInput}
              className={`px-3.5 py-1.5 rounded-lg font-mono text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
                isLiveInputActive
                  ? "bg-red-500 text-white animate-pulse shadow-md shadow-red-500/30"
                  : "bg-[#1D1D21] hover:bg-[#25252b] text-gray-300 border border-[#333338]"
              }`}
              title="Toggle Live Audio / Instrument Interface Input"
            >
              {isLiveInputActive ? (
                <>
                  <Mic className="w-3.5 h-3.5" />
                  <span>LIVE INPUT: ON</span>
                </>
              ) : (
                <>
                  <MicOff className="w-3.5 h-3.5 text-gray-500" />
                  <span>DIRECT INACTIVE</span>
                </>
              )}
            </button>

            {/* MIDI Controller Pill */}
            <button
              id="nav-btn-midi-settings"
              onClick={onOpenMidiSettings}
              className="px-3 py-1.5 rounded-lg bg-[#1D1D21] hover:bg-[#25252b] border border-[#333338] text-gray-300 hover:text-white font-mono text-xs flex items-center gap-1.5 transition-all cursor-pointer"
              title="Open MIDI Foot Controller Pedalboard Mappings"
            >
              <Radio className="w-3.5 h-3.5 text-[#CCFF00]" />
              <span>MIDI</span>
              <span className="px-1.5 py-0.2 rounded bg-[#0A0A0B] text-[#CCFF00] text-[10px] font-bold border border-[#333338]">
                {connectedMidiCount > 0 ? `${connectedMidiCount} PEDAL` : "SETUP"}
              </span>
            </button>

            {/* Master Mute / Tuner Toggle */}
            <button
              id="nav-btn-master-mute"
              onClick={onToggleMute}
              className={`p-2 rounded-lg border transition-all cursor-pointer ${
                isMuted
                  ? "bg-red-500 text-white border-red-400 shadow-md animate-pulse"
                  : "bg-[#1D1D21] hover:bg-[#25252b] text-gray-300 border-[#333338]"
              }`}
              title="Master Mute / Output Killswitch"
            >
              {isMuted ? <VolumeX className="w-4 h-4 text-white" /> : <Volume2 className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Bento Module Switcher Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          {tabs.map((tab) => {
            const isCurrent = currentTab === tab.id;
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                id={`nav-tab-${tab.id}`}
                onClick={() => onSelectTab(tab.id)}
                className={`px-4 py-2.5 rounded-xl font-mono text-xs font-bold transition-all flex items-center gap-2.5 whitespace-nowrap border cursor-pointer ${
                  isCurrent
                    ? "bg-[#CCFF00] text-black border-[#CCFF00] shadow-[0_0_15px_rgba(204,255,0,0.25)]"
                    : "bg-[#141416] hover:bg-[#1D1D21] text-gray-400 hover:text-gray-200 border-[#222226]"
                }`}
              >
                <Icon className={`w-4 h-4 ${isCurrent ? "text-black" : "text-[#CCFF00]"}`} />
                <span className="tracking-tight uppercase">{tab.label}</span>
                <span
                  className={`text-[9px] px-1.5 py-0.5 rounded font-mono font-bold uppercase ${
                    isCurrent ? "bg-black/20 text-black" : "bg-[#0A0A0B] text-gray-400 border border-[#222226]"
                  }`}
                >
                  {tab.badge}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </header>
  );
};
