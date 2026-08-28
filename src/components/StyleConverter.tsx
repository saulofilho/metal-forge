import React, { useState } from "react";
import { AudioEngine } from "../audio/audioEngine";
import { FACTORY_PRESETS } from "../audio/presetLibrary";
import { StyleConversionResult, MetalSubgenre } from "../types";
import { motion, AnimatePresence } from "motion/react";
import {
  Flame,
  Zap,
  Play,
  Square,
  Sparkles,
  Copy,
  Check,
  RotateCcw,
  ArrowRight,
  Sliders,
  Music,
  Radio,
  SlidersHorizontal,
  Volume2,
  Shield,
  Layers,
  Wand2,
} from "lucide-react";

interface StyleConverterProps {
  onLoadAmpPreset?: (presetId: string) => void;
  onNavigateToAmp?: () => void;
}

const STYLE_PRESET_EXAMPLES = [
  {
    title: "Anti-Hero",
    artist: "Taylor Swift",
    genre: "Pop / Synth",
    targetSubgenre: "Metalcore" as MetalSubgenre,
    url: "https://tabs.ultimate-guitar.com/tab/taylor-swift/anti-hero-chords-4389025",
    description: "Pop synthesizer chords re-imagined with 0-0-0 palm-muted chugs, Add9 dissonances, and a crushing half-time breakdown.",
  },
  {
    title: "Decks Dark",
    artist: "Radiohead",
    genre: "Art Rock / Ambient",
    targetSubgenre: "Swedish Death Metal" as MetalSubgenre,
    url: "https://tabs.ultimate-guitar.com/tab/radiohead/decks-dark-official-4270984",
    description: "Ethereal piano and vocal harmonies converted to Stockholm HM-2 chainsaw buzzsaw riffs and Swedish melodic death metal.",
  },
  {
    title: "Shake It Off",
    artist: "Taylor Swift",
    genre: "Dance Pop",
    targetSubgenre: "Thrash Metal" as MetalSubgenre,
    url: "https://tabs.ultimate-guitar.com/tab/taylor-swift/shake-it-off-chords-1658428",
    description: "Upbeat pop drum loop transformed into a relentless 180 BPM Bay Area downpicked thrash gallop.",
  },
  {
    title: "Creep",
    artist: "Radiohead",
    genre: "90s Alt-Rock",
    targetSubgenre: "Djent" as MetalSubgenre,
    url: "https://tabs.ultimate-guitar.com/tab/radiohead/creep-chords-4169",
    description: "Iconic 4-chord grunge progression re-engineered into syncopated 7/8 polyrhythmic thall chugs with tight gate clamping.",
  },
  {
    title: "Bad Guy",
    artist: "Billie Eilish",
    genre: "Dark Pop / Bass",
    targetSubgenre: "Nu-Metal" as MetalSubgenre,
    url: "https://tabs.ultimate-guitar.com/tab/billie-eilish/bad-guy-chords-2646279",
    description: "Minimalist 808 bass transformed into heavy sub-octave Drop C nu-metal bounce riff with tritone pitch scrapes.",
  },
  {
    title: "Stay",
    artist: "The Kid LAROI & Justin Bieber",
    genre: "Synthpop / Trap",
    targetSubgenre: "Prog Metal" as MetalSubgenre,
    url: "https://tabs.ultimate-guitar.com/tab/the-kid-laroi/stay-chords-3796853",
    description: "Modern synth hook transformed into neoclassical sweep-picked arpeggios and high-octane melodic metal.",
  },
];

