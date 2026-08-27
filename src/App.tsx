import React, { useState, useEffect } from "react";
import { AudioEngine } from "./audio/audioEngine";
import { MidiEngine } from "./audio/midiEngine";
import { Navigation, StudioTab } from "./components/Navigation";
import { TransposerStudio } from "./components/TransposerStudio";
import { AmpRigStudio } from "./components/AmpRigStudio";
import { LivePerformanceHUD } from "./components/LivePerformanceHUD";
import { DropCTuner } from "./components/DropCTuner";
import { MultitrackDAW } from "./components/MultitrackDAW";
import { MidiSettingsModal } from "./components/MidiSettingsModal";

export default function App() {
  const [currentTab, setCurrentTab] = useState<StudioTab>("transposer");
  const [isMidiModalOpen, setIsMidiModalOpen] = useState(false);
  const [isLiveInputActive, setIsLiveInputActive] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [connectedMidiCount, setConnectedMidiCount] = useState(0);

  const audioEngine = AudioEngine.getInstance();
  const midiEngine = MidiEngine.getInstance();

  // Initialize MIDI & Audio on mount
  useEffect(() => {
    midiEngine.init().then(() => {
      setConnectedMidiCount(midiEngine.connectedDevices.length);
    });

    const interval = setInterval(() => {
      setConnectedMidiCount(midiEngine.connectedDevices.length);
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const handleToggleLiveInput = async () => {
    if (isLiveInputActive) {
      audioEngine.disableLiveInput();
      setIsLiveInputActive(false);
    } else {
      const ok = await audioEngine.enableLiveInput(256);
      if (ok) {
        setIsLiveInputActive(true);
      } else {
        alert("Could not access audio interface / microphone. Please verify device permissions in your browser.");
      }
    }
  };

  const handleToggleMute = () => {
    const muted = audioEngine.toggleMute();
    setIsMuted(muted);
  };

  return (
    <div className="min-h-screen bg-[#0A0A0B] text-gray-200 flex flex-col font-sans selection:bg-[#CCFF00] selection:text-black">
      {/* Bento Studio Header & Navigation Bar */}
      <Navigation
        currentTab={currentTab}
        onSelectTab={setCurrentTab}
        onOpenMidiSettings={() => setIsMidiModalOpen(true)}
        isLiveInputActive={isLiveInputActive}
        onToggleLiveInput={handleToggleLiveInput}
        isMuted={isMuted}
        onToggleMute={handleToggleMute}
        connectedMidiCount={connectedMidiCount}
      />

      {/* Main Bento Studio Viewport */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 pb-20">
        {currentTab === "transposer" && <TransposerStudio />}
        {currentTab === "amp-rig" && <AmpRigStudio />}
        {currentTab === "live-hud" && (
          <LivePerformanceHUD onOpenMidiSettings={() => setIsMidiModalOpen(true)} />
        )}
        {currentTab === "tuner" && <DropCTuner />}
        {currentTab === "daw" && <MultitrackDAW />}
      </main>

      {/* MIDI Controller Settings Modal */}
      <MidiSettingsModal isOpen={isMidiModalOpen} onClose={() => setIsMidiModalOpen(false)} />

      {/* Bento Grid Telemetry Footer */}
      <footer className="bg-[#141416] border-t border-[#222226] py-3.5 px-4 sm:px-6 text-xs text-gray-400 font-mono">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-6 flex-wrap">
            <div className="flex flex-col">
              <span className="text-[9px] uppercase tracking-widest text-gray-500">Audio Buffer</span>
              <span className="text-xs font-mono font-bold text-gray-200">128 Samples</span>
            </div>
            <div className="flex flex-col">
              <span className="text-[9px] uppercase tracking-widest text-gray-500">Sample Rate</span>
              <span className="text-xs font-mono font-bold text-gray-200">96.0 kHz</span>
            </div>
            <div className="flex flex-col">
              <span className="text-[9px] uppercase tracking-widest text-gray-500">Drop C Strings</span>
              <span className="text-xs font-mono font-bold text-[#CCFF00]">C2 - G2 - C3 - F3 - A3 - D4</span>
            </div>
          </div>

          {/* Master Output VU Meter */}
          <div className="flex items-center gap-4">
            <span className="text-[9px] uppercase tracking-widest text-gray-500">Master Out</span>
            <div className="h-3.5 w-44 sm:w-56 bg-[#0A0A0B] rounded-md relative overflow-hidden border border-[#222226]">
              <div
                className="absolute top-0 bottom-0 left-0 bg-gradient-to-r from-emerald-500 via-[#CCFF00] to-red-500 transition-all duration-75"
                style={{ width: isMuted ? "0%" : isLiveInputActive ? "68%" : "35%" }}
              ></div>
            </div>
            <span className="text-xs font-mono font-bold text-[#CCFF00]">
              {isMuted ? "MUTED" : "-3.4 dB"}
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}
