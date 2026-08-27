import React, { useState } from "react";
import { AudioEngine } from "../audio/audioEngine";
import {
  DROP_C_POWER_CHORDS,
  POPULAR_SONG_PRESETS,
} from "../audio/dropCData";
import { ChordVoicing, MetalSubgenre, TransposedSongData } from "../types";
import { DropCFretboard } from "./DropCFretboard";
import {
  Zap,
  Play,
  Square,
  Sparkles,
  Copy,
  Check,
  RotateCcw,
  Music,
  Sliders,
  Info,
} from "lucide-react";

export const TransposerStudio: React.FC = () => {
  const [songTitle, setSongTitle] = useState("");
  const [artist, setArtist] = useState("");
  const [rawText, setRawText] = useState("");
  const [subgenre, setSubgenre] = useState<MetalSubgenre>("Metalcore");
  const [isLoading, setIsLoading] = useState(false);
  const [transposedData, setTransposedData] = useState<TransposedSongData | null>(null);
  const [selectedChord, setSelectedChord] = useState<ChordVoicing>(DROP_C_POWER_CHORDS[0]);
  const [playingSectionIndex, setPlayingSectionIndex] = useState<number | null>(null);
  const [copied, setCopied] = useState(false);
  const [semitoneShift, setSemitoneShift] = useState(0);

  const audioEngine = AudioEngine.getInstance();

  // Load a popular song preset
  const handleSelectPreset = (preset: (typeof POPULAR_SONG_PRESETS)[0]) => {
    setSongTitle(preset.title);
    setArtist(preset.artist);
    setRawText(preset.inputChords);
    setSubgenre(preset.metalSubgenre as MetalSubgenre);
  };

  // Transpose song into Drop C Metal
  const handleTranspose = async () => {
    if (!songTitle && !rawText) {
      alert("Please enter a song title or paste chord progressions / lyrics!");
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch("/api/metal-transcode", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          songTitle,
          artist,
          rawText,
          metalSubgenre: subgenre,
          targetTuning: "Drop C (C-G-C-F-A-D)",
        }),
      });
      const json = await res.json();
      if (json.success && json.data) {
        setTransposedData(json.data);
      }
    } catch (e) {
      console.error("Transposition error:", e);
    } finally {
      setIsLoading(false);
    }
  };

  // Play a section's tab riff via Drop C Synth
  const handlePlaySectionTab = async (sectionIdx: number) => {
    if (playingSectionIndex === sectionIdx) {
      setPlayingSectionIndex(null);
      return;
    }

    await audioEngine.init();
    setPlayingSectionIndex(sectionIdx);

    // Dynamic riff pattern playback based on subgenre & section
    const isBreakdown = transposedData?.sections[sectionIdx]?.name.toLowerCase().includes("breakdown");
    const chordVoicingsToPlay = isBreakdown
      ? [
          { frets: [0, 0, 0, "x", "x", "x"], pm: true, dur: 0.15 },
          { frets: [0, 0, 0, "x", "x", "x"], pm: true, dur: 0.15 },
          { frets: [1, 1, 1, "x", "x", "x"], pm: false, dur: 0.35 },
          { frets: [0, 0, 0, "x", "x", "x"], pm: true, dur: 0.15 },
          { frets: [8, 8, 8, "x", "x", "x"], pm: false, dur: 0.4 },
        ]
      : [
          { frets: [0, 0, 0, "x", "x", "x"], pm: true, dur: 0.2 },
          { frets: [0, 0, 0, "x", "x", "x"], pm: true, dur: 0.2 },
          { frets: [8, 8, 8, "x", "x", "x"], pm: false, dur: 0.35 },
          { frets: [3, 3, 3, "x", "x", "x"], pm: false, dur: 0.35 },
          { frets: [10, 10, 10, "x", "x", "x"], pm: false, dur: 0.45 },
        ];

    let delay = 0;
    chordVoicingsToPlay.forEach((item, i) => {
      setTimeout(() => {
        audioEngine.playDropCVoicing(item.frets as any, item.pm, item.dur);
        if (i === chordVoicingsToPlay.length - 1) {
          setTimeout(() => setPlayingSectionIndex(null), 500);
        }
      }, delay);
      delay += item.dur * 1000 + 40;
    });
  };

  const handleCopyChart = () => {
    if (!transposedData) return;
    const text = `=== DROP C METAL TRANSPOSITION ===
Song: ${songTitle || "Custom Track"}
Tuning: Drop C (C-G-C-F-A-D)
Key: ${transposedData.metalKey} | BPM: ${transposedData.bpm}
Style: ${transposedData.styleDescription}

${transposedData.sections
  .map(
    (s) => `--- ${s.name} ---
Original: ${s.originalChords}
Drop C Metal: ${s.metalChords}
Technique: ${s.technique}
Tab:
${s.tab}
`
  )
  .join("\n")}
Fretboard Tips:
${transposedData.dropCFretboardTips.map((t) => "- " + t).join("\n")}`;

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div id="transposer-studio" className="space-y-6">
      {/* Bento Header & Song Input Section */}
      <div className="bg-[#141416] border border-[#222226] rounded-2xl p-5 sm:p-6 shadow-2xl relative overflow-hidden">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-5 border-b border-[#222226]">
          <div>
            <div className="flex items-center gap-2.5">
              <span className="p-2 rounded-xl bg-[#0A0A0B] border border-[#222226] text-[#CCFF00]">
                <Zap className="w-5 h-5 fill-current" />
              </span>
              <h2 className="text-lg sm:text-xl font-bold tracking-widest text-white font-mono uppercase">
                Drop C Chord Transposer & Harmonic Engine
              </h2>
            </div>
            <p className="text-xs text-gray-400 mt-1 max-w-2xl">
              Transpose chord progressions into heavy Drop C metal voicings (0-0-0 power chugs,
              Add9 dissonances, tritones, djent breakdowns) with full tablature & interactive audio playback.
            </p>
          </div>

          {/* Subgenre Selector */}
          <div className="flex items-center gap-2 bg-[#0A0A0B] p-1.5 rounded-xl border border-[#222226]">
            <span className="text-xs font-mono text-gray-400 px-2 font-bold uppercase tracking-wider">STYLE:</span>
            <select
              id="metal-subgenre-select"
              value={subgenre}
              onChange={(e) => setSubgenre(e.target.value as MetalSubgenre)}
              className="bg-[#141416] border border-[#333338] text-xs font-mono font-bold text-[#CCFF00] rounded-lg px-3 py-1.5 focus:border-[#CCFF00] outline-none cursor-pointer"
            >
              <option value="Metalcore">Metalcore (Killswitch, A Day To Remember)</option>
              <option value="Djent">Djent / Thall (Periphery, Meshuggah)</option>
              <option value="Thrash Metal">Thrash Metal (80s Bay Area Downpicking)</option>
              <option value="Swedish Death Metal">Swedish Death Metal (HM-2 Buzzsaw)</option>
              <option value="Doom / Sludge">Doom / Sludge (Heavy Low Octave Fuzz)</option>
              <option value="Prog Metal">Progressive Metal (Liquid Leads & Shimmer)</option>
              <option value="Nu-Metal">Nu-Metal (Deftones, Slipknot Drop C)</option>
              <option value="Black Metal">Black Metal (Atmospheric Tremolo)</option>
            </select>
          </div>
        </div>

        {/* Popular Presets Quick Bar */}
        <div className="mt-4 flex items-center gap-2 overflow-x-auto pb-2 text-xs scrollbar-none">
          <span className="text-[10px] font-mono text-gray-500 uppercase tracking-widest whitespace-nowrap flex items-center gap-1 font-bold">
            <Zap className="w-3 h-3 text-[#CCFF00]" /> Presets:
          </span>
          {POPULAR_SONG_PRESETS.map((preset) => (
            <button
              key={preset.title}
              id={`preset-song-${preset.title.toLowerCase().replace(/[^a-z0-9]/g, "-")}`}
              onClick={() => handleSelectPreset(preset)}
              className="px-2.5 py-1 rounded-lg bg-[#1D1D21] hover:bg-[#25252b] hover:border-[#CCFF00] text-gray-300 border border-[#333338] font-mono text-[11px] whitespace-nowrap transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <span className="font-bold text-gray-200">{preset.title}</span>
              <span className="text-[10px] text-gray-400">({preset.artist})</span>
            </button>
          ))}
        </div>

        {/* Input Fields in Bento Arrangement */}
        <div className="mt-4 grid grid-cols-1 md:grid-cols-12 gap-3">
          <div className="md:col-span-4 space-y-3">
            <div>
              <label className="block text-[10px] font-mono font-bold uppercase tracking-widest text-gray-500 mb-1">
                Song Title
              </label>
              <input
                id="transposer-song-title"
                type="text"
                value={songTitle}
                onChange={(e) => setSongTitle(e.target.value)}
                placeholder="e.g. Master of Puppets / Shape of You"
                className="w-full bg-[#0A0A0B] border border-[#222226] rounded-xl px-3 py-2 text-sm text-gray-100 font-mono focus:border-[#CCFF00] outline-none"
              />
            </div>
            <div>
              <label className="block text-[10px] font-mono font-bold uppercase tracking-widest text-gray-500 mb-1">
                Original Artist
              </label>
              <input
                id="transposer-artist"
                type="text"
                value={artist}
                onChange={(e) => setArtist(e.target.value)}
                placeholder="e.g. Nirvana, Radiohead, Pop/Rock"
                className="w-full bg-[#0A0A0B] border border-[#222226] rounded-xl px-3 py-2 text-sm text-gray-100 font-mono focus:border-[#CCFF00] outline-none"
              />
            </div>

            {/* Transpose Semitones Slider */}
            <div className="p-3 bg-[#0A0A0B] rounded-xl border border-[#222226]">
              <div className="flex items-center justify-between text-xs font-mono mb-1.5">
                <span className="text-[10px] uppercase tracking-widest text-gray-500 font-bold">PITCH SHIFT</span>
                <span className="text-[#CCFF00] font-bold text-xs">
                  {semitoneShift > 0 ? `+${semitoneShift}` : semitoneShift} Semitones
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setSemitoneShift((prev) => Math.max(-12, prev - 1))}
                  className="px-2 py-1 rounded bg-[#1D1D21] text-gray-300 text-xs font-mono hover:bg-[#25252b] border border-[#333338] cursor-pointer"
                >
                  -1
                </button>
                <input
                  type="range"
                  min={-12}
                  max={12}
                  value={semitoneShift}
                  onChange={(e) => setSemitoneShift(Number(e.target.value))}
                  className="w-full accent-[#CCFF00] cursor-pointer"
                />
                <button
                  onClick={() => setSemitoneShift((prev) => Math.min(12, prev + 1))}
                  className="px-2 py-1 rounded bg-[#1D1D21] text-gray-300 text-xs font-mono hover:bg-[#25252b] border border-[#333338] cursor-pointer"
                >
                  +1
                </button>
              </div>
            </div>
          </div>

          <div className="md:col-span-8 flex flex-col">
            <label className="block text-[10px] font-mono font-bold uppercase tracking-widest text-gray-500 mb-1 flex items-center justify-between">
              <span>Chord Progression / Tabs / Lyrics Input</span>
              <span className="text-[10px] text-gray-400 font-normal font-mono">
                Standard Chords (e.g. Am - F - C - G)
              </span>
            </label>
            <textarea
              id="transposer-raw-text"
              rows={5}
              value={rawText}
              onChange={(e) => setRawText(e.target.value)}
              placeholder="Paste chords here, e.g.:&#10;[Verse]&#10;Am        F           C           G&#10;Every breath you take, every move you make&#10;[Chorus]&#10;F         G           Am"
              className="w-full flex-1 bg-[#0A0A0B] border border-[#222226] rounded-xl p-3 text-xs sm:text-sm text-gray-200 font-mono focus:border-[#CCFF00] outline-none resize-none leading-relaxed"
            />
          </div>
        </div>

        {/* Action Button */}
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-[#222226]">
          <div className="flex items-center gap-2 text-xs text-gray-400 font-mono">
            <Info className="w-4 h-4 text-[#CCFF00]" />
            <span>Target: <strong className="text-gray-200">Drop C (C-G-C-F-A-D)</strong> • Auto-Pitch Voicing</span>
          </div>

          <button
            id="btn-transpose-to-metal"
            onClick={handleTranspose}
            disabled={isLoading}
            className="px-6 py-2.5 rounded-xl bg-[#CCFF00] hover:bg-[#b8e600] text-black font-black text-xs font-mono uppercase tracking-wider flex items-center gap-2 shadow-lg shadow-[rgba(204,255,0,0.25)] transition-all cursor-pointer disabled:opacity-50"
          >
            {isLoading ? (
              <>
                <RotateCcw className="w-4 h-4 animate-spin text-black" />
                <span>REHARMONIZING TO DROP C...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 fill-current" />
                <span>TRANSPOSE TO DROP C METAL</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Transposed Results View Bento Grid */}
      {transposedData && (
        <div className="bg-[#141416] border border-[#333338] rounded-2xl p-5 sm:p-6 shadow-2xl space-y-6">
          {/* Header Summary */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#222226]">
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded bg-[#1D1D21] text-[#CCFF00] font-mono text-xs font-bold border border-[#333338] uppercase">
                  {transposedData.tuning}
                </span>
                <h3 className="text-lg sm:text-xl font-bold text-white font-mono">
                  {songTitle || "Transposed Metal Chart"}
                </h3>
              </div>
              <p className="text-xs text-gray-400 mt-1">{transposedData.styleDescription}</p>
            </div>

            <div className="flex items-center gap-2">
              <div className="flex items-center gap-3 bg-[#0A0A0B] px-3 py-1.5 rounded-xl border border-[#222226] font-mono text-xs">
                <div>
                  <span className="text-gray-500 uppercase text-[10px]">KEY: </span>
                  <span className="text-[#CCFF00] font-bold">{transposedData.metalKey}</span>
                </div>
                <div className="w-px h-3 bg-[#222226]" />
                <div>
                  <span className="text-gray-500 uppercase text-[10px]">BPM: </span>
                  <span className="text-gray-200 font-bold">{transposedData.bpm}</span>
                </div>
              </div>

              <button
                onClick={handleCopyChart}
                className="px-3 py-1.5 rounded-lg bg-[#1D1D21] hover:bg-[#25252b] text-gray-200 text-xs font-mono font-bold flex items-center gap-1.5 transition-all border border-[#333338] cursor-pointer"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-[#CCFF00]" /> : <Copy className="w-3.5 h-3.5" />}
                {copied ? "Copied!" : "Copy Tab"}
              </button>
            </div>
          </div>

          {/* Sections Bento Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {transposedData.sections.map((sec, idx) => (
              <div
                key={sec.name + idx}
                className="bg-[#0A0A0B] rounded-xl p-4 border border-[#222226] hover:border-[#333338] transition-all flex flex-col justify-between space-y-3"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono font-bold uppercase tracking-wider text-[#CCFF00] flex items-center gap-1.5">
                      <Zap className="w-3.5 h-3.5 fill-current" /> {sec.name}
                    </span>
                    <button
                      onClick={() => handlePlaySectionTab(idx)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold flex items-center gap-1 transition-all cursor-pointer ${
                        playingSectionIndex === idx
                          ? "bg-red-500 text-white animate-pulse"
                          : "bg-[#1D1D21] hover:bg-[#CCFF00] hover:text-black text-gray-300 border border-[#333338]"
                      }`}
                    >
                      {playingSectionIndex === idx ? (
                        <>
                          <Square className="w-3 h-3 fill-current" /> Stop
                        </>
                      ) : (
                        <>
                          <Play className="w-3 h-3 fill-current" /> Play Riff
                        </>
                      )}
                    </button>
                  </div>

                  <div className="mt-2 text-xs space-y-1">
                    <div className="flex items-center gap-1 font-mono">
                      <span className="text-gray-500">Original:</span>
                      <span className="text-gray-300">{sec.originalChords}</span>
                    </div>
                    <div className="flex items-center gap-1 font-mono font-bold">
                      <span className="text-[#CCFF00]">Drop C Metal:</span>
                      <span className="text-white bg-[#141416] px-2 py-0.5 rounded border border-[#222226]">
                        {sec.metalChords}
                      </span>
                    </div>
                    <p className="text-[11px] text-gray-400 italic pt-1">{sec.technique}</p>
                  </div>
                </div>

                {/* Tab Block */}
                <div className="bg-[#141416] rounded-lg p-2.5 border border-[#222226] font-mono text-[11px] text-[#CCFF00]/90 overflow-x-auto whitespace-pre leading-tight select-all">
                  {sec.tab}
                </div>
              </div>
            ))}
          </div>

          {/* Fretboard Tips */}
          {transposedData.dropCFretboardTips && (
            <div className="p-4 rounded-xl bg-[#0A0A0B] border border-[#222226] space-y-2">
              <h4 className="text-xs font-mono font-bold uppercase tracking-widest text-[#CCFF00] flex items-center gap-1.5">
                <Sliders className="w-3.5 h-3.5" /> Drop C Fretboard Pro Tips:
              </h4>
              <ul className="text-xs text-gray-400 space-y-1 list-disc list-inside">
                {transposedData.dropCFretboardTips.map((tip, i) => (
                  <li key={i}>{tip}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Interactive Fretboard Visualizer */}
      <DropCFretboard
        selectedChordFrets={selectedChord.fretPositions}
        chordName={selectedChord.chordName}
      />

      {/* Drop C Chord Voicing Library */}
      <div className="bg-[#141416] border border-[#222226] rounded-2xl p-5 sm:p-6 shadow-2xl space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Music className="w-5 h-5 text-[#CCFF00]" />
            <h3 className="text-sm sm:text-base font-bold text-white font-mono uppercase tracking-widest">
              Drop C Metal Voicings & Power Chord Library
            </h3>
          </div>
          <span className="text-xs text-gray-500 font-mono">1-Finger Barre & Dissonant Shapes</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {DROP_C_POWER_CHORDS.map((chord) => {
            const isSelected = selectedChord.chordName === chord.chordName;
            return (
              <div
                key={chord.chordName}
                id={`chord-card-${chord.chordName.toLowerCase().replace(/[^a-z0-9]/g, "-")}`}
                onClick={() => setSelectedChord(chord)}
                className={`p-3.5 rounded-xl border transition-all cursor-pointer flex flex-col justify-between ${
                  isSelected
                    ? "bg-[#1D1D21] border-[#CCFF00] shadow-[0_0_12px_rgba(204,255,0,0.25)]"
                    : "bg-[#0A0A0B] border-[#222226] hover:border-[#333338]"
                }`}
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-sm font-mono text-white">{chord.chordName}</span>
                    <span
                      className={`text-[9px] font-mono px-1.5 py-0.5 rounded font-bold uppercase ${
                        chord.metalType === "Power Chord"
                          ? "bg-[#1D1D21] text-[#CCFF00] border border-[#333338]"
                          : chord.metalType === "Tritone / Diminished"
                          ? "bg-red-950/80 text-red-400 border border-red-900"
                          : "bg-[#1D1D21] text-amber-300 border border-[#333338]"
                      }`}
                    >
                      {chord.metalType}
                    </span>
                  </div>

                  {/* Fret notation: [0-0-0-x-x-x] */}
                  <div className="mt-1 font-mono text-xs text-[#CCFF00] font-semibold">
                    Frets: [{chord.fretPositions.map((f) => (f === "x" ? "X" : f)).join("-")}]
                  </div>

                  <p className="text-[11px] text-gray-400 mt-1.5 line-clamp-2">{chord.description}</p>
                </div>

                <div className="mt-3 pt-2 border-t border-[#222226] flex items-center justify-between">
                  <span className="text-[10px] text-gray-500 font-mono">
                    {chord.isBarre ? "1-Finger Barre" : "Complex Shape"}
                  </span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      audioEngine.init().then(() => {
                        audioEngine.playDropCVoicing(chord.fretPositions, false, 0.7);
                      });
                    }}
                    className="p-1.5 rounded-lg bg-[#1D1D21] hover:bg-[#CCFF00] hover:text-black text-gray-300 transition-all border border-[#333338] cursor-pointer"
                    title="Play Chord"
                  >
                    <Play className="w-3 h-3 fill-current" />
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
