import React, { useState, useEffect } from "react";
import { MidiEngine } from "../audio/midiEngine";
import { MidiDevice, MidiMapping } from "../types";
import {
  Radio,
  Trash2,
  RefreshCw,
  Zap,
  X,
  Sparkles,
} from "lucide-react";

interface MidiSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const MidiSettingsModal: React.FC<MidiSettingsModalProps> = ({ isOpen, onClose }) => {
  const midiEngine = MidiEngine.getInstance();
  const [devices, setDevices] = useState<MidiDevice[]>([]);
  const [mappings, setMappings] = useState<MidiMapping[]>([]);
  const [isLearning, setIsLearning] = useState(false);
  const [lastMsg, setLastMsg] = useState<any>(null);
  const [learningIndex, setLearningIndex] = useState<number | null>(null);

  useEffect(() => {
    if (isOpen) {
      midiEngine.init().then(() => {
        setDevices([...midiEngine.connectedDevices]);
        setMappings([...midiEngine.mappings]);
      });
    }
  }, [isOpen]);

  useEffect(() => {
    const timer = setInterval(() => {
      if (isOpen) {
        setDevices([...midiEngine.connectedDevices]);
        setMappings([...midiEngine.mappings]);
        setIsLearning(midiEngine.isLearning);
        setLastMsg(midiEngine.lastReceivedMessage);
      }
    }, 150);
    return () => clearInterval(timer);
  }, [isOpen]);

  if (!isOpen) return null;

  const handleStartLearn = (index: number, mapping: MidiMapping) => {
    setLearningIndex(index);
    midiEngine.startMidiLearn(mapping);
  };

  const handleCancelLearn = () => {
    setLearningIndex(null);
    midiEngine.cancelMidiLearn();
  };

  const handleDeleteMapping = (index: number) => {
    midiEngine.deleteMapping(index);
    setMappings([...midiEngine.mappings]);
  };

  const handleResetDefaults = () => {
    midiEngine.resetToDefaults();
    setMappings([...midiEngine.mappings]);
  };

  const handleSimulatePC = (number: number) => {
    midiEngine.simulateMidi("pc", number);
  };

  const handleSimulateCC = (number: number) => {
    midiEngine.simulateMidi("cc", number);
  };

