import React, { useState } from "react";
import { AudioEngine } from "../audio/audioEngine";
import { ScrapedSongResult, TransposedSongData, MetalSubgenre } from "../types";
import { motion, AnimatePresence } from "motion/react";
import {
  Search,
  Globe,
  Zap,
  Play,
  Square,
  Sparkles,
  Copy,
  Check,
  RotateCcw,
  ExternalLink,
  Music,
  ArrowRight,
  Sliders,
  ShieldCheck,
  Layers,
  Flame,
} from "lucide-react";

interface RiffScraperProps {
  onApplyTransposition?: (data: TransposedSongData, songTitle: string, artist: string) => void;
  onNavigateToAmp?: () => void;
}

const SAMPLE_SCRAPER_URLS = [
  {
    label: "Radiohead - Decks Dark",
    url: "https://tabs.ultimate-guitar.com/tab/radiohead/decks-dark-official-4270984",
    artist: "Radiohead",
    title: "Decks Dark",
    genre: "Art Rock",
  },
  {
    label: "Taylor Swift - Anti-Hero",
    url: "https://tabs.ultimate-guitar.com/tab/taylor-swift/anti-hero-chords-4389025",
    artist: "Taylor Swift",
    title: "Anti-Hero",
    genre: "Pop / Synth",
  },
  {
    label: "Metallica - Master of Puppets",
    url: "https://tabs.ultimate-guitar.com/tab/metallica/master-of-puppets-chords-837492",
    artist: "Metallica",
    title: "Master of Puppets",
    genre: "Thrash Metal",
  },
  {
    label: "Deftones - Change",
    url: "https://tabs.ultimate-guitar.com/tab/deftones/change-in-the-house-of-flies-tabs-12847",
    artist: "Deftones",
    title: "Change (In the House of Flies)",
    genre: "Alt-Metal / Drop C",
  },
  {
    label: "Slipknot - Duality",
    url: "https://tabs.ultimate-guitar.com/tab/slipknot/duality-tabs-109283",
    artist: "Slipknot",
    title: "Duality",
    genre: "Nu-Metal / Drop B/C",
  },
  {
    label: "Nirvana - Smells Like Teen Spirit",
    url: "https://tabs.ultimate-guitar.com/tab/nirvana/smells-like-teen-spirit-chords-807283",
    artist: "Nirvana",
    title: "Smells Like Teen Spirit",
    genre: "Grunge",
  },
];

