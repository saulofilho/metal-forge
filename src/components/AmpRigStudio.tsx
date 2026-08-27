import React, { useState, useEffect, useMemo, useRef } from "react";
import { AudioEngine } from "../audio/audioEngine";
import { FACTORY_PRESETS } from "../audio/presetLibrary";
import { AmpParams, AmpPreset, PresetCategory, PresetUsageStat, AbPresetSlot } from "../types";
import { Knob } from "./Knob";
import { SpectralAnalyzer } from "./SpectralAnalyzer";
import {
  Mic,
  MicOff,
  Sliders,
  Play,
  Square,
  Volume2,
  VolumeX,
  Headphones,
  Save,
  Download,
  Upload,
  Zap,
  Layers,
  Radio,
  Sparkles,
  Flame,
  Search,
  Filter,
  Clock,
  Activity,
  TrendingUp,
  ArrowLeftRight,
  Copy,
  RotateCcw,
  Check,
  GitCompare,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  Gauge,
  ShieldCheck,
  Volume1,
} from "lucide-react";

export const AmpRigStudio: React.FC = () => {
  const audioEngine = AudioEngine.getInstance();
  const [presets, setPresets] = useState<AmpPreset[]>(() => {
    try {
      const custom = localStorage.getItem("dropc_metal_custom_presets");
      return custom ? [...FACTORY_PRESETS, ...JSON.parse(custom)] : FACTORY_PRESETS;
    } catch {
      return FACTORY_PRESETS;
    }
  });

  const [currentPresetId, setCurrentPresetId] = useState<string>("preset-5150-chug");
  const [selectedCategory, setSelectedCategory] = useState<PresetCategory>("All");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [sortBy, setSortBy] = useState<"default" | "most-played" | "recently-used">("default");
  const [customPresetCategory, setCustomPresetCategory] = useState<"High-Gain" | "Clean" | "Experimental" | "Custom">("High-Gain");
  const [params, setParams] = useState<AmpParams>(FACTORY_PRESETS[0].params);
  const [isLiveInputActive, setIsLiveInputActive] = useState(false);
  const [inputBuffer, setInputBuffer] = useState<number>(256);
  const [customPresetName, setCustomPresetName] = useState("");
  const [showSaveModal, setShowSaveModal] = useState(false);

  // A/B Preset Tone Comparison State Buffers
  const [abActiveSlot, setAbActiveSlot] = useState<"A" | "B">("A");
  const [slotA, setSlotA] = useState<AbPresetSlot>(() => ({
    name: FACTORY_PRESETS[0].name,
    presetId: FACTORY_PRESETS[0].id,
    params: { ...FACTORY_PRESETS[0].params },
    timestamp: Date.now(),
  }));
  const [slotB, setSlotB] = useState<AbPresetSlot>(() => ({
    name: (FACTORY_PRESETS[1] || FACTORY_PRESETS[0]).name,
    presetId: (FACTORY_PRESETS[1] || FACTORY_PRESETS[0]).id,
    params: { ...(FACTORY_PRESETS[1]?.params || FACTORY_PRESETS[0].params) },
    timestamp: Date.now(),
  }));
  const [showDiffDrawer, setShowDiffDrawer] = useState(false);
  const [abToastMessage, setAbToastMessage] = useState<string | null>(null);
  const abToastTimerRef = useRef<number | null>(null);

  const showAbToast = (msg: string) => {
    if (abToastTimerRef.current) clearTimeout(abToastTimerRef.current);
    setAbToastMessage(msg);
    abToastTimerRef.current = window.setTimeout(() => {
      setAbToastMessage(null);
    }, 2800);
  };

  // Preset Usage Insights State (Times Played + Last Used Timestamp)
  const [usageStats, setUsageStats] = useState<Record<string, PresetUsageStat>>(() => {
    try {
      const stored = localStorage.getItem("dropc_preset_usage_stats");
      if (stored) {
        return JSON.parse(stored);
      }
    } catch {
      // ignore
    }
    return {
      "preset-5150-chug": { count: 3, lastUsed: Date.now() - 1000 * 60 * 2 },
      "preset-mesa-nu-metal": { count: 2, lastUsed: Date.now() - 1000 * 60 * 18 },
      "preset-djent-808": { count: 1, lastUsed: Date.now() - 1000 * 60 * 65 },
    };
  });

  const recordPresetUsage = (presetId: string) => {
    setUsageStats((prev) => {
      const existing = prev[presetId] || { count: 0, lastUsed: 0 };
      const updated = {
        ...prev,
        [presetId]: {
          count: existing.count + 1,
          lastUsed: Date.now(),
        },
      };
      try {
        localStorage.setItem("dropc_preset_usage_stats", JSON.stringify(updated));
      } catch {
        // ignore
      }
      return updated;
    });
  };

  const formatLastUsed = (timestamp: number | undefined, isSelected: boolean): string => {
    if (isSelected) return "Active now";
    if (!timestamp || timestamp === 0) return "Never used";
    const elapsedSec = Math.max(1, Math.floor((Date.now() - timestamp) / 1000));
    if (elapsedSec < 45) return "Just now";
    if (elapsedSec < 60) return `${elapsedSec}s ago`;
    const elapsedMin = Math.floor(elapsedSec / 60);
    if (elapsedMin < 60) return `${elapsedMin}m ago`;
    const elapsedHours = Math.floor(elapsedMin / 60);
    if (elapsedHours < 24) return `${elapsedHours}h ago`;
    const elapsedDays = Math.floor(elapsedHours / 24);
    if (elapsedDays === 1) return "Yesterday";
    if (elapsedDays < 7) return `${elapsedDays}d ago`;
    const elapsedWeeks = Math.floor(elapsedDays / 7);
    return `${elapsedWeeks}w ago`;
  };

  // Audio sample hover preview state
  const [hoverAuditionEnabled, setHoverAuditionEnabled] = useState(true);
  const [auditioningPresetId, setAuditioningPresetId] = useState<string | null>(null);
  const hoverTimerRef = useRef<number | null>(null);
  const activeParamsRef = useRef<AmpParams>(params);

  useEffect(() => {
    activeParamsRef.current = params;
  }, [params]);

  // Metering state
  const [levels, setLevels] = useState({ in: 0, out: 0, gate: true });

  // Filtered and Sorted preset list based on category, search query & sort mode
  const filteredPresets = useMemo(() => {
    const list = presets.filter((preset) => {
      // Determine category (fallback if missing)
      const cat = preset.category || (preset.id.startsWith("custom-") ? "Custom" : "High-Gain");
      
      const matchesCategory =
        selectedCategory === "All" ||
        (selectedCategory === "Custom" && (preset.id.startsWith("custom-") || cat === "Custom")) ||
        cat === selectedCategory;

      const matchesSearch =
        !searchQuery.trim() ||
        preset.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        preset.subgenre.toLowerCase().includes(searchQuery.toLowerCase()) ||
        preset.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        preset.params.ampModel.toLowerCase().includes(searchQuery.toLowerCase());

      return matchesCategory && matchesSearch;
    });

    if (sortBy === "most-played") {
      return [...list].sort((a, b) => {
        const countA = usageStats[a.id]?.count || 0;
        const countB = usageStats[b.id]?.count || 0;
        return countB - countA;
      });
    }

    if (sortBy === "recently-used") {
      return [...list].sort((a, b) => {
        const timeA = usageStats[a.id]?.lastUsed || 0;
        const timeB = usageStats[b.id]?.lastUsed || 0;
        return timeB - timeA;
      });
    }

    return list;
  }, [presets, selectedCategory, searchQuery, sortBy, usageStats]);

  // Counts per category
  const categoryCounts = useMemo(() => {
    const counts = {
      All: presets.length,
      "High-Gain": 0,
      Clean: 0,
      Experimental: 0,
      Custom: 0,
    };
    presets.forEach((p) => {
      const cat = p.category || (p.id.startsWith("custom-") ? "Custom" : "High-Gain");
      if (p.id.startsWith("custom-")) {
        counts.Custom++;
      }
      if (cat === "High-Gain") counts["High-Gain"]++;
      else if (cat === "Clean") counts.Clean++;
      else if (cat === "Experimental") counts.Experimental++;
    });
    return counts;
  }, [presets]);

  // Detailed parameter differences between Slot A and Slot B
  const parameterDifferences = useMemo(() => {
    const diffs: { category: string; paramName: string; valA: string; valB: string }[] = [];
    const pA = slotA.params;
    const pB = slotB.params;

    if (pA.ampModel !== pB.ampModel) {
      diffs.push({ category: "Amp Head", paramName: "Model", valA: pA.ampModel, valB: pB.ampModel });
    }
    if (Math.abs(pA.gain - pB.gain) > 0.05) {
      diffs.push({ category: "Amp Head", paramName: "Gain", valA: pA.gain.toFixed(1), valB: pB.gain.toFixed(1) });
    }
    if (Math.abs(pA.master - pB.master) > 0.05) {
      diffs.push({ category: "Amp Head", paramName: "Master", valA: pA.master.toFixed(1), valB: pB.master.toFixed(1) });
    }
    if (Math.abs(pA.bass - pB.bass) > 0.05) {
      diffs.push({ category: "EQ", paramName: "Bass", valA: pA.bass.toFixed(1), valB: pB.bass.toFixed(1) });
    }
    if (Math.abs(pA.middle - pB.middle) > 0.05) {
      diffs.push({ category: "EQ", paramName: "Middle", valA: pA.middle.toFixed(1), valB: pB.middle.toFixed(1) });
    }
    if (Math.abs(pA.treble - pB.treble) > 0.05) {
      diffs.push({ category: "EQ", paramName: "Treble", valA: pA.treble.toFixed(1), valB: pB.treble.toFixed(1) });
    }
    if (Math.abs(pA.presence - pB.presence) > 0.05) {
      diffs.push({ category: "Power Stage", paramName: "Presence", valA: pA.presence.toFixed(1), valB: pB.presence.toFixed(1) });
    }
    if (Math.abs(pA.resonance - pB.resonance) > 0.05) {
      diffs.push({ category: "Power Stage", paramName: "Resonance", valA: pA.resonance.toFixed(1), valB: pB.resonance.toFixed(1) });
    }
    if (pA.cabModel !== pB.cabModel) {
      diffs.push({ category: "Cabinet IR", paramName: "Cab Model", valA: pA.cabModel, valB: pB.cabModel });
    }
    if (pA.micType !== pB.micType) {
      diffs.push({ category: "Cabinet IR", paramName: "Microphone", valA: pA.micType, valB: pB.micType });
    }
    if (pA.micPlacement !== pB.micPlacement) {
      diffs.push({ category: "Cabinet IR", paramName: "Placement", valA: pA.micPlacement, valB: pB.micPlacement });
    }
    if (pA.driveEnabled !== pB.driveEnabled) {
      diffs.push({ category: "Overdrive", paramName: "TS9 Power", valA: pA.driveEnabled ? "ON" : "OFF", valB: pB.driveEnabled ? "ON" : "OFF" });
    }
    if (pA.driveEnabled && pB.driveEnabled) {
      if (Math.abs(pA.driveGain - pB.driveGain) > 0.05) {
        diffs.push({ category: "Overdrive", paramName: "Drive Gain", valA: pA.driveGain.toFixed(1), valB: pB.driveGain.toFixed(1) });
      }
      if (Math.abs(pA.driveLevel - pB.driveLevel) > 0.05) {
        diffs.push({ category: "Overdrive", paramName: "Drive Level", valA: pA.driveLevel.toFixed(1), valB: pB.driveLevel.toFixed(1) });
      }
    }
    if (pA.gateEnabled !== pB.gateEnabled) {
      diffs.push({ category: "Noise Gate", paramName: "Gate Power", valA: pA.gateEnabled ? "ON" : "OFF", valB: pB.gateEnabled ? "ON" : "OFF" });
    }
    if (pA.gateThreshold !== pB.gateThreshold) {
      diffs.push({ category: "Noise Gate", paramName: "Threshold", valA: `${pA.gateThreshold}dB`, valB: `${pB.gateThreshold}dB` });
    }
    if (pA.delayEnabled !== pB.delayEnabled) {
      diffs.push({ category: "Delay", paramName: "Delay Power", valA: pA.delayEnabled ? "ON" : "OFF", valB: pB.delayEnabled ? "ON" : "OFF" });
    }
    if (pA.reverbEnabled !== pB.reverbEnabled) {
      diffs.push({ category: "Reverb", paramName: "Reverb Power", valA: pA.reverbEnabled ? "ON" : "OFF", valB: pB.reverbEnabled ? "ON" : "OFF" });
    }
    if (pA.chorusEnabled !== pB.chorusEnabled) {
      diffs.push({ category: "Chorus", paramName: "Chorus Power", valA: pA.chorusEnabled ? "ON" : "OFF", valB: pB.chorusEnabled ? "ON" : "OFF" });
    }
    if (pA.eqEnabled !== pB.eqEnabled) {
      diffs.push({ category: "Graphic EQ", paramName: "5-Band EQ", valA: pA.eqEnabled ? "ON" : "OFF", valB: pB.eqEnabled ? "ON" : "OFF" });
    }
    const trimA = pA.gainStageTrim !== undefined ? pA.gainStageTrim : 0;
    const trimB = pB.gainStageTrim !== undefined ? pB.gainStageTrim : 0;
    if (Math.abs(trimA - trimB) > 0.1) {
      diffs.push({
        category: "Gain Staging",
        paramName: "Output Trim",
        valA: `${trimA >= 0 ? "+" : ""}${trimA.toFixed(1)} dB`,
        valB: `${trimB >= 0 ? "+" : ""}${trimB.toFixed(1)} dB`,
      });
    }

    return diffs;
  }, [slotA, slotB]);

  useEffect(() => {
    audioEngine.init().then(() => {
      audioEngine.applyAmpParams(params);
    });
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setLevels({
        in: audioEngine.inputLevel,
        out: audioEngine.outputLevel,
        gate: audioEngine.isGateOpen,
      });
    }, 60);
    return () => clearInterval(timer);
  }, []);

  // Keyboard shortcut listener for instantaneous A/B toggling
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (["INPUT", "TEXTAREA", "SELECT"].includes((e.target as HTMLElement)?.tagName)) {
        return;
      }
      if (e.key === "a" || e.key === "A") {
        if (e.shiftKey) {
          handleSwitchSlot("A");
        }
      } else if (e.key === "b" || e.key === "B") {
        if (e.shiftKey) {
          handleSwitchSlot("B");
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [slotA, slotB, abActiveSlot]);

  // Switch between Slot A and Slot B
  const handleSwitchSlot = (targetSlot: "A" | "B") => {
    const targetData = targetSlot === "A" ? slotA : slotB;
    setAbActiveSlot(targetSlot);
    setParams(targetData.params);
    setCurrentPresetId(targetData.presetId || "");
    activeParamsRef.current = targetData.params;
    audioEngine.applyAmpParams(targetData.params);
    showAbToast(`Active: Slot [${targetSlot}] • ${targetData.name}`);
  };

  // Toggle A/B back and forth
  const handleToggleAB = () => {
    const nextSlot = abActiveSlot === "A" ? "B" : "A";
    handleSwitchSlot(nextSlot);
  };

  // Copy one slot to the other
  const handleCopySlot = (source: "A" | "B") => {
    if (source === "A") {
      setSlotB({
        name: `${slotA.name} (Snapshot)`,
        presetId: slotA.presetId,
        params: { ...slotA.params },
        timestamp: Date.now(),
      });
      showAbToast(`Copied Slot A settings into Slot B as reference baseline!`);
    } else {
      setSlotA({
        name: `${slotB.name} (Snapshot)`,
        presetId: slotB.presetId,
        params: { ...slotB.params },
        timestamp: Date.now(),
      });
      showAbToast(`Copied Slot B settings into Slot A as reference baseline!`);
    }
  };

  // Swap Slot A and Slot B
  const handleSwapSlots = () => {
    const prevA = { ...slotA };
    const prevB = { ...slotB };
    setSlotA(prevB);
    setSlotB(prevA);
    const activeData = abActiveSlot === "A" ? prevB : prevA;
    setParams(activeData.params);
    setCurrentPresetId(activeData.presetId || "");
    activeParamsRef.current = activeData.params;
    audioEngine.applyAmpParams(activeData.params);
    showAbToast(`Swapped Slot A ⇄ Slot B!`);
  };

  // Handle parameter tweaking
  const handleParamChange = <K extends keyof AmpParams>(key: K, value: AmpParams[K]) => {
    const updated = { ...params, [key]: value };
    setParams(updated);
    activeParamsRef.current = updated;
    audioEngine.applyAmpParams(updated);

    // Sync with active comparison slot
    if (abActiveSlot === "A") {
      setSlotA((prev) => ({
        ...prev,
        params: updated,
        timestamp: Date.now(),
      }));
    } else {
      setSlotB((prev) => ({
        ...prev,
        params: updated,
        timestamp: Date.now(),
      }));
    }
  };

  // Select preset from library into active slot
  const handleSelectPreset = (preset: AmpPreset) => {
    if (hoverTimerRef.current) {
      clearTimeout(hoverTimerRef.current);
      hoverTimerRef.current = null;
    }
    audioEngine.stopPresetAudition();
    setAuditioningPresetId(null);
    setCurrentPresetId(preset.id);
    setParams(preset.params);
    activeParamsRef.current = preset.params;
    audioEngine.applyAmpParams(preset.params);
    recordPresetUsage(preset.id);

    const slotPayload: AbPresetSlot = {
      name: preset.name,
      presetId: preset.id,
      params: { ...preset.params },
      timestamp: Date.now(),
    };

    if (abActiveSlot === "A") {
      setSlotA(slotPayload);
    } else {
      setSlotB(slotPayload);
    }
    showAbToast(`Loaded "${preset.name}" into Slot ${abActiveSlot}`);
  };

  // Load preset directly into designated slot
  const handleLoadPresetToSlot = (e: React.MouseEvent, preset: AmpPreset, targetSlot: "A" | "B") => {
    e.stopPropagation();
    const slotPayload: AbPresetSlot = {
      name: preset.name,
      presetId: preset.id,
      params: { ...preset.params },
      timestamp: Date.now(),
    };

    if (targetSlot === "A") {
      setSlotA(slotPayload);
      if (abActiveSlot === "A") {
        setParams(preset.params);
        setCurrentPresetId(preset.id);
        activeParamsRef.current = preset.params;
        audioEngine.applyAmpParams(preset.params);
      }
    } else {
      setSlotB(slotPayload);
      if (abActiveSlot === "B") {
        setParams(preset.params);
        setCurrentPresetId(preset.id);
        activeParamsRef.current = preset.params;
        audioEngine.applyAmpParams(preset.params);
      }
    }
    recordPresetUsage(preset.id);
    showAbToast(`Assigned "${preset.name}" to Slot ${targetSlot}`);
  };

  const handlePresetMouseEnter = (preset: AmpPreset) => {
    if (!hoverAuditionEnabled) return;
    if (hoverTimerRef.current) clearTimeout(hoverTimerRef.current);

    // 140ms debounce to avoid spamming audio while quickly moving mouse
    hoverTimerRef.current = window.setTimeout(() => {
      setAuditioningPresetId(preset.id);
      audioEngine.playPresetAudition(preset, () => {
        setAuditioningPresetId((prev) => (prev === preset.id ? null : prev));
        audioEngine.applyAmpParams(activeParamsRef.current);
      });
    }, 140);
  };

  const handlePresetMouseLeave = (preset: AmpPreset) => {
    if (hoverTimerRef.current) {
      clearTimeout(hoverTimerRef.current);
      hoverTimerRef.current = null;
    }
    if (auditioningPresetId === preset.id) {
      audioEngine.stopPresetAudition();
      setAuditioningPresetId(null);
      audioEngine.applyAmpParams(activeParamsRef.current);
    }
  };

  const handleToggleAudition = (e: React.MouseEvent, preset: AmpPreset) => {
    e.stopPropagation();
    if (auditioningPresetId === preset.id) {
      audioEngine.stopPresetAudition();
      setAuditioningPresetId(null);
      audioEngine.applyAmpParams(activeParamsRef.current);
    } else {
      if (hoverTimerRef.current) {
        clearTimeout(hoverTimerRef.current);
        hoverTimerRef.current = null;
      }
      setAuditioningPresetId(preset.id);
      audioEngine.playPresetAudition(preset, () => {
        setAuditioningPresetId((prev) => (prev === preset.id ? null : prev));
        audioEngine.applyAmpParams(activeParamsRef.current);
      });
    }
  };

  const handleToggleLiveInput = async () => {
    if (isLiveInputActive) {
      audioEngine.disableLiveInput();
      setIsLiveInputActive(false);
    } else {
      const ok = await audioEngine.enableLiveInput(inputBuffer);
      if (ok) {
        setIsLiveInputActive(true);
      } else {
        alert("Could not access microphone/audio interface. Please check browser permissions!");
      }
    }
  };

  // Virtual Test Riff triggers
  const handleTestRiff = (type: "chug" | "gallop" | "add9" | "breakdown") => {
    audioEngine.init().then(() => {
      if (type === "chug") {
        // 0-0-0 16th triplets
        [0, 0.12, 0.24, 0.36, 0.48, 0.6, 0.72].forEach((t) => {
          setTimeout(() => {
            audioEngine.playDropCVoicing([0, 0, 0, "x", "x", "x"], true, 0.15);
          }, t * 1000);
        });
      } else if (type === "gallop") {
        // 16th-16th-8th gallop into 8th fret
        [0, 0.1, 0.2, 0.4, 0.5, 0.6, 0.8].forEach((t, i) => {
          const fret = i === 6 ? 8 : 0;
          setTimeout(() => {
            audioEngine.playDropCVoicing([fret, fret, fret, "x", "x", "x"], i !== 6, 0.2);
          }, t * 1000);
        });
      } else if (type === "add9") {
        // Melodic Add9 ringing chord
        audioEngine.playDropCVoicing([0, 0, 0, 2, 3, "x"], false, 1.2);
        setTimeout(() => audioEngine.playDropCVoicing([8, 8, 8, 10, 12, "x"], false, 1.5), 600);
      } else if (type === "breakdown") {
        // Crushing 0-0-0 into tritone
        [0, 0.2, 0.5, 0.8, 1.1].forEach((t, i) => {
          const fret = i === 2 ? 1 : 0;
          setTimeout(() => {
            audioEngine.playDropCVoicing([fret, fret, fret, "x", "x", "x"], i !== 2, 0.35);
          }, t * 1000);
        });
      }
    });
  };

  const handleSaveCustomPreset = () => {
    if (!customPresetName) return;
    const newPreset: AmpPreset = {
      id: `custom-${Date.now()}`,
      name: customPresetName,
      subgenre: "Metalcore",
      category: customPresetCategory,
      description: "Custom user dialed rig preset.",
      iconName: "Flame",
      params: { ...params },
    };

    const updated = [...presets, newPreset];
    setPresets(updated);
    setCurrentPresetId(newPreset.id);
    recordPresetUsage(newPreset.id);
    localStorage.setItem(
      "dropc_metal_custom_presets",
      JSON.stringify(updated.filter((p) => p.id.startsWith("custom-")))
    );
    setShowSaveModal(false);
    setCustomPresetName("");
  };

  const handleExportPresetsJson = () => {
    const blob = new Blob([JSON.stringify(presets, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "dropc-metalforge-presets.json";
    a.click();
  };

  const handleImportPresetsJson = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const parsed = JSON.parse(ev.target?.result as string);
        if (Array.isArray(parsed)) {
          setPresets(parsed);
          localStorage.setItem(
            "dropc_metal_custom_presets",
            JSON.stringify(parsed.filter((p) => p.id.startsWith("custom-")))
          );
        }
      } catch (err) {
        alert("Invalid preset JSON file.");
      }
    };
    reader.readAsText(file);
  };

  return (
    <div id="amp-rig-studio" className="space-y-6">
      {/* Top Controls & Live Input Bento Bar */}
      <div className="bg-[#141416] border border-[#222226] rounded-2xl p-4 sm:p-5 shadow-2xl flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        {/* Live Input Setup */}
        <div className="flex flex-wrap items-center gap-3">
          <button
            id="btn-toggle-live-input"
            onClick={handleToggleLiveInput}
            className={`px-4 py-2 rounded-xl font-mono text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
              isLiveInputActive
                ? "bg-red-500 text-white animate-pulse shadow-lg shadow-red-500/30"
                : "bg-[#1D1D21] hover:bg-[#CCFF00] hover:text-black text-gray-200 border border-[#333338]"
            }`}
          >
            {isLiveInputActive ? (
              <>
                <Mic className="w-4 h-4" /> GUITAR INPUT: ACTIVE
              </>
            ) : (
              <>
                <MicOff className="w-4 h-4 text-gray-400" /> CONNECT LIVE GUITAR
              </>
            )}
          </button>

          {/* Latency Buffer Mode */}
          <div className="flex items-center gap-1.5 bg-[#0A0A0B] px-3 py-1.5 rounded-xl border border-[#222226] text-xs font-mono">
            <span className="text-gray-500 uppercase text-[10px] font-bold">BUFFER:</span>
            <select
              value={inputBuffer}
              onChange={(e) => setInputBuffer(Number(e.target.value))}
              disabled={isLiveInputActive}
              className="bg-transparent text-[#CCFF00] font-bold outline-none cursor-pointer"
            >
              <option value={128} className="bg-[#141416] text-white">128 (Ultra-Low ~2.7ms)</option>
              <option value={256} className="bg-[#141416] text-white">256 (Balanced ~5.3ms)</option>
              <option value={512} className="bg-[#141416] text-white">512 (Stable ~10.6ms)</option>
            </select>
          </div>

          {/* VU Meters & Output Level */}
          <div className="flex items-center gap-3 bg-[#0A0A0B] px-3 py-1.5 rounded-xl border border-[#222226]">
            <div className="flex items-center gap-1.5 text-[10px] font-mono">
              <span className="text-gray-500 uppercase font-bold">IN:</span>
              <div className="w-14 h-2 bg-[#1D1D21] rounded-full overflow-hidden flex border border-[#333338]">
                <div
                  className="h-full bg-emerald-500 transition-all duration-75"
                  style={{ width: `${Math.min(100, levels.in * 100)}%` }}
                />
              </div>
            </div>

            <div className="flex items-center gap-1.5 text-[10px] font-mono">
              <span className="text-gray-500 uppercase font-bold">OUT:</span>
              <div className="w-14 h-2 bg-[#1D1D21] rounded-full overflow-hidden flex border border-[#333338]">
                <div
                  className={`h-full transition-all duration-75 ${
                    levels.out > 0.88 ? "bg-red-500 shadow-[0_0_6px_rgba(239,68,68,0.8)]" : "bg-[#CCFF00]"
                  }`}
                  style={{ width: `${Math.min(100, levels.out * 100)}%` }}
                />
              </div>
            </div>

            {/* Noise Gate LED */}
            <div className="flex items-center gap-1.5 text-[10px] font-mono">
              <span className="text-gray-500 uppercase font-bold">GATE:</span>
              <span
                className={`w-2.5 h-2.5 rounded-full ${
                  levels.gate ? "bg-[#CCFF00] shadow-[0_0_8px_rgba(204,255,0,0.9)]" : "bg-gray-700"
                }`}
                title={levels.gate ? "Gate Open" : "Gate Clamped"}
              />
            </div>
          </div>

          {/* Preset Gain-Staging Normalizer & Clip-Prevention Slider */}
          <div className="flex items-center gap-2.5 bg-[#0A0A0B] px-3 py-1.5 rounded-xl border border-[#222226] text-xs font-mono">
            <div className="flex items-center gap-1.5 text-gray-300">
              <ShieldCheck className="w-3.5 h-3.5 text-[#CCFF00]" />
              <div className="flex flex-col">
                <span className="text-[9px] text-gray-500 uppercase font-bold tracking-wider leading-none">PRESET GAIN STAGING</span>
                <span className="text-[10px] text-gray-300 font-bold leading-tight flex items-center gap-1">
                  <span>Output Trim:</span>
                  <span className={`font-mono font-bold ${
                    (params.gainStageTrim || 0) > 0 ? "text-amber-400" : (params.gainStageTrim || 0) < 0 ? "text-sky-400" : "text-[#CCFF00]"
                  }`}>
                    {(params.gainStageTrim || 0) >= 0 ? "+" : ""}{(params.gainStageTrim || 0).toFixed(1)} dB
                  </span>
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <input
                id="slider-gain-staging-trim"
                type="range"
                min="-12"
                max="12"
                step="0.5"
                value={params.gainStageTrim !== undefined ? params.gainStageTrim : 0}
                onChange={(e) => handleParamChange("gainStageTrim", parseFloat(e.target.value))}
                className="w-24 sm:w-28 accent-[#CCFF00] h-1.5 bg-[#1D1D21] rounded-lg cursor-pointer"
                title="Manually normalize output level for this preset to prevent live-switching clipping (-12dB to +12dB)"
              />
              <button
                type="button"
                onClick={() => handleParamChange("gainStageTrim", 0)}
                className="px-1.5 py-0.5 rounded text-[9px] bg-[#1D1D21] hover:bg-[#25252b] text-gray-400 hover:text-white border border-[#333338] transition-colors cursor-pointer"
                title="Reset Gain-Stage Trim to 0.0 dB"
              >
                0dB
              </button>
            </div>
          </div>
        </div>

        {/* Virtual Riff Tester Bar */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs scrollbar-none">
          <span className="text-[10px] font-mono text-gray-500 uppercase tracking-widest whitespace-nowrap flex items-center gap-1 font-bold">
            <Radio className="w-3.5 h-3.5 text-[#CCFF00]" /> Test Rig:
          </span>
          <button
            onClick={() => handleTestRiff("chug")}
            className="px-2.5 py-1 rounded-lg bg-[#1D1D21] hover:bg-[#CCFF00] hover:text-black text-gray-200 text-[11px] font-mono font-bold flex items-center gap-1 transition-all border border-[#333338] cursor-pointer"
          >
            <Play className="w-2.5 h-2.5 fill-current" /> 0-0-0 Chug
          </button>
          <button
            onClick={() => handleTestRiff("gallop")}
            className="px-2.5 py-1 rounded-lg bg-[#1D1D21] hover:bg-[#CCFF00] hover:text-black text-gray-200 text-[11px] font-mono font-bold flex items-center gap-1 transition-all border border-[#333338] cursor-pointer"
          >
            <Play className="w-2.5 h-2.5 fill-current" /> Thrash Gallop
          </button>
          <button
            onClick={() => handleTestRiff("add9")}
            className="px-2.5 py-1 rounded-lg bg-[#1D1D21] hover:bg-[#CCFF00] hover:text-black text-gray-200 text-[11px] font-mono font-bold flex items-center gap-1 transition-all border border-[#333338] cursor-pointer"
          >
            <Play className="w-2.5 h-2.5 fill-current" /> Melodic Add9
          </button>
          <button
            onClick={() => handleTestRiff("breakdown")}
            className="px-2.5 py-1 rounded-lg bg-[#1D1D21] hover:bg-[#CCFF00] hover:text-black text-gray-200 text-[11px] font-mono font-bold flex items-center gap-1 transition-all border border-[#333338] cursor-pointer"
          >
            <Play className="w-2.5 h-2.5 fill-current" /> Slam Breakdown
          </button>
        </div>
      </div>

      {/* A/B Dual-Slot Tone Comparison Control Bar */}
      <div className="bg-[#141416] border border-[#222226] rounded-2xl p-4 sm:p-5 shadow-2xl space-y-3">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pb-3 border-b border-[#222226]">
          <div className="flex items-center gap-2">
            <ArrowLeftRight className="w-4 h-4 text-[#CCFF00]" />
            <h3 className="text-xs sm:text-sm font-bold text-white font-mono uppercase tracking-widest flex items-center gap-2">
              <span>A/B TONAL COMPARISON ENGINE</span>
              <span className="text-[10px] px-2 py-0.5 rounded bg-[#1D1D21] text-gray-400 font-normal border border-[#333338]">
                Instant Auditioning
              </span>
            </h3>
          </div>

          {/* Quick A/B Action Utilities */}
          <div className="flex items-center flex-wrap gap-2 text-xs font-mono">
            <button
              onClick={() => handleCopySlot("A")}
              className="px-2.5 py-1 rounded-lg bg-[#1D1D21] hover:bg-[#25252b] text-gray-300 border border-[#333338] flex items-center gap-1.5 transition-all cursor-pointer"
              title="Copy active settings in Slot A into Slot B as a baseline"
            >
              <Copy className="w-3 h-3 text-[#CCFF00]" />
              <span>Copy A → B</span>
            </button>

            <button
              onClick={() => handleCopySlot("B")}
              className="px-2.5 py-1 rounded-lg bg-[#1D1D21] hover:bg-[#25252b] text-gray-300 border border-[#333338] flex items-center gap-1.5 transition-all cursor-pointer"
              title="Copy active settings in Slot B into Slot A as a baseline"
            >
              <Copy className="w-3 h-3 text-[#CCFF00]" />
              <span>Copy B → A</span>
            </button>

            <button
              onClick={handleSwapSlots}
              className="px-2.5 py-1 rounded-lg bg-[#1D1D21] hover:bg-[#25252b] text-gray-300 border border-[#333338] flex items-center gap-1.5 transition-all cursor-pointer"
              title="Swap Slot A and Slot B settings"
            >
              <RefreshCw className="w-3 h-3 text-[#CCFF00]" />
              <span>Swap A ⇄ B</span>
            </button>

            {/* Difference Inspector Button */}
            <button
              onClick={() => setShowDiffDrawer(!showDiffDrawer)}
              className={`px-3 py-1 rounded-lg border font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                parameterDifferences.length > 0
                  ? "bg-[#CCFF00]/10 text-[#CCFF00] border-[#CCFF00]/40 hover:bg-[#CCFF00]/20"
                  : "bg-[#1D1D21] text-gray-400 border-[#333338]"
              }`}
            >
              <GitCompare className="w-3 h-3" />
              <span>
                {parameterDifferences.length === 0
                  ? "Tones Identical"
                  : `${parameterDifferences.length} ${parameterDifferences.length === 1 ? "Diff" : "Diffs"}`}
              </span>
              {showDiffDrawer ? <ChevronUp className="w-3 h-3 ml-0.5" /> : <ChevronDown className="w-3 h-3 ml-0.5" />}
            </button>
          </div>
        </div>

        {/* Main A / B Selector Buttons Row */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
          {/* Slot A Card */}
          <div
            onClick={() => handleSwitchSlot("A")}
            className={`col-span-1 md:col-span-5 p-3 sm:p-3.5 rounded-xl border transition-all cursor-pointer select-none relative ${
              abActiveSlot === "A"
                ? "bg-[#1a1c13] border-[#CCFF00] shadow-[0_0_15px_rgba(204,255,0,0.25)] ring-1 ring-[#CCFF00]"
                : "bg-[#0A0A0B] border-[#222226] hover:border-[#38383f] opacity-75 hover:opacity-100"
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <span
                  className={`w-7 h-7 rounded-lg font-mono font-black text-sm flex items-center justify-center border ${
                    abActiveSlot === "A"
                      ? "bg-[#CCFF00] text-black border-[#CCFF00] shadow-[0_0_10px_rgba(204,255,0,0.4)]"
                      : "bg-[#1D1D21] text-gray-400 border-[#333338]"
                  }`}
                >
                  A
                </span>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-white tracking-wide truncate max-w-[150px] sm:max-w-[190px]">
                      {slotA.name}
                    </span>
                    {abActiveSlot === "A" && (
                      <span className="px-1.5 py-0.2 rounded bg-[#CCFF00] text-black font-mono text-[9px] font-black uppercase">
                        ACTIVE
                      </span>
                    )}
                  </div>
                  <p className="text-[10px] text-gray-400 font-mono mt-0.5 truncate">
                    {slotA.params.ampModel} • Gain {slotA.params.gain.toFixed(1)} • {slotA.params.cabModel.split(" ")[0]}
                  </p>
                </div>
              </div>

              <div className="text-right">
                <span className="text-[9px] font-mono text-gray-500 block">Shift+A</span>
                <span className={`text-[10px] font-mono font-bold ${slotA.params.driveEnabled ? "text-[#CCFF00]" : "text-gray-500"}`}>
                  {slotA.params.driveEnabled ? "TS9 ON" : "TS9 OFF"}
                </span>
              </div>
            </div>
          </div>

          {/* Center A/B Toggle Master Button */}
          <div className="col-span-1 md:col-span-2 flex flex-col items-center justify-center">
            <button
              id="btn-ab-toggle"
              onClick={handleToggleAB}
              className="w-full py-2.5 px-3 rounded-xl bg-gradient-to-r from-[#1E1E22] via-[#282830] to-[#1E1E22] hover:from-[#25252a] hover:to-[#25252a] text-white border border-[#3A3A42] hover:border-[#CCFF00] transition-all shadow-xl flex items-center justify-center gap-2 group cursor-pointer"
              title="Instantly toggle between Tone Slot A and Tone Slot B (Shortcut: Shift+A or Shift+B)"
            >
              <span
                className={`font-mono font-black text-xs px-2 py-0.5 rounded transition-all ${
                  abActiveSlot === "A"
                    ? "bg-[#CCFF00] text-black shadow-[0_0_8px_rgba(204,255,0,0.5)] scale-105"
                    : "bg-[#141416] text-gray-400"
                }`}
              >
                A
              </span>
              <ArrowLeftRight className="w-3.5 h-3.5 text-[#CCFF00] group-hover:rotate-180 transition-transform duration-300" />
              <span
                className={`font-mono font-black text-xs px-2 py-0.5 rounded transition-all ${
                  abActiveSlot === "B"
                    ? "bg-[#CCFF00] text-black shadow-[0_0_8px_rgba(204,255,0,0.5)] scale-105"
                    : "bg-[#141416] text-gray-400"
                }`}
              >
                B
              </span>
            </button>
            <span className="text-[9px] font-mono text-gray-500 mt-1 uppercase tracking-widest">
              Shift+A / Shift+B
            </span>
          </div>

          {/* Slot B Card */}
          <div
            onClick={() => handleSwitchSlot("B")}
            className={`col-span-1 md:col-span-5 p-3 sm:p-3.5 rounded-xl border transition-all cursor-pointer select-none relative ${
              abActiveSlot === "B"
                ? "bg-[#1a1c13] border-[#CCFF00] shadow-[0_0_15px_rgba(204,255,0,0.25)] ring-1 ring-[#CCFF00]"
                : "bg-[#0A0A0B] border-[#222226] hover:border-[#38383f] opacity-75 hover:opacity-100"
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <span
                  className={`w-7 h-7 rounded-lg font-mono font-black text-sm flex items-center justify-center border ${
                    abActiveSlot === "B"
                      ? "bg-[#CCFF00] text-black border-[#CCFF00] shadow-[0_0_10px_rgba(204,255,0,0.4)]"
                      : "bg-[#1D1D21] text-gray-400 border-[#333338]"
                  }`}
                >
                  B
                </span>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-white tracking-wide truncate max-w-[150px] sm:max-w-[190px]">
                      {slotB.name}
                    </span>
                    {abActiveSlot === "B" && (
                      <span className="px-1.5 py-0.2 rounded bg-[#CCFF00] text-black font-mono text-[9px] font-black uppercase">
                        ACTIVE
                      </span>
                    )}
                  </div>
                  <p className="text-[10px] text-gray-400 font-mono mt-0.5 truncate">
                    {slotB.params.ampModel} • Gain {slotB.params.gain.toFixed(1)} • {slotB.params.cabModel.split(" ")[0]}
                  </p>
                </div>
              </div>

              <div className="text-right">
                <span className="text-[9px] font-mono text-gray-500 block">Shift+B</span>
                <span className={`text-[10px] font-mono font-bold ${slotB.params.driveEnabled ? "text-[#CCFF00]" : "text-gray-500"}`}>
                  {slotB.params.driveEnabled ? "TS9 ON" : "TS9 OFF"}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Parameter Differences Drawer */}
        {showDiffDrawer && (
          <div className="mt-3 pt-3 border-t border-[#222226] bg-[#0A0A0B] p-3.5 rounded-xl border border-[#222226]">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-mono font-bold text-gray-300 flex items-center gap-1.5">
                <GitCompare className="w-3.5 h-3.5 text-[#CCFF00]" />
                <span>SIDE-BY-SIDE PARAMETER DIFFERENCES ({parameterDifferences.length})</span>
              </span>
              <button
                onClick={() => setShowDiffDrawer(false)}
                className="text-xs font-mono text-gray-500 hover:text-white cursor-pointer"
              >
                Close
              </button>
            </div>

            {parameterDifferences.length > 0 ? (
              <div className="overflow-x-auto max-h-52 scrollbar-thin">
                <table className="w-full text-left font-mono text-[11px]">
                  <thead>
                    <tr className="border-b border-[#222226] text-gray-500 text-[10px]">
                      <th className="pb-1.5 font-bold uppercase">Section</th>
                      <th className="pb-1.5 font-bold uppercase">Parameter</th>
                      <th className={`pb-1.5 font-bold uppercase ${abActiveSlot === "A" ? "text-[#CCFF00]" : ""}`}>Slot A</th>
                      <th className={`pb-1.5 font-bold uppercase ${abActiveSlot === "B" ? "text-[#CCFF00]" : ""}`}>Slot B</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#1D1D21]">
                    {parameterDifferences.map((d, i) => (
                      <tr key={i} className="hover:bg-[#141416]/50">
                        <td className="py-1 text-gray-400 text-[10px]">{d.category}</td>
                        <td className="py-1 text-gray-200 font-semibold">{d.paramName}</td>
                        <td className={`py-1 ${abActiveSlot === "A" ? "text-[#CCFF00] font-bold" : "text-gray-300"}`}>
                          {d.valA}
                        </td>
                        <td className={`py-1 ${abActiveSlot === "B" ? "text-[#CCFF00] font-bold" : "text-gray-300"}`}>
                          {d.valB}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-xs font-mono text-gray-500 text-center py-2">
                Slot A and Slot B parameters are currently identical. Tweak any knob or pedal to compare differences!
              </p>
            )}
          </div>
        )}
      </div>

      {/* Preset Selector Bento Grid with Categorical Filtering */}
      <div className="bg-[#141416] border border-[#222226] rounded-2xl p-4 sm:p-5 shadow-2xl space-y-4">
        {/* Preset Header & Actions */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#222226]">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-[#CCFF00]" />
            <h3 className="text-xs sm:text-sm font-bold text-white font-mono uppercase tracking-widest">
              AMP RIG PRESET LIBRARY ({presets.length})
            </h3>
          </div>

          <div className="flex items-center flex-wrap gap-2">
            {/* Hover Audition Toggle */}
            <button
              type="button"
              onClick={() => {
                if (hoverAuditionEnabled) {
                  audioEngine.stopPresetAudition();
                  setAuditioningPresetId(null);
                }
                setHoverAuditionEnabled(!hoverAuditionEnabled);
              }}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-mono font-bold flex items-center gap-1.5 transition-all border cursor-pointer ${
                hoverAuditionEnabled
                  ? "bg-[#CCFF00]/15 text-[#CCFF00] border-[#CCFF00]/60 shadow-[0_0_12px_rgba(204,255,0,0.2)]"
                  : "bg-[#1D1D21] text-gray-400 border-[#333338] hover:text-gray-200"
              }`}
              title="Toggle automatic high-fidelity sample audio playback when hovering over presets"
            >
              <Headphones className="w-3.5 h-3.5" />
              <span>
                Audition on Hover: <strong className={hoverAuditionEnabled ? "text-[#CCFF00]" : "text-gray-500"}>{hoverAuditionEnabled ? "ON" : "OFF"}</strong>
              </span>
            </button>

            <button
              onClick={() => setShowSaveModal(true)}
              className="px-3 py-1.5 rounded-lg bg-[#1D1D21] hover:bg-[#25252b] text-gray-200 text-xs font-mono font-bold flex items-center gap-1.5 transition-all border border-[#333338] cursor-pointer"
            >
              <Save className="w-3.5 h-3.5" /> Save Preset
            </button>
            <button
              onClick={handleExportPresetsJson}
              className="p-1.5 rounded-lg bg-[#1D1D21] hover:bg-[#25252b] text-gray-300 transition-all border border-[#333338] cursor-pointer"
              title="Export Presets JSON"
            >
              <Download className="w-3.5 h-3.5" />
            </button>
            <label
              className="p-1.5 rounded-lg bg-[#1D1D21] hover:bg-[#25252b] text-gray-300 transition-all border border-[#333338] cursor-pointer"
              title="Import Presets JSON"
            >
              <Upload className="w-3.5 h-3.5" />
              <input type="file" accept=".json" onChange={handleImportPresetsJson} className="hidden" />
            </label>
          </div>
        </div>

        {/* Categorical Filtering Tabs, Sort & Search Toolbar */}
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
          {/* Category Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            {(["All", "High-Gain", "Clean", "Experimental", "Custom"] as PresetCategory[]).map((cat) => {
              const isActive = selectedCategory === cat;
              const count = categoryCounts[cat] || 0;
              return (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap border ${
                    isActive
                      ? "bg-[#CCFF00] text-black border-[#CCFF00] shadow-[0_0_12px_rgba(204,255,0,0.35)]"
                      : "bg-[#0A0A0B] text-gray-400 border-[#222226] hover:text-white hover:border-[#333338]"
                  }`}
                >
                  {cat === "High-Gain" && <Flame className="w-3 h-3" />}
                  {cat === "Clean" && <Sparkles className="w-3 h-3" />}
                  {cat === "Experimental" && <Zap className="w-3 h-3" />}
                  {cat === "Custom" && <Layers className="w-3 h-3" />}
                  {cat}
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded-md ${
                      isActive ? "bg-black/20 text-black font-black" : "bg-[#141416] text-gray-500"
                    }`}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Right Tools: Sort Mode & Search Filter Input */}
          <div className="flex items-center gap-2 flex-wrap md:flex-nowrap">
            {/* Sort Mode Selector */}
            <div className="flex items-center bg-[#0A0A0B] border border-[#222226] rounded-xl p-0.5 text-[11px] font-mono shrink-0">
              <button
                type="button"
                onClick={() => setSortBy("default")}
                className={`px-2 py-1 rounded-lg transition-colors cursor-pointer ${
                  sortBy === "default"
                    ? "bg-[#1D1D21] text-[#CCFF00] font-bold"
                    : "text-gray-400 hover:text-gray-200"
                }`}
                title="Default Preset Order"
              >
                Default
              </button>
              <button
                type="button"
                onClick={() => setSortBy("most-played")}
                className={`px-2 py-1 rounded-lg transition-colors flex items-center gap-1 cursor-pointer ${
                  sortBy === "most-played"
                    ? "bg-[#1D1D21] text-[#CCFF00] font-bold"
                    : "text-gray-400 hover:text-gray-200"
                }`}
                title="Sort by Times Played"
              >
                <Activity className="w-3 h-3" />
                <span>Most Played</span>
              </button>
              <button
                type="button"
                onClick={() => setSortBy("recently-used")}
                className={`px-2 py-1 rounded-lg transition-colors flex items-center gap-1 cursor-pointer ${
                  sortBy === "recently-used"
                    ? "bg-[#1D1D21] text-[#CCFF00] font-bold"
                    : "text-gray-400 hover:text-gray-200"
                }`}
                title="Sort by Recently Used"
              >
                <Clock className="w-3 h-3" />
                <span>Recent</span>
              </button>
            </div>

            {/* Search Filter Input */}
            <div className="relative flex-1 min-w-[180px] md:w-56">
              <Search className="w-3.5 h-3.5 text-gray-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search tone, genre, amp..."
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

        {/* Preset Cards Grid (Filtered) */}
        {filteredPresets.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2.5">
            {filteredPresets.map((preset) => {
              const isSelected = currentPresetId === preset.id;
              const isAuditioning = auditioningPresetId === preset.id;
              const cat = preset.category || (preset.id.startsWith("custom-") ? "Custom" : "High-Gain");
              const usage = usageStats[preset.id] || { count: 0, lastUsed: 0 };
              return (
                <div
                  key={preset.id}
                  id={`preset-card-${preset.id}`}
                  onMouseEnter={() => handlePresetMouseEnter(preset)}
                  onMouseLeave={() => handlePresetMouseLeave(preset)}
                  onClick={() => handleSelectPreset(preset)}
                  className={`p-3 rounded-xl border text-left transition-all relative overflow-hidden flex flex-col justify-between cursor-pointer group select-none ${
                    isAuditioning
                      ? "bg-[#1F1F24] border-[#CCFF00] shadow-[0_0_20px_rgba(204,255,0,0.35)] ring-2 ring-[#CCFF00]"
                      : isSelected
                      ? "bg-[#1D1D21] border-[#CCFF00] shadow-[0_0_15px_rgba(204,255,0,0.25)] ring-1 ring-[#CCFF00]"
                      : "bg-[#0A0A0B] border-[#222226] hover:border-[#44444c] hover:bg-[#141416]"
                  }`}
                >
                  <div>
                    {/* Top Row: Category Tag, Genre, Audition Equalizer / Button */}
                    <div className="flex items-center justify-between gap-1">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span
                          className={`text-[9px] font-mono uppercase px-1.5 py-0.5 rounded font-bold ${
                            isAuditioning || isSelected
                              ? "bg-[#CCFF00] text-black"
                              : cat === "Clean"
                              ? "bg-sky-950/80 text-sky-400 border border-sky-800/40"
                              : cat === "Experimental"
                              ? "bg-purple-950/80 text-purple-400 border border-purple-800/40"
                              : "bg-[#141416] text-gray-400 border border-[#333338]"
                          }`}
                        >
                          {cat}
                        </span>
                        <span className="text-[9px] font-mono text-gray-500 truncate max-w-[85px]">
                          {preset.subgenre}
                        </span>
                      </div>

                      {/* Audition Button & Visual Equalizer Indicator */}
                      <div className="flex items-center gap-1.5">
                        {/* Quick Slot Assign Buttons */}
                        <div className="flex items-center gap-0.5 bg-[#141416] p-0.5 rounded-lg border border-[#2b2b30]">
                          <button
                            type="button"
                            onClick={(e) => handleLoadPresetToSlot(e, preset, "A")}
                            className={`px-1.5 py-0.5 rounded text-[9px] font-mono font-bold transition-all cursor-pointer ${
                              slotA.presetId === preset.id
                                ? "bg-[#CCFF00] text-black font-black shadow-[0_0_6px_rgba(204,255,0,0.5)]"
                                : "text-gray-400 hover:text-white"
                            }`}
                            title={`Assign to Slot A (currently: ${slotA.name})`}
                          >
                            A
                          </button>
                          <button
                            type="button"
                            onClick={(e) => handleLoadPresetToSlot(e, preset, "B")}
                            className={`px-1.5 py-0.5 rounded text-[9px] font-mono font-bold transition-all cursor-pointer ${
                              slotB.presetId === preset.id
                                ? "bg-[#CCFF00] text-black font-black shadow-[0_0_6px_rgba(204,255,0,0.5)]"
                                : "text-gray-400 hover:text-white"
                            }`}
                            title={`Assign to Slot B (currently: ${slotB.name})`}
                          >
                            B
                          </button>
                        </div>

                        {isAuditioning && (
                          <div className="flex items-end gap-0.5 h-3.5 py-0.5">
                            <span className="w-0.5 bg-[#CCFF00] rounded-full h-full animate-bounce" />
                            <span className="w-0.5 bg-[#CCFF00] rounded-full h-2/3 animate-bounce [animation-delay:0.15s]" />
                            <span className="w-0.5 bg-[#CCFF00] rounded-full h-full animate-bounce [animation-delay:0.3s]" />
                            <span className="w-0.5 bg-[#CCFF00] rounded-full h-1/2 animate-bounce [animation-delay:0.45s]" />
                          </div>
                        )}

                        <button
                          type="button"
                          onClick={(e) => handleToggleAudition(e, preset)}
                          className={`p-1 rounded-lg border transition-all cursor-pointer ${
                            isAuditioning
                              ? "bg-[#CCFF00] text-black border-[#CCFF00] shadow-[0_0_8px_rgba(204,255,0,0.5)]"
                              : "bg-[#141416] text-gray-400 border-[#2b2b30] hover:text-[#CCFF00] hover:border-[#CCFF00]/60"
                          }`}
                          title={isAuditioning ? "Stop audio preview" : "Audition audio sample riff"}
                        >
                          {isAuditioning ? (
                            <Square className="w-3 h-3 fill-current" />
                          ) : (
                            <Volume2 className="w-3 h-3" />
                          )}
                        </button>

                        {isSelected && !isAuditioning && (
                          <span className="w-2 h-2 rounded-full bg-[#CCFF00] shadow-[0_0_6px_rgba(204,255,0,0.9)] animate-pulse shrink-0" />
                        )}
                      </div>
                    </div>

                    <h4 className="font-bold text-xs sm:text-sm font-mono text-gray-100 mt-2 line-clamp-1 group-hover:text-white flex items-center justify-between">
                      <span>{preset.name}</span>
                    </h4>
                    <p className="text-[11px] text-gray-400 mt-1 line-clamp-2 leading-relaxed">
                      {preset.description}
                    </p>
                  </div>

                  <div className="mt-2.5 pt-2 border-t border-[#222226] space-y-1.5">
                    {/* Amp Model & Gain */}
                    <div className="flex items-center justify-between text-[10px] font-mono">
                      <span className="text-gray-500 truncate max-w-[130px]">{preset.params.ampModel}</span>
                      {isAuditioning ? (
                        <span className="text-[#CCFF00] font-bold uppercase tracking-wider animate-pulse flex items-center gap-1">
                          <Radio className="w-2.5 h-2.5" /> Auditioning
                        </span>
                      ) : (
                        <span className="text-[#CCFF00] font-bold">Gain: {preset.params.gain.toFixed(1)}</span>
                      )}
                    </div>

                    {/* Usage Insights Bar: Last Used & Times Played */}
                    <div className="pt-1 border-t border-[#1a1a1e] flex items-center justify-between text-[9.5px] font-mono">
                      <div
                        className="flex items-center gap-1 text-gray-500"
                        title={
                          usage.lastUsed
                            ? `Last loaded: ${new Date(usage.lastUsed).toLocaleString()}`
                            : "Never loaded yet"
                        }
                      >
                        <Clock className="w-2.5 h-2.5 text-gray-500 shrink-0" />
                        <span className={isSelected ? "text-[#CCFF00] font-bold" : "text-gray-400"}>
                          {formatLastUsed(usage.lastUsed, isSelected)}
                        </span>
                      </div>

                      <div
                        className="flex items-center gap-1"
                        title={`Total times loaded: ${usage.count}`}
                      >
                        <Activity className={`w-2.5 h-2.5 shrink-0 ${usage.count > 0 ? "text-[#CCFF00]" : "text-gray-600"}`} />
                        <span className={usage.count > 0 ? "text-gray-300 font-semibold" : "text-gray-600"}>
                          {usage.count} {usage.count === 1 ? "play" : "plays"}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="py-8 text-center bg-[#0A0A0B] rounded-xl border border-[#222226] font-mono">
            <Filter className="w-6 h-6 text-gray-600 mx-auto mb-2" />
            <p className="text-xs text-gray-400">No presets matched "{searchQuery}" in category "{selectedCategory}".</p>
            <button
              onClick={() => {
                setSelectedCategory("All");
                setSearchQuery("");
              }}
              className="mt-2 text-xs text-[#CCFF00] hover:underline cursor-pointer"
            >
              Reset Filters
            </button>
          </div>
        )}
      </div>

      {/* Real-Time Spectral Frequency Analyzer & DSP Visualizer Widget */}
      <SpectralAnalyzer params={params} onTestRiff={handleTestRiff} />

      {/* Main Amp Head Chassis */}
      <div className="bg-gradient-to-b from-[#141416] via-[#0A0A0B] to-[#141416] border-2 border-[#222226] rounded-3xl p-5 sm:p-7 shadow-2xl relative overflow-hidden">
        {/* Metal corners */}
        <div className="absolute top-2 left-2 w-6 h-6 border-t-2 border-l-2 border-[#333338] pointer-events-none" />
        <div className="absolute top-2 right-2 w-6 h-6 border-t-2 border-r-2 border-[#333338] pointer-events-none" />
        <div className="absolute bottom-2 left-2 w-6 h-6 border-b-2 border-l-2 border-[#333338] pointer-events-none" />
        <div className="absolute bottom-2 right-2 w-6 h-6 border-b-2 border-r-2 border-[#333338] pointer-events-none" />

        {/* Amp Logo & Glowing Vacuum Tubes Grid */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-[#222226]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#0A0A0B] border border-[#222226] flex items-center justify-center text-[#CCFF00] shadow-[0_0_15px_rgba(204,255,0,0.25)]">
              <Zap className="w-6 h-6 fill-current" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-xl sm:text-2xl font-black font-mono tracking-wider text-white">
                  {params.ampModel.toUpperCase()}
                </h3>
                <span className="px-2 py-0.5 rounded bg-[#1D1D21] text-[#CCFF00] font-mono text-[10px] font-bold border border-[#333338]">
                  TUBE STAGE
                </span>
                {/* Tactical Chassis A/B Switch */}
                <div className="flex items-center gap-1 bg-[#0A0A0B] p-0.5 rounded-lg border border-[#333338] ml-2">
                  <span className="text-[9px] font-mono text-gray-500 font-bold px-1 uppercase">A/B:</span>
                  <button
                    onClick={() => handleSwitchSlot("A")}
                    className={`px-2 py-0.5 rounded text-[10px] font-mono font-black transition-all cursor-pointer ${
                      abActiveSlot === "A"
                        ? "bg-[#CCFF00] text-black shadow-[0_0_8px_rgba(204,255,0,0.5)]"
                        : "text-gray-400 hover:text-white"
                    }`}
                  >
                    A
                  </button>
                  <button
                    onClick={() => handleSwitchSlot("B")}
                    className={`px-2 py-0.5 rounded text-[10px] font-mono font-black transition-all cursor-pointer ${
                      abActiveSlot === "B"
                        ? "bg-[#CCFF00] text-black shadow-[0_0_8px_rgba(204,255,0,0.5)]"
                        : "text-gray-400 hover:text-white"
                    }`}
                  >
                    B
                  </button>
                </div>
              </div>
              <p className="text-xs text-gray-400 font-mono mt-0.5">
                Class A/B Push-Pull Tube Power Stage • Drop C Low Frequency Tuned
              </p>
            </div>
          </div>

          {/* Glowing Vacuum Tube Emulation Window */}
          <div className="flex items-center gap-3 bg-[#0A0A0B] px-4 py-2 rounded-xl border border-[#222226] shadow-inner">
            <span className="text-[9px] font-mono text-gray-500 uppercase font-bold tracking-widest">TUBES:</span>
            <div className="flex items-center gap-2">
              {[1, 2, 3, 4].map((tube) => {
                const glowIntensity = 0.4 + (params.gain / 10) * 0.6;
                return (
                  <div key={tube} className="flex flex-col items-center">
                    <div
                      className="w-3.5 h-7 rounded-t-full bg-gradient-to-t from-orange-600 via-amber-400 to-yellow-200 border border-orange-500/60 shadow-lg transition-all duration-300"
                      style={{
                        opacity: glowIntensity,
                        boxShadow: `0 0 ${10 * glowIntensity}px rgba(204, 255, 0, ${glowIntensity * 0.7})`,
                      }}
                    />
                    <span className="text-[8px] text-gray-500 font-mono mt-0.5">12AX7</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Amp Head Model Switcher */}
        <div className="mt-4 flex items-center gap-2 flex-wrap text-xs">
          <span className="font-mono text-gray-500 uppercase text-[10px] font-bold tracking-widest">AMP MODEL:</span>
          {(
            [
              "5150 High-Gain",
              "Mesa Dual Rectifier",
              "Diezel VH4",
              "ENGL Savage",
              "Marshall JCM800",
              "HM-2 Chainsaw",
            ] as const
          ).map((m) => (
            <button
              key={m}
              onClick={() => handleParamChange("ampModel", m)}
              className={`px-3 py-1 rounded-lg font-mono text-xs font-bold transition-all border cursor-pointer ${
                params.ampModel === m
                  ? "bg-[#CCFF00] text-black border-[#CCFF00] shadow-[0_0_10px_rgba(204,255,0,0.4)]"
                  : "bg-[#1D1D21] hover:bg-[#25252b] text-gray-300 border-[#333338]"
              }`}
            >
              {m}
            </button>
          ))}
        </div>

        {/* Amp Head Main Knobs Row */}
        <div className="mt-6 p-5 rounded-2xl bg-[#0A0A0B] border border-[#222226] shadow-inner grid grid-cols-3 sm:grid-cols-4 md:grid-cols-7 gap-4">
          <Knob
            label="GAIN"
            value={params.gain}
            min={0}
            max={10}
            color="red"
            size="lg"
            onChange={(v) => handleParamChange("gain", v)}
          />
          <Knob
            label="BASS"
            value={params.bass}
            min={0}
            max={10}
            color="lime"
            size="lg"
            onChange={(v) => handleParamChange("bass", v)}
          />
          <Knob
            label="MIDDLE"
            value={params.middle}
            min={0}
            max={10}
            color="yellow"
            size="lg"
            onChange={(v) => handleParamChange("middle", v)}
          />
          <Knob
            label="TREBLE"
            value={params.treble}
            min={0}
            max={10}
            color="orange"
            size="lg"
            onChange={(v) => handleParamChange("treble", v)}
          />
          <Knob
            label="PRESENCE"
            value={params.presence}
            min={0}
            max={10}
            color="cyan"
            size="lg"
            onChange={(v) => handleParamChange("presence", v)}
          />
          <Knob
            label="RESONANCE"
            value={params.resonance}
            min={0}
            max={10}
            color="purple"
            size="lg"
            onChange={(v) => handleParamChange("resonance", v)}
          />
          <Knob
            label="MASTER"
            value={params.master}
            min={0}
            max={10}
            color="emerald"
            size="lg"
            onChange={(v) => handleParamChange("master", v)}
          />
        </div>

        {/* Chassis Gain-Staging Normalizer Bar */}
        <div className="mt-4 pt-3 border-t border-[#222226] flex flex-col sm:flex-row items-center justify-between gap-3 px-2">
          <div className="flex items-center gap-2">
            <Gauge className="w-4 h-4 text-[#CCFF00]" />
            <div className="flex flex-col">
              <span className="text-[11px] font-mono font-bold text-gray-200 uppercase tracking-wide">
                PRESET GAIN-STAGING & LEVEL NORMALIZATION
              </span>
              <span className="text-[10px] font-mono text-gray-400">
                Calibrates output volume before the studio limiter to eliminate clipping and jumps during live preset switching.
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3 bg-[#0A0A0B] px-3.5 py-1.5 rounded-xl border border-[#222226] shrink-0">
            <span className="text-[10px] font-mono font-bold text-gray-400">TRIM:</span>
            <input
              type="range"
              min="-12"
              max="12"
              step="0.5"
              value={params.gainStageTrim !== undefined ? params.gainStageTrim : 0}
              onChange={(e) => handleParamChange("gainStageTrim", parseFloat(e.target.value))}
              className="w-28 accent-[#CCFF00] h-1.5 bg-[#1D1D21] rounded-lg cursor-pointer"
            />
            <span
              className={`font-mono text-xs font-bold min-w-[55px] text-right ${
                (params.gainStageTrim || 0) > 0
                  ? "text-amber-400"
                  : (params.gainStageTrim || 0) < 0
                  ? "text-sky-400"
                  : "text-[#CCFF00]"
              }`}
            >
              {(params.gainStageTrim || 0) >= 0 ? "+" : ""}
              {(params.gainStageTrim || 0).toFixed(1)} dB
            </span>
            <button
              type="button"
              onClick={() => handleParamChange("gainStageTrim", 0)}
              className="px-2 py-0.5 rounded text-[9.5px] font-mono font-bold bg-[#1D1D21] hover:bg-[#25252b] text-gray-300 hover:text-white border border-[#333338] transition-colors cursor-pointer"
            >
              Reset
            </button>
          </div>
        </div>
      </div>

      {/* Pre-FX & Post-FX Stompboxes and Cabinet Simulator Grid */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
        {/* PRE-FX PEDALS: Gate & Tube Screamer */}
        <div className="md:col-span-4 space-y-4">
          {/* Noise Gate Pedal */}
          <div className="bg-[#141416] border border-[#222226] rounded-2xl p-4 shadow-xl flex flex-col justify-between">
            <div className="flex items-center justify-between pb-3 border-b border-[#222226]">
              <div className="flex items-center gap-2">
                <span
                  className={`w-2.5 h-2.5 rounded-full ${
                    params.gateEnabled ? "bg-[#CCFF00] shadow-[0_0_8px_rgba(204,255,0,0.9)]" : "bg-gray-700"
                  }`}
                />
                <h4 className="font-mono text-xs font-bold text-white uppercase tracking-wider">PRECISION NOISE GATE</h4>
              </div>
              <button
                onClick={() => handleParamChange("gateEnabled", !params.gateEnabled)}
                className={`px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold transition-all border cursor-pointer ${
                  params.gateEnabled
                    ? "bg-[#CCFF00] text-black border-[#CCFF00] shadow-sm"
                    : "bg-[#1D1D21] text-gray-400 border-[#333338]"
                }`}
              >
                {params.gateEnabled ? "ON" : "BYPASS"}
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4 mt-3">
              <Knob
                label="THRESH"
                value={params.gateThreshold}
                min={-80}
                max={-20}
                unit="dB"
                color="lime"
                size="md"
                onChange={(v) => handleParamChange("gateThreshold", v)}
              />
              <Knob
                label="RELEASE"
                value={params.gateRelease * 1000}
                min={10}
                max={200}
                unit="ms"
                color="cyan"
                size="md"
                onChange={(v) => handleParamChange("gateRelease", v / 1000)}
              />
            </div>
          </div>

          {/* Tube Screamer TS9 Overdrive Pedal */}
          <div className="bg-[#141416] border border-[#222226] rounded-2xl p-4 shadow-xl flex flex-col justify-between">
            <div className="flex items-center justify-between pb-3 border-b border-[#222226]">
              <div className="flex items-center gap-2">
                <span
                  className={`w-2.5 h-2.5 rounded-full ${
                    params.driveEnabled ? "bg-[#CCFF00] shadow-[0_0_8px_rgba(204,255,0,0.9)]" : "bg-gray-700"
                  }`}
                />
                <h4 className="font-mono text-xs font-bold text-[#CCFF00] uppercase tracking-wider">TS9 OVERDRIVE BOOST</h4>
              </div>
              <button
                onClick={() => handleParamChange("driveEnabled", !params.driveEnabled)}
                className={`px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold transition-all border cursor-pointer ${
                  params.driveEnabled
                    ? "bg-[#CCFF00] text-black border-[#CCFF00] shadow-md"
                    : "bg-[#1D1D21] text-gray-400 border-[#333338]"
                }`}
              >
                {params.driveEnabled ? "ENGAGED" : "BYPASS"}
              </button>
            </div>

            <div className="grid grid-cols-3 gap-2 mt-3">
              <Knob
                label="DRIVE"
                value={params.driveGain}
                min={0}
                max={10}
                color="lime"
                size="md"
                onChange={(v) => handleParamChange("driveGain", v)}
              />
              <Knob
                label="TONE"
                value={params.driveTone}
                min={0}
                max={10}
                color="yellow"
                size="md"
                onChange={(e) => handleParamChange("driveTone", e)}
              />
              <Knob
                label="LEVEL"
                value={params.driveLevel}
                min={0}
                max={10}
                color="orange"
                size="md"
                onChange={(e) => handleParamChange("driveLevel", e)}
              />
            </div>

            <div className="mt-3 pt-2 border-t border-[#222226] flex items-center justify-between">
              <span className="text-[11px] font-mono text-gray-400">720Hz Tight Mid Boost:</span>
              <button
                onClick={() => handleParamChange("driveMidBoost", !params.driveMidBoost)}
                className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold border cursor-pointer ${
                  params.driveMidBoost
                    ? "bg-[#CCFF00] text-black border-[#CCFF00]"
                    : "bg-[#1D1D21] text-gray-400 border-[#333338]"
                }`}
              >
                {params.driveMidBoost ? "ACTIVE" : "OFF"}
              </button>
            </div>
          </div>
        </div>

        {/* CABINET & MIC SIMULATOR */}
        <div className="md:col-span-4 bg-[#141416] border border-[#222226] rounded-2xl p-4 shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-[#222226]">
              <div className="flex items-center gap-2">
                <Sliders className="w-4 h-4 text-[#CCFF00]" />
                <h4 className="font-mono text-xs font-bold text-white uppercase tracking-wider">4x12 CAB & MIC SIMULATOR</h4>
              </div>
              <span className="text-[10px] font-mono text-[#CCFF00] font-bold">IMPULSE DSP</span>
            </div>

            <div className="space-y-3 mt-3">
              <div>
                <label className="block text-[10px] font-mono font-bold uppercase tracking-widest text-gray-500 mb-1">
                  CABINET IMPULSE:
                </label>
                <select
                  value={params.cabModel}
                  onChange={(e) => handleParamChange("cabModel", e.target.value as any)}
                  className="w-full bg-[#0A0A0B] border border-[#222226] rounded-xl px-2.5 py-2 text-xs text-gray-100 font-mono focus:border-[#CCFF00] outline-none cursor-pointer"
                >
                  <option value="Mesa OS 4x12 V30">Mesa Boogie Oversized 4x12 (V30s)</option>
                  <option value="Marshall 1960A Greenback">Marshall 1960A (Celestion Greenbacks)</option>
                  <option value="ENGL Pro V30">ENGL Pro Straight 4x12 (V30s)</option>
                  <option value="Peavey 5150 Sheffield">Peavey 5150 Sheffield 1200 4x12</option>
                  <option value="Orange PPC412">Orange PPC412 Heavy Celestion</option>
                  <option value="Diezel 4x12">Diezel Front Loaded 4x12</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-mono font-bold uppercase tracking-widest text-gray-500 mb-1">
                  MICROPHONE:
                </label>
                <select
                  value={params.micType}
                  onChange={(e) => handleParamChange("micType", e.target.value as any)}
                  className="w-full bg-[#0A0A0B] border border-[#222226] rounded-xl px-2.5 py-2 text-xs text-gray-100 font-mono focus:border-[#CCFF00] outline-none cursor-pointer"
                >
                  <option value="Shure SM57 Dynamic">Shure SM57 Dynamic (Aggressive Cut)</option>
                  <option value="Royer R-121 Ribbon">Royer R-121 Ribbon (Warm Low End)</option>
                  <option value="Sennheiser MD421">Sennheiser MD421 (Punchy Mids)</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-mono font-bold uppercase tracking-widest text-gray-500 mb-1">
                  MIC PLACEMENT:
                </label>
                <select
                  value={params.micPlacement}
                  onChange={(e) => handleParamChange("micPlacement", e.target.value as any)}
                  className="w-full bg-[#0A0A0B] border border-[#222226] rounded-xl px-2.5 py-2 text-xs text-gray-100 font-mono focus:border-[#CCFF00] outline-none cursor-pointer"
                >
                  <option value="Center">Center (Bright / Direct)</option>
                  <option value="Cap-Edge">Cap-Edge (Balanced Sweet Spot)</option>
                  <option value="Cone">Cone (Dark / Thick Body)</option>
                  <option value="Off-Axis">45° Off-Axis (Smooth Highs)</option>
                </select>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-[#222226] flex justify-center">
            <Knob
              label="ROOM AIR"
              value={params.cabAir}
              min={0}
              max={10}
              color="cyan"
              size="md"
              onChange={(v) => handleParamChange("cabAir", v)}
            />
          </div>
        </div>

        {/* POST-FX: 5-Band Metal Graphic EQ & Delay/Reverb */}
        <div className="md:col-span-4 space-y-4">
          {/* 5-Band Graphic EQ */}
          <div className="bg-[#141416] border border-[#222226] rounded-2xl p-4 shadow-xl">
            <div className="flex items-center justify-between pb-3 border-b border-[#222226]">
              <div className="flex items-center gap-2">
                <span
                  className={`w-2.5 h-2.5 rounded-full ${
                    params.eqEnabled ? "bg-[#CCFF00] shadow-[0_0_8px_rgba(204,255,0,0.9)]" : "bg-gray-700"
                  }`}
                />
                <h4 className="font-mono text-xs font-bold text-white uppercase tracking-wider">5-BAND GRAPHIC EQ</h4>
              </div>
              <button
                onClick={() => handleParamChange("eqEnabled", !params.eqEnabled)}
                className={`px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold transition-all border cursor-pointer ${
                  params.eqEnabled
                    ? "bg-[#CCFF00] text-black border-[#CCFF00]"
                    : "bg-[#1D1D21] text-gray-400 border-[#333338]"
                }`}
              >
                {params.eqEnabled ? "ACTIVE" : "BYPASS"}
              </button>
            </div>

            <div className="grid grid-cols-5 gap-1.5 mt-3">
              <Knob
                label="80Hz"
                value={params.eq80Hz}
                min={-10}
                max={10}
                color="lime"
                size="sm"
                onChange={(v) => handleParamChange("eq80Hz", v)}
              />
              <Knob
                label="250Hz"
                value={params.eq250Hz}
                min={-10}
                max={10}
                color="yellow"
                size="sm"
                onChange={(v) => handleParamChange("eq250Hz", v)}
              />
              <Knob
                label="750Hz"
                value={params.eq750Hz}
                min={-10}
                max={10}
                color="red"
                size="sm"
                onChange={(v) => handleParamChange("eq750Hz", v)}
              />
              <Knob
                label="2.2kHz"
                value={params.eq2200Hz}
                min={-10}
                max={10}
                color="cyan"
                size="sm"
                onChange={(v) => handleParamChange("eq2200Hz", v)}
              />
              <Knob
                label="6kHz"
                value={params.eq6000Hz}
                min={-10}
                max={10}
                color="purple"
                size="sm"
                onChange={(v) => handleParamChange("eq6000Hz", v)}
              />
            </div>
          </div>

          {/* Time-Based FX: Delay & Reverb */}
          <div className="bg-[#141416] border border-[#222226] rounded-2xl p-4 shadow-xl">
            <div className="flex items-center justify-between pb-3 border-b border-[#222226]">
              <div className="flex items-center gap-2">
                <span
                  className={`w-2.5 h-2.5 rounded-full ${
                    params.delayEnabled || params.reverbEnabled
                      ? "bg-[#CCFF00] shadow-[0_0_8px_rgba(204,255,0,0.9)]"
                      : "bg-gray-700"
                  }`}
                />
                <h4 className="font-mono text-xs font-bold text-white uppercase tracking-wider">DELAY & REVERB SPACE</h4>
              </div>
            </div>

            <div className="grid grid-cols-4 gap-2 mt-3">
              <Knob
                label="DLY TIME"
                value={params.delayTime}
                min={50}
                max={1000}
                unit="ms"
                color="cyan"
                size="sm"
                onChange={(v) => handleParamChange("delayTime", v)}
              />
              <Knob
                label="DLY MIX"
                value={params.delayMix}
                min={0}
                max={10}
                color="cyan"
                size="sm"
                onChange={(v) => {
                  handleParamChange("delayMix", v);
                  handleParamChange("delayEnabled", v > 0);
                }}
              />
              <Knob
                label="REV DECAY"
                value={params.reverbDecay}
                min={0.5}
                max={8}
                unit="s"
                color="purple"
                size="sm"
                onChange={(v) => handleParamChange("reverbDecay", v)}
              />
              <Knob
                label="REV MIX"
                value={params.reverbMix}
                min={0}
                max={10}
                color="purple"
                size="sm"
                onChange={(v) => {
                  handleParamChange("reverbMix", v);
                  handleParamChange("reverbEnabled", v > 0);
                }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Save Custom Preset Modal */}
      {showSaveModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#141416] border border-[#222226] rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <h3 className="text-base font-bold font-mono text-white flex items-center gap-2">
              <Save className="w-5 h-5 text-[#CCFF00]" /> Save Custom Metal Rig Preset
            </h3>
            <p className="text-xs text-gray-400">
              Save your dialed rig settings (amp head, overdrive, gate, IR, and EQ) to your local preset library.
            </p>
            <input
              type="text"
              value={customPresetName}
              onChange={(e) => setCustomPresetName(e.target.value)}
              placeholder="e.g. My Heavy 0-0-0 Destroyer"
              className="w-full bg-[#0A0A0B] border border-[#222226] rounded-xl px-3 py-2 text-sm text-gray-100 font-mono focus:border-[#CCFF00] outline-none"
            />
            <div>
              <label className="text-[11px] font-mono text-gray-400 block mb-1.5 uppercase font-bold">Preset Category</label>
              <div className="grid grid-cols-3 gap-2">
                {(["High-Gain", "Clean", "Experimental"] as const).map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setCustomPresetCategory(cat)}
                    className={`py-1.5 px-2 rounded-lg text-xs font-mono font-bold transition-all border cursor-pointer ${
                      customPresetCategory === cat
                        ? "bg-[#CCFF00] text-black border-[#CCFF00]"
                        : "bg-[#0A0A0B] text-gray-400 border-[#222226] hover:border-[#333338]"
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setShowSaveModal(false)}
                className="px-4 py-2 rounded-xl bg-[#1D1D21] text-gray-300 text-xs font-mono hover:bg-[#25252b] border border-[#333338] cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveCustomPreset}
                disabled={!customPresetName.trim()}
                className="px-5 py-2 rounded-xl bg-[#CCFF00] hover:bg-[#b8e600] text-black font-bold text-xs font-mono disabled:opacity-50 cursor-pointer"
              >
                Save Preset
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Floating A/B Switch Toast */}
      {abToastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#141416] border border-[#CCFF00] text-white px-4 py-2.5 rounded-xl shadow-[0_0_20px_rgba(204,255,0,0.3)] font-mono text-xs flex items-center gap-2 animate-in fade-in slide-in-from-bottom-3 duration-200">
          <Zap className="w-4 h-4 text-[#CCFF00] shrink-0" />
          <span>{abToastMessage}</span>
        </div>
      )}
    </div>
  );
};
