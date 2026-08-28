import React, { useState, useEffect, useMemo } from "react";
import {
  SavedRiffItem,
  MetalSubgenre,
  TransposedSongSection,
  ChordTransformItem,
} from "../types";
import { RiffLibraryStorage } from "../audio/riffLibraryStorage";
import { AudioEngine } from "../audio/audioEngine";
import { motion, AnimatePresence } from "motion/react";
import {
  Star,
  Search,
  Filter,
  Play,
  Square,
  Plus,
  Trash2,
  Edit3,
  Save,
  Download,
  Upload,
  Copy,
  Check,
  Sliders,
  Flame,
  Music,
  ExternalLink,
  Zap,
  Tag,
  Clock,
  ArrowUpDown,
  X,
  Sparkles,
  Layers,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

interface RiffLibraryProps {
  onLoadAmpPreset?: (presetId: string) => void;
  onNavigateToAmp?: () => void;
  onLoadInTransposer?: (title: string, artist: string, chords: string, subgenre: MetalSubgenre) => void;
}

const SUBGENRES: (MetalSubgenre | "All")[] = [
  "All",
  "Metalcore",
  "Djent",
  "Thrash Metal",
  "Swedish Death Metal",
  "Doom / Sludge",
  "Nu-Metal",
  "Prog Metal",
  "Black Metal",
];

export const RiffLibrary: React.FC<RiffLibraryProps> = ({
  onLoadAmpPreset,
  onNavigateToAmp,
  onLoadInTransposer,
}) => {
  const storage = useMemo(() => RiffLibraryStorage.getInstance(), []);
  const audioEngine = useMemo(() => AudioEngine.getInstance(), []);

  const [riffs, setRiffs] = useState<SavedRiffItem[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSubgenre, setSelectedSubgenre] = useState<MetalSubgenre | "All">("All");
  const [onlyFavorites, setOnlyFavorites] = useState(false);
  const [sortBy, setSortBy] = useState<"recent" | "title" | "artist" | "bpm">("recent");

  // Active playing state
  const [playingRiffId, setPlayingRiffId] = useState<string | null>(null);
  const [playingSectionIdx, setPlayingSectionIdx] = useState<number | null>(null);

  // Selected item for detail view / expanded
  const [expandedRiffId, setExpandedRiffId] = useState<string | null>(null);
  const [copiedRiffId, setCopiedRiffId] = useState<string | null>(null);

  // Notes editing state
  const [editingNotesId, setEditingNotesId] = useState<string | null>(null);
  const [tempNotes, setTempNotes] = useState("");

  // Tag input state
  const [tagInputRiffId, setTagInputRiffId] = useState<string | null>(null);
  const [newTagText, setNewTagText] = useState("");

  // Create new manual riff modal
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newArtist, setNewArtist] = useState("");
  const [newOriginalGenre, setNewOriginalGenre] = useState("");
  const [newSubgenre, setNewSubgenre] = useState<MetalSubgenre>("Metalcore");
  const [newKey, setNewKey] = useState("C Minor");
  const [newBpm, setNewBpm] = useState(135);
  const [newNotes, setNewNotes] = useState("");
  const [newTags, setNewTags] = useState("Drop C, Heavy Chugs");
  const [newChords, setNewChords] = useState("C5 [0-0-0] - G#5 [8-8-8] - D#5 [3-3-3]");
  const [newTab, setNewTab] = useState(
    "d|---------------------------------|\na|---------------------------------|\nF|---------------------------------|\nC|-0-0-0-0-8-8-8-8-3-3-3-3---------|\nG|-0-0-0-0-8-8-8-8-3-3-3-3---------|\nC|-0-0-0-0-8-8-8-8-3-3-3-3---------|\n   . . . . . . . ."
  );

  // Import / Export JSON modal
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [exportJsonStr, setExportJsonStr] = useState("");
  const [importJsonStr, setImportJsonStr] = useState("");
  const [importFeedback, setImportFeedback] = useState<string | null>(null);

  const refreshRiffs = () => {
    setRiffs(storage.getAll());
  };

  useEffect(() => {
    refreshRiffs();
  }, []);

  const handleToggleFavorite = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    storage.toggleFavorite(id);
    refreshRiffs();
  };

  const handleDeleteRiff = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm("Are you sure you want to remove this riff from your library?")) {
      storage.deleteRiff(id);
      refreshRiffs();
      if (expandedRiffId === id) setExpandedRiffId(null);
    }
  };

  const handleSaveNotes = (id: string) => {
    storage.updateNotes(id, tempNotes);
    setEditingNotesId(null);
    refreshRiffs();
  };

  const handleAddTag = (id: string) => {
    if (newTagText.trim()) {
      storage.addTag(id, newTagText.trim());
      setNewTagText("");
      setTagInputRiffId(null);
      refreshRiffs();
    }
  };

  const handleRemoveTag = (id: string, tag: string, e: React.MouseEvent) => {
    e.stopPropagation();
    storage.removeTag(id, tag);
    refreshRiffs();
  };

  const handlePlayRiff = async (riff: SavedRiffItem, sectionIdx = 0, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();

    if (playingRiffId === riff.id && playingSectionIdx === sectionIdx) {
      setPlayingRiffId(null);
      setPlayingSectionIdx(null);
      return;
    }

    await audioEngine.init();
    setPlayingRiffId(riff.id);
    setPlayingSectionIdx(sectionIdx);

    const isBreakdown =
      riff.subgenre === "Metalcore" ||
      riff.subgenre === "Djent" ||
      (riff.sections[sectionIdx]?.name || "").toLowerCase().includes("breakdown");

    const notesToPlay = isBreakdown
      ? [
          { frets: [0, 0, 0, "x", "x", "x"], pm: true, dur: 0.18 },
          { frets: [0, 0, 0, "x", "x", "x"], pm: true, dur: 0.18 },
          { frets: [1, 1, 1, "x", "x", "x"], pm: false, dur: 0.35 },
          { frets: [0, 0, 0, "x", "x", "x"], pm: true, dur: 0.18 },
          { frets: [8, 8, 8, "x", "x", "x"], pm: false, dur: 0.4 },
          { frets: [0, 0, 0, "x", "x", "x"], pm: true, dur: 0.2 },
        ]
      : [
          { frets: [0, 0, 0, "x", "x", "x"], pm: true, dur: 0.22 },
          { frets: [0, 0, 0, "x", "x", "x"], pm: true, dur: 0.22 },
          { frets: [8, 8, 8, "x", "x", "x"], pm: false, dur: 0.38 },
          { frets: [3, 3, 3, "x", "x", "x"], pm: false, dur: 0.38 },
          { frets: [10, 10, 10, "x", "x", "x"], pm: false, dur: 0.48 },
        ];

    let delay = 0;
    notesToPlay.forEach((item, i) => {
      setTimeout(() => {
        audioEngine.playDropCVoicing(item.frets as any, item.pm, item.dur);
        if (i === notesToPlay.length - 1) {
          setTimeout(() => {
            setPlayingRiffId(null);
            setPlayingSectionIdx(null);
          }, 600);
        }
      }, delay);
      delay += item.dur * 1000 + 40;
    });
  };

  const handleCopyRiff = (riff: SavedRiffItem, e: React.MouseEvent) => {
    e.stopPropagation();
    const formatted = `=== DROP C METAL RIFF ===
Title: ${riff.title}
Original Artist: ${riff.originalArtist} (${riff.originalGenre || "Unknown"})
Metal Subgenre: ${riff.subgenre}
Tuning: ${riff.tuning}
Key: ${riff.metalKey} | BPM: ${riff.bpm}
Tags: ${riff.tags.join(", ")}
Notes: ${riff.userNotes || "None"}

${riff.sections
  .map(
    (s) => `[${s.name}]
Original: ${s.originalChords}
Drop C Metal: ${s.metalChords}
Technique: ${s.technique}
Tab:
${s.tab}`
  )
  .join("\n\n")}`;

    navigator.clipboard.writeText(formatted);
    setCopiedRiffId(riff.id);
    setTimeout(() => setCopiedRiffId(null), 2000);
  };

  const handleCreateNewRiff = () => {
    if (!newTitle.trim()) {
      alert("Please enter a title for your riff!");
      return;
    }

    const tagList = newTags
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);

    storage.saveRiff({
      title: newTitle.trim(),
      originalArtist: newArtist.trim() || "Custom / Original",
      originalGenre: newOriginalGenre.trim() || "Original",
      subgenre: newSubgenre,
      originalKey: newKey,
      metalKey: newKey,
      bpm: Number(newBpm) || 135,
      tuning: "Drop C (C-G-C-F-A-D)",
      sourceType: "manual",
      tags: tagList.length ? tagList : ["Drop C", "Custom"],
      isFavorite: true,
      userNotes: newNotes.trim() || "Handcrafted Drop C riff.",
      sections: [
        {
          name: "Main Riff",
          originalChords: newChords,
          metalChords: newChords,
          technique: "Downpicked Drop C barre power chords with palm muting",
          tab: newTab,
        },
      ],
    });

    refreshRiffs();
    setIsCreateModalOpen(false);
    // Reset fields
    setNewTitle("");
    setNewArtist("");
    setNewNotes("");
  };

  // Filter and sort riffs
  const filteredRiffs = useMemo(() => {
    return riffs
      .filter((riff) => {
        if (onlyFavorites && !riff.isFavorite) return false;
        if (selectedSubgenre !== "All" && riff.subgenre !== selectedSubgenre) return false;
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchTitle = riff.title.toLowerCase().includes(q);
          const matchArtist = riff.originalArtist.toLowerCase().includes(q);
          const matchGenre = (riff.originalGenre || "").toLowerCase().includes(q);
          const matchSubgenre = riff.subgenre.toLowerCase().includes(q);
          const matchTags = riff.tags.some((t) => t.toLowerCase().includes(q));
          const matchNotes = (riff.userNotes || "").toLowerCase().includes(q);
          const matchChords = riff.sections.some(
            (s) => s.metalChords.toLowerCase().includes(q) || s.originalChords.toLowerCase().includes(q)
          );
          return matchTitle || matchArtist || matchGenre || matchSubgenre || matchTags || matchNotes || matchChords;
        }
        return true;
      })
      .sort((a, b) => {
        if (sortBy === "recent") {
          return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
        }
        if (sortBy === "title") {
          return a.title.localeCompare(b.title);
        }
        if (sortBy === "artist") {
          return a.originalArtist.localeCompare(b.originalArtist);
        }
        if (sortBy === "bpm") {
          return b.bpm - a.bpm;
        }
        return 0;
      });
  }, [riffs, searchQuery, selectedSubgenre, onlyFavorites, sortBy]);

  const favoritesCount = useMemo(() => riffs.filter((r) => r.isFavorite).length, [riffs]);

  return (
    <div id="riff-library-container" className="space-y-6">
      {/* Top Banner & Quick Controls */}
      <div className="bg-[#141416] border border-[#222226] rounded-2xl p-5 sm:p-6 shadow-2xl relative overflow-hidden">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-5 border-b border-[#222226]">
          <div>
            <div className="flex items-center gap-2.5">
              <span className="p-2 rounded-xl bg-[#0A0A0B] border border-[#222226] text-[#CCFF00]">
                <Music className="w-5 h-5 fill-current" />
              </span>
              <h2 className="text-lg sm:text-xl font-bold tracking-widest text-white font-mono uppercase">
                Drop C Riff & Progression Vault
              </h2>
            </div>
            <p className="text-xs text-gray-400 mt-1 max-w-2xl">
              Save, organize, and audition your favorite transposed metal progressions. Store original artist metadata,
              subgenre adaptations, custom guitar tabs, and 1-click amp rig linkages.
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              id="btn-create-custom-riff"
              onClick={() => setIsCreateModalOpen(true)}
              className="px-4 py-2 rounded-xl bg-[#CCFF00] hover:bg-[#b8e600] text-black font-black text-xs font-mono uppercase tracking-wider flex items-center gap-2 shadow-lg shadow-[rgba(204,255,0,0.25)] transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span>New Riff Entry</span>
            </button>

            <button
              id="btn-open-export-import"
              onClick={() => {
                setExportJsonStr(storage.exportJson());
                setImportJsonStr("");
                setImportFeedback(null);
                setIsExportModalOpen(true);
              }}
              className="px-3.5 py-2 rounded-xl bg-[#1D1D21] hover:bg-[#25252b] text-gray-300 hover:text-white text-xs font-mono font-bold flex items-center gap-1.5 border border-[#333338] transition-all cursor-pointer"
              title="Backup / Restore Riff Library"
            >
              <Download className="w-4 h-4" />
              <span>Backup / JSON</span>
            </button>
          </div>
        </div>

        {/* Search, Filter Bar, Subgenre Pills */}
        <div className="mt-4 space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5 items-center">
            {/* Search Input */}
            <div className="sm:col-span-6 relative">
              <Search className="w-4 h-4 text-gray-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                id="search-riff-input"
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by song, artist (e.g. Radiohead, Deftones), tags, chords..."
                className="w-full bg-[#0A0A0B] border border-[#222226] rounded-xl pl-9 pr-8 py-2 text-xs sm:text-sm text-gray-100 font-mono focus:border-[#CCFF00] outline-none"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-200"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Favorite Filter Toggle */}
            <div className="sm:col-span-3 flex items-center">
              <button
                id="btn-filter-favorites"
                onClick={() => setOnlyFavorites((prev) => !prev)}
                className={`w-full py-2 px-3 rounded-xl border text-xs font-mono font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                  onlyFavorites
                    ? "bg-amber-500/20 border-amber-400 text-amber-300 shadow-[0_0_12px_rgba(245,158,11,0.2)]"
                    : "bg-[#0A0A0B] border-[#222226] text-gray-400 hover:text-gray-200"
                }`}
              >
                <Star className={`w-4 h-4 ${onlyFavorites ? "fill-amber-400 text-amber-400" : ""}`} />
                <span>Favorites ({favoritesCount})</span>
              </button>
            </div>

            {/* Sort Dropdown */}
            <div className="sm:col-span-3">
              <div className="flex items-center gap-1.5 bg-[#0A0A0B] border border-[#222226] rounded-xl px-2.5 py-1.5">
                <ArrowUpDown className="w-3.5 h-3.5 text-gray-500" />
                <span className="text-[10px] font-mono text-gray-500 uppercase font-bold">Sort:</span>
                <select
                  id="sort-riffs-select"
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="w-full bg-transparent text-xs font-mono text-[#CCFF00] font-bold outline-none cursor-pointer"
                >
                  <option value="recent">Recently Added</option>
                  <option value="title">Title (A-Z)</option>
                  <option value="artist">Original Artist (A-Z)</option>
                  <option value="bpm">BPM (Fast to Slow)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Subgenre Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs scrollbar-none">
            <span className="text-[10px] font-mono text-gray-500 uppercase tracking-wider font-bold whitespace-nowrap flex items-center gap-1 mr-1">
              <Filter className="w-3 h-3 text-[#CCFF00]" /> Filter Style:
            </span>
            {SUBGENRES.map((sub) => {
              const count =
                sub === "All" ? riffs.length : riffs.filter((r) => r.subgenre === sub).length;
              return (
                <button
                  key={sub}
                  onClick={() => setSelectedSubgenre(sub)}
                  className={`px-3 py-1 rounded-lg text-xs font-mono font-bold whitespace-nowrap transition-all flex items-center gap-1.5 cursor-pointer ${
                    selectedSubgenre === sub
                      ? "bg-[#CCFF00] text-black shadow-md shadow-[rgba(204,255,0,0.2)]"
                      : "bg-[#0A0A0B] text-gray-400 hover:text-gray-200 border border-[#222226]"
                  }`}
                >
                  <span>{sub}</span>
                  <span
                    className={`text-[10px] px-1 rounded ${
                      selectedSubgenre === sub ? "bg-black/20 text-black" : "bg-[#1D1D21] text-gray-400"
                    }`}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Riff Cards Bento Grid */}
      {filteredRiffs.length === 0 ? (
        <div className="bg-[#141416] border border-[#222226] rounded-2xl p-10 text-center space-y-3">
          <Music className="w-10 h-10 text-gray-600 mx-auto stroke-1" />
          <h3 className="text-base font-bold text-gray-300 font-mono">No Saved Riffs Found</h3>
          <p className="text-xs text-gray-500 max-w-md mx-auto">
            {searchQuery || selectedSubgenre !== "All" || onlyFavorites
              ? "No riffs matched your active search or filters. Try adjusting your search query or subgenre filter."
              : "Your vault is empty! Transpose any song via Riff Scraper, Style Converter, or create a custom entry above."}
          </p>
          <div className="pt-2 flex justify-center gap-2">
            <button
              onClick={() => {
                setSearchQuery("");
                setSelectedSubgenre("All");
                setOnlyFavorites(false);
              }}
              className="px-4 py-2 rounded-xl bg-[#1D1D21] hover:bg-[#25252b] text-xs font-mono text-gray-300 border border-[#333338] cursor-pointer"
            >
              Reset Filters
            </button>
            <button
              onClick={() => {
                storage.resetToDefaults();
                refreshRiffs();
              }}
              className="px-4 py-2 rounded-xl bg-[#CCFF00] text-black text-xs font-mono font-bold cursor-pointer"
            >
              Restore Curated Metal Presets
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredRiffs.map((riff) => {
            const isPlaying = playingRiffId === riff.id;
            const isExpanded = expandedRiffId === riff.id;

            return (
              <div
                key={riff.id}
                id={`riff-card-${riff.id}`}
                className={`bg-[#141416] border rounded-2xl p-4 sm:p-5 transition-all duration-200 flex flex-col justify-between space-y-4 relative overflow-hidden group ${
                  isExpanded
                    ? "border-[#CCFF00] shadow-[0_0_20px_rgba(204,255,0,0.15)] ring-1 ring-[#CCFF00]/40"
                    : "border-[#222226] hover:border-[#333338] hover:shadow-xl"
                }`}
              >
                {/* Top Bar with Artist & Favorite Toggle */}
                <div className="space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="px-2 py-0.5 rounded bg-[#0A0A0B] text-gray-300 font-mono text-[11px] font-bold border border-[#222226]">
                          {riff.originalArtist}
                        </span>
                        {riff.originalGenre && (
                          <span className="text-[10px] font-mono text-gray-500 italic">
                            ({riff.originalGenre})
                          </span>
                        )}
                      </div>
                      <h3 className="text-base font-bold text-white font-mono mt-1 group-hover:text-[#CCFF00] transition-colors leading-snug">
                        {riff.title}
                      </h3>
                    </div>

                    {/* Star Favorite Button */}
                    <button
                      id={`btn-fav-${riff.id}`}
                      onClick={(e) => handleToggleFavorite(riff.id, e)}
                      className={`p-2 rounded-xl transition-all cursor-pointer ${
                        riff.isFavorite
                          ? "text-amber-400 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30"
                          : "text-gray-500 hover:text-gray-300 bg-[#0A0A0B] border border-[#222226]"
                      }`}
                      title={riff.isFavorite ? "Remove from Favorites" : "Add to Favorites"}
                    >
                      <Star className={`w-4 h-4 ${riff.isFavorite ? "fill-amber-400" : ""}`} />
                    </button>
                  </div>

                  {/* Subgenre Tag & Meta Chips */}
                  <div className="flex items-center gap-1.5 flex-wrap pt-1">
                    <span
                      className={`text-[10px] font-mono px-2 py-0.5 rounded-md font-bold uppercase tracking-wider ${
                        riff.subgenre === "Metalcore"
                          ? "bg-purple-950/80 text-purple-300 border border-purple-800"
                          : riff.subgenre === "Swedish Death Metal"
                          ? "bg-red-950/80 text-red-300 border border-red-800"
                          : riff.subgenre === "Djent"
                          ? "bg-cyan-950/80 text-cyan-300 border border-cyan-800"
                          : riff.subgenre === "Thrash Metal"
                          ? "bg-amber-950/80 text-amber-300 border border-amber-800"
                          : riff.subgenre === "Doom / Sludge"
                          ? "bg-emerald-950/80 text-emerald-300 border border-emerald-800"
                          : "bg-[#1D1D21] text-[#CCFF00] border border-[#333338]"
                      }`}
                    >
                      {riff.subgenre}
                    </span>

                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-[#0A0A0B] text-gray-300 border border-[#222226]">
                      {riff.tuning.split(" ")[0]}
                    </span>

                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-[#0A0A0B] text-[#CCFF00] font-bold border border-[#222226]">
                      {riff.metalKey}
                    </span>

                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-[#0A0A0B] text-gray-400 border border-[#222226]">
                      {riff.bpm} BPM
                    </span>
                  </div>

                  {/* Primary Chord Snapshot */}
                  <div className="p-2.5 rounded-xl bg-[#0A0A0B] border border-[#222226] font-mono text-xs space-y-1">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-gray-500">Drop C Chords:</span>
                      <span className="text-[#CCFF00] font-bold truncate max-w-[200px]">
                        {riff.sections[0]?.metalChords || "C5 [0-0-0]"}
                      </span>
                    </div>
                    <p className="text-[10px] text-gray-400 italic line-clamp-1">
                      {riff.sections[0]?.technique || "1-finger barre downpicking"}
                    </p>
                  </div>

                  {/* Tags */}
                  <div className="flex items-center gap-1 flex-wrap pt-0.5">
                    {riff.tags.map((tag) => (
                      <span
                        key={tag}
                        className="inline-flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded bg-[#1D1D21] text-gray-400 border border-[#2A2A30]"
                      >
                        <span>#{tag}</span>
                        <button
                          onClick={(e) => handleRemoveTag(riff.id, tag, e)}
                          className="hover:text-red-400"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                    {tagInputRiffId === riff.id ? (
                      <div className="inline-flex items-center gap-1">
                        <input
                          type="text"
                          value={newTagText}
                          onChange={(e) => setNewTagText(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") handleAddTag(riff.id);
                            if (e.key === "Escape") setTagInputRiffId(null);
                          }}
                          placeholder="tag..."
                          className="w-16 bg-[#0A0A0B] border border-[#CCFF00] rounded px-1.5 py-0.5 text-[10px] font-mono text-white outline-none"
                          autoFocus
                        />
                        <button
                          onClick={() => handleAddTag(riff.id)}
                          className="text-[10px] text-[#CCFF00] font-bold hover:underline"
                        >
                          Add
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setTagInputRiffId(riff.id);
                          setNewTagText("");
                        }}
                        className="text-[10px] font-mono text-gray-500 hover:text-[#CCFF00] flex items-center gap-0.5 px-1 py-0.5"
                      >
                        <Plus className="w-2.5 h-2.5" /> Tag
                      </button>
                    )}
                  </div>
                </div>

                {/* Expanded Details: Tab Notation, Notes & Rig Recommendations */}
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="space-y-3 pt-3 border-t border-[#222226]"
                    >
                      {/* Section Tabs */}
                      <div className="space-y-2">
                        <span className="text-[10px] font-mono uppercase tracking-widest text-gray-500 font-bold flex items-center gap-1">
                          <Zap className="w-3 h-3 text-[#CCFF00]" /> Full Tab & Structure:
                        </span>
                        {riff.sections.map((sec, sIdx) => (
                          <div
                            key={sec.name + sIdx}
                            className="p-2.5 rounded-xl bg-[#0A0A0B] border border-[#222226] space-y-1.5"
                          >
                            <div className="flex items-center justify-between text-xs font-mono">
                              <span className="text-gray-300 font-bold">{sec.name}</span>
                              <button
                                onClick={(e) => handlePlayRiff(riff, sIdx, e)}
                                className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold flex items-center gap-1 transition-all cursor-pointer ${
                                  isPlaying && playingSectionIdx === sIdx
                                    ? "bg-red-500 text-white animate-pulse"
                                    : "bg-[#1D1D21] text-gray-300 hover:bg-[#CCFF00] hover:text-black border border-[#333338]"
                                }`}
                              >
                                {isPlaying && playingSectionIdx === sIdx ? (
                                  <>
                                    <Square className="w-2.5 h-2.5 fill-current" /> Stop
                                  </>
                                ) : (
                                  <>
                                    <Play className="w-2.5 h-2.5 fill-current" /> Play
                                  </>
                                )}
                              </button>
                            </div>
                            <div className="bg-[#141416] rounded p-2 border border-[#222226] font-mono text-[10px] text-[#CCFF00]/90 overflow-x-auto whitespace-pre leading-tight select-all">
                              {sec.tab}
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* User Notes Section */}
                      <div className="p-2.5 rounded-xl bg-[#0A0A0B] border border-[#222226] space-y-1">
                        <div className="flex items-center justify-between text-[10px] font-mono font-bold uppercase tracking-wider text-gray-400">
                          <span>User Notes & Tuning Tips:</span>
                          {editingNotesId !== riff.id && (
                            <button
                              onClick={() => {
                                setEditingNotesId(riff.id);
                                setTempNotes(riff.userNotes || "");
                              }}
                              className="text-gray-400 hover:text-[#CCFF00] flex items-center gap-1"
                            >
                              <Edit3 className="w-3 h-3" /> Edit
                            </button>
                          )}
                        </div>

                        {editingNotesId === riff.id ? (
                          <div className="space-y-1.5">
                            <textarea
                              value={tempNotes}
                              onChange={(e) => setTempNotes(e.target.value)}
                              rows={2}
                              className="w-full bg-[#141416] border border-[#CCFF00] rounded-lg p-2 text-xs font-mono text-white outline-none"
                              placeholder="Add practice tips, pickup positions, or pedal notes..."
                            />
                            <div className="flex justify-end gap-1.5">
                              <button
                                onClick={() => setEditingNotesId(null)}
                                className="px-2 py-1 rounded bg-[#1D1D21] text-[10px] font-mono text-gray-400"
                              >
                                Cancel
                              </button>
                              <button
                                onClick={() => handleSaveNotes(riff.id)}
                                className="px-2.5 py-1 rounded bg-[#CCFF00] text-black text-[10px] font-mono font-bold"
                              >
                                Save Note
                              </button>
                            </div>
                          </div>
                        ) : (
                          <p className="text-[11px] text-gray-300 font-mono italic">
                            {riff.userNotes || "No notes added yet. Click edit to add tuning notes."}
                          </p>
                        )}
                      </div>

                      {/* Recommended Amp Rig Link */}
                      {riff.recommendedRig && (
                        <div className="p-2.5 rounded-xl bg-[#0A0A0B] border border-[#222226] flex items-center justify-between gap-2">
                          <div className="text-[11px] font-mono">
                            <span className="text-gray-500 uppercase text-[9px] block">Amp Tone:</span>
                            <span className="text-[#CCFF00] font-bold">{riff.recommendedRig.name}</span>
                          </div>
                          {onLoadAmpPreset && onNavigateToAmp && (
                            <button
                              onClick={() => {
                                onLoadAmpPreset(riff.recommendedRig!.presetId);
                                onNavigateToAmp();
                              }}
                              className="px-2.5 py-1 rounded-lg bg-[#1D1D21] hover:bg-[#CCFF00] hover:text-black text-gray-200 text-[10px] font-mono font-bold border border-[#333338] transition-all flex items-center gap-1 cursor-pointer whitespace-nowrap"
                            >
                              <Sliders className="w-3 h-3" /> Load Tone
                            </button>
                          )}
                        </div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Bottom Action Strip */}
                <div className="pt-3 border-t border-[#222226] flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    {/* Primary Audio Playback */}
                    <button
                      id={`btn-play-riff-${riff.id}`}
                      onClick={(e) => handlePlayRiff(riff, 0, e)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                        isPlaying
                          ? "bg-red-500 text-white animate-pulse shadow-lg shadow-red-500/30"
                          : "bg-[#CCFF00] hover:bg-[#b8e600] text-black shadow-md shadow-[rgba(204,255,0,0.2)]"
                      }`}
                    >
                      {isPlaying ? (
                        <>
                          <Square className="w-3.5 h-3.5 fill-current" />
                          <span>Stop</span>
                        </>
                      ) : (
                        <>
                          <Play className="w-3.5 h-3.5 fill-current" />
                          <span>Play Riff</span>
                        </>
                      )}
                    </button>

                    {/* Copy Tab */}
                    <button
                      onClick={(e) => handleCopyRiff(riff, e)}
                      className="p-2 rounded-xl bg-[#0A0A0B] hover:bg-[#1D1D21] text-gray-400 hover:text-gray-200 border border-[#222226] transition-all cursor-pointer"
                      title="Copy Tab & Progression"
                    >
                      {copiedRiffId === riff.id ? (
                        <Check className="w-3.5 h-3.5 text-[#CCFF00]" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>

                    {/* Delete Riff */}
                    <button
                      onClick={(e) => handleDeleteRiff(riff.id, e)}
                      className="p-2 rounded-xl bg-[#0A0A0B] hover:bg-red-950/40 text-gray-500 hover:text-red-400 border border-[#222226] transition-all cursor-pointer"
                      title="Delete Riff"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Expand / Collapse Button */}
                  <button
                    onClick={() => setExpandedRiffId(isExpanded ? null : riff.id)}
                    className="text-xs font-mono font-bold text-gray-400 hover:text-[#CCFF00] flex items-center gap-1 px-2 py-1 rounded-lg hover:bg-[#0A0A0B] transition-all cursor-pointer"
                  >
                    <span>{isExpanded ? "Hide Tab" : "View Tab"}</span>
                    {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal: Create Custom Riff Entry */}
      <AnimatePresence>
        {isCreateModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-[#141416] border border-[#333338] rounded-2xl w-full max-w-2xl p-6 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between pb-3 border-b border-[#222226]">
                <div className="flex items-center gap-2">
                  <Plus className="w-5 h-5 text-[#CCFF00]" />
                  <h3 className="text-base font-bold text-white font-mono uppercase tracking-wider">
                    Add New Drop C Riff to Vault
                  </h3>
                </div>
                <button
                  onClick={() => setIsCreateModalOpen(false)}
                  className="p-1 rounded-lg text-gray-400 hover:text-white hover:bg-[#1D1D21]"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-mono font-bold uppercase tracking-widest text-gray-500 mb-1">
                    Song / Riff Title *
                  </label>
                  <input
                    type="text"
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    placeholder="e.g. My Heavy Breakdown"
                    className="w-full bg-[#0A0A0B] border border-[#222226] rounded-xl px-3 py-2 text-sm text-gray-100 font-mono focus:border-[#CCFF00] outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-mono font-bold uppercase tracking-widest text-gray-500 mb-1">
                    Original Artist / Band
                  </label>
                  <input
                    type="text"
                    value={newArtist}
                    onChange={(e) => setNewArtist(e.target.value)}
                    placeholder="e.g. Original / Band Name"
                    className="w-full bg-[#0A0A0B] border border-[#222226] rounded-xl px-3 py-2 text-sm text-gray-100 font-mono focus:border-[#CCFF00] outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-mono font-bold uppercase tracking-widest text-gray-500 mb-1">
                    Metal Subgenre Adaptation
                  </label>
                  <select
                    value={newSubgenre}
                    onChange={(e) => setNewSubgenre(e.target.value as MetalSubgenre)}
                    className="w-full bg-[#0A0A0B] border border-[#222226] text-xs font-mono font-bold text-[#CCFF00] rounded-xl px-3 py-2 outline-none focus:border-[#CCFF00] cursor-pointer"
                  >
                    <option value="Metalcore">Metalcore (0-0-0 Breakdown)</option>
                    <option value="Swedish Death Metal">Swedish Death Metal (HM-2 Buzzsaw)</option>
                    <option value="Djent">Djent / Thall (Polyrhythm)</option>
                    <option value="Thrash Metal">Thrash Metal (Gallop Downpicking)</option>
                    <option value="Doom / Sludge">Doom / Sludge (Heavy Fuzz)</option>
                    <option value="Nu-Metal">Nu-Metal (Deftones Drop C)</option>
                    <option value="Prog Metal">Progressive Metal</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-mono font-bold uppercase tracking-widest text-gray-500 mb-1">
                    Tempo (BPM) & Key
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      value={newBpm}
                      onChange={(e) => setNewBpm(Number(e.target.value))}
                      className="w-1/2 bg-[#0A0A0B] border border-[#222226] rounded-xl px-3 py-2 text-xs text-gray-100 font-mono focus:border-[#CCFF00] outline-none"
                      placeholder="BPM"
                    />
                    <input
                      type="text"
                      value={newKey}
                      onChange={(e) => setNewKey(e.target.value)}
                      className="w-1/2 bg-[#0A0A0B] border border-[#222226] rounded-xl px-3 py-2 text-xs text-gray-100 font-mono focus:border-[#CCFF00] outline-none"
                      placeholder="Key (e.g. C Minor)"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-mono font-bold uppercase tracking-widest text-gray-500 mb-1">
                  Drop C Chords / Voicings
                </label>
                <input
                  type="text"
                  value={newChords}
                  onChange={(e) => setNewChords(e.target.value)}
                  placeholder="e.g. C5 [0-0-0] - G#5 [8-8-8] - D#5 [3-3-3]"
                  className="w-full bg-[#0A0A0B] border border-[#222226] rounded-xl px-3 py-2 text-xs text-gray-100 font-mono focus:border-[#CCFF00] outline-none"
                />
              </div>

              <div>
                <label className="block text-[10px] font-mono font-bold uppercase tracking-widest text-gray-500 mb-1">
                  Guitar Tablature (Drop C: C-G-C-F-A-D)
                </label>
                <textarea
                  rows={4}
                  value={newTab}
                  onChange={(e) => setNewTab(e.target.value)}
                  className="w-full bg-[#0A0A0B] border border-[#222226] rounded-xl p-3 text-xs text-[#CCFF00] font-mono focus:border-[#CCFF00] outline-none resize-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-mono font-bold uppercase tracking-widest text-gray-500 mb-1">
                    Tags (Comma Separated)
                  </label>
                  <input
                    type="text"
                    value={newTags}
                    onChange={(e) => setNewTags(e.target.value)}
                    placeholder="e.g. Breakdown, Sludge, 0-0-0"
                    className="w-full bg-[#0A0A0B] border border-[#222226] rounded-xl px-3 py-2 text-xs text-gray-100 font-mono focus:border-[#CCFF00] outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-mono font-bold uppercase tracking-widest text-gray-500 mb-1">
                    Practice Notes / Rig Tips
                  </label>
                  <input
                    type="text"
                    value={newNotes}
                    onChange={(e) => setNewNotes(e.target.value)}
                    placeholder="e.g. Tight noise gate with HM-2 pedal"
                    className="w-full bg-[#0A0A0B] border border-[#222226] rounded-xl px-3 py-2 text-xs text-gray-100 font-mono focus:border-[#CCFF00] outline-none"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-[#222226] flex items-center justify-end gap-2">
                <button
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-[#1D1D21] hover:bg-[#25252b] text-gray-300 text-xs font-mono font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateNewRiff}
                  className="px-6 py-2 rounded-xl bg-[#CCFF00] hover:bg-[#b8e600] text-black font-black text-xs font-mono uppercase tracking-wider flex items-center gap-2 cursor-pointer shadow-lg shadow-[rgba(204,255,0,0.2)]"
                >
                  <Save className="w-4 h-4" />
                  <span>Save Riff to Vault</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Modal: Backup & Restore JSON */}
      <AnimatePresence>
        {isExportModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-[#141416] border border-[#333338] rounded-2xl w-full max-w-2xl p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between pb-3 border-b border-[#222226]">
                <div className="flex items-center gap-2">
                  <Download className="w-5 h-5 text-[#CCFF00]" />
                  <h3 className="text-base font-bold text-white font-mono uppercase tracking-wider">
                    Riff Vault Backup & JSON Import
                  </h3>
                </div>
                <button
                  onClick={() => setIsExportModalOpen(false)}
                  className="p-1 rounded-lg text-gray-400 hover:text-white hover:bg-[#1D1D21]"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4">
                {/* Export Section */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-[10px] font-mono font-bold uppercase tracking-widest text-gray-400">
                      Export Current Riffs (JSON)
                    </label>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(exportJsonStr);
                        alert("Copied JSON to clipboard!");
                      }}
                      className="text-xs font-mono text-[#CCFF00] font-bold hover:underline flex items-center gap-1"
                    >
                      <Copy className="w-3 h-3" /> Copy JSON
                    </button>
                  </div>
                  <textarea
                    rows={5}
                    readOnly
                    value={exportJsonStr}
                    className="w-full bg-[#0A0A0B] border border-[#222226] rounded-xl p-3 text-[11px] font-mono text-gray-300 outline-none select-all"
                  />
                </div>

                {/* Import Section */}
                <div className="pt-2 border-t border-[#222226]">
                  <label className="block text-[10px] font-mono font-bold uppercase tracking-widest text-gray-400 mb-1.5">
                    Import Riffs (Paste JSON)
                  </label>
                  <textarea
                    rows={4}
                    value={importJsonStr}
                    onChange={(e) => setImportJsonStr(e.target.value)}
                    placeholder="Paste exported riff array JSON here..."
                    className="w-full bg-[#0A0A0B] border border-[#222226] rounded-xl p-3 text-[11px] font-mono text-gray-200 outline-none focus:border-[#CCFF00]"
                  />
                  {importFeedback && (
                    <p className="text-xs font-mono text-[#CCFF00] mt-1">{importFeedback}</p>
                  )}
                  <div className="mt-2 flex justify-end">
                    <button
                      onClick={() => {
                        if (!importJsonStr.trim()) return;
                        const res = storage.importJson(importJsonStr);
                        if (res.success) {
                          setImportFeedback(`Successfully imported ${res.count} riffs!`);
                          refreshRiffs();
                        } else {
                          setImportFeedback(`Import error: ${res.error}`);
                        }
                      }}
                      className="px-4 py-1.5 rounded-xl bg-[#1D1D21] hover:bg-[#25252b] text-gray-200 text-xs font-mono font-bold border border-[#333338] flex items-center gap-1.5 cursor-pointer"
                    >
                      <Upload className="w-3.5 h-3.5 text-[#CCFF00]" />
                      <span>Import Riffs</span>
                    </button>
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-[#222226] flex justify-end">
                <button
                  onClick={() => setIsExportModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-[#CCFF00] text-black text-xs font-mono font-bold cursor-pointer"
                >
                  Done
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