export const RiffScraper: React.FC<RiffScraperProps> = ({ onApplyTransposition }) => {
  const [urlInput, setUrlInput] = useState("");
  const [targetSubgenre, setTargetSubgenre] = useState<MetalSubgenre>("Metalcore");
  const [isScraping, setIsScraping] = useState(false);
  const [scrapedData, setScrapedData] = useState<ScrapedSongResult | null>(null);
  const [playingSectionIdx, setPlayingSectionIdx] = useState<number | null>(null);
  const [copied, setCopied] = useState(false);
  const [activeView, setActiveView] = useState<"scraped" | "transposed">("transposed");

  const audioEngine = AudioEngine.getInstance();

  const handleScrape = async (overrideUrl?: string) => {
    const targetUrl = overrideUrl || urlInput;
    if (!targetUrl.trim()) {
      alert("Please enter a valid song URL, Ultimate Guitar link, or Songsterr tab!");
      return;
    }

    setIsScraping(true);
    try {
      const res = await fetch("/api/scrape-song-url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url: targetUrl,
          targetTuning: "Drop C (C-G-C-F-A-D)",
        }),
      });

      const json = await res.json();
      if (json.success && json.data) {
        setScrapedData(json.data);
        setActiveView(json.data.transposedDropC ? "transposed" : "scraped");
        if (onApplyTransposition && json.data.transposedDropC) {
          onApplyTransposition(json.data.transposedDropC, json.data.songTitle, json.data.artist);
        }
      }
    } catch (e) {
      console.error("Error scraping song chords:", e);
    } finally {
      setIsScraping(false);
    }
  };

  const handleSelectSample = (sample: (typeof SAMPLE_SCRAPER_URLS)[0]) => {
    setUrlInput(sample.url);
    handleScrape(sample.url);
  };

  // Play section riff audio using the guitar DSP synthesis
  const handlePlayDropCRiff = async (idx: number) => {
    if (playingSectionIdx === idx) {
      setPlayingSectionIdx(null);
      return;
    }

    await audioEngine.init();
    setPlayingSectionIdx(idx);

    const isBreakdown = scrapedData?.transposedDropC?.sections[idx]?.name.toLowerCase().includes("breakdown");
    const pattern = isBreakdown
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
          { frets: [3, 3, 3, "x", "x", "x"], pm: false, dur: 0.3 },
          { frets: [8, 8, 8, "x", "x", "x"], pm: false, dur: 0.35 },
          { frets: [10, 10, 10, "x", "x", "x"], pm: false, dur: 0.45 },
        ];

    let delay = 0;
    pattern.forEach((item, i) => {
      setTimeout(() => {
        audioEngine.playDropCVoicing(item.frets as any, item.pm, item.dur);
        if (i === pattern.length - 1) {
          setTimeout(() => setPlayingSectionIdx(null), 500);
        }
      }, delay);
      delay += item.dur * 1000 + 40;
    });
  };

  const handleCopyTransposedTab = () => {
    if (!scrapedData?.transposedDropC) return;
    const text = `=== DROP C METAL TRANSCRIPTION (FROM RIFF SCRAPER) ===
Source URL: ${scrapedData.url}
Song: ${scrapedData.songTitle} - ${scrapedData.artist}
Original Key: ${scrapedData.originalKey} (${scrapedData.originalBpm} BPM)
Transposed Metal Key: ${scrapedData.transposedDropC.metalKey} (${scrapedData.transposedDropC.bpm} BPM)
Tuning: Drop C (C-G-C-F-A-D)

${scrapedData.transposedDropC.sections
  .map(
    (s) => `--- ${s.name} ---
Original: ${s.originalChords}
Drop C Metal: ${s.metalChords}
Technique: ${s.technique}
Tab:
${s.tab}`
  )
  .join("\n\n")}
`;

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div id="riff-scraper-module" className="space-y-6">
      {/* Scraper Search & URL Input Bento Box */}
      <div className="bg-[#141416] border border-[#222226] rounded-2xl p-5 sm:p-6 shadow-2xl relative overflow-hidden">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-5 border-b border-[#222226]">
          <div>
            <div className="flex items-center gap-2.5">
              <span className="p-2 rounded-xl bg-[#0A0A0B] border border-[#222226] text-[#CCFF00]">
                <Globe className="w-5 h-5" />
              </span>
              <h3 className="text-lg sm:text-xl font-bold tracking-widest text-white font-mono uppercase">
                Web Riff Scraper & Drop C Auto-Harmonizer
              </h3>
            </div>
            <p className="text-xs text-gray-400 mt-1 max-w-2xl">
              Paste any song or guitar tab URL (Ultimate Guitar, Songsterr, Cifra Club, Chordify) to automatically
              extract its chord progression, key, and sections, then instantly transpose the entire sequence into Drop C!
            </p>
          </div>

          {/* Subgenre Style */}
          <div className="flex items-center gap-2 bg-[#0A0A0B] p-1.5 rounded-xl border border-[#222226]">
            <span className="text-xs font-mono text-gray-400 px-2 font-bold uppercase tracking-wider">METAL FLAVOR:</span>
            <select
              value={targetSubgenre}
              onChange={(e) => setTargetSubgenre(e.target.value as MetalSubgenre)}
              className="bg-[#141416] border border-[#333338] text-xs font-mono font-bold text-[#CCFF00] rounded-lg px-3 py-1.5 focus:border-[#CCFF00] outline-none cursor-pointer"
            >
              <option value="Metalcore">Metalcore (0-0-0 Breakdown Slams & Add9)</option>
              <option value="Djent">Djent / Thall (Polyrhythms & Tight Gates)</option>
              <option value="Thrash Metal">Thrash Metal (180 BPM Downpicked Gallops)</option>
              <option value="Swedish Death Metal">Swedish Death Metal (HM-2 Buzzsaw)</option>
              <option value="Doom / Sludge">Doom / Sludge (Heavy Low Fuzz)</option>
              <option value="Prog Metal">Progressive Metal (Liquid Leads)</option>
              <option value="Nu-Metal">Nu-Metal (Deftones / Slipknot Drop C)</option>
            </select>
          </div>
        </div>

        {/* URL Input Form */}
        <div className="mt-4 space-y-3">
          <div className="flex flex-col sm:flex-row items-center gap-2.5">
            <div className="relative flex-1 w-full">
              <Search className="w-4 h-4 text-gray-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                id="riff-scraper-url-input"
                type="url"
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                placeholder="Paste tab URL e.g. https://tabs.ultimate-guitar.com/tab/radiohead/decks-dark-official-4270984"
                className="w-full bg-[#0A0A0B] border border-[#222226] rounded-xl pl-10 pr-4 py-3 text-xs sm:text-sm text-gray-100 font-mono focus:border-[#CCFF00] outline-none"
              />
            </div>
            <button
              id="btn-scrape-riff-url"
              onClick={() => handleScrape()}
              disabled={isScraping || !urlInput.trim()}
              className="w-full sm:w-auto px-6 py-3 rounded-xl bg-[#CCFF00] hover:bg-[#b8e600] text-black font-black text-xs font-mono uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-[rgba(204,255,0,0.2)] transition-all cursor-pointer disabled:opacity-50"
            >
              {isScraping ? (
                <>
                  <RotateCcw className="w-4 h-4 animate-spin text-black" />
                  <span>SCRAPING TAB & RE-HARMONIZING...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 fill-current" />
                  <span>SCRAPE & EXTRACT CHORDS</span>
                </>
              )}
            </button>
          </div>

          {/* Quick Preset URLs */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs scrollbar-none pt-1">
            <span className="text-[10px] font-mono text-gray-500 uppercase tracking-widest whitespace-nowrap flex items-center gap-1 font-bold">
              <Zap className="w-3 h-3 text-[#CCFF00]" /> 1-Click Tab Demos:
            </span>
            {SAMPLE_SCRAPER_URLS.map((sample) => (
              <button
                key={sample.title}
                id={`demo-url-${sample.title.toLowerCase().replace(/[^a-z0-9]/g, "-")}`}
                onClick={() => handleSelectSample(sample)}
                className="px-2.5 py-1 rounded-lg bg-[#1D1D21] hover:bg-[#25252b] hover:border-[#CCFF00] text-gray-300 border border-[#333338] font-mono text-[11px] whitespace-nowrap transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <span className="font-bold text-gray-200">{sample.title}</span>
                <span className="text-[10px] text-gray-400">({sample.artist})</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Scraped Results View */}
      <AnimatePresence mode="wait">
        {scrapedData && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.25 }}
            className="bg-[#141416] border border-[#333338] rounded-2xl p-5 sm:p-6 shadow-2xl space-y-6"
          >
            {/* Header Telemetry */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-5 border-b border-[#222226]">
              <div>
                <div className="flex items-center gap-2.5 flex-wrap">
                  <span className="px-2.5 py-0.5 rounded bg-[#1D1D21] text-[#CCFF00] font-mono text-xs font-bold border border-[#333338] uppercase flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3" /> {scrapedData.source}
                  </span>
                  <span className="px-2 py-0.5 rounded bg-emerald-950/70 text-emerald-400 font-mono text-[10px] font-bold border border-emerald-900/60 uppercase">
                    Scraped & Parsed
                  </span>
                  <h3 className="text-lg sm:text-xl font-bold text-white font-mono">
                    {scrapedData.songTitle} <span className="text-gray-400 font-normal">by {scrapedData.artist}</span>
                  </h3>
                </div>

                {/* URL preview */}
                <div className="flex items-center gap-1.5 text-xs text-gray-500 font-mono mt-1.5 truncate max-w-xl">
                  <ExternalLink className="w-3.5 h-3.5 flex-shrink-0 text-gray-400" />
                  <span className="truncate">{scrapedData.url}</span>
                </div>
              </div>

              {/* View Switcher & Action Controls */}
              <div className="flex items-center gap-2 flex-wrap">
                <div className="flex items-center bg-[#0A0A0B] p-1 rounded-xl border border-[#222226]">
                  <button
                    onClick={() => setActiveView("scraped")}
                    className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer ${
                      activeView === "scraped"
                        ? "bg-[#1D1D21] text-[#CCFF00] border border-[#333338]"
                        : "text-gray-400 hover:text-gray-200"
                    }`}
                  >
                    Original Chords
                  </button>
                  <button
                    onClick={() => setActiveView("transposed")}
                    className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                      activeView === "transposed"
                        ? "bg-[#CCFF00] text-black font-black"
                        : "text-gray-400 hover:text-gray-200"
                    }`}
                  >
                    <Zap className="w-3 h-3 fill-current" /> Drop C Metal Tab
                  </button>
                </div>

                <button
                  onClick={handleCopyTransposedTab}
                  className="px-3 py-2 rounded-xl bg-[#1D1D21] hover:bg-[#25252b] text-gray-200 text-xs font-mono font-bold flex items-center gap-1.5 transition-all border border-[#333338] cursor-pointer"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-[#CCFF00]" /> : <Copy className="w-3.5 h-3.5" />}
                  {copied ? "Copied Tab!" : "Copy Drop C Chart"}
                </button>
              </div>
            </div>

            {/* Quick Metrics Strip */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3 rounded-xl bg-[#0A0A0B] border border-[#222226]">
                <span className="text-[10px] font-mono text-gray-500 uppercase tracking-wider block font-bold">ORIGINAL KEY</span>
                <span className="text-sm font-mono text-gray-200 font-bold">{scrapedData.originalKey}</span>
              </div>
              <div className="p-3 rounded-xl bg-[#0A0A0B] border border-[#222226]">
                <span className="text-[10px] font-mono text-gray-500 uppercase tracking-wider block font-bold">DETECTED TEMPO</span>
                <span className="text-sm font-mono text-gray-200 font-bold">{scrapedData.originalBpm} BPM</span>
              </div>
              <div className="p-3 rounded-xl bg-[#0A0A0B] border border-[#222226]">
                <span className="text-[10px] font-mono text-gray-500 uppercase tracking-wider block font-bold">DROP C KEY</span>
                <span className="text-sm font-mono text-[#CCFF00] font-bold">
                  {scrapedData.transposedDropC?.metalKey || "C Minor"}
                </span>
              </div>
              <div className="p-3 rounded-xl bg-[#0A0A0B] border border-[#222226]">
                <span className="text-[10px] font-mono text-gray-500 uppercase tracking-wider block font-bold">TUNING</span>
                <span className="text-sm font-mono text-[#CCFF00] font-bold">Drop C (C-G-C-F-A-D)</span>
              </div>
            </div>

            {/* 1-Click Reharmonization Banner */}
            {scrapedData.transposedDropC && (
              <div className="p-4 rounded-xl bg-[#0A0A0B] border border-[#CCFF00]/30 shadow-[0_0_15px_rgba(204,255,0,0.08)] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span className="p-2 rounded-lg bg-[#141416] text-[#CCFF00] border border-[#222226]">
                    <Flame className="w-5 h-5 fill-current" />
                  </span>
                  <div>
                    <h4 className="text-xs font-mono font-bold text-white uppercase tracking-wider">
                      Drop C Transposition Ready: 1-Finger Power Chords & 0-0-0 Chugs
                    </h4>
                    <p className="text-[11px] text-gray-400 mt-0.5">
                      {scrapedData.transposedDropC.styleDescription}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setActiveView("transposed")}
                    className="px-4 py-2 rounded-xl bg-[#CCFF00] hover:bg-[#b8e600] text-black font-mono font-black text-xs uppercase tracking-wider flex items-center gap-1.5 cursor-pointer shadow-md"
                  >
                    <Zap className="w-3.5 h-3.5 fill-current" />
                    <span>View Transposed Riffs</span>
                  </button>
                </div>
              </div>
            )}

            {/* View A: Transposed Drop C View */}
            {activeView === "transposed" && scrapedData.transposedDropC && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-mono font-bold uppercase tracking-widest text-[#CCFF00] flex items-center gap-2">
                    <Zap className="w-4 h-4 fill-current" /> Drop C Metal Tablature & Section Chords
                  </h4>
                  <span className="text-[11px] text-gray-500 font-mono">
                    Tuning: C2 - G2 - C3 - F3 - A3 - D4
                  </span>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {scrapedData.transposedDropC.sections.map((sec, idx) => (
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
                            onClick={() => handlePlayDropCRiff(idx)}
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
                            <span className="text-gray-500">Scraped Chords:</span>
                            <span className="text-gray-300">{sec.originalChords}</span>
                          </div>
                          <div className="flex items-center gap-1.5 font-mono font-bold">
                            <span className="text-[#CCFF00]">Drop C Metal:</span>
                            <span className="text-white bg-[#141416] px-2 py-0.5 rounded border border-[#222226]">
                              {sec.metalChords}
                            </span>
                          </div>
                          <p className="text-[11px] text-gray-400 italic pt-1">{sec.technique}</p>
                        </div>
                      </div>

                      {/* Tab notation */}
                      <div className="bg-[#141416] rounded-lg p-2.5 border border-[#222226] font-mono text-[11px] text-[#CCFF00]/90 overflow-x-auto whitespace-pre leading-tight select-all">
                        {sec.tab}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Fretboard Tips */}
                {scrapedData.transposedDropC.dropCFretboardTips && (
                  <div className="p-4 rounded-xl bg-[#0A0A0B] border border-[#222226] space-y-2">
                    <h5 className="text-xs font-mono font-bold uppercase tracking-widest text-[#CCFF00] flex items-center gap-1.5">
                      <Sliders className="w-3.5 h-3.5" /> Drop C Fretboard Pro Tips:
                    </h5>
                    <ul className="text-xs text-gray-400 space-y-1 list-disc list-inside">
                      {scrapedData.transposedDropC.dropCFretboardTips.map((tip, i) => (
                        <li key={i}>{tip}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}

            {/* View B: Original Scraped Chord Sheet */}
            {activeView === "scraped" && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-mono font-bold uppercase tracking-widest text-gray-300 flex items-center gap-2">
                    <Music className="w-4 h-4 text-[#CCFF00]" /> Scraped Original Structure & Chords
                  </h4>
                  <span className="text-[11px] text-gray-500 font-mono">
                    Extracted from {scrapedData.source}
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {scrapedData.sections.map((sec, idx) => (
                    <div
                      key={sec.name + idx}
                      className="bg-[#0A0A0B] rounded-xl p-3.5 border border-[#222226] space-y-2 flex flex-col justify-between"
                    >
                      <div>
                        <div className="flex items-center justify-between">
                          <span className="font-mono text-xs font-bold text-white uppercase">{sec.name}</span>
                          <span className="text-[10px] font-mono text-gray-500">{sec.chords.length} chords</span>
                        </div>

                        <div className="flex flex-wrap gap-1.5 mt-2">
                          {sec.chords.map((c, ci) => (
                            <span
                              key={ci}
                              className="px-2 py-0.5 rounded bg-[#1D1D21] text-[#CCFF00] font-mono text-xs font-bold border border-[#333338]"
                            >
                              {c}
                            </span>
                          ))}
                        </div>

                        {sec.lyricsSnippet && (
                          <p className="text-[11px] text-gray-400 mt-2 italic line-clamp-2">
                            "{sec.lyricsSnippet}"
                          </p>
                        )}
                      </div>

                      {sec.rawTab && (
                        <div className="mt-2 bg-[#141416] p-2 rounded font-mono text-[10px] text-gray-300 overflow-x-auto whitespace-pre">
                          {sec.rawTab}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