  return (
    <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-4">
      <div className="bg-[#141416] border border-[#222226] rounded-3xl p-6 sm:p-7 max-w-3xl w-full shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-[#222226]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#0A0A0B] border border-[#222226] flex items-center justify-center text-[#CCFF00]">
              <Radio className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-bold font-mono text-white flex items-center gap-2">
                MIDI FOOT CONTROLLER INTEGRATION
              </h2>
              <p className="text-xs text-gray-400">
                Plug-and-play support for Behringer FCB1010, Morningstar, Line 6, MeloAudio & USB Pedalboards
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-[#0A0A0B] hover:bg-[#1D1D21] border border-[#222226] text-gray-400 hover:text-white transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Connected Hardware Devices Status */}
        <div className="bg-[#0A0A0B] rounded-2xl p-4 border border-[#222226] space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-white flex items-center gap-2">
              <Zap className="w-4 h-4 text-[#CCFF00]" /> DETECTED MIDI INTERFACES ({devices.length}):
            </h3>
            <button
              onClick={() => midiEngine.init()}
              className="text-xs font-mono text-[#CCFF00] hover:underline flex items-center gap-1 cursor-pointer font-bold"
            >
              <RefreshCw className="w-3 h-3" /> Rescan Devices
            </button>
          </div>

          {devices.length === 0 ? (
            <div className="p-4 rounded-xl bg-[#141416] border border-[#222226] text-center space-y-1">
              <p className="text-xs text-gray-300 font-mono">
                No physical MIDI foot controller detected right now.
              </p>
              <p className="text-[11px] text-gray-400">
                Plug in any USB MIDI pedalboard or use hotkeys <strong className="text-[#CCFF00]">1-6</strong>, <strong className="text-[#CCFF00]">B</strong> (Boost),{" "}
                <strong className="text-[#CCFF00]">D</strong> (Delay), <strong className="text-[#CCFF00]">M</strong> (Mute), <strong className="text-[#CCFF00]">Space</strong> (Tap Tempo).
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {devices.map((d) => (
                <div
                  key={d.id}
                  className="flex items-center justify-between p-3 rounded-xl bg-[#141416] border border-[#CCFF00]/30 text-xs font-mono"
                >
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#CCFF00] shadow-[0_0_6px_rgba(204,255,0,0.8)]" />
                    <span className="font-bold text-white">{d.name}</span>
                    <span className="text-gray-400">({d.manufacturer})</span>
                  </div>
                  <span className="px-2 py-0.5 rounded bg-[#1D1D21] text-[#CCFF00] border border-[#CCFF00]/30 text-[10px] font-bold">
                    CONNECTED (0ms)
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Live Incoming Monitor */}
        <div className="bg-[#0A0A0B] rounded-2xl p-4 border border-[#222226] flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-3">
            <span className="text-[10px] font-mono text-gray-500 font-bold uppercase tracking-widest">LIVE MIDI MONITOR:</span>
            {lastMsg ? (
              <span className="font-mono text-xs text-[#CCFF00] bg-[#141416] px-3 py-1 rounded-lg border border-[#222226]">
                {lastMsg.type} | Ch: {lastMsg.channel} | #{lastMsg.number} | Val: {lastMsg.value} ({lastMsg.time})
              </span>
            ) : (
              <span className="text-xs text-gray-400 font-mono">Awaiting MIDI input message...</span>
            )}
          </div>

          {isLearning && (
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-full bg-[#CCFF00] text-black text-xs font-mono font-black animate-pulse">
                WAITING FOR PEDAL PRESS...
              </span>
              <button
                onClick={handleCancelLearn}
                className="px-2.5 py-1 rounded bg-[#141416] border border-[#222226] text-xs font-mono text-gray-300 hover:bg-[#1D1D21] cursor-pointer"
              >
                Cancel
              </button>
            </div>
          )}
        </div>

        {/* MIDI Action Mappings Table */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-white">PEDALBOARD ACTION MAPPINGS:</h3>
            <button
              onClick={handleResetDefaults}
              className="text-xs font-mono text-gray-400 hover:text-white transition-colors cursor-pointer"
            >
              Reset to Factory Mappings
            </button>
          </div>

          <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
            {mappings.map((m, idx) => (
              <div
                key={idx}
                className={`p-3 rounded-xl border flex items-center justify-between text-xs font-mono transition-all ${
                  learningIndex === idx
                    ? "bg-[#1D1D21] border-[#CCFF00] ring-1 ring-[#CCFF00]"
                    : "bg-[#0A0A0B] border-[#222226]"
                }`}
              >
                <div>
                  <div className="font-bold text-white">{m.description}</div>
                  <div className="text-[11px] text-[#CCFF00]/80 mt-0.5">
                    Type: <strong className="uppercase">{m.messageType}</strong> | Msg Number: #{m.number} | Target:{" "}
                    {m.targetPresetId || m.action}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleStartLearn(idx, m)}
                    className={`px-3 py-1 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer ${
                      learningIndex === idx
                        ? "bg-[#CCFF00] text-black animate-pulse"
                        : "bg-[#141416] hover:bg-[#CCFF00] hover:text-black text-gray-200 border border-[#222226]"
                    }`}
                  >
                    {learningIndex === idx ? "Listening..." : "MIDI Learn"}
                  </button>

                  <button
                    onClick={() => handleDeleteMapping(idx)}
                    className="p-1.5 rounded-lg bg-[#141416] border border-[#222226] hover:bg-red-500/20 text-gray-400 hover:text-red-400 transition-all cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Virtual Test Triggers */}
        <div className="pt-3 border-t border-[#222226] flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-1.5 text-xs font-mono text-gray-400">
            <Sparkles className="w-3.5 h-3.5 text-[#CCFF00]" /> Virtual Pedal Tester:
          </div>
          <div className="flex items-center gap-1.5 flex-wrap">
            {[0, 1, 2, 3, 4].map((num) => (
              <button
                key={num}
                onClick={() => handleSimulatePC(num)}
                className="px-2 py-1 rounded bg-[#0A0A0B] border border-[#222226] hover:bg-[#CCFF00] hover:text-black text-[11px] font-mono text-gray-300 transition-colors cursor-pointer"
              >
                PC {num + 1}
              </button>
            ))}
            <button
              onClick={() => handleSimulateCC(64)}
              className="px-2 py-1 rounded bg-[#0A0A0B] border border-[#222226] hover:bg-[#CCFF00] hover:text-black text-[11px] font-mono text-gray-300 transition-colors cursor-pointer"
            >
              CC 64 (Boost)
            </button>
            <button
              onClick={() => handleSimulateCC(65)}
              className="px-2 py-1 rounded bg-[#0A0A0B] border border-[#222226] hover:bg-cyan-400 hover:text-black text-[11px] font-mono text-gray-300 transition-colors cursor-pointer"
            >
              CC 65 (Delay)
            </button>
            <button
              onClick={() => handleSimulateCC(66)}
              className="px-2 py-1 rounded bg-[#0A0A0B] border border-[#222226] hover:bg-red-500 hover:text-white text-[11px] font-mono text-gray-300 transition-colors cursor-pointer"
            >
              CC 66 (Mute)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