export const StyleConverter: React.FC<StyleConverterProps> = ({ onLoadAmpPreset, onNavigateToAmp }) => {
  const [songTitle, setSongTitle] = useState("");
  const [artist, setArtist] = useState("");
  const [rawTabOrUrl, setRawTabOrUrl] = useState("");
  const [originalGenre, setOriginalGenre] = useState("Pop / Synth");
  const [targetSubgenre, setTargetSubgenre] = useState<MetalSubgenre>("Metalcore");
  const [isConverting, setIsConverting] = useState(false);
  const [convertedData, setConvertedData] = useState<StyleConversionResult | null>(null);
  const [playingSectionIdx, setPlayingSectionIdx] = useState<number | null>(null);
  const [copied, setCopied] = useState(false);

  const audioEngine = AudioEngine.getInstance();

  const handleConvert = async (overrideData?: { title: string; artist: string; url: string; genre: string; targetSubgenre: MetalSubgenre }) => {
    const effTitle = overrideData?.title || songTitle;
    const effArtist = overrideData?.artist || artist;
    const effInput = overrideData?.url || rawTabOrUrl || effTitle;
    const effGenre = overrideData?.genre || originalGenre;
    const effSubgenre = overrideData?.targetSubgenre || targetSubgenre;

    if (!effTitle.trim() && !effInput.trim()) {
      alert("Please enter a song title, artist, or paste a tab URL (e.g. Taylor Swift, Radiohead)!");
      return;
    }

    setIsConverting(true);
    try {
      const res = await fetch("/api/style-convert", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          songTitle: effTitle,
          artist: effArtist,
          rawTabOrUrl: effInput,
          originalGenre: effGenre,
          targetMetalSubgenre: effSubgenre,
          targetTuning: "Drop C (C-G-C-F-A-D)",
        }),
      });

      const json = await res.json();
      if (json.success && json.data) {
        setConvertedData(json.data);
      }
    } catch (e) {
      console.error("Style conversion error:", e);
    } finally {
      setIsConverting(false);
    }
  };

  const handleSelectPreset = (preset: (typeof STYLE_PRESET_EXAMPLES)[0]) => {
    setSongTitle(preset.title);
    setArtist(preset.artist);
    setRawTabOrUrl(preset.url);
    setOriginalGenre(preset.genre);
    setTargetSubgenre(preset.targetSubgenre);
    handleConvert(preset);
  };

  const handlePlaySectionAudio = async (idx: number) => {
    if (playingSectionIdx === idx) {
      setPlayingSectionIdx(null);
      return;
    }

    await audioEngine.init();
    setPlayingSectionIdx(idx);

    const sec = convertedData?.sections[idx];
    const customVoicings = sec?.audioVoicings;

    const voicingsToPlay = customVoicings && customVoicings.length > 0
      ? customVoicings
      : sec?.name.toLowerCase().includes("breakdown")
      ? [
          { frets: [0, 0, 0, "x", "x", "x"], pm: true, dur: 0.15 },
          { frets: [0, 0, 0, "x", "x", "x"], pm: true, dur: 0.15 },
          { frets: [1, 1, 1, "x", "x", "x"], pm: false, dur: 0.35 },
          { frets: [0, 0, 0, "x", "x", "x"], pm: true, dur: 0.15 },
          { frets: [8, 8, 8, "x", "x", "x"], pm: false, dur: 0.4 },
        ]
      : [
          { frets: [0, 0, 0, "x", "x", "x"], pm: true, dur: 0.18 },
          { frets: [0, 0, 0, "x", "x", "x"], pm: true, dur: 0.18 },
          { frets: [7, 7, 7, "x", "x", "x"], pm: false, dur: 0.3 },
          { frets: [0, 0, 0, 2, 3, "x"], pm: false, dur: 0.4 },
          { frets: [5, 5, 5, "x", "x", "x"], pm: false, dur: 0.4 },
        ];

    let delay = 0;
    voicingsToPlay.forEach((item, i) => {
      setTimeout(() => {
        audioEngine.playDropCVoicing(item.frets as any, item.pm, item.dur);
        if (i === voicingsToPlay.length - 1) {
          setTimeout(() => setPlayingSectionIdx(null), 500);
        }
      }, delay);
      delay += item.dur * 1000 + 40;
    });
  };

  const handleApplyRecommendedRig = () => {
    if (!convertedData) return;
    const recId = convertedData.recommendedRig.presetId;
    const match = FACTORY_PRESETS.find((p) => p.id === recId) || FACTORY_PRESETS[0];
    if (match) {
      audioEngine.applyAmpParams(match.params);
      if (onLoadAmpPreset) onLoadAmpPreset(match.id);
    }
    if (onNavigateToAmp) onNavigateToAmp();
  };

  const handleCopyMetalTab = () => {
    if (!convertedData) return;
    const text = `=== POP/INDIE TO HEAVY METAL STYLE TRANSFORMATION ===
Original: ${convertedData.originalTitle} by ${convertedData.originalArtist} (${convertedData.originalGenre})
Target Subgenre: ${convertedData.targetMetalSubgenre} (Drop C Tuning: C-G-C-F-A-D)
Key Shift: ${convertedData.originalKey} -> ${convertedData.metalKey}
Tempo Shift: ${convertedData.originalBpm} BPM -> ${convertedData.metalBpm} BPM

--- TRANSFORMATION NOTES ---
${convertedData.transformationNotes}

--- CHORD TRANSFORMATION MATRIX ---
${convertedData.chordTransformations
  .map((c) => `* ${c.originalChord}  --->  ${c.metalDropCChord} ${c.fretNotation} : ${c.functionDescription}`)
  .join("\n")}

--- METALIZED SECTIONS & TABS ---
${convertedData.sections
  .map(
    (s) => `[${s.name}]
Original Chords: ${s.originalChords}
Drop C Metal: ${s.metalChords}
Drum Feel: ${s.drumFeel}
Technique: ${s.technique}
Tab:
${s.tab}`
  )
  .join("\n\n")}

Breakdown Pattern: ${convertedData.breakdownPattern || "0-0-0 chugs with 1-1-1 tritone slam"}
Recommended Rig: ${convertedData.recommendedRig.name} (${convertedData.recommendedRig.ampModel})
`;

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div id="style-converter-module" className="space-y-6">
      {/* Converter Bento Control Station */}
      <div className="bg-[#141416] border border-[#222226] rounded-2xl p-5 sm:p-6 shadow-2xl relative overflow-hidden">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-5 border-b border-[#222226]">
          <div>
            <div className="flex items-center gap-2.5">
              <span className="p-2 rounded-xl bg-[#0A0A0B] border border-[#222226] text-[#CCFF00]">
                <Flame className="w-5 h-5 fill-current" />
              </span>
              <h3 className="text-lg sm:text-xl font-bold tracking-widest text-white font-mono uppercase">
                "Metalize Anything" Style Conversion Engine
              </h3>
            </div>
            <p className="text-xs text-gray-400 mt-1 max-w-2xl">
              Turn any pop song, indie ballad, or acoustic tab (e.g. Taylor Swift, Radiohead, Billie Eilish)
              into crushing heavy metal riffs with 0-0-0 chugs, Add9 voicings, galloping rhythms, and breakdowns!
            </p>
          </div>

          {/* Target Subgenre Selector */}
          <div className="flex items-center gap-2 bg-[#0A0A0B] p-1.5 rounded-xl border border-[#222226]">
            <span className="text-xs font-mono text-gray-400 px-2 font-bold uppercase tracking-wider">TARGET METAL:</span>
            <select
              id="style-converter-subgenre-select"
              value={targetSubgenre}
              onChange={(e) => setTargetSubgenre(e.target.value as MetalSubgenre)}
              className="bg-[#141416] border border-[#333338] text-xs font-mono font-bold text-[#CCFF00] rounded-lg px-3 py-1.5 focus:border-[#CCFF00] outline-none cursor-pointer"
            >
              <option value="Metalcore">Modern Metalcore (0-0-0 Slams & Add9 Chorus)</option>
              <option value="Djent">Djent / Thall (7/8 Polyrhythms & Tight Chugs)</option>
              <option value="Thrash Metal">Thrash Metal (180 BPM Downpicked Gallops)</option>
              <option value="Swedish Death Metal">Swedish Death Metal (HM-2 Chainsaw)</option>
              <option value="Doom / Sludge">Doom / Sludge (Heavy Low Fuzz Drone)</option>
              <option value="Nu-Metal">Nu-Metal (Deftones / Slipknot Drop C Groove)</option>
              <option value="Prog Metal">Progressive Metal (Liquid Leads & Shimmer)</option>
              <option value="Black Metal">Black Metal (Cold Atmospheric Tremolo)</option>
            </select>
          </div>
        </div>

        {/* 1-Click Transformation Demos */}
        <div className="mt-4 flex items-center gap-2 overflow-x-auto pb-1 text-xs scrollbar-none">
          <span className="text-[10px] font-mono text-gray-500 uppercase tracking-widest whitespace-nowrap flex items-center gap-1 font-bold">
            <Zap className="w-3 h-3 text-[#CCFF00]" /> 1-Click Examples:
          </span>
          {STYLE_PRESET_EXAMPLES.map((preset) => (
            <button
              key={preset.title}
              id={`style-preset-${preset.title.toLowerCase().replace(/[^a-z0-9]/g, "-")}`}
              onClick={() => handleSelectPreset(preset)}
              className="px-2.5 py-1 rounded-lg bg-[#1D1D21] hover:bg-[#25252b] hover:border-[#CCFF00] text-gray-300 border border-[#333338] font-mono text-[11px] whitespace-nowrap transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <span className="font-bold text-gray-200">{preset.title}</span>
              <span className="text-[10px] text-gray-400">({preset.artist})</span>
              <span className="text-[9px] px-1 py-0.2 rounded bg-[#0A0A0B] text-[#CCFF00] font-bold">
                {preset.targetSubgenre}
              </span>
            </button>
          ))}
        </div>

        {/* Form Inputs Grid */}
        <div className="mt-4 grid grid-cols-1 md:grid-cols-12 gap-3">
          <div className="md:col-span-4 space-y-3">
            <div>
              <label className="block text-[10px] font-mono font-bold uppercase tracking-widest text-gray-500 mb-1">
                Song Title
              </label>
              <input
                id="style-converter-title"
                type="text"
                value={songTitle}
                onChange={(e) => setSongTitle(e.target.value)}
                placeholder="e.g. Anti-Hero / Decks Dark / Shake It Off"
                className="w-full bg-[#0A0A0B] border border-[#222226] rounded-xl px-3 py-2 text-xs sm:text-sm text-gray-100 font-mono focus:border-[#CCFF00] outline-none"
              />
            </div>

            <div>
              <label className="block text-[10px] font-mono font-bold uppercase tracking-widest text-gray-500 mb-1">
                Original Artist
              </label>
              <input
                id="style-converter-artist"
                type="text"
                value={artist}
                onChange={(e) => setArtist(e.target.value)}
                placeholder="e.g. Taylor Swift, Radiohead, Pop/Indie"
                className="w-full bg-[#0A0A0B] border border-[#222226] rounded-xl px-3 py-2 text-xs sm:text-sm text-gray-100 font-mono focus:border-[#CCFF00] outline-none"
              />
            </div>

            <div>
              <label className="block text-[10px] font-mono font-bold uppercase tracking-widest text-gray-500 mb-1">
                Original Style / Genre
              </label>
              <select
                value={originalGenre}
                onChange={(e) => setOriginalGenre(e.target.value)}
                className="w-full bg-[#0A0A0B] border border-[#222226] rounded-xl px-3 py-2 text-xs text-gray-200 font-mono focus:border-[#CCFF00] outline-none cursor-pointer"
              >
                <option value="Pop / Synth">Pop / Synth (Taylor Swift, Dua Lipa)</option>
                <option value="Art Rock / Indie">Art Rock / Indie (Radiohead, Arctic Monkeys)</option>
                <option value="Acoustic / Folk">Acoustic / Folk Ballad (Ed Sheeran, Bon Iver)</option>
                <option value="Dark Pop / 808">Dark Pop / 808 (Billie Eilish, Lorde)</option>
                <option value="Pop Punk / 2000s">Pop Punk / 2000s (Olivia Rodrigo, Paramore)</option>
                <option value="Jazz / Blues">Jazz / Blues Progression (ii - V - I)</option>
                <option value="R&B / Soul">R&B / Soul / Neo-Soul</option>
              </select>
            </div>
          </div>

          <div className="md:col-span-8 flex flex-col">
            <label className="block text-[10px] font-mono font-bold uppercase tracking-widest text-gray-500 mb-1 flex items-center justify-between">
              <span>Tab URL or Raw Chords Input</span>
              <span className="text-[10px] text-[#CCFF00] font-normal font-mono">
                Accepts Ultimate-Guitar URLs or chord text
              </span>
            </label>
            <textarea
              id="style-converter-raw-input"
              rows={6}
              value={rawTabOrUrl}
              onChange={(e) => setRawTabOrUrl(e.target.value)}
              placeholder="Paste tab URL or chords here, e.g.:&#10;https://tabs.ultimate-guitar.com/tab/radiohead/decks-dark-official-4270984&#10;or:&#10;[Intro] C - G - Am - F&#10;[Verse] C - G - Am - F"
              className="w-full flex-1 bg-[#0A0A0B] border border-[#222226] rounded-xl p-3 text-xs sm:text-sm text-gray-200 font-mono focus:border-[#CCFF00] outline-none resize-none leading-relaxed"
            />
          </div>
        </div>

        {/* Action Button */}
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-[#222226]">
          <div className="flex items-center gap-2 text-xs text-gray-400 font-mono">
            <Flame className="w-4 h-4 text-[#CCFF00]" />
            <span>Target Engine: <strong className="text-[#CCFF00]">{targetSubgenre} in Drop C</strong></span>
          </div>

          <button
            id="btn-convert-style-to-metal"
            onClick={() => handleConvert()}
            disabled={isConverting}
            className="px-6 py-2.5 rounded-xl bg-[#CCFF00] hover:bg-[#b8e600] text-black font-black text-xs font-mono uppercase tracking-wider flex items-center gap-2 shadow-lg shadow-[rgba(204,255,0,0.25)] transition-all cursor-pointer disabled:opacity-50"
          >
            {isConverting ? (
              <>
                <RotateCcw className="w-4 h-4 animate-spin text-black" />
                <span>METALLIZING CHORDS & RIFFS...</span>
              </>
            ) : (
              <>
                <Wand2 className="w-4 h-4 fill-current" />
                <span>TRANSFORM TO HEAVY METAL</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Results View */}
      <AnimatePresence mode="wait">
        {convertedData && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.25 }}
            className="bg-[#141416] border border-[#333338] rounded-2xl p-5 sm:p-6 shadow-2xl space-y-6"
          >
            {/* Header Analysis Strip */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-5 border-b border-[#222226]">
              <div>
                <div className="flex items-center gap-2.5 flex-wrap">
                  <span className="px-2.5 py-0.5 rounded bg-red-950/80 text-red-400 font-mono text-xs font-bold border border-red-900 uppercase flex items-center gap-1">
                    <Flame className="w-3.5 h-3.5 fill-current" /> Metalized
                  </span>
                  <span className="px-2.5 py-0.5 rounded bg-[#1D1D21] text-[#CCFF00] font-mono text-xs font-bold border border-[#333338] uppercase">
                    {convertedData.targetMetalSubgenre}
                  </span>
                  <h3 className="text-lg sm:text-xl font-bold text-white font-mono">
                    {convertedData.originalTitle} <span className="text-gray-400 font-normal">({convertedData.originalArtist})</span>
                  </h3>
                </div>
                <p className="text-xs text-gray-400 mt-1 max-w-3xl leading-relaxed">
                  {convertedData.transformationNotes}
                </p>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <button
                  onClick={handleApplyRecommendedRig}
                  className="px-3.5 py-2 rounded-xl bg-[#1D1D21] hover:bg-[#25252b] text-[#CCFF00] text-xs font-mono font-bold flex items-center gap-1.5 transition-all border border-[#333338] cursor-pointer"
                >
                  <SlidersHorizontal className="w-3.5 h-3.5" />
                  <span>Load {convertedData.recommendedRig.ampModel} Rig</span>
                </button>
                <button
                  onClick={handleCopyMetalTab}
                  className="px-3.5 py-2 rounded-xl bg-[#CCFF00] hover:bg-[#b8e600] text-black text-xs font-mono font-black uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer"
                >
                  {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  {copied ? "Copied!" : "Copy Full Metal Chart"}
                </button>
              </div>
            </div>

            {/* Before vs After Key & BPM Transformation Strip */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3.5 rounded-xl bg-[#0A0A0B] border border-[#222226]">
                <span className="text-[10px] font-mono text-gray-500 uppercase tracking-wider block font-bold">ORIGINAL TEMPO</span>
                <span className="text-sm font-mono text-gray-300 font-bold">{convertedData.originalBpm} BPM</span>
                <span className="text-[10px] text-gray-500 font-mono block mt-0.5">{convertedData.originalGenre}</span>
              </div>
              <div className="p-3.5 rounded-xl bg-[#0A0A0B] border border-[#CCFF00]/40 shadow-[0_0_10px_rgba(204,255,0,0.05)]">
                <span className="text-[10px] font-mono text-[#CCFF00] uppercase tracking-wider block font-bold">METAL TEMPO</span>
                <span className="text-sm font-mono text-[#CCFF00] font-bold">{convertedData.metalBpm} BPM</span>
                <span className="text-[10px] text-emerald-400 font-mono block mt-0.5">Heavy Gallop Speed</span>
              </div>
              <div className="p-3.5 rounded-xl bg-[#0A0A0B] border border-[#222226]">
                <span className="text-[10px] font-mono text-gray-500 uppercase tracking-wider block font-bold">ORIGINAL KEY</span>
                <span className="text-sm font-mono text-gray-300 font-bold">{convertedData.originalKey}</span>
              </div>
              <div className="p-3.5 rounded-xl bg-[#0A0A0B] border border-[#CCFF00]/40 shadow-[0_0_10px_rgba(204,255,0,0.05)]">
                <span className="text-[10px] font-mono text-[#CCFF00] uppercase tracking-wider block font-bold">DROP C KEY</span>
                <span className="text-sm font-mono text-[#CCFF00] font-bold">{convertedData.metalKey}</span>
              </div>
            </div>

            {/* Chord Transformation Matrix */}
            <div className="space-y-3">
              <h4 className="text-xs font-mono font-bold uppercase tracking-widest text-[#CCFF00] flex items-center gap-2">
                <Music className="w-4 h-4" /> Before & After Chord Transformation Matrix
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {convertedData.chordTransformations.map((item, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-xl bg-[#0A0A0B] border border-[#222226] space-y-1.5 flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between text-xs font-mono">
                        <span className="text-gray-400">{item.originalChord}</span>
                        <ArrowRight className="w-3 h-3 text-[#CCFF00]" />
                        <span className="text-[#CCFF00] font-bold">{item.metalDropCChord}</span>
                      </div>
                      <div className="mt-1 font-mono text-xs text-white font-semibold">
                        Fret: <span className="text-[#CCFF00]">{item.fretNotation}</span>
                      </div>
                    </div>
                    <p className="text-[10px] text-gray-400 italic pt-1 border-t border-[#222226]">
                      {item.functionDescription}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Metalized Sections Bento Grid */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-mono font-bold uppercase tracking-widest text-[#CCFF00] flex items-center gap-2">
                  <Zap className="w-4 h-4 fill-current" /> Metal Tablature & Interactive Riff Playback
                </h4>
                <span className="text-[11px] text-gray-500 font-mono">
                  Tuning: Drop C (C-G-C-F-A-D)
                </span>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {convertedData.sections.map((sec, idx) => (
                  <div
                    key={sec.name + idx}
                    className="bg-[#0A0A0B] rounded-xl p-4 border border-[#222226] hover:border-[#333338] transition-all flex flex-col justify-between space-y-3"
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-mono font-bold uppercase tracking-wider text-[#CCFF00] flex items-center gap-1.5">
                          <Flame className="w-3.5 h-3.5 fill-current" /> {sec.name}
                        </span>
                        <button
                          onClick={() => handlePlaySectionAudio(idx)}
                          className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold flex items-center gap-1 transition-all cursor-pointer ${
                            playingSectionIdx === idx
                              ? "bg-red-500 text-white animate-pulse"
                              : "bg-[#1D1D21] hover:bg-[#CCFF00] hover:text-black text-gray-300 border border-[#333338]"
                          }`}
                        >
                          {playingSectionIdx === idx ? (
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
                        <div className="flex items-center gap-1.5 font-mono">
                          <span className="text-gray-500">Original Chords:</span>
                          <span className="text-gray-300">{sec.originalChords}</span>
                        </div>
                        <div className="flex items-center gap-1.5 font-mono font-bold">
                          <span className="text-[#CCFF00]">Drop C Metal:</span>
                          <span className="text-white bg-[#141416] px-2 py-0.5 rounded border border-[#222226]">
                            {sec.metalChords}
                          </span>
                        </div>
                        <div className="text-[11px] text-gray-400 italic pt-1 flex items-center gap-1.5">
                          <Volume2 className="w-3 h-3 text-gray-500" />
                          <span>Drum Feel: {sec.drumFeel}</span>
                        </div>
                        <p className="text-[11px] text-gray-400 italic">{sec.technique}</p>
                      </div>
                    </div>

                    {/* Tab Block */}
                    <div className="bg-[#141416] rounded-lg p-2.5 border border-[#222226] font-mono text-[11px] text-[#CCFF00]/90 overflow-x-auto whitespace-pre leading-tight select-all">
                      {sec.tab}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Recommended Amp & Effects Setup */}
            {convertedData.recommendedRig && (
              <div className="p-4 rounded-xl bg-[#0A0A0B] border border-[#222226] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <SlidersHorizontal className="w-4 h-4 text-[#CCFF00]" />
                    <h4 className="text-xs font-mono font-bold uppercase tracking-widest text-white">
                      Recommended Amp & Pedalboard Setup
                    </h4>
                  </div>
                  <p className="text-xs text-gray-300 font-mono">
                    <strong className="text-[#CCFF00]">{convertedData.recommendedRig.name}</strong> • {convertedData.recommendedRig.distortionTip}
                  </p>
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {convertedData.recommendedRig.pedals.map((pedal, i) => (
                      <span
                        key={i}
                        className="px-2 py-0.5 rounded bg-[#141416] text-gray-400 font-mono text-[10px] border border-[#222226]"
                      >
                        {pedal}
                      </span>
                    ))}
                  </div>
                </div>

                <button
                  onClick={handleApplyRecommendedRig}
                  className="px-4 py-2 rounded-xl bg-[#CCFF00] hover:bg-[#b8e600] text-black font-mono font-black text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap shadow-md"
                >
                  <Zap className="w-3.5 h-3.5 fill-current" />
                  <span>Load Rig in Amp Studio</span>
                </button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
