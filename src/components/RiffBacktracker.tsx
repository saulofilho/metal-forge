import React, { useState, useEffect, useRef, useCallback } from "react";
import { AudioEngine } from "../audio/audioEngine";
import {
  DROP_C_POWER_CHORDS,
  DEFAULT_BACKTRACKER_PRESETS,
} from "../audio/dropCData";
import {
  BacktrackerChordItem,
  DrumBeatPattern,
  MetalSubgenre,
  StrumPatternFeel,
  TransposedSongData,
} from "../types";
import { motion, AnimatePresence } from "motion/react";
import {
  Play,
  Square,
  Volume2,
  VolumeX,
  Plus,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Zap,
  Flame,
  Music,
  Sliders,
  RotateCcw,
  Sparkles,
  Gauge,
  Layers,
  Clock,
  ArrowRight,
  TrendingUp,
  Check,
  Headphones,
} from "lucide-react";

interface RiffBacktrackerProps {
  transposedData?: TransposedSongData | null;
  songTitle?: string;
  artist?: string;
  onNavigateToAmp?: () => void;
}

export const RiffBacktracker: React.FC<RiffBacktrackerProps> = ({
  transposedData,
  songTitle,
  artist,
  onNavigateToAmp,
}) => {
  const audioEngine = AudioEngine.getInstance();

  // State: Progression & Feel
  const [selectedPresetId, setSelectedPresetId] = useState<string>(
    DEFAULT_BACKTRACKER_PRESETS[0].id
  );
  const [chords, setChords] = useState<BacktrackerChordItem[]>(
    DEFAULT_BACKTRACKER_PRESETS[0].chords
  );
  const [bpm, setBpm] = useState<number>(DEFAULT_BACKTRACKER_PRESETS[0].defaultBpm);
  const [baseBpm, setBaseBpm] = useState<number>(
    DEFAULT_BACKTRACKER_PRESETS[0].defaultBpm
  );
  const [speedMultiplier, setSpeedMultiplier] = useState<number>(1.0);
  const [drumPattern, setDrumPattern] = useState<DrumBeatPattern>(
    DEFAULT_BACKTRACKER_PRESETS[0].drumPattern
  );
  const [strumFeel, setStrumFeel] = useState<StrumPatternFeel>(
    DEFAULT_BACKTRACKER_PRESETS[0].strumFeel
  );

  // Playback & Session state
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [enableCountIn, setEnableCountIn] = useState<boolean>(true);
  const [loopMode, setLoopMode] = useState<"loop_indefinite" | "single_pass">(
    "loop_indefinite"
  );

  // Mixer Volumes
  const [playDrums, setPlayDrums] = useState<boolean>(true);
  const [playChords, setPlayChords] = useState<boolean>(true);
  const [playClick, setPlayClick] = useState<boolean>(true);
  const [drumsVolume, setDrumsVolume] = useState<number>(0.9);
  const [chordsVolume, setChordsVolume] = useState<number>(0.85);
  const [clickVolume, setClickVolume] = useState<number>(0.65);

  // Speed Accelerator Drill Mode
  const [autoSpeedTrainer, setAutoSpeedTrainer] = useState<boolean>(false);
  const [speedIncrement, setSpeedIncrement] = useState<number>(2);
  const [speedIntervalLoops, setSpeedIntervalLoops] = useState<number>(2);

  // Live Step Tracking
  const [currentStep16, setCurrentStep16] = useState<number>(0);
  const [currentBeat, setCurrentBeat] = useState<number>(0);
  const [currentChordIndex, setCurrentChordIndex] = useState<number>(0);
  const [currentChord, setCurrentChord] = useState<BacktrackerChordItem | null>(null);
  const [nextChord, setNextChord] = useState<BacktrackerChordItem | null>(null);
  const [loopCount, setLoopCount] = useState<number>(0);
  const [isCountIn, setIsCountIn] = useState<boolean>(false);
  const [countInBeat, setCountInBeat] = useState<number>(0);
  const [activeBpm, setActiveBpm] = useState<number>(bpm);

  // Tap Tempo state
  const tapTimesRef = useRef<number[]>([]);
  const [tapFlash, setTapFlash] = useState<boolean>(false);

  // Stop backtracker when unmounting
  useEffect(() => {
    return () => {
      audioEngine.stopBacktracker();
    };
  }, [audioEngine]);

  // Load preset progression
  const handleSelectPreset = (presetId: string) => {
    const found = DEFAULT_BACKTRACKER_PRESETS.find((p) => p.id === presetId);
    if (!found) return;

    if (isPlaying) {
      audioEngine.stopBacktracker();
      setIsPlaying(false);
    }

    setSelectedPresetId(found.id);
    setChords([...found.chords]);
    setBaseBpm(found.defaultBpm);
    setBpm(Math.round(found.defaultBpm * speedMultiplier));
    setActiveBpm(Math.round(found.defaultBpm * speedMultiplier));
    setDrumPattern(found.drumPattern);
    setStrumFeel(found.strumFeel);
  };

  // Import section from transposed song
  const handleImportSongSection = (sectionIndex: number) => {
    if (!transposedData || !transposedData.sections[sectionIndex]) return;
    const sec = transposedData.sections[sectionIndex];

    if (isPlaying) {
      audioEngine.stopBacktracker();
      setIsPlaying(false);
    }

    const chordList = sec.metalChords.split(/[-–—,]/).map((c) => c.trim()).filter(Boolean);
    const newChords: BacktrackerChordItem[] = chordList.length > 0
      ? chordList.map((ch, idx) => {
          // Find matching power chord voicing or fallback to open C
          const match = DROP_C_POWER_CHORDS.find(
            (v) =>
              v.chordName.toLowerCase().startsWith(ch.toLowerCase().slice(0, 2)) ||
              v.metalName.toLowerCase().includes(ch.toLowerCase())
          );
          return {
            id: `sec-chord-${idx}-${Date.now()}`,
            chordName: ch,
            metalName: match?.metalName || `${ch} Drop C Shape`,
            fretPositions: match?.fretPositions || [0, 0, 0, "x", "x", "x"],
            durationBeats: 4,
            isPalmMute: sec.technique.toLowerCase().includes("palm") || sec.name.toLowerCase().includes("breakdown"),
            tabSnippet: sec.tab,
          };
        })
      : [
          {
            id: `sec-chord-0-${Date.now()}`,
            chordName: "C5 (Open Chug)",
            metalName: "0-0-0 Breakdown Tonic",
            fretPositions: [0, 0, 0, "x", "x", "x"],
            durationBeats: 4,
            isPalmMute: true,
          },
        ];

    setChords(newChords);
    setSelectedPresetId("custom-imported");
    const targetBpm = transposedData.bpm || 135;
    setBaseBpm(targetBpm);
    setBpm(Math.round(targetBpm * speedMultiplier));
    setActiveBpm(Math.round(targetBpm * speedMultiplier));
  };

  // Speed multiplier toggle (0.5x to 1.5x)
  const handleSpeedMultiplierChange = (mult: number) => {
    setSpeedMultiplier(mult);
    const newBpm = Math.round(baseBpm * mult);
    setBpm(newBpm);
    setActiveBpm(newBpm);
    if (isPlaying) {
      audioEngine.updateBacktrackerOptions({ bpm: newBpm });
    }
  };

  // Manual BPM change
  const handleBpmChange = (newBpm: number) => {
    const clamped = Math.max(40, Math.min(260, newBpm));
    setBpm(clamped);
    setBaseBpm(Math.round(clamped / speedMultiplier));
    setActiveBpm(clamped);
    if (isPlaying) {
      audioEngine.updateBacktrackerOptions({ bpm: clamped });
    }
  };

  // Tap Tempo calculation
  const handleTapTempo = () => {
    const now = performance.now();
    setTapFlash(true);
    setTimeout(() => setTapFlash(false), 120);

    const times = tapTimesRef.current;
    if (times.length > 0 && now - times[times.length - 1] > 2500) {
      tapTimesRef.current = [now];
      return;
    }

    times.push(now);
    if (times.length > 5) times.shift();

    if (times.length >= 2) {
      const intervals = [];
      for (let i = 1; i < times.length; i++) {
        intervals.push(times[i] - times[i - 1]);
      }
      const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;
      const calculatedBpm = Math.round(60000 / avgInterval);
      if (calculatedBpm >= 40 && calculatedBpm <= 260) {
        handleBpmChange(calculatedBpm);
      }
    }
  };

  // Toggle Playback
  const handleTogglePlay = async () => {
    if (isPlaying) {
      audioEngine.stopBacktracker();
      setIsPlaying(false);
      setIsCountIn(false);
      return;
    }

    await audioEngine.init();
    setIsPlaying(true);
    setLoopCount(0);

    await audioEngine.startBacktracker({
      bpm,
      drumPattern,
      strumFeel,
      chords,
      enableCountIn,
      playDrums,
      playChords,
      playClick,
      drumsVolume,
      chordsVolume,
      clickVolume,
      autoSpeedTrainer,
      speedTrainerIncrement: speedIncrement,
      speedTrainerIntervalLoops: speedIntervalLoops,
      loopMode,
      onStep: (info) => {
        setCurrentStep16(info.step16);
        setCurrentBeat(info.beat);
        setCurrentChordIndex(info.chordIndex);
        setCurrentChord(info.currentChord);
        setNextChord(info.nextChord);
        setIsCountIn(info.isCountIn);
        setCountInBeat(info.countInBeat);
        setActiveBpm(info.currentBpm);
      },
      onLoopCompleted: (loops, newBpm) => {
        setLoopCount(loops);
        setActiveBpm(newBpm);
        setBpm(newBpm);
      },
    });
  };

  // Sync mixer and options live
  useEffect(() => {
    if (isPlaying) {
      audioEngine.updateBacktrackerOptions({
        drumPattern,
        strumFeel,
        chords,
        playDrums,
        playChords,
        playClick,
        drumsVolume,
        chordsVolume,
        clickVolume,
        autoSpeedTrainer,
        speedTrainerIncrement: speedIncrement,
        speedTrainerIntervalLoops: speedIntervalLoops,
      });
    }
  }, [
    drumPattern,
    strumFeel,
    chords,
    playDrums,
    playChords,
    playClick,
    drumsVolume,
    chordsVolume,
    clickVolume,
    autoSpeedTrainer,
    speedIncrement,
    speedIntervalLoops,
    isPlaying,
    audioEngine,
  ]);

  // Spacebar play/pause listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.code === "Space" &&
        e.target instanceof HTMLElement &&
        !["INPUT", "TEXTAREA", "SELECT"].includes(e.target.tagName)
      ) {
        e.preventDefault();
        handleTogglePlay();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isPlaying, bpm, drumPattern, strumFeel, chords, enableCountIn, playDrums, playChords, playClick]);

  // Chord List Manipulation
  const handleAddChord = (voicing: (typeof DROP_C_POWER_CHORDS)[0]) => {
    const newChordItem: BacktrackerChordItem = {
      id: `chord-${Date.now()}`,
      chordName: voicing.chordName,
      metalName: voicing.metalName,
      fretPositions: voicing.fretPositions,
      durationBeats: 4,
      isPalmMute: false,
    };
    setChords([...chords, newChordItem]);
  };

  const handleRemoveChord = (index: number) => {
    if (chords.length <= 1) return;
    const copy = [...chords];
    copy.splice(index, 1);
    setChords(copy);
  };

  const handleMoveChord = (index: number, direction: "left" | "right") => {
    const targetIdx = direction === "left" ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= chords.length) return;
    const copy = [...chords];
    const temp = copy[index];
    copy[index] = copy[targetIdx];
    copy[targetIdx] = temp;
    setChords(copy);
  };

  const handleToggleChordPalmMute = (index: number) => {
    const copy = [...chords];
    copy[index].isPalmMute = !copy[index].isPalmMute;
    setChords(copy);
  };

  const handleChangeChordBeats = (index: number, beats: number) => {
    const copy = [...chords];
    copy[index].durationBeats = beats;
    setChords(copy);
  };

  return (
    <div className="w-full space-y-6" id="riff-backtracker-container">
      {/* Top Banner / Hero HUD */}
      <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-5 shadow-2xl relative overflow-hidden">
        {/* Glow backdrop */}
        <div className="absolute -top-24 -right-24 w-80 h-80 bg-red-600/10 blur-3xl rounded-full pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-80 h-80 bg-amber-600/10 blur-3xl rounded-full pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2.5">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase tracking-wider bg-red-950/80 text-red-400 border border-red-800/60">
                <span className={`w-2 h-2 rounded-full ${isPlaying ? "bg-red-500 animate-ping" : "bg-zinc-600"}`} />
                {isPlaying ? (isCountIn ? "COUNT-IN" : "PLAYING IN SYNC") : "READY"}
              </span>
              <h2 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
                <Flame className="w-5 h-5 text-red-500" />
                Riff Backtracker
              </h2>
            </div>
            <p className="text-xs text-zinc-400 max-w-xl">
              Overlay variable-speed metal drum grooves and metronome click over Drop C chord progressions.
              Practice tight palm-muted downpicking, breakdowns, and polyrhythms in perfect tempo.
            </p>
          </div>

          {/* Quick Preset Selector & Import */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1.5 bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <select
                id="backtracker-preset-select"
                aria-label="Riff Backtracker Preset"
                value={selectedPresetId}
                onChange={(e) => handleSelectPreset(e.target.value)}
                className="bg-transparent text-xs font-medium text-zinc-200 outline-none cursor-pointer pr-2"
              >
                {DEFAULT_BACKTRACKER_PRESETS.map((p) => (
                  <option key={p.id} value={p.id} className="bg-zinc-900 text-zinc-200">
                    {p.title} ({p.defaultBpm} BPM - {p.subgenre})
                  </option>
                ))}
                {selectedPresetId === "custom-imported" && (
                  <option value="custom-imported" className="bg-zinc-900 text-amber-400">
                    ★ Imported from Song ({songTitle || "Custom"})
                  </option>
                )}
              </select>
            </div>

            {/* If a transposed song is loaded, allow 1-click import */}
            {transposedData && transposedData.sections.length > 0 && (
              <div className="flex items-center gap-1.5 bg-red-950/40 border border-red-800/50 rounded-lg px-3 py-1.5">
                <Music className="w-3.5 h-3.5 text-red-400 shrink-0" />
                <select
                  id="backtracker-song-section-select"
                  aria-label="Import Section from Transposed Song"
                  onChange={(e) => {
                    const val = parseInt(e.target.value, 10);
                    if (!isNaN(val)) handleImportSongSection(val);
                  }}
                  defaultValue=""
                  className="bg-transparent text-xs font-medium text-red-200 outline-none cursor-pointer pr-2"
                >
                  <option value="" disabled className="bg-zinc-900 text-zinc-400">
                    Import Section ({songTitle || "Song"})...
                  </option>
                  {transposedData.sections.map((sec, idx) => (
                    <option key={idx} value={idx} className="bg-zinc-900 text-zinc-200">
                      Section {idx + 1}: {sec.name} ({sec.metalChords})
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
        </div>

        {/* 1. MASTER PERFORMANCE HUD (Live Chord + Metronome Beats + 16-Step LED Sequencer) */}
        <div className="mt-5 grid grid-cols-1 lg:grid-cols-12 gap-4">
          {/* Active Chord Focus Card */}
          <div className="lg:col-span-6 bg-zinc-900/90 border border-zinc-800 rounded-xl p-4 flex flex-col justify-between relative overflow-hidden">
            {/* Count In Banner */}
            <AnimatePresence>
              {isCountIn && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className="absolute inset-0 bg-red-950/95 border border-red-600/80 z-20 flex flex-col items-center justify-center rounded-xl p-4"
                >
                  <span className="text-xs uppercase font-bold tracking-widest text-red-400">
                    PRE-ROLL COUNT-IN
                  </span>
                  <div className="text-6xl font-black text-white tracking-wider my-1">
                    {countInBeat}
                  </div>
                  <div className="flex gap-2">
                    {[1, 2, 3, 4].map((b) => (
                      <div
                        key={b}
                        className={`w-3 h-3 rounded-full transition-all duration-150 ${
                          b <= countInBeat ? "bg-red-500 shadow-lg shadow-red-500/50 scale-110" : "bg-zinc-800"
                        }`}
                      />
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400">
                CURRENT VOICING ({currentChordIndex + 1}/{chords.length})
              </span>
              <div className="flex items-center gap-1.5">
                {currentChord?.isPalmMute ? (
                  <span className="px-2 py-0.5 text-[10px] font-bold uppercase rounded bg-amber-950/80 text-amber-400 border border-amber-800/60">
                    [PM] Palm Muted
                  </span>
                ) : (
                  <span className="px-2 py-0.5 text-[10px] font-bold uppercase rounded bg-zinc-800 text-zinc-300">
                    [RING] Open Ring
                  </span>
                )}
                <span className="px-2 py-0.5 text-[10px] font-bold uppercase rounded bg-zinc-800 text-zinc-300">
                  Loop #{loopCount + 1}
                </span>
              </div>
            </div>

            {/* Giant Active Chord Display */}
            <div className="my-3">
              <div className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
                {currentChord?.chordName || chords[0]?.chordName || "C5 (Open Chug)"}
              </div>
              <div className="text-xs font-mono text-amber-400 mt-1">
                {currentChord?.metalName || chords[0]?.metalName || "0-0-0 Low Tonic Barre"}
              </div>
              {/* Tab Notation Fret Map */}
              <div className="mt-2 text-xs font-mono bg-black/60 rounded-md px-3 py-1.5 text-emerald-400 border border-zinc-800/80 flex items-center justify-between">
                <span>Frets (6-1): [{currentChord?.fretPositions.join("-") || chords[0]?.fretPositions.join("-")}]</span>
                <span className="text-zinc-400 text-[11px]">{currentChord?.durationBeats || 4} Beats</span>
              </div>
            </div>

            {/* Next Chord Preview Banner */}
            <div className="pt-2 border-t border-zinc-800/80 flex items-center justify-between text-xs text-zinc-400">
              <span className="flex items-center gap-1">
                <ArrowRight className="w-3.5 h-3.5 text-zinc-400" />
                Next Chord:
              </span>
              <span className="font-semibold text-zinc-200">
                {nextChord?.chordName || chords[(currentChordIndex + 1) % chords.length]?.chordName || "—"}
              </span>
            </div>
          </div>

          {/* 4-Beat Glowing Metronome & 16-Step Drum Grid Matrix */}
          <div className="lg:col-span-6 bg-zinc-900/90 border border-zinc-800 rounded-xl p-4 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-red-400" />
                  Metronome & 16th-Step Subdivision
                </span>
                <span className="text-xs font-mono text-zinc-300">
                  Beat: <strong className="text-white font-bold">{currentBeat + 1}</strong>/4
                </span>
              </div>

              {/* 4 Large Quarter-Note Beat Orbs */}
              <div className="grid grid-cols-4 gap-2 mb-4">
                {[0, 1, 2, 3].map((b) => {
                  const isActive = isPlaying && currentBeat === b && !isCountIn;
                  const isBeat1 = b === 0;
                  return (
                    <div
                      key={b}
                      className={`h-12 rounded-lg flex flex-col items-center justify-center border transition-all duration-100 ${
                        isActive
                          ? isBeat1
                            ? "bg-red-600 text-white border-red-400 shadow-lg shadow-red-600/50 scale-105"
                            : "bg-amber-500 text-black border-amber-300 shadow-lg shadow-amber-500/50 scale-105"
                          : "bg-zinc-950 border-zinc-800 text-zinc-400"
                      }`}
                    >
                      <span className="text-sm font-black">{b + 1}</span>
                      <span className="text-[9px] uppercase tracking-tighter opacity-80">
                        {isBeat1 ? "Downbeat" : "Beat"}
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* 16-Step LED Grid Matrix */}
              <div className="space-y-1">
                <div className="flex items-center justify-between text-[10px] text-zinc-400 font-mono">
                  <span>16th Subdivision</span>
                  <span>1 e & a • 2 e & a • 3 e & a • 4 e & a</span>
                </div>
                <div className="grid grid-cols-16 gap-1">
                  {Array.from({ length: 16 }).map((_, idx) => {
                    const isStepActive = isPlaying && currentStep16 === idx && !isCountIn;
                    const isQuarter = idx % 4 === 0;
                    return (
                      <div
                        key={idx}
                        className={`h-6 rounded-sm flex items-center justify-center text-[9px] font-mono transition-all duration-75 ${
                          isStepActive
                            ? isQuarter
                              ? "bg-red-500 text-white shadow-md shadow-red-500/80 scale-110 font-bold"
                              : "bg-amber-400 text-black shadow-md shadow-amber-400/80 scale-110 font-bold"
                            : isQuarter
                            ? "bg-zinc-800 border border-zinc-700 text-zinc-300"
                            : "bg-zinc-950 border border-zinc-900 text-zinc-600"
                        }`}
                      >
                        {idx + 1}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Quick Drum Pattern & Strum Feedback */}
            <div className="mt-3 pt-2.5 border-t border-zinc-800/80 flex items-center justify-between text-[11px] text-zinc-400">
              <span className="truncate max-w-[200px]">
                Drum: <strong className="text-zinc-200">{drumPattern}</strong>
              </span>
              <span>
                Feel: <strong className="text-amber-400 capitalize">{strumFeel}</strong>
              </span>
            </div>
          </div>
        </div>

        {/* 2. PLAYBACK TRANSPORT & TEMPO CONTROLLER */}
        <div className="mt-5 p-4 rounded-xl bg-zinc-900/60 border border-zinc-800 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
          {/* Main Play / Stop Button */}
          <div className="flex items-center gap-3">
            <button
              id="backtracker-play-toggle-btn"
              onClick={handleTogglePlay}
              className={`px-6 py-3 rounded-xl font-bold flex items-center justify-center gap-2.5 shadow-xl transition-all duration-150 active:scale-95 ${
                isPlaying
                  ? "bg-red-600 hover:bg-red-500 text-white shadow-red-600/30"
                  : "bg-gradient-to-r from-red-600 to-amber-600 hover:from-red-500 hover:to-amber-500 text-white shadow-red-600/20"
              }`}
            >
              {isPlaying ? (
                <>
                  <Square className="w-5 h-5 fill-current" />
                  <span>STOP BACKTRACKER</span>
                </>
              ) : (
                <>
                  <Play className="w-5 h-5 fill-current" />
                  <span>START BACKTRACKER</span>
                </>
              )}
            </button>

            {/* Pre-roll & Loop Mode Toggles */}
            <div className="flex flex-col gap-1 text-xs">
              <label className="flex items-center gap-2 cursor-pointer text-zinc-300 hover:text-white select-none">
                <input
                  type="checkbox"
                  checked={enableCountIn}
                  onChange={(e) => setEnableCountIn(e.target.checked)}
                  className="rounded border-zinc-700 bg-zinc-800 text-red-600 focus:ring-0 cursor-pointer"
                />
                4-Beat Count In
              </label>
              <label className="flex items-center gap-2 cursor-pointer text-zinc-300 hover:text-white select-none">
                <input
                  type="checkbox"
                  checked={loopMode === "loop_indefinite"}
                  onChange={(e) =>
                    setLoopMode(e.target.checked ? "loop_indefinite" : "single_pass")
                  }
                  className="rounded border-zinc-700 bg-zinc-800 text-red-600 focus:ring-0 cursor-pointer"
                />
                Continuous Loop
              </label>
            </div>
          </div>

          {/* TEMPO CONTROLS (Variable BPM + Tap Tempo + Multipliers) */}
          <div className="flex flex-wrap items-center gap-4">
            {/* BPM Slider & Steppers */}
            <div className="flex items-center gap-2 bg-zinc-950 border border-zinc-800 rounded-lg p-2">
              <div className="flex flex-col items-center">
                <span className="text-[10px] font-bold tracking-wider uppercase text-zinc-400">
                  TEMPO
                </span>
                <span className="text-xl font-extrabold text-white font-mono">
                  {bpm} <span className="text-xs text-zinc-400 font-normal">BPM</span>
                </span>
              </div>

              {/* -5 / -1 / +1 / +5 Buttons */}
              <div className="flex items-center gap-1">
                <button
                  onClick={() => handleBpmChange(bpm - 5)}
                  className="px-2 py-1 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 text-xs font-bold rounded border border-zinc-800"
                >
                  -5
                </button>
                <button
                  onClick={() => handleBpmChange(bpm - 1)}
                  className="px-2 py-1 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 text-xs font-bold rounded border border-zinc-800"
                >
                  -1
                </button>
                <input
                  type="range"
                  min={40}
                  max={240}
                  value={bpm}
                  onChange={(e) => handleBpmChange(parseInt(e.target.value, 10))}
                  className="w-24 accent-red-500 cursor-pointer mx-1"
                />
                <button
                  onClick={() => handleBpmChange(bpm + 1)}
                  className="px-2 py-1 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 text-xs font-bold rounded border border-zinc-800"
                >
                  +1
                </button>
                <button
                  onClick={() => handleBpmChange(bpm + 5)}
                  className="px-2 py-1 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 text-xs font-bold rounded border border-zinc-800"
                >
                  +5
                </button>
              </div>

              {/* Tap Tempo Button */}
              <button
                onClick={handleTapTempo}
                className={`px-3 py-1.5 rounded text-xs font-bold uppercase transition-all duration-100 border ${
                  tapFlash
                    ? "bg-amber-500 text-black border-amber-300 scale-105"
                    : "bg-zinc-900 hover:bg-zinc-800 text-amber-400 border-amber-900/60"
                }`}
              >
                TAP TEMPO
              </button>
            </div>

            {/* Speed Multiplier Quick Buttons */}
            <div className="flex items-center gap-1 bg-zinc-950 border border-zinc-800 rounded-lg p-1.5">
              {[
                { label: "0.5x", mult: 0.5, tip: "Half-Time" },
                { label: "0.75x", mult: 0.75, tip: "Slow Practice" },
                { label: "1.0x", mult: 1.0, tip: "Normal" },
                { label: "1.25x", mult: 1.25, tip: "Speed Drill" },
                { label: "1.5x", mult: 1.5, tip: "Shred" },
              ].map((item) => (
                <button
                  key={item.label}
                  onClick={() => handleSpeedMultiplierChange(item.mult)}
                  title={item.tip}
                  className={`px-2 py-1 rounded text-xs font-bold transition-all ${
                    speedMultiplier === item.mult
                      ? "bg-red-600 text-white shadow-sm"
                      : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900"
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Speed Accelerator Drill Mode (Dynamic Auto-BPM) */}
        <div className="mt-3 px-4 py-2.5 rounded-lg bg-zinc-900/40 border border-zinc-800/80 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-emerald-400" />
            <label className="flex items-center gap-2 cursor-pointer font-medium text-zinc-300 hover:text-white select-none">
              <input
                type="checkbox"
                checked={autoSpeedTrainer}
                onChange={(e) => setAutoSpeedTrainer(e.target.checked)}
                className="rounded border-zinc-700 bg-zinc-800 text-emerald-500 focus:ring-0 cursor-pointer"
              />
              <span className="font-semibold text-white">Speed Accelerator Drill:</span>
              <span>Automatically increase tempo</span>
            </label>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              <span className="text-zinc-400">Add</span>
              <select
                aria-label="Speed increment"
                value={speedIncrement}
                onChange={(e) => setSpeedIncrement(parseInt(e.target.value, 10))}
                disabled={!autoSpeedTrainer}
                className="bg-zinc-900 border border-zinc-800 text-zinc-200 rounded px-2 py-0.5 outline-none text-xs disabled:opacity-50"
              >
                <option value={2}>+2 BPM</option>
                <option value={4}>+4 BPM</option>
                <option value={5}>+5 BPM</option>
                <option value={8}>+8 BPM</option>
              </select>
            </div>

            <div className="flex items-center gap-1.5">
              <span className="text-zinc-400">every</span>
              <select
                aria-label="Speed interval loops"
                value={speedIntervalLoops}
                onChange={(e) => setSpeedIntervalLoops(parseInt(e.target.value, 10))}
                disabled={!autoSpeedTrainer}
                className="bg-zinc-900 border border-zinc-800 text-zinc-200 rounded px-2 py-0.5 outline-none text-xs disabled:opacity-50"
              >
                <option value={1}>1 loop</option>
                <option value={2}>2 loops</option>
                <option value={4}>4 loops</option>
                <option value={8}>8 loops</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* 3. SOUND CONTROLS & MIXER STRIP */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Drums Configuration */}
        <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-800 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-zinc-300 flex items-center gap-1.5">
              <Headphones className="w-4 h-4 text-red-400" />
              Drum Groove
            </span>
            <button
              onClick={() => setPlayDrums(!playDrums)}
              className={`p-1 rounded text-xs transition-colors ${
                playDrums ? "text-red-400 hover:text-red-300" : "text-zinc-600 hover:text-zinc-400"
              }`}
              title={playDrums ? "Mute Drums" : "Unmute Drums"}
            >
              {playDrums ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </button>
          </div>

          <select
            id="backtracker-drum-pattern-select"
            aria-label="Drum Beat Pattern"
            value={drumPattern}
            onChange={(e) => setDrumPattern(e.target.value as DrumBeatPattern)}
            className="w-full bg-zinc-900 border border-zinc-800 text-xs font-medium text-zinc-200 rounded-lg p-2 outline-none cursor-pointer"
          >
            <option value="0-0-0 Breakdown Heavy">0-0-0 Breakdown Heavy (China & Half-Time)</option>
            <option value="Double Bass Gallop (Thrash)">Double Bass Gallop (Thrash 16ths)</option>
            <option value="Blast Beat (Death/Black)">Blast Beat (Death/Black Metal)</option>
            <option value="Half-Time Groove (Metalcore)">Half-Time Groove (Metalcore Backbeat)</option>
            <option value="Djent Polyrhythm (7/8 & 4/4)">Djent Polyrhythm (7/8 & 4/4 Thall)</option>
            <option value="Classic 4/4 Hard Rock">Classic 4/4 Hard Rock Groove</option>
            <option value="Slow Sludge Doom (60 BPM)">Slow Sludge Doom (Subterranean)</option>
            <option value="None / Click Only">None / Metronome Click Only</option>
          </select>

          <div className="flex items-center gap-2 pt-1">
            <span className="text-[11px] text-zinc-400 w-12">Level:</span>
            <input
              type="range"
              min={0}
              max={1}
              step={0.05}
              value={drumsVolume}
              onChange={(e) => setDrumsVolume(parseFloat(e.target.value))}
              disabled={!playDrums}
              className="w-full accent-red-500 cursor-pointer disabled:opacity-40"
            />
            <span className="text-[11px] font-mono text-zinc-400 w-8 text-right">
              {Math.round(drumsVolume * 100)}%
            </span>
          </div>
        </div>

        {/* Drop C Rhythm Guitar Synth */}
        <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-800 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-zinc-300 flex items-center gap-1.5">
              <Zap className="w-4 h-4 text-amber-400" />
              Guitar / Synth Rhythm
            </span>
            <button
              onClick={() => setPlayChords(!playChords)}
              className={`p-1 rounded text-xs transition-colors ${
                playChords ? "text-amber-400 hover:text-amber-300" : "text-zinc-600 hover:text-zinc-400"
              }`}
              title={playChords ? "Mute Rhythm Guitar" : "Unmute Rhythm Guitar"}
            >
              {playChords ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </button>
          </div>

          <select
            id="backtracker-strum-feel-select"
            aria-label="Rhythm Guitar Strum Feel"
            value={strumFeel}
            onChange={(e) => setStrumFeel(e.target.value as StrumPatternFeel)}
            className="w-full bg-zinc-900 border border-zinc-800 text-xs font-medium text-zinc-200 rounded-lg p-2 outline-none cursor-pointer"
          >
            <option value="chug8ths">Palm-Muted 8th Chugs (0-0-0-0-0-0-0-0)</option>
            <option value="chug16ths">16th-Note Double Chugs (Rapid Fire)</option>
            <option value="sustain">Sustained Power Chords (Full Ring)</option>
            <option value="gallop">Down-Down-Up Gallop Rhythm</option>
            <option value="syncopated">Djent Syncopated Accents</option>
            <option value="muted">Muted / Play Solo (Drums Only)</option>
          </select>

          <div className="flex items-center gap-2 pt-1">
            <span className="text-[11px] text-zinc-400 w-12">Level:</span>
            <input
              type="range"
              min={0}
              max={1}
              step={0.05}
              value={chordsVolume}
              onChange={(e) => setChordsVolume(parseFloat(e.target.value))}
              disabled={!playChords}
              className="w-full accent-amber-500 cursor-pointer disabled:opacity-40"
            />
            <span className="text-[11px] font-mono text-zinc-400 w-8 text-right">
              {Math.round(chordsVolume * 100)}%
            </span>
          </div>
        </div>

        {/* Metronome Click Track */}
        <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-800 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-zinc-300 flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-emerald-400" />
              Metronome Click
            </span>
            <button
              onClick={() => setPlayClick(!playClick)}
              className={`p-1 rounded text-xs transition-colors ${
                playClick ? "text-emerald-400 hover:text-emerald-300" : "text-zinc-600 hover:text-zinc-400"
              }`}
              title={playClick ? "Mute Metronome" : "Unmute Metronome"}
            >
              {playClick ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </button>
          </div>

          <div className="text-xs text-zinc-400 bg-zinc-900 border border-zinc-800 rounded-lg p-2.5">
            Quarter-note sync with high accented pitch (1400Hz) on beat 1 and solid clicks on 2, 3, 4.
          </div>

          <div className="flex items-center gap-2 pt-1">
            <span className="text-[11px] text-zinc-400 w-12">Level:</span>
            <input
              type="range"
              min={0}
              max={1}
              step={0.05}
              value={clickVolume}
              onChange={(e) => setClickVolume(parseFloat(e.target.value))}
              disabled={!playClick}
              className="w-full accent-emerald-500 cursor-pointer disabled:opacity-40"
            />
            <span className="text-[11px] font-mono text-zinc-400 w-8 text-right">
              {Math.round(clickVolume * 100)}%
            </span>
          </div>
        </div>
      </div>

      {/* 4. CHORD PROGRESSION TIMELINE & EDITOR */}
      <div className="p-5 rounded-xl bg-zinc-950 border border-zinc-800 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="text-sm font-bold uppercase tracking-wider text-white flex items-center gap-2">
              <Layers className="w-4 h-4 text-red-500" />
              Drop C Practice Chord Progression ({chords.length} Bars)
            </h3>
            <p className="text-xs text-zinc-400">
              Customize chord steps, beat durations, and palm muting. Backtracker loops through each bar in sequence.
            </p>
          </div>

          {/* Quick Add Power Chord Dropdown */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-zinc-400">Add Chord:</span>
            <select
              aria-label="Add Drop C Power Chord"
              onChange={(e) => {
                const idx = parseInt(e.target.value, 10);
                if (!isNaN(idx) && DROP_C_POWER_CHORDS[idx]) {
                  handleAddChord(DROP_C_POWER_CHORDS[idx]);
                  e.target.value = "";
                }
              }}
              defaultValue=""
              className="bg-zinc-900 border border-zinc-800 text-xs font-semibold text-red-400 rounded-lg px-2.5 py-1.5 outline-none cursor-pointer"
            >
              <option value="" disabled className="text-zinc-500">
                + Select Voicing to Add...
              </option>
              {DROP_C_POWER_CHORDS.map((v, i) => (
                <option key={i} value={i} className="text-zinc-200">
                  {v.chordName} ({v.metalName})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Chord Step Cards Carousel */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {chords.map((chord, idx) => {
            const isActive = isPlaying && currentChordIndex === idx && !isCountIn;
            return (
              <div
                key={chord.id || idx}
                className={`p-3.5 rounded-xl border transition-all duration-150 relative flex flex-col justify-between ${
                  isActive
                    ? "bg-red-950/40 border-red-500 shadow-lg shadow-red-950/60 ring-1 ring-red-500"
                    : "bg-zinc-900/80 border-zinc-800 hover:border-zinc-700"
                }`}
              >
                {/* Bar Header */}
                <div className="flex items-center justify-between mb-2">
                  <span
                    className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${
                      isActive ? "bg-red-500 text-white" : "bg-zinc-800 text-zinc-400"
                    }`}
                  >
                    Bar {idx + 1}
                  </span>

                  {/* Move Left / Right / Delete */}
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleMoveChord(idx, "left")}
                      disabled={idx === 0}
                      className="p-1 rounded text-zinc-400 hover:text-white disabled:opacity-20"
                      title="Move Left"
                    >
                      <ChevronLeft className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleMoveChord(idx, "right")}
                      disabled={idx === chords.length - 1}
                      className="p-1 rounded text-zinc-400 hover:text-white disabled:opacity-20"
                      title="Move Right"
                    >
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleRemoveChord(idx)}
                      disabled={chords.length <= 1}
                      className="p-1 rounded text-red-400 hover:text-red-300 disabled:opacity-20"
                      title="Delete Chord"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Chord Title & Metal Name */}
                <div className="my-1">
                  <div className="text-lg font-extrabold text-white truncate">
                    {chord.chordName}
                  </div>
                  <div className="text-xs font-mono text-zinc-400 truncate">
                    {chord.metalName || "Drop C Barre"}
                  </div>
                </div>

                {/* Frets Display */}
                <div className="my-2 px-2 py-1 rounded bg-black/60 font-mono text-[11px] text-emerald-400 border border-zinc-800">
                  [{chord.fretPositions.join("-")}]
                </div>

                {/* Controls: Beats Duration & Palm Mute Toggle */}
                <div className="pt-2 border-t border-zinc-800/80 flex items-center justify-between gap-2 text-xs">
                  <div className="flex items-center gap-1">
                    <span className="text-zinc-400 text-[11px]">Beats:</span>
                    <select
                      aria-label="Chord duration in beats"
                      value={chord.durationBeats || 4}
                      onChange={(e) =>
                        handleChangeChordBeats(idx, parseInt(e.target.value, 10))
                      }
                      className="bg-zinc-950 border border-zinc-800 text-zinc-200 text-xs rounded px-1.5 py-0.5 outline-none cursor-pointer"
                    >
                      <option value={1}>1</option>
                      <option value={2}>2</option>
                      <option value={3}>3</option>
                      <option value={4}>4</option>
                      <option value={8}>8</option>
                    </select>
                  </div>

                  <button
                    onClick={() => handleToggleChordPalmMute(idx)}
                    className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase transition-colors border ${
                      chord.isPalmMute
                        ? "bg-amber-950/90 text-amber-300 border-amber-700/80"
                        : "bg-zinc-800/80 text-zinc-400 border-zinc-700/60 hover:text-zinc-200"
                    }`}
                  >
                    {chord.isPalmMute ? "PM: ON" : "PM: OFF"}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
