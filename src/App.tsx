import React, { useState, useEffect } from "react";
import { AudioEngine } from "./audio/audioEngine";
import { FACTORY_PRESETS } from "./audio/presetLibrary";
import { MidiEngine } from "./audio/midiEngine";
import { Navigation, StudioTab } from "./components/Navigation";
import { TransposerStudio } from "./components/TransposerStudio";
import { AmpRigStudio } from "./components/AmpRigStudio";
import { LivePerformanceHUD } from "./components/LivePerformanceHUD";
import { DropCTuner } from "./components/DropCTuner";
import { MultitrackDAW } from "./components/MultitrackDAW";
import { MetalHistoryStudio } from "./components/MetalHistoryStudio";
import { MidiSettingsModal } from "./components/MidiSettingsModal";
import { FooterVuMeter } from "./components/FooterVuMeter";

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
        {currentTab === "transposer" && (
          <TransposerStudio
            onNavigateToAmp={() => setCurrentTab("amp-rig")}
            onLoadAmpPreset={(presetId) => {
              const preset = FACTORY_PRESETS.find((p) => p.id === presetId);
              if (preset) {
                audioEngine.applyAmpParams(preset.params);
              }
            }}
          />
        )}
        {currentTab === "amp-rig" && <AmpRigStudio />}
        {currentTab === "live-hud" && (
          <LivePerformanceHUD onOpenMidiSettings={() => setIsMidiModalOpen(true)} />
        )}
        {currentTab === "tuner" && <DropCTuner />}
        {currentTab === "daw" && <MultitrackDAW />}
        {currentTab === "metal-history" && (
          <MetalHistoryStudio
            onSelectPreset={(presetId) => {
              // Apply preset through audioEngine
              const preset = FACTORY_PRESETS.find((p) => p.id === presetId);
              if (preset) {
                audioEngine.applyAmpParams(preset.params);
              }
            }}
            onNavigateToAmp={() => setCurrentTab("amp-rig")}
          />
        )}
      </main>

      {/* MIDI Controller Settings Modal */}
      <MidiSettingsModal isOpen={isMidiModalOpen} onClose={() => setIsMidiModalOpen(false)} />

      {/* Bento Grid Telemetry Footer with Amplitude-Reactive VU Meter */}
      <FooterVuMeter isMuted={isMuted} isLiveInputActive={isLiveInputActive} />
    </div>
  );
}
