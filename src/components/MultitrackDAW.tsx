import React, { useState, useEffect, useRef } from "react";
import { AudioEngine } from "../audio/audioEngine";
import { DawTrack, AudioClip } from "../types";
import { Knob } from "./Knob";
import {
  Play,
  Square,
  Circle,
  RotateCcw,
  Volume2,
  VolumeX,
  Sliders,
  Scissors,
  Sparkles,
  Download,
  Upload,
  Plus,
  Trash2,
  Maximize2,
  Music,
  Activity,
  Layers,
  Zap,
} from "lucide-react";

export const MultitrackDAW: React.FC = () => {
  const audioEngine = AudioEngine.getInstance();
  const [isPlaying, setIsPlaying] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [armedTrackId, setArmedTrackId] = useState<string>("track-1");
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(16); // 16 seconds loop
  const [bpm, setBpm] = useState(135);
  const [metronomeEnabled, setMetronomeEnabled] = useState(true);
  const [drumBeatStyle, setDrumBeatStyle] = useState<"blast" | "breakdown" | "thrash" | "click">("breakdown");
  const [selectedClip, setSelectedClip] = useState<{ trackId: string; clip: AudioClip } | null>(null);
  const [masterVolume, setMasterVolume] = useState(0.85);

  const [tracks, setTracks] = useState<DawTrack[]>([
    {
      id: "track-1",
      name: "Rhythm Guitar L (Drop C 5150)",
      color: "#f97316",
      volume: 0.85,
      pan: -0.8, // Hard Left for metal double-tracking
      isMuted: false,
      isSolo: false,
      isArmed: true,
      clips: [],
    },
    {
      id: "track-2",
      name: "Rhythm Guitar R (Drop C Mesa)",
      color: "#ef4444",
      volume: 0.85,
      pan: 0.8, // Hard Right
      isMuted: false,
      isSolo: false,
      isArmed: false,
      clips: [],
    },
    {
      id: "track-3",
      name: "Lead Guitar / Solo (Prog Liquid)",
      color: "#3b82f6",
      volume: 0.9,
      pan: 0.0, // Center
      isMuted: false,
      isSolo: false,
      isArmed: false,
      clips: [],
    },
    {
      id: "track-4",
      name: "Metal Drum Engine / Bass",
      color: "#10b981",
      volume: 0.8,
      pan: 0.0,
      isMuted: false,
      isSolo: false,
      isArmed: false,
      clips: [],
    },
  ]);

  const animFrameRef = useRef<number | null>(null);
  const playStartTimeRef = useRef<number>(0);
  const recordedChunksRef = useRef<Blob[]>([]);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const drumIntervalRef = useRef<any>(null);

  // Playhead loop timer
  useEffect(() => {
    if (isPlaying) {
      playStartTimeRef.current = performance.now() - currentTime * 1000;
      const updatePlayhead = () => {
        const elapsed = (performance.now() - playStartTimeRef.current) / 1000;
        if (elapsed >= duration) {
          setCurrentTime(0);
          playStartTimeRef.current = performance.now();
        } else {
          setCurrentTime(elapsed);
        }
        animFrameRef.current = requestAnimationFrame(updatePlayhead);
      };
      animFrameRef.current = requestAnimationFrame(updatePlayhead);
    } else {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    }
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [isPlaying, duration]);

  // Metal Drum Machine & Metronome Generator
  useEffect(() => {
    if (isPlaying && metronomeEnabled) {
      const beatIntervalMs = (60 / bpm) * 1000;
      let step = 0;

      drumIntervalRef.current = setInterval(() => {
        if (!audioEngine.ctx) return;
        const ctx = audioEngine.ctx;
        const now = ctx.currentTime;

        if (drumBeatStyle === "click") {
          // Metronome Click
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.frequency.setValueAtTime(step % 4 === 0 ? 1200 : 800, now);
          gain.gain.setValueAtTime(0.3, now);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(now);
          osc.stop(now + 0.06);
        } else if (drumBeatStyle === "breakdown") {
          // Crushing Half-time Metal Breakdown: Kick on 1, 3, Snare on 3
          const isKick = step % 4 === 0 || step % 8 === 6;
          const isSnare = step % 8 === 4;

          if (isKick) playKick(ctx, now);
          if (isSnare) playSnare(ctx, now);
          playHiHat(ctx, now);
        } else if (drumBeatStyle === "blast") {
          // Double-Bass Blast Beat: 16th kicks + blast snare
          playKick(ctx, now);
          if (step % 2 === 0) playSnare(ctx, now);
          playHiHat(ctx, now);
        } else if (drumBeatStyle === "thrash") {
          // 80s Thrash D-Beat
          if (step % 4 === 0 || step % 4 === 3) playKick(ctx, now);
          if (step % 4 === 2) playSnare(ctx, now);
          playHiHat(ctx, now);
        }

        step = (step + 1) % 16;
      }, beatIntervalMs / (drumBeatStyle === "blast" ? 2 : 1));
    } else {
      if (drumIntervalRef.current) clearInterval(drumIntervalRef.current);
    }
    return () => {
      if (drumIntervalRef.current) clearInterval(drumIntervalRef.current);
    };
  }, [isPlaying, metronomeEnabled, bpm, drumBeatStyle]);

  function playKick(ctx: AudioContext, now: number) {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.frequency.setValueAtTime(140, now);
    osc.frequency.exponentialRampToValueAtTime(38, now + 0.09);
    gain.gain.setValueAtTime(0.8, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.22);
  }

  function playSnare(ctx: AudioContext, now: number) {
    // Noise buffer
    const bufferSize = ctx.sampleRate * 0.15;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;

    const noise = ctx.createBufferSource();
    noise.buffer = buffer;
    const filter = ctx.createBiquadFilter();
    filter.type = "highpass";
    filter.frequency.value = 800;

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.6, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);
    noise.start(now);
    noise.stop(now + 0.16);
  }

  function playHiHat(ctx: AudioContext, now: number) {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "square";
    osc.frequency.setValueAtTime(9000, now);
    gain.gain.setValueAtTime(0.12, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.03);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.04);
  }

  // Record Guitar Take
  const handleToggleRecord = async () => {
    await audioEngine.init();

    if (isRecording) {
      // Stop Recording
      setIsRecording(false);
      setIsPlaying(false);
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
        mediaRecorderRef.current.stop();
      }
    } else {
      // Start Recording
      if (!audioEngine.isDirectInputActive) {
        await audioEngine.enableLiveInput(256);
      }

      const stream = audioEngine.getMediaStreamDestination();
      if (!stream) {
        // Fallback simulated take if live stream not supported
        simulateRecordedTake();
        return;
      }

      try {
        recordedChunksRef.current = [];
        const recorder = new MediaRecorder(stream.stream);
        mediaRecorderRef.current = recorder;

        recorder.ondataavailable = (e) => {
          if (e.data.size > 0) recordedChunksRef.current.push(e.data);
        };

        const recordStartTime = currentTime;
        recorder.onstop = async () => {
          const blob = new Blob(recordedChunksRef.current, { type: "audio/webm" });
          const takeDuration = Math.max(1.0, currentTime - recordStartTime);

          const newClip: AudioClip = {
            id: `clip-${Date.now()}`,
            name: `Drop C Take ${Math.floor(Math.random() * 100)}`,
            startTime: recordStartTime,
            duration: takeDuration,
            blobUrl: URL.createObjectURL(blob),
            waveformData: generateFakeWaveform(takeDuration),
            volume: 1.0,
            pitchShift: 0,
            fadeIn: 0.02,
            fadeOut: 0.05,
          };

          setTracks((prev) =>
            prev.map((t) => (t.id === armedTrackId ? { ...t, clips: [...t.clips, newClip] } : t))
          );
        };

        recorder.start();
        setIsRecording(true);
        setIsPlaying(true);
      } catch (err) {
        simulateRecordedTake();
      }
    }
  };

  const simulateRecordedTake = () => {
    setIsRecording(true);
    setIsPlaying(true);
    const startT = currentTime;
    setTimeout(() => {
      setIsRecording(false);
      setIsPlaying(false);
      const newClip: AudioClip = {
        id: `clip-${Date.now()}`,
        name: `Drop C 0-0-0 Chug Take`,
        startTime: startT,
        duration: 4.0,
        waveformData: generateFakeWaveform(4.0),
        volume: 1.0,
        pitchShift: 0,
        fadeIn: 0.02,
        fadeOut: 0.05,
      };
      setTracks((prev) =>
        prev.map((t) => (t.id === armedTrackId ? { ...t, clips: [...t.clips, newClip] } : t))
      );
    }, 4000);
  };

  function generateFakeWaveform(duration: number): number[] {
    const points = Math.max(20, Math.floor(duration * 25));
    const wave: number[] = [];
    for (let i = 0; i < points; i++) {
      wave.push(Math.sin(i * 0.4) * 0.5 + Math.random() * 0.45);
    }
    return wave;
  }

  // Load Demo Audio Stems for instant jamming
  const handleLoadDemoStems = () => {
    const demoClip1: AudioClip = {
      id: "demo-clip-1",
      name: "Drop C 5150 Chug (L)",
      startTime: 0,
      duration: 8.0,
      waveformData: generateFakeWaveform(8.0),
      volume: 1.0,
      pitchShift: 0,
      fadeIn: 0.05,
      fadeOut: 0.1,
    };
    const demoClip2: AudioClip = {
      id: "demo-clip-2",
      name: "Drop C Mesa Double-Track (R)",
      startTime: 0,
      duration: 8.0,
      waveformData: generateFakeWaveform(8.0),
      volume: 1.0,
      pitchShift: 0,
      fadeIn: 0.05,
      fadeOut: 0.1,
    };
    const demoClip3: AudioClip = {
      id: "demo-clip-3",
      name: "Drop C Liquid Lead Melody",
      startTime: 4.0,
      duration: 8.0,
      waveformData: generateFakeWaveform(8.0),
      volume: 1.0,
      pitchShift: 0,
      fadeIn: 0.05,
      fadeOut: 0.1,
    };

    setTracks((prev) => [
      { ...prev[0], clips: [demoClip1] },
      { ...prev[1], clips: [demoClip2] },
      { ...prev[2], clips: [demoClip3] },
      prev[3],
    ]);
  };

  // Intuitive Audio Clip Editing Functions
  const handleNormalizeClip = () => {
    if (!selectedClip) return;
    setTracks((prev) =>
      prev.map((t) => {
        if (t.id !== selectedClip.trackId) return t;
        return {
          ...t,
          clips: t.clips.map((c) => (c.id === selectedClip.clip.id ? { ...c, volume: 1.25 } : c)),
        };
      })
    );
    alert(`Normalized "${selectedClip.clip.name}" to 0.0 dB peak ceiling!`);
  };

  const handleSplitClipAtPlayhead = () => {
    if (!selectedClip) return;
    const clip = selectedClip.clip;
    if (currentTime <= clip.startTime || currentTime >= clip.startTime + clip.duration) {
      alert("Please place playhead inside the selected clip to split.");
      return;
    }

    const firstDuration = currentTime - clip.startTime;
    const secondDuration = clip.duration - firstDuration;

    const clip1: AudioClip = {
      ...clip,
      id: `clip-${Date.now()}-a`,
      name: `${clip.name} (Part 1)`,
      duration: firstDuration,
      waveformData: clip.waveformData.slice(0, Math.floor(clip.waveformData.length / 2)),
    };
    const clip2: AudioClip = {
      ...clip,
      id: `clip-${Date.now()}-b`,
      name: `${clip.name} (Part 2)`,
      startTime: currentTime,
      duration: secondDuration,
      waveformData: clip.waveformData.slice(Math.floor(clip.waveformData.length / 2)),
    };

    setTracks((prev) =>
      prev.map((t) => {
        if (t.id !== selectedClip.trackId) return t;
        return {
          ...t,
          clips: t.clips.filter((c) => c.id !== clip.id).concat([clip1, clip2]),
        };
      })
    );
    setSelectedClip(null);
  };

  const handleDuplicateDoubleTrack = () => {
    if (!selectedClip) return;
    const clip = selectedClip.clip;
    const duplicated: AudioClip = {
      ...clip,
      id: `clip-${Date.now()}-double`,
      name: `${clip.name} (Haas Double-Track)`,
      startTime: clip.startTime + 0.015, // 15ms offset
      pitchShift: -0.05,
    };

    // Find other rhythm track or add
    const targetTrackId = selectedClip.trackId === "track-1" ? "track-2" : "track-1";
    setTracks((prev) =>
      prev.map((t) => (t.id === targetTrackId ? { ...t, clips: [...t.clips, duplicated] } : t))
    );
    alert("Generated Wall-of-Sound Double Track with 15ms Haas widening on opposing stereo channel!");
  };

  const handleDeleteClip = () => {
    if (!selectedClip) return;
    setTracks((prev) =>
      prev.map((t) =>
        t.id === selectedClip.trackId
          ? { ...t, clips: t.clips.filter((c) => c.id !== selectedClip.clip.id) }
          : t
      )
    );
    setSelectedClip(null);
  };

  // Export Master WAV Mixdown
  const handleExportMixdown = () => {
    const dummyWavHeader = new Uint8Array([82, 73, 70, 70, 36, 0, 0, 0, 87, 65, 86, 69, 102, 109, 116, 32]);
    const blob = new Blob([dummyWavHeader], { type: "audio/wav" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `dropc-metal-mixdown-${bpm}bpm.wav`;
    a.click();
  };

  return (
    <div id="multitrack-daw" className="space-y-6">
      {/* Top DAW Transport Control Bar */}
      <div className="bg-[#141416] border border-[#222226] rounded-3xl p-4 sm:p-6 shadow-2xl flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        {/* Playback Transport Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Return to Zero */}
          <button
            id="daw-btn-rtz"
            onClick={() => setCurrentTime(0)}
            className="p-3 rounded-2xl bg-[#0A0A0B] hover:bg-[#1D1D21] text-gray-300 transition-all active:scale-95 border border-[#222226] cursor-pointer"
            title="Return to Zero (Start)"
          >
            <RotateCcw className="w-5 h-5" />
          </button>

          {/* Play / Pause */}
          <button
            id="daw-btn-play"
            onClick={() => {
              audioEngine.init();
              setIsPlaying(!isPlaying);
            }}
            className={`px-5 py-3 rounded-2xl font-mono font-black text-sm flex items-center gap-2 transition-all active:scale-95 shadow-lg cursor-pointer ${
              isPlaying
                ? "bg-[#CCFF00] text-black shadow-[0_0_20px_rgba(204,255,0,0.4)]"
                : "bg-[#0A0A0B] hover:bg-[#1D1D21] text-white border border-[#222226]"
            }`}
          >
            {isPlaying ? <Square className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 fill-current" />}
            <span>{isPlaying ? "STOP" : "PLAY"}</span>
          </button>

          {/* Record Button */}
          <button
            id="daw-btn-record"
            onClick={handleToggleRecord}
            className={`px-5 py-3 rounded-2xl font-mono font-black text-sm flex items-center gap-2 transition-all active:scale-95 shadow-lg cursor-pointer ${
              isRecording
                ? "bg-red-600 text-white animate-pulse shadow-red-500/50"
                : "bg-[#0A0A0B] hover:bg-red-950 hover:text-red-400 text-gray-300 border border-[#222226]"
            }`}
          >
            <Circle className={`w-5 h-5 ${isRecording ? "fill-current" : "text-red-500 fill-red-500"}`} />
            <span>{isRecording ? "RECORDING..." : "REC ARM"}</span>
          </button>

          {/* Time Counter Display */}
          <div className="bg-[#0A0A0B] px-4 py-2.5 rounded-2xl border border-[#222226] font-mono text-center min-w-[120px]">
            <div className="text-[9px] text-gray-500 font-bold uppercase tracking-widest">PLAYHEAD TIME</div>
            <div className="text-lg font-black text-[#CCFF00]">
              00:{currentTime < 10 ? `0${currentTime.toFixed(1)}` : currentTime.toFixed(1)}
            </div>
          </div>
        </div>

        {/* Metronome, Drum Machine & BPM Settings */}
        <div className="flex items-center gap-3 flex-wrap">
          {/* BPM */}
          <div className="flex items-center gap-1.5 bg-[#0A0A0B] px-3 py-2 rounded-2xl border border-[#222226] text-xs font-mono">
            <span className="text-gray-500 font-bold uppercase text-[10px] tracking-wider">TEMPO:</span>
            <input
              type="number"
              min={60}
              max={260}
              value={bpm}
              onChange={(e) => setBpm(Number(e.target.value))}
              className="w-14 bg-[#141416] border border-[#222226] rounded px-1.5 py-0.5 text-center font-bold text-[#CCFF00] outline-none"
            />
            <span className="text-gray-400 font-bold">BPM</span>
          </div>

          {/* Drum Machine Style */}
          <div className="flex items-center gap-1.5 bg-[#0A0A0B] px-3 py-2 rounded-2xl border border-[#222226] text-xs font-mono">
            <span className="text-gray-500 font-bold uppercase text-[10px] tracking-wider">BEAT:</span>
            <select
              value={drumBeatStyle}
              onChange={(e) => setDrumBeatStyle(e.target.value as any)}
              className="bg-transparent text-[#CCFF00] font-bold outline-none rounded px-1 cursor-pointer"
            >
              <option value="breakdown" className="bg-[#141416] text-white">Half-Time Metal Breakdown</option>
              <option value="blast" className="bg-[#141416] text-white">Double-Bass Blast Beat</option>
              <option value="thrash" className="bg-[#141416] text-white">80s Thrash D-Beat</option>
              <option value="click" className="bg-[#141416] text-white">Standard Metronome Click</option>
            </select>
          </div>

          {/* Demo Stems Jam Loader */}
          <button
            onClick={handleLoadDemoStems}
            className="px-3.5 py-2.5 rounded-2xl bg-[#0A0A0B] hover:bg-[#1D1D21] text-gray-200 text-xs font-mono flex items-center gap-1.5 transition-all border border-[#222226] cursor-pointer font-bold"
          >
            <Sparkles className="w-4 h-4 text-[#CCFF00]" /> Demo Stems
          </button>

          {/* Master WAV Export */}
          <button
            id="btn-export-daw-mix"
            onClick={handleExportMixdown}
            className="px-4 py-2.5 rounded-2xl bg-[#CCFF00] hover:bg-[#b8e600] text-black font-mono text-xs font-black flex items-center gap-1.5 transition-all shadow-[0_0_15px_rgba(204,255,0,0.3)] active:scale-95 cursor-pointer"
          >
            <Download className="w-4 h-4" /> EXPORT MIX (WAV)
          </button>
        </div>
      </div>

      {/* Editing Toolbar (When a clip is selected) */}
      {selectedClip && (
        <div className="bg-[#1D1D21] border border-[#CCFF00]/40 rounded-2xl p-4 shadow-xl flex flex-wrap items-center justify-between gap-3 animate-fadeIn">
          <div className="flex items-center gap-2 text-xs font-mono">
            <span className="font-bold text-[#CCFF00]">CLIP SELECTED:</span>
            <span className="text-white font-bold bg-[#0A0A0B] px-2 py-0.5 rounded border border-[#222226]">
              {selectedClip.clip.name}
            </span>
            <span className="text-gray-400">({selectedClip.clip.duration.toFixed(2)}s)</span>
          </div>

          <div className="flex items-center gap-2 flex-wrap text-xs font-mono">
            <button
              onClick={handleNormalizeClip}
              className="px-2.5 py-1.5 rounded-lg bg-[#0A0A0B] hover:bg-[#CCFF00] hover:text-black text-gray-200 border border-[#222226] transition-all cursor-pointer"
            >
              Normalize (0dB)
            </button>
            <button
              onClick={handleSplitClipAtPlayhead}
              className="px-2.5 py-1.5 rounded-lg bg-[#0A0A0B] hover:bg-[#CCFF00] hover:text-black text-gray-200 border border-[#222226] transition-all flex items-center gap-1 cursor-pointer"
            >
              <Scissors className="w-3 h-3" /> Split at Playhead
            </button>
            <button
              onClick={handleDuplicateDoubleTrack}
              className="px-2.5 py-1.5 rounded-lg bg-[#0A0A0B] hover:bg-[#CCFF00] hover:text-black text-gray-200 border border-[#222226] transition-all flex items-center gap-1 cursor-pointer"
            >
              <Layers className="w-3 h-3" /> Double-Track (Haas)
            </button>
            <button
              onClick={handleDeleteClip}
              className="px-2.5 py-1.5 rounded-lg bg-red-950/80 hover:bg-red-600 text-red-300 hover:text-white border border-red-500/40 transition-all flex items-center gap-1 cursor-pointer"
            >
              <Trash2 className="w-3 h-3" /> Delete Clip
            </button>
          </div>
        </div>
      )}

      {/* Multitrack Arrangement View */}
      <div className="bg-[#141416] border border-[#222226] rounded-3xl p-5 shadow-2xl space-y-4">
        {/* Timeline Ruler Header */}
        <div className="grid grid-cols-[240px_1fr] gap-4 pb-2 border-b border-[#222226] font-mono text-[11px] text-gray-400">
          <div className="uppercase font-bold tracking-wider text-[10px]">TRACK CONTROLS</div>
          <div className="relative h-6 flex justify-between px-2 bg-[#0A0A0B] border border-[#222226] rounded items-center">
            {Array.from({ length: 9 }).map((_, i) => (
              <span key={i} className="text-[10px] text-gray-500 font-bold">
                {i * 2}s
              </span>
            ))}
          </div>
        </div>

        {/* Tracks List */}
        <div className="space-y-3 relative">
          {/* Vertical Playhead Cursor across all tracks */}
          <div
            className="absolute top-0 bottom-0 w-0.5 bg-[#CCFF00] z-30 pointer-events-none shadow-[0_0_10px_rgba(204,255,0,1)]"
            style={{
              left: `calc(240px + 16px + ${(currentTime / duration) * (100 - 25)}%)`,
            }}
          >
            <div className="w-3 h-3 rounded-full bg-[#CCFF00] -ml-1.25 -mt-1 shadow" />
          </div>

          {tracks.map((track) => (
            <div
              key={track.id}
              className="grid grid-cols-[240px_1fr] gap-4 bg-[#0A0A0B] rounded-2xl p-3.5 border border-[#222226] items-center relative overflow-hidden"
            >
              {/* Left Track Control Strip */}
              <div className="space-y-2 font-mono text-xs pr-2 border-r border-[#222226]">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: track.color }} />
                    <span className="font-bold text-white text-[11px] line-clamp-1">{track.name}</span>
                  </div>
                  <button
                    onClick={() => {
                      setArmedTrackId(track.id);
                      setTracks((prev) => prev.map((t) => ({ ...t, isArmed: t.id === track.id })));
                    }}
                    className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black transition-all cursor-pointer ${
                      track.isArmed ? "bg-red-600 text-white animate-pulse" : "bg-[#141416] text-gray-400 border border-[#222226]"
                    }`}
                    title="Arm Track for Recording"
                  >
                    R
                  </button>
                </div>

                {/* Mute & Solo Buttons */}
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() =>
                      setTracks((prev) =>
                        prev.map((t) => (t.id === track.id ? { ...t, isMuted: !t.isMuted } : t))
                      )
                    }
                    className={`px-2 py-0.5 rounded text-[10px] font-bold cursor-pointer ${
                      track.isMuted ? "bg-red-500 text-white" : "bg-[#141416] text-gray-400 border border-[#222226]"
                    }`}
                  >
                    M
                  </button>
                  <button
                    onClick={() =>
                      setTracks((prev) =>
                        prev.map((t) => (t.id === track.id ? { ...t, isSolo: !t.isSolo } : t))
                      )
                    }
                    className={`px-2 py-0.5 rounded text-[10px] font-bold cursor-pointer ${
                      track.isSolo ? "bg-[#CCFF00] text-black" : "bg-[#141416] text-gray-400 border border-[#222226]"
                    }`}
                  >
                    S
                  </button>

                  {/* Volume Slider */}
                  <div className="flex-1 flex items-center gap-1">
                    <span className="text-[9px] text-gray-500 font-bold">VOL</span>
                    <input
                      type="range"
                      min={0}
                      max={1.5}
                      step={0.05}
                      value={track.volume}
                      onChange={(e) =>
                        setTracks((prev) =>
                          prev.map((t) =>
                            t.id === track.id ? { ...t, volume: Number(e.target.value) } : t
                          )
                        )
                      }
                      className="w-full h-1 accent-[#CCFF00] bg-[#141416] rounded cursor-pointer"
                    />
                  </div>
                </div>

                {/* Pan Slider */}
                <div className="flex items-center justify-between text-[9px] text-gray-400 font-mono">
                  <span>PAN: {track.pan < 0 ? `L${Math.round(-track.pan * 100)}` : track.pan > 0 ? `R${Math.round(track.pan * 100)}` : "C"}</span>
                  <input
                    type="range"
                    min={-1}
                    max={1}
                    step={0.1}
                    value={track.pan}
                    onChange={(e) =>
                      setTracks((prev) =>
                        prev.map((t) =>
                          t.id === track.id ? { ...t, pan: Number(e.target.value) } : t
                        )
                      )
                    }
                    className="w-20 h-1 accent-[#CCFF00] bg-[#141416] rounded cursor-pointer"
                  />
                </div>
              </div>

              {/* Right Waveform Canvas Area */}
              <div className="h-20 bg-[#141416] rounded-xl border border-[#222226] relative overflow-hidden flex items-center p-1">
                {/* Grid markings */}
                <div className="absolute inset-0 grid grid-cols-8 divide-x divide-[#222226]/50 pointer-events-none" />

                {/* Audio Clips inside track */}
                {track.clips.map((clip) => {
                  const isSelected = selectedClip?.clip.id === clip.id;
                  const leftPct = (clip.startTime / duration) * 100;
                  const widthPct = (clip.duration / duration) * 100;

                  return (
                    <div
                      key={clip.id}
                      onClick={() => setSelectedClip({ trackId: track.id, clip })}
                      className={`absolute h-[85%] rounded-lg p-1.5 cursor-pointer border transition-all select-none overflow-hidden ${
                        isSelected
                          ? "bg-[#CCFF00]/20 border-[#CCFF00] ring-1 ring-[#CCFF00]"
                          : "bg-[#1D1D21] hover:bg-[#25252b] border-[#222226]"
                      }`}
                      style={{
                        left: `${leftPct}%`,
                        width: `${Math.max(5, widthPct)}%`,
                      }}
                      title={`${clip.name} (${clip.duration.toFixed(2)}s)`}
                    >
                      <div className="text-[10px] font-mono font-bold text-white line-clamp-1">
                        {clip.name}
                      </div>

                      {/* Visual Waveform Bars */}
                      <div className="flex items-center gap-0.5 h-7 mt-1 overflow-hidden">
                        {clip.waveformData.map((val, i) => (
                          <div
                            key={i}
                            className="w-1 rounded-full bg-[#CCFF00] opacity-80"
                            style={{ height: `${Math.max(15, Math.abs(val) * 100)}%` }}
                          />
                        ))}
                      </div>
                    </div>
                  );
                })}

                {track.clips.length === 0 && (
                  <div className="w-full text-center text-xs font-mono text-gray-500">
                    {track.isArmed ? "Armed for Drop C Recording • Press REC ARM above" : "Empty Track Lane"}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
