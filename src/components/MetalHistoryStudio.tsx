import React, { useState, useMemo } from "react";
import {
  METAL_ERAS,
  METAL_SUBGENRES,
  METAL_GUITAR_LORE,
  MetalEra,
  MetalSubgenre,
} from "../data/metalHistoryData";
import { AudioEngine } from "../audio/audioEngine";
import {
  BookOpen,
  Calendar,
  Disc,
  Flame,
  Globe,
  Headphones,
  Layers,
  Music,
  Play,
  Radio,
  Search,
  Sliders,
  Sparkles,
  Zap,
  Tag,
  Guitar,
  ChevronRight,
  Shield,
  Activity,
} from "lucide-react";

interface MetalHistoryStudioProps {
  onSelectPreset?: (presetId: string) => void;
  onNavigateToAmp?: () => void;
}

type ActiveSection = "eras" | "subgenres" | "tuning-lore" | "gear-secrets";

export const MetalHistoryStudio: React.FC<MetalHistoryStudioProps> = ({
  onSelectPreset,
  onNavigateToAmp,
}) => {
  const [activeSection, setActiveSection] = useState<ActiveSection>("eras");
  const [selectedEraId, setSelectedEraId] = useState<string>("era-metalcore-dropc");
  const [selectedSubgenreId, setSelectedSubgenreId] = useState<string>("genre-dropc-metalcore");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [previewingRiff, setPreviewingRiff] = useState<string | null>(null);

  const audioEngine = AudioEngine.getInstance();

  // Filtered Subgenres & Eras based on search
  const filteredSubgenres = useMemo(() => {
    if (!searchQuery.trim()) return METAL_SUBGENRES;
    const q = searchQuery.toLowerCase();
    return METAL_SUBGENRES.filter(
      (g) =>
        g.name.toLowerCase().includes(q) ||
        g.description.toLowerCase().includes(q) ||
        g.tuning.toLowerCase().includes(q) ||
        g.pioneerBands.some((b) => b.name.toLowerCase().includes(q) || b.keyGuitarist.toLowerCase().includes(q)) ||
        g.essentialAlbums.some((a) => a.artist.toLowerCase().includes(q) || a.title.toLowerCase().includes(q))
    );
  }, [searchQuery]);

  const filteredEras = useMemo(() => {
    if (!searchQuery.trim()) return METAL_ERAS;
    const q = searchQuery.toLowerCase();
    return METAL_ERAS.filter(
      (e) =>
        e.title.toLowerCase().includes(q) ||
        e.period.toLowerCase().includes(q) ||
        e.summary.toLowerCase().includes(q) ||
        e.definingBands.some((b) => b.toLowerCase().includes(q)) ||
        e.iconicAlbums.some((a) => a.artist.toLowerCase().includes(q) || a.album.toLowerCase().includes(q))
    );
  }, [searchQuery]);

  const activeEra = useMemo(() => {
    return METAL_ERAS.find((e) => e.id === selectedEraId) || METAL_ERAS[3];
  }, [selectedEraId]);

  const activeSubgenre = useMemo(() => {
    return METAL_SUBGENRES.find((g) => g.id === selectedSubgenreId) || METAL_SUBGENRES[0];
  }, [selectedSubgenreId]);

  const handlePlayRiff = async (type: "chug" | "gallop" | "add9" | "breakdown" | "ambient", id: string) => {
    await audioEngine.init();
    setPreviewingRiff(id);
    if (type === "chug") audioEngine.playTestChug();
    else if (type === "gallop") audioEngine.playTestGallop();
    else if (type === "add9") audioEngine.playTestAdd9();
    else if (type === "breakdown") audioEngine.playTestBreakdown();
    else audioEngine.playTestChug();

    setTimeout(() => {
      setPreviewingRiff(null);
    }, 1800);
  };

  const handleLoadRig = (presetId: string) => {
    if (onSelectPreset) {
      onSelectPreset(presetId);
    }
    if (onNavigateToAmp) {
      onNavigateToAmp();
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Bento Banner */}
      <div className="bg-gradient-to-r from-[#141416] via-[#111114] to-[#141416] border border-[#222226] rounded-2xl p-5 sm:p-6 shadow-2xl relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-[#CCFF00] text-black font-bold shadow-[0_0_12px_rgba(204,255,0,0.3)]">
                <Flame className="w-5 h-5 fill-current" />
              </span>
              <h2 className="text-xl sm:text-2xl font-black font-mono tracking-tight text-white">
                HEAVY METAL <span className="text-[#CCFF00]">ENCYCLOPEDIA & LORE</span>
              </h2>
            </div>
            <p className="text-xs sm:text-sm text-gray-400 font-mono">
              The sonic evolution of Heavy Metal, Drop C tuning origins, guitar rigs, pioneer bands, and subgenres.
            </p>
          </div>

          {/* Quick Stats Pills */}
          <div className="flex items-center gap-2 flex-wrap">
            <div className="bg-[#0A0A0B] border border-[#222226] px-3 py-1.5 rounded-xl flex items-center gap-2 text-xs font-mono">
              <Calendar className="w-3.5 h-3.5 text-[#CCFF00]" />
              <span className="text-gray-400">1968 - Present</span>
            </div>
            <div className="bg-[#0A0A0B] border border-[#222226] px-3 py-1.5 rounded-xl flex items-center gap-2 text-xs font-mono">
              <Music className="w-3.5 h-3.5 text-[#CCFF00]" />
              <span className="text-gray-400">Drop C Fundamental: 65.4 Hz</span>
            </div>
          </div>
        </div>

        {/* Section Tabs & Search Toolbar */}
        <div className="mt-6 pt-4 border-t border-[#222226] flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Section Buttons */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            <button
              type="button"
              onClick={() => setActiveSection("eras")}
              className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition-all flex items-center gap-2 cursor-pointer shrink-0 ${
                activeSection === "eras"
                  ? "bg-[#CCFF00] text-black shadow-[0_0_12px_rgba(204,255,0,0.3)]"
                  : "bg-[#0A0A0B] text-gray-400 hover:text-gray-200 border border-[#222226]"
              }`}
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>Metal Timeline & Eras</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveSection("subgenres")}
              className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition-all flex items-center gap-2 cursor-pointer shrink-0 ${
                activeSection === "subgenres"
                  ? "bg-[#CCFF00] text-black shadow-[0_0_12px_rgba(204,255,0,0.3)]"
                  : "bg-[#0A0A0B] text-gray-400 hover:text-gray-200 border border-[#222226]"
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Subgenres & Rigs</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveSection("tuning-lore")}
              className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition-all flex items-center gap-2 cursor-pointer shrink-0 ${
                activeSection === "tuning-lore"
                  ? "bg-[#CCFF00] text-black shadow-[0_0_12px_rgba(204,255,0,0.3)]"
                  : "bg-[#0A0A0B] text-gray-400 hover:text-gray-200 border border-[#222226]"
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Drop C Physics & Lore</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveSection("gear-secrets")}
              className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition-all flex items-center gap-2 cursor-pointer shrink-0 ${
                activeSection === "gear-secrets"
                  ? "bg-[#CCFF00] text-black shadow-[0_0_12px_rgba(204,255,0,0.3)]"
                  : "bg-[#0A0A0B] text-gray-400 hover:text-gray-200 border border-[#222226]"
              }`}
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>Historic Tone Secrets</span>
            </button>
          </div>

          {/* Search Filter */}
          <div className="relative min-w-[220px] md:w-64">
            <Search className="w-3.5 h-3.5 text-gray-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search band, album, tuning, gear..."
              className="w-full bg-[#0A0A0B] border border-[#222226] rounded-xl pl-8 pr-3 py-1.5 text-xs text-gray-200 font-mono focus:border-[#CCFF00] outline-none placeholder:text-gray-600 transition-colors"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 text-xs font-mono"
              >
                ✕
              </button>
            )}
          </div>
        </div>
      </div>

      {/* SECTION 1: TIMELINE & ERAS */}
      {activeSection === "eras" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Era Selector Pills / Timeline Navigator */}
          <div className="lg:col-span-4 space-y-2.5">
            <div className="flex items-center justify-between pb-1">
              <span className="text-[10px] font-mono text-gray-500 uppercase tracking-widest font-bold">
                HISTORIC ERAS ({filteredEras.length})
              </span>
            </div>

            {filteredEras.map((era) => {
              const isSelected = selectedEraId === era.id;
              return (
                <div
                  key={era.id}
                  onClick={() => setSelectedEraId(era.id)}
                  className={`p-3.5 rounded-2xl border transition-all cursor-pointer ${
                    isSelected
                      ? "bg-[#18181C] border-[#CCFF00] shadow-[0_0_15px_rgba(204,255,0,0.15)]"
                      : "bg-[#141416] border-[#222226] hover:border-[#333338] hover:bg-[#161619]"
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span
                      className="px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase tracking-wider"
                      style={{
                        backgroundColor: `${era.color}22`,
                        color: era.color,
                        border: `1px solid ${era.color}44`,
                      }}
                    >
                      {era.period}
                    </span>
                    <span className="text-[10px] font-mono text-gray-500">{era.badge}</span>
                  </div>

                  <h3 className="text-sm font-bold font-mono text-white mt-2 flex items-center justify-between">
                    <span>{era.title}</span>
                    <ChevronRight className={`w-4 h-4 transition-transform ${isSelected ? "text-[#CCFF00] translate-x-1" : "text-gray-600"}`} />
                  </h3>
                  <p className="text-[11px] text-gray-400 mt-1 line-clamp-2 leading-relaxed">
                    {era.subtitle}
                  </p>

                  <div className="mt-2 pt-2 border-t border-[#222226] flex items-center gap-1.5 flex-wrap">
                    {era.definingBands.slice(0, 3).map((b) => (
                      <span key={b} className="text-[9.5px] font-mono bg-[#0A0A0B] text-gray-400 px-1.5 py-0.5 rounded border border-[#222226]">
                        {b}
                      </span>
                    ))}
                    {era.definingBands.length > 3 && (
                      <span className="text-[9.5px] font-mono text-gray-500">+{era.definingBands.length - 3}</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Right Column: Era Deep-Dive Card */}
          <div className="lg:col-span-8 bg-[#141416] border border-[#222226] rounded-2xl p-5 sm:p-7 shadow-xl space-y-6">
            {/* Era Banner Header */}
            <div className="pb-4 border-b border-[#222226] space-y-2">
              <div className="flex items-center gap-2">
                <span
                  className="px-2.5 py-0.5 rounded-lg text-xs font-mono font-bold uppercase tracking-wider"
                  style={{
                    backgroundColor: `${activeEra.color}22`,
                    color: activeEra.color,
                    border: `1px solid ${activeEra.color}44`,
                  }}
                >
                  {activeEra.period}
                </span>
                <span className="text-xs font-mono text-gray-500 uppercase">{activeEra.badge}</span>
              </div>

              <h2 className="text-xl sm:text-2xl font-black font-mono text-white tracking-tight">
                {activeEra.title}
              </h2>
              <p className="text-xs text-[#CCFF00] font-mono font-bold">
                {activeEra.subtitle}
              </p>
            </div>

            {/* Era Summary */}
            <div className="bg-[#0A0A0B] border border-[#222226] rounded-xl p-4">
              <p className="text-xs sm:text-sm text-gray-300 leading-relaxed font-sans">
                {activeEra.summary}
              </p>
            </div>

            {/* Key Innovations */}
            <div className="space-y-3">
              <h4 className="text-xs font-mono uppercase font-bold text-gray-400 tracking-wider flex items-center gap-2">
                <Zap className="w-3.5 h-3.5 text-[#CCFF00]" /> Harmonic & Rhythmic Innovations
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {activeEra.keyInnovations.map((inv, idx) => (
                  <div
                    key={idx}
                    className="bg-[#0A0A0B] border border-[#222226] rounded-xl p-3 flex items-start gap-2.5"
                  >
                    <span className="w-5 h-5 rounded-full bg-[#1D1D21] border border-[#333338] text-[#CCFF00] text-[10px] font-mono font-bold flex items-center justify-center shrink-0 mt-0.5">
                      {idx + 1}
                    </span>
                    <span className="text-xs text-gray-300 leading-snug">{inv}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Guitar Tone & Amplifier Evolution */}
            <div className="bg-[#0A0A0B] border border-[#222226] rounded-xl p-4 space-y-1.5">
              <div className="flex items-center gap-2 text-xs font-mono font-bold text-[#CCFF00] uppercase">
                <Sliders className="w-4 h-4" /> Guitar Tone & Rig Architecture
              </div>
              <p className="text-xs text-gray-300 font-mono leading-relaxed">
                {activeEra.guitarToneTech}
              </p>
            </div>

            {/* Iconic Albums & Standout Tracks */}
            <div className="space-y-3">
              <h4 className="text-xs font-mono uppercase font-bold text-gray-400 tracking-wider flex items-center gap-2">
                <Disc className="w-3.5 h-3.5 text-[#CCFF00]" /> Landmark Albums & Standout Tracks
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {activeEra.iconicAlbums.map((alb) => (
                  <div
                    key={alb.album}
                    className="bg-[#0A0A0B] border border-[#222226] rounded-xl p-3.5 flex flex-col justify-between hover:border-[#333338] transition-colors"
                  >
                    <div>
                      <div className="flex items-center justify-between text-[10px] font-mono text-gray-500">
                        <span>{alb.year}</span>
                        <span className="px-1.5 py-0.2 rounded bg-[#1D1D21] text-gray-300 border border-[#222226]">
                          {alb.tuning}
                        </span>
                      </div>
                      <h5 className="font-bold text-xs sm:text-sm font-mono text-white mt-1">{alb.album}</h5>
                      <p className="text-xs text-[#CCFF00] font-mono font-semibold">{alb.artist}</p>
                    </div>

                    <div className="mt-2 pt-2 border-t border-[#1D1D21] flex items-center justify-between text-[11px] font-mono">
                      <span className="text-gray-400 flex items-center gap-1 truncate">
                        <Headphones className="w-3 h-3 text-gray-500 shrink-0" />
                        <strong className="text-gray-200">{alb.standoutTrack}</strong>
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Defining Bands Roster */}
            <div className="pt-2">
              <h4 className="text-xs font-mono uppercase font-bold text-gray-400 tracking-wider mb-2 flex items-center gap-2">
                <Globe className="w-3.5 h-3.5 text-[#CCFF00]" /> Defining Artists of this Era
              </h4>
              <div className="flex items-center gap-2 flex-wrap">
                {activeEra.definingBands.map((band) => (
                  <span
                    key={band}
                    className="px-3 py-1.5 rounded-xl bg-[#0A0A0B] border border-[#222226] text-xs font-mono text-gray-200 font-bold hover:border-[#CCFF00] transition-colors"
                  >
                    {band}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SECTION 2: SUBGENRES & RIGS MATRIX */}
      {activeSection === "subgenres" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Subgenres Navigation Tabs */}
          <div className="lg:col-span-4 space-y-2.5">
            <div className="flex items-center justify-between pb-1">
              <span className="text-[10px] font-mono text-gray-500 uppercase tracking-widest font-bold">
                SUBGENRES ({filteredSubgenres.length})
              </span>
            </div>

            {filteredSubgenres.map((genre) => {
              const isSelected = selectedSubgenreId === genre.id;
              return (
                <div
                  key={genre.id}
                  onClick={() => setSelectedSubgenreId(genre.id)}
                  className={`p-3.5 rounded-2xl border transition-all cursor-pointer ${
                    isSelected
                      ? "bg-[#18181C] border-[#CCFF00] shadow-[0_0_15px_rgba(204,255,0,0.15)]"
                      : "bg-[#141416] border-[#222226] hover:border-[#333338] hover:bg-[#161619]"
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span
                      className="px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase tracking-wider"
                      style={{
                        backgroundColor: `${genre.color}22`,
                        color: genre.color,
                        border: `1px solid ${genre.color}44`,
                      }}
                    >
                      {genre.tuning}
                    </span>
                    <span className="text-[10px] font-mono text-gray-500">{genre.bpmRange}</span>
                  </div>

                  <h3 className="text-sm font-bold font-mono text-white mt-2 flex items-center justify-between">
                    <span>{genre.name}</span>
                    <ChevronRight className={`w-4 h-4 transition-transform ${isSelected ? "text-[#CCFF00] translate-x-1" : "text-gray-600"}`} />
                  </h3>
                  <p className="text-[11px] text-gray-400 mt-1 line-clamp-2 leading-relaxed">
                    {genre.description}
                  </p>
                </div>
              );
            })}
          </div>

          {/* Subgenre Details & Rig Recipe */}
          <div className="lg:col-span-8 bg-[#141416] border border-[#222226] rounded-2xl p-5 sm:p-7 shadow-xl space-y-6">
            {/* Header & Quick Action Buttons */}
            <div className="pb-4 border-b border-[#222226] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <span
                    className="px-2.5 py-0.5 rounded-lg text-xs font-mono font-bold uppercase tracking-wider"
                    style={{
                      backgroundColor: `${activeSubgenre.color}22`,
                      color: activeSubgenre.color,
                      border: `1px solid ${activeSubgenre.color}44`,
                    }}
                  >
                    {activeSubgenre.tuning}
                  </span>
                  <span className="text-xs font-mono text-gray-500">{activeSubgenre.era}</span>
                </div>
                <h2 className="text-xl sm:text-2xl font-black font-mono text-white mt-1">
                  {activeSubgenre.name}
                </h2>
              </div>

              {/* Riff Preview & Load Preset Rig Buttons */}
              <div className="flex items-center gap-2 flex-wrap">
                <button
                  type="button"
                  onClick={() => handlePlayRiff(activeSubgenre.riffType, activeSubgenre.id)}
                  className={`px-3.5 py-2 rounded-xl text-xs font-mono font-bold flex items-center gap-2 border transition-all cursor-pointer ${
                    previewingRiff === activeSubgenre.id
                      ? "bg-[#CCFF00] text-black border-[#CCFF00] animate-pulse"
                      : "bg-[#0A0A0B] hover:bg-[#1D1D21] text-gray-200 border-[#222226]"
                  }`}
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>{previewingRiff === activeSubgenre.id ? "Playing..." : "Play Riff Demo"}</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleLoadRig(activeSubgenre.recommendedPresetId)}
                  className="px-4 py-2 rounded-xl bg-[#CCFF00] hover:bg-[#b8e600] text-black text-xs font-mono font-bold flex items-center gap-2 shadow-[0_0_12px_rgba(204,255,0,0.3)] cursor-pointer"
                >
                  <Sliders className="w-3.5 h-3.5" />
                  <span>Load Preset Rig</span>
                </button>
              </div>
            </div>

            {/* Description */}
            <div className="bg-[#0A0A0B] border border-[#222226] rounded-xl p-4">
              <p className="text-xs sm:text-sm text-gray-300 leading-relaxed font-sans">
                {activeSubgenre.description}
              </p>
            </div>

            {/* Tone Formula / Rig Architecture */}
            <div className="space-y-3">
              <h4 className="text-xs font-mono uppercase font-bold text-gray-400 tracking-wider flex items-center gap-2">
                <Sliders className="w-3.5 h-3.5 text-[#CCFF00]" /> Studio Rig Architecture & DSP Recipe
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 font-mono text-xs">
                <div className="bg-[#0A0A0B] border border-[#222226] rounded-xl p-3 space-y-1">
                  <span className="text-gray-500 uppercase text-[10px] font-bold block">Amplifier Model:</span>
                  <p className="text-white font-bold">{activeSubgenre.toneCharacteristics.ampModel}</p>
                </div>

                <div className="bg-[#0A0A0B] border border-[#222226] rounded-xl p-3 space-y-1">
                  <span className="text-gray-500 uppercase text-[10px] font-bold block">Pedal Chain:</span>
                  <p className="text-[#CCFF00] font-semibold">{activeSubgenre.toneCharacteristics.pedals.join(" → ")}</p>
                </div>

                <div className="bg-[#0A0A0B] border border-[#222226] rounded-xl p-3 space-y-1">
                  <span className="text-gray-500 uppercase text-[10px] font-bold block">Target EQ Curve:</span>
                  <p className="text-gray-300">{activeSubgenre.toneCharacteristics.eqCurve}</p>
                </div>

                <div className="bg-[#0A0A0B] border border-[#222226] rounded-xl p-3 space-y-1">
                  <span className="text-gray-500 uppercase text-[10px] font-bold block">Playing Technique:</span>
                  <p className="text-gray-300 font-sans text-xs">{activeSubgenre.toneCharacteristics.technique}</p>
                </div>
              </div>
            </div>

            {/* Pioneer Bands & Signature Gear */}
            <div className="space-y-3">
              <h4 className="text-xs font-mono uppercase font-bold text-gray-400 tracking-wider flex items-center gap-2">
                <Guitar className="w-3.5 h-3.5 text-[#CCFF00]" /> Pioneer Bands & Guitarists
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 font-mono text-xs">
                {activeSubgenre.pioneerBands.map((band) => (
                  <div
                    key={band.name}
                    className="bg-[#0A0A0B] border border-[#222226] rounded-xl p-3.5 space-y-1 hover:border-[#333338] transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <h5 className="font-bold text-white text-sm">{band.name}</h5>
                      <span className="text-[10px] text-gray-500">{band.country}</span>
                    </div>
                    <p className="text-[#CCFF00] text-[11px] font-semibold">Guitar: {band.keyGuitarist}</p>
                    <p className="text-gray-400 text-[10.5px]">Gear: {band.signatureGear}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Essential Albums */}
            <div className="space-y-3">
              <h4 className="text-xs font-mono uppercase font-bold text-gray-400 tracking-wider flex items-center gap-2">
                <Disc className="w-3.5 h-3.5 text-[#CCFF00]" /> Essential Listening Tracks
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 font-mono text-xs">
                {activeSubgenre.essentialAlbums.map((alb) => (
                  <div
                    key={alb.title}
                    className="bg-[#0A0A0B] border border-[#222226] rounded-xl p-3 flex items-center justify-between"
                  >
                    <div className="truncate">
                      <span className="text-white font-bold block truncate">{alb.title} ({alb.year})</span>
                      <span className="text-gray-400 text-[11px]">{alb.artist} • Track: <strong className="text-[#CCFF00]">{alb.track}</strong></span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Harmonic Theory Notes */}
            <div className="pt-2">
              <h4 className="text-xs font-mono uppercase font-bold text-gray-400 tracking-wider mb-2 flex items-center gap-2">
                <Music className="w-3.5 h-3.5 text-[#CCFF00]" /> Harmonic Structure & Scales
              </h4>
              <div className="flex items-center gap-2 flex-wrap">
                {activeSubgenre.harmonicFeatures.map((feat) => (
                  <span
                    key={feat}
                    className="px-3 py-1 rounded-xl bg-[#0A0A0B] border border-[#222226] text-xs font-mono text-gray-300"
                  >
                    {feat}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SECTION 3: DROP C PHYSICS & LORE */}
      {activeSection === "tuning-lore" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Fundamental Frequency Card */}
            <div className="bg-[#141416] border border-[#222226] rounded-2xl p-5 shadow-xl space-y-2">
              <div className="w-8 h-8 rounded-lg bg-[#0A0A0B] border border-[#222226] flex items-center justify-center text-[#CCFF00]">
                <Activity className="w-4 h-4" />
              </div>
              <h3 className="text-sm font-bold font-mono text-white">65.41 Hz Low C Fundamental</h3>
              <p className="text-xs text-gray-400 font-sans leading-relaxed">
                Tuning the 6th string down two whole steps to C2 (65.41 Hz) places the fundamental resonant frequency right above the sub-bass subwoofer zone (20-60Hz) and directly in the punchy kick drum body (60-80Hz).
              </p>
            </div>

            {/* One-Finger Power Chords */}
            <div className="bg-[#141416] border border-[#222226] rounded-2xl p-5 shadow-xl space-y-2">
              <div className="w-8 h-8 rounded-lg bg-[#0A0A0B] border border-[#222226] flex items-center justify-center text-[#CCFF00]">
                <Flame className="w-4 h-4" />
              </div>
              <h3 className="text-sm font-bold font-mono text-white">Root-5th-Octave Barre</h3>
              <p className="text-xs text-gray-400 font-sans leading-relaxed">
                Strings 6, 5, and 4 (C-G-C) form a power chord (Root-Fifth-Octave) on the same fret. Barring one finger allows instantaneous 0-0-0 chugs, sliding octaves, and lightning-fast breakdown riffs impossible in standard tuning.
              </p>
            </div>

            {/* String Tension Sweet Spot */}
            <div className="bg-[#141416] border border-[#222226] rounded-2xl p-5 shadow-xl space-y-2">
              <div className="w-8 h-8 rounded-lg bg-[#0A0A0B] border border-[#222226] flex items-center justify-center text-[#CCFF00]">
                <Sliders className="w-4 h-4" />
              </div>
              <h3 className="text-sm font-bold font-mono text-white">10-52 & 11-56 Gauges</h3>
              <p className="text-xs text-gray-400 font-sans leading-relaxed">
                On a 25.5" scale guitar (Fender/Ibanez/ESP), a .052" or .056" low C provides approximately 16.8 lbs of tension—the acoustic sweet spot that avoids floppy pitch drift when struck hard with a heavy pick.
              </p>
            </div>
          </div>

          {/* Full Drop C String & Frequency Anatomy Table */}
          <div className="bg-[#141416] border border-[#222226] rounded-2xl p-5 sm:p-6 shadow-xl space-y-4">
            <h3 className="text-sm font-bold font-mono text-white uppercase tracking-wider flex items-center gap-2">
              <Music className="w-4 h-4 text-[#CCFF00]" /> Drop C (C-G-C-F-A-D) 6-String Frequency Blueprint
            </h3>

            <div className="overflow-x-auto">
              <table className="w-full text-left font-mono text-xs">
                <thead>
                  <tr className="border-b border-[#222226] text-gray-500 text-[10px] uppercase">
                    <th className="py-2.5 px-3">String</th>
                    <th className="py-2.5 px-3">Note</th>
                    <th className="py-2.5 px-3">Frequency</th>
                    <th className="py-2.5 px-3">Standard Offset</th>
                    <th className="py-2.5 px-3">Rec. Gauge (25.5")</th>
                    <th className="py-2.5 px-3">Tension</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1D1D21] text-gray-300">
                  <tr className="bg-[#0A0A0B]/50 hover:bg-[#1D1D21]">
                    <td className="py-2.5 px-3 font-bold text-white">6 (Lowest)</td>
                    <td className="py-2.5 px-3 text-[#CCFF00] font-bold text-sm">C2</td>
                    <td className="py-2.5 px-3">65.41 Hz</td>
                    <td className="py-2.5 px-3 text-red-400">-2 Whole Steps (E → C)</td>
                    <td className="py-2.5 px-3 font-bold">.052" - .056"</td>
                    <td className="py-2.5 px-3 text-emerald-400">~16.5 lbs</td>
                  </tr>
                  <tr className="hover:bg-[#1D1D21]">
                    <td className="py-2.5 px-3 font-bold text-white">5</td>
                    <td className="py-2.5 px-3 text-[#CCFF00] font-bold text-sm">G2</td>
                    <td className="py-2.5 px-3">98.00 Hz</td>
                    <td className="py-2.5 px-3 text-amber-400">-1 Whole Step (A → G)</td>
                    <td className="py-2.5 px-3 font-bold">.042" - .044"</td>
                    <td className="py-2.5 px-3 text-emerald-400">~16.2 lbs</td>
                  </tr>
                  <tr className="bg-[#0A0A0B]/50 hover:bg-[#1D1D21]">
                    <td className="py-2.5 px-3 font-bold text-white">4</td>
                    <td className="py-2.5 px-3 text-[#CCFF00] font-bold text-sm">C3</td>
                    <td className="py-2.5 px-3">130.81 Hz</td>
                    <td className="py-2.5 px-3 text-amber-400">-1 Whole Step (D → C)</td>
                    <td className="py-2.5 px-3 font-bold">.030" - .032"</td>
                    <td className="py-2.5 px-3 text-emerald-400">~16.9 lbs</td>
                  </tr>
                  <tr className="hover:bg-[#1D1D21]">
                    <td className="py-2.5 px-3 font-bold text-white">3</td>
                    <td className="py-2.5 px-3 text-white font-bold text-sm">F3</td>
                    <td className="py-2.5 px-3">174.61 Hz</td>
                    <td className="py-2.5 px-3 text-amber-400">-1 Whole Step (G → F)</td>
                    <td className="py-2.5 px-3 font-bold">.017" (Plain)</td>
                    <td className="py-2.5 px-3 text-emerald-400">~15.8 lbs</td>
                  </tr>
                  <tr className="bg-[#0A0A0B]/50 hover:bg-[#1D1D21]">
                    <td className="py-2.5 px-3 font-bold text-white">2</td>
                    <td className="py-2.5 px-3 text-white font-bold text-sm">A3</td>
                    <td className="py-2.5 px-3">220.00 Hz</td>
                    <td className="py-2.5 px-3 text-amber-400">-1 Whole Step (B → A)</td>
                    <td className="py-2.5 px-3 font-bold">.013" (Plain)</td>
                    <td className="py-2.5 px-3 text-emerald-400">~15.4 lbs</td>
                  </tr>
                  <tr className="hover:bg-[#1D1D21]">
                    <td className="py-2.5 px-3 font-bold text-white">1 (Highest)</td>
                    <td className="py-2.5 px-3 text-white font-bold text-sm">D4</td>
                    <td className="py-2.5 px-3">293.66 Hz</td>
                    <td className="py-2.5 px-3 text-amber-400">-1 Whole Step (E → D)</td>
                    <td className="py-2.5 px-3 font-bold">.010" - .011"</td>
                    <td className="py-2.5 px-3 text-emerald-400">~16.0 lbs</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* SECTION 4: HISTORIC TONE SECRETS & GEAR LORE */}
      {activeSection === "gear-secrets" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {METAL_GUITAR_LORE.map((lore) => (
            <div
              key={lore.id}
              className="bg-[#141416] border border-[#222226] rounded-2xl p-5 sm:p-6 shadow-xl space-y-4 hover:border-[#333338] transition-all flex flex-col justify-between"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="px-2 py-0.5 rounded bg-[#CCFF00]/10 text-[#CCFF00] border border-[#CCFF00]/30 text-[10px] font-mono font-bold uppercase">
                    {lore.category}
                  </span>
                </div>
                <h3 className="text-base sm:text-lg font-bold font-mono text-white">
                  {lore.title}
                </h3>
                <p className="text-xs text-[#CCFF00] font-mono font-semibold">
                  {lore.summary}
                </p>
                <p className="text-xs sm:text-sm text-gray-300 font-sans leading-relaxed pt-2">
                  {lore.details}
                </p>
              </div>

              <div className="pt-3 border-t border-[#222226]">
                <span className="text-[10px] font-mono text-gray-500 uppercase font-bold block mb-1.5">
                  Associated Legends & Records:
                </span>
                <div className="flex items-center gap-1.5 flex-wrap">
                  {lore.keyArtists.map((art) => (
                    <span
                      key={art}
                      className="px-2 py-0.5 rounded bg-[#0A0A0B] border border-[#222226] text-[10.5px] font-mono text-gray-300"
                    >
                      {art}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
