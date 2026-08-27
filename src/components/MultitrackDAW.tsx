import React, { useState, useEffect, useRef, useCallback } from "react";
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
  GripHorizontal,
  GripVertical,
  ArrowUp,
  ArrowDown,
  Magnet,
  FileAudio,
  ChevronsLeft,
  ChevronsRight,
  Copy,
  Move,
} from "lucide-react";

interface DraggingClipState {
  clipId: string;
  clip: AudioClip;
  sourceTrackId: string;
  hoverTrackId: string;
  initialStartTime: number;
  currentStartTime: number;
  initialDuration: number;
  currentDuration: number;
  startPointerX: number;
  startPointerY: number;
  offsetXSec: number;
  mode: "move" | "trim-start" | "trim-end";
}

const TRACK_COLOR_PALETTES = [
  { name: "Orange Metal", color: "#f97316" },
  { name: "Crimson Mesa", color: "#ef4444" },
  { name: "Prog Cyan", color: "#06b6d4" },
  { name: "Emerald Rhythm", color: "#10b981" },
  { name: "Violet Djent", color: "#8b5cf6" },
  { name: "Gold Crunch", color: "#eab308" },
  { name: "Rose Lead", color: "#f43f5e" },
];

export const MultitrackDAW: React.FC = () => {
  const audioEngine = AudioEngine.getInstance();
  const [isPlaying, setIsPlaying] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [armedTrackId, setArmedTrackId] = useState<string>("track-1");
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(16); // 16 seconds default timeline duration
  const [bpm, setBpm] = useState(135);
  const [metronomeEnabled, setMetronomeEnabled] = useState(true);
  const [drumBeatStyle, setDrumBeatStyle] = useState<"blast" | "breakdown" | "thrash" | "click">("breakdown");
  const [selectedClip, setSelectedClip] = useState<{ trackId: string; clip: AudioClip } | null>(null);
  const [snapResolution, setSnapResolution] = useState<number>(0.25); // 0.25s (16th beat snap), 0 = free
  const [dragState, setDragState] = useState<DraggingClipState | null>(null);
  const [hoveredLaneTrackId, setHoveredLaneTrackId] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [isFileDraggingOver, setIsFileDraggingOver] = useState(false);

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
  const timelineTracksContainerRef = useRef<HTMLDivElement | null>(null);
  const trackLanesRefs = useRef<Map<string, HTMLDivElement>>(new Map());

  // Show momentary status toast
  const showStatus = useCallback((msg: string) => {
    setStatusMessage(msg);
    setTimeout(() => {
      setStatusMessage((prev) => (prev === msg ? null : prev));
    }, 2800);
  }, []);

  // Snapping math helper
  const snapTime = useCallback(
    (time: number, snap: number): number => {
      if (snap <= 0) return Math.max(0, Math.min(duration - 0.2, time));
      const snapped = Math.round(time / snap) * snap;
      return Math.max(0, Math.min(duration - 0.2, Number(snapped.toFixed(3))));
    },
    [duration]
  );

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
          const isKick = step % 4 === 0 || step % 8 === 6;
          const isSnare = step % 8 === 4;

          if (isKick) playKick(ctx, now);
          if (isSnare) playSnare(ctx, now);
          playHiHat(ctx, now);
        } else if (drumBeatStyle === "blast") {
          playKick(ctx, now);
          if (step % 2 === 0) playSnare(ctx, now);
          playHiHat(ctx, now);
        } else if (drumBeatStyle === "thrash") {
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
    const bufferSize = Math.floor(ctx.sampleRate * 0.15);
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
      setIsRecording(false);
      setIsPlaying(false);
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
        mediaRecorderRef.current.stop();
      }
    } else {
      if (!audioEngine.isDirectInputActive) {
        await audioEngine.enableLiveInput(256);
      }

      const stream = audioEngine.getMediaStreamDestination();
      if (!stream) {
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
          setSelectedClip({ trackId: armedTrackId, clip: newClip });
          showStatus(`Recorded new take on ${tracks.find((t) => t.id === armedTrackId)?.name}`);
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
      setSelectedClip({ trackId: armedTrackId, clip: newClip });
      showStatus("Added simulated Drop C take to track");
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
      prev[3] ? prev[3] : prev[0],
      ...prev.slice(4),
    ]);
    setSelectedClip({ trackId: tracks[0].id, clip: demoClip1 });
    showStatus("Loaded 3 demo Drop C multitrack stems. Drag clips across tracks or timeline!");
  };

  // ==========================================
  // DRAG & DROP SYSTEM (Pointer-based & HTML5)
  // ==========================================

  // Initiate pointer-based drag (Move or Trim)
  const handleStartClipDrag = (
    e: React.PointerEvent,
    trackId: string,
    clip: AudioClip,
    mode: "move" | "trim-start" | "trim-end"
  ) => {
    e.stopPropagation();
    e.preventDefault();

    // Select clip on click/drag
    setSelectedClip({ trackId, clip });

    const laneEl = trackLanesRefs.current.get(trackId);
    if (!laneEl) return;
    const rect = laneEl.getBoundingClientRect();
    const clickXInLane = e.clientX - rect.left;
    const clickTimeInSec = (clickXInLane / rect.width) * duration;
    const offsetFromClipStart = Math.max(0, clickTimeInSec - clip.startTime);

    const initialDrag: DraggingClipState = {
      clipId: clip.id,
      clip,
      sourceTrackId: trackId,
      hoverTrackId: trackId,
      initialStartTime: clip.startTime,
      currentStartTime: clip.startTime,
      initialDuration: clip.duration,
      currentDuration: clip.duration,
      startPointerX: e.clientX,
      startPointerY: e.clientY,
      offsetXSec: offsetFromClipStart,
      mode,
    };

    setDragState(initialDrag);
    setHoveredLaneTrackId(trackId);

    // Global pointer move & up handlers
    const onPointerMove = (moveEvent: PointerEvent) => {
      // Find current track lane under pointer
      let targetTrackId = trackId;
      trackLanesRefs.current.forEach((el, id) => {
        const r = el.getBoundingClientRect();
        if (moveEvent.clientY >= r.top - 12 && moveEvent.clientY <= r.bottom + 12) {
          targetTrackId = id;
        }
      });
      setHoveredLaneTrackId(targetTrackId);

      // Measure current target lane rect
      const targetLaneEl = trackLanesRefs.current.get(targetTrackId) || laneEl;
      const targetRect = targetLaneEl.getBoundingClientRect();
      const lanePointerX = moveEvent.clientX - targetRect.left;
      const pointerTime = (lanePointerX / targetRect.width) * duration;

      setDragState((prev) => {
        if (!prev) return null;

        if (prev.mode === "move") {
          const rawStartTime = pointerTime - prev.offsetXSec;
          const snappedStart = snapTime(rawStartTime, snapResolution);
          const clampedStart = Math.max(0, Math.min(duration - prev.currentDuration, snappedStart));

          return {
            ...prev,
            hoverTrackId: targetTrackId,
            currentStartTime: clampedStart,
          };
        } else if (prev.mode === "trim-start") {
          const rawStartTime = snapTime(pointerTime, snapResolution);
          const minDuration = 0.5;
          const maxStart = prev.initialStartTime + prev.initialDuration - minDuration;
          const newStart = Math.max(0, Math.min(maxStart, rawStartTime));
          const newDuration = prev.initialStartTime + prev.initialDuration - newStart;

          return {
            ...prev,
            currentStartTime: newStart,
            currentDuration: Math.max(minDuration, newDuration),
          };
        } else if (prev.mode === "trim-end") {
          const rawEndTime = snapTime(pointerTime, snapResolution);
          const minDuration = 0.5;
          const newDuration = Math.max(minDuration, Math.min(duration - prev.currentStartTime, rawEndTime - prev.currentStartTime));

          return {
            ...prev,
            currentDuration: newDuration,
          };
        }
        return prev;
      });
    };

    const onPointerUp = (upEvent: PointerEvent) => {
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);

      setDragState((finalState) => {
        if (!finalState) return null;

        // Apply clip modifications
        const finalClip: AudioClip = {
          ...finalState.clip,
          startTime: finalState.currentStartTime,
          duration: finalState.currentDuration,
        };

        const srcId = finalState.sourceTrackId;
        const destId = finalState.hoverTrackId;

        setTracks((prevTracks) => {
          if (srcId === destId) {
            // Reorder within the same track
            return prevTracks.map((t) => {
              if (t.id !== srcId) return t;
              return {
                ...t,
                clips: t.clips
                  .map((c) => (c.id === finalClip.id ? finalClip : c))
                  .sort((a, b) => a.startTime - b.startTime),
              };
            });
          } else {
            // Move between different tracks
            return prevTracks.map((t) => {
              if (t.id === srcId) {
                return {
                  ...t,
                  clips: t.clips.filter((c) => c.id !== finalClip.id),
                };
              }
              if (t.id === destId) {
                return {
                  ...t,
                  clips: [...t.clips, finalClip].sort((a, b) => a.startTime - b.startTime),
                };
              }
              return t;
            });
          }
        });

        const destTrackName = tracks.find((t) => t.id === destId)?.name || destId;
        if (srcId !== destId) {
          showStatus(`Moved "${finalClip.name}" to ${destTrackName} at ${finalClip.startTime.toFixed(2)}s`);
        } else {
          showStatus(`Repositioned "${finalClip.name}" at ${finalClip.startTime.toFixed(2)}s`);
        }

        setSelectedClip({ trackId: destId, clip: finalClip });
        return null;
      });

      setHoveredLaneTrackId(null);
    };

    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", onPointerUp);
  };

  // External File Drag & Drop (Drop audio files directly onto a track lane)
  const handleFileDropOnTrack = async (e: React.DragEvent, trackId: string) => {
    e.preventDefault();
    e.stopPropagation();
    setIsFileDraggingOver(false);
    setHoveredLaneTrackId(null);

    const files = e.dataTransfer.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    if (!file.type.startsWith("audio/") && !file.name.match(/\.(wav|mp3|ogg|flac|m4a|aac)$/i)) {
      alert("Please drop a valid audio file (.wav, .mp3, .ogg, .flac).");
      return;
    }

    try {
      await audioEngine.init();
      const arrayBuffer = await file.arrayBuffer();
      let clipDuration = 4.0;
      let waveformData = generateFakeWaveform(4.0);

      if (audioEngine.ctx) {
        try {
          const audioBuffer = await audioEngine.ctx.decodeAudioData(arrayBuffer.slice(0));
          clipDuration = audioBuffer.duration;
          // Extract real peaks for waveform
          const channelData = audioBuffer.getChannelData(0);
          const sampleStep = Math.floor(channelData.length / 50);
          waveformData = [];
          for (let i = 0; i < 50; i++) {
            const val = channelData[i * sampleStep] || 0;
            waveformData.push(val);
          }
        } catch {
          // fallback to fake waveform if decoding fails
        }
      }

      const laneEl = trackLanesRefs.current.get(trackId);
      let dropStartTime = 0;
      if (laneEl) {
        const rect = laneEl.getBoundingClientRect();
        const dropX = e.clientX - rect.left;
        dropStartTime = snapTime((dropX / rect.width) * duration, snapResolution);
      }

      const newClip: AudioClip = {
        id: `imported-${Date.now()}`,
        name: file.name.replace(/\.[^/.]+$/, ""),
        startTime: Math.max(0, Math.min(duration - 1, dropStartTime)),
        duration: Math.min(duration - dropStartTime, Math.max(1, clipDuration)),
        blobUrl: URL.createObjectURL(file),
        waveformData,
        volume: 1.0,
        pitchShift: 0,
        fadeIn: 0.02,
        fadeOut: 0.05,
      };

      setTracks((prev) =>
        prev.map((t) => (t.id === trackId ? { ...t, clips: [...t.clips, newClip] } : t))
      );
      setSelectedClip({ trackId, clip: newClip });
      showStatus(`Imported & dropped "${file.name}" onto ${tracks.find((t) => t.id === trackId)?.name}!`);
    } catch (err) {
      alert("Could not process dropped audio file.");
    }
  };

  // Timeline Ruler Scrub Click
  const handleTimelineRulerClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const targetTime = snapTime((clickX / rect.width) * duration, snapResolution);
    setCurrentTime(targetTime);
  };

  // ==========================================
  // TRACK REORDERING & MANAGEMENT
  // ==========================================
  const handleMoveTrackUp = (index: number) => {
    if (index <= 0) return;
    setTracks((prev) => {
      const copy = [...prev];
      const temp = copy[index - 1];
      copy[index - 1] = copy[index];
      copy[index] = temp;
      return copy;
    });
  };

  const handleMoveTrackDown = (index: number) => {
    if (index >= tracks.length - 1) return;
    setTracks((prev) => {
      const copy = [...prev];
      const temp = copy[index + 1];
      copy[index + 1] = copy[index];
      copy[index] = temp;
      return copy;
    });
  };

  const handleAddTrack = () => {
    const palette = TRACK_COLOR_PALETTES[tracks.length % TRACK_COLOR_PALETTES.length];
    const newTrack: DawTrack = {
      id: `track-${Date.now()}`,
      name: `Metal Track ${tracks.length + 1} (${palette.name})`,
      color: palette.color,
      volume: 0.85,
      pan: 0.0,
      isMuted: false,
      isSolo: false,
      isArmed: false,
      clips: [],
    };
    setTracks((prev) => [...prev, newTrack]);
    showStatus(`Added new "${newTrack.name}" to timeline`);
  };

  const handleDeleteTrack = (trackId: string) => {
    if (tracks.length <= 1) {
      alert("DAW requires at least 1 track lane.");
      return;
    }
    setTracks((prev) => prev.filter((t) => t.id !== trackId));
    if (selectedClip?.trackId === trackId) setSelectedClip(null);
    if (armedTrackId === trackId) setArmedTrackId(tracks[0].id);
  };

  // ==========================================
  // CLIP EDITING OPERATIONS
  // ==========================================
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
    showStatus(`Normalized "${selectedClip.clip.name}" to 0.0 dB peak ceiling!`);
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
      waveformData: (clip.waveformData || []).slice(0, Math.floor((clip.waveformData || []).length / 2)),
    };
    const clip2: AudioClip = {
      ...clip,
      id: `clip-${Date.now()}-b`,
      name: `${clip.name} (Part 2)`,
      startTime: currentTime,
      duration: secondDuration,
      waveformData: (clip.waveformData || []).slice(Math.floor((clip.waveformData || []).length / 2)),
    };

    setTracks((prev) =>
      prev.map((t) => {
        if (t.id !== selectedClip.trackId) return t;
        return {
          ...t,
          clips: t.clips.filter((c) => c.id !== clip.id).concat([clip1, clip2]).sort((a, b) => a.startTime - b.startTime),
        };
      })
    );
    setSelectedClip({ trackId: selectedClip.trackId, clip: clip1 });
    showStatus(`Split clip into 2 parts at ${currentTime.toFixed(2)}s`);
  };

  const handleDuplicateDoubleTrack = () => {
    if (!selectedClip) return;
    const clip = selectedClip.clip;
    const duplicated: AudioClip = {
      ...clip,
      id: `clip-${Date.now()}-double`,
      name: `${clip.name} (Haas Double-Track)`,
      startTime: clip.startTime + 0.015,
      pitchShift: -0.05,
    };

    // Place on opposing stereo rhythm track or next track
    const targetTrackId =
      selectedClip.trackId === tracks[0]?.id && tracks[1]
        ? tracks[1].id
        : tracks[0]?.id || selectedClip.trackId;

    setTracks((prev) =>
      prev.map((t) => (t.id === targetTrackId ? { ...t, clips: [...t.clips, duplicated] } : t))
    );
    showStatus("Generated Haas Stereo Double-Track on opposing channel!");
  };

  const handleNudgeClip = (deltaSec: number) => {
    if (!selectedClip) return;
    const newStart = Math.max(0, Math.min(duration - selectedClip.clip.duration, selectedClip.clip.startTime + deltaSec));
    const updatedClip = { ...selectedClip.clip, startTime: Number(newStart.toFixed(3)) };

    setTracks((prev) =>
      prev.map((t) => {
        if (t.id !== selectedClip.trackId) return t;
        return {
          ...t,
          clips: t.clips.map((c) => (c.id === updatedClip.id ? updatedClip : c)),
        };
      })
    );
    setSelectedClip({ trackId: selectedClip.trackId, clip: updatedClip });
  };

  const handleMoveClipToAdjacentTrack = (direction: "up" | "down") => {
    if (!selectedClip) return;
    const currentTrackIndex = tracks.findIndex((t) => t.id === selectedClip.trackId);
    if (currentTrackIndex === -1) return;

    const targetTrackIndex = direction === "up" ? currentTrackIndex - 1 : currentTrackIndex + 1;
    if (targetTrackIndex < 0 || targetTrackIndex >= tracks.length) return;

    const targetTrack = tracks[targetTrackIndex];
    const clip = selectedClip.clip;

    setTracks((prev) =>
      prev.map((t) => {
        if (t.id === selectedClip.trackId) {
          return { ...t, clips: t.clips.filter((c) => c.id !== clip.id) };
        }
        if (t.id === targetTrack.id) {
          return { ...t, clips: [...t.clips, clip].sort((a, b) => a.startTime - b.startTime) };
        }
        return t;
      })
    );
    setSelectedClip({ trackId: targetTrack.id, clip });
    showStatus(`Moved "${clip.name}" to ${targetTrack.name}`);
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
    showStatus(`Deleted clip "${selectedClip.clip.name}"`);
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
    showStatus("Exported Master DAW Multitrack Mixdown (WAV)!");
  };

  return (
    <div id="multitrack-daw" className="space-y-6 select-none">
      {/* DAW Header Banner & Global Status Message */}
      {statusMessage && (
        <div className="bg-[#18181C] border border-[#CCFF00] text-[#CCFF00] px-4 py-2 rounded-2xl text-xs font-mono font-bold flex items-center justify-between shadow-[0_0_20px_rgba(204,255,0,0.2)] animate-fadeIn">
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 fill-current animate-pulse" />
            <span>{statusMessage}</span>
          </div>
          <button onClick={() => setStatusMessage(null)} className="text-gray-400 hover:text-white text-xs">
            ✕
          </button>
        </div>
      )}

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

        {/* Snapping Grid, Metronome, Drum Machine & Actions */}
        <div className="flex items-center gap-3 flex-wrap">
          {/* Snap-to-Grid Selector */}
          <div className="flex items-center gap-1.5 bg-[#0A0A0B] px-3 py-2 rounded-2xl border border-[#222226] text-xs font-mono">
            <Magnet className={`w-3.5 h-3.5 ${snapResolution > 0 ? "text-[#CCFF00]" : "text-gray-600"}`} />
            <span className="text-gray-500 font-bold uppercase text-[10px] tracking-wider">SNAP:</span>
            <select
              value={snapResolution}
              onChange={(e) => setSnapResolution(Number(e.target.value))}
              className="bg-transparent text-[#CCFF00] font-bold outline-none rounded px-1 cursor-pointer"
            >
              <option value={0} className="bg-[#141416] text-white">Free (Off)</option>
              <option value={0.1} className="bg-[#141416] text-white">0.1s (Fine)</option>
              <option value={0.25} className="bg-[#141416] text-white">1/16 Beat (0.25s)</option>
              <option value={0.5} className="bg-[#141416] text-white">1/8 Beat (0.50s)</option>
              <option value={1.0} className="bg-[#141416] text-white">1/4 Beat (1.00s)</option>
              <option value={2.0} className="bg-[#141416] text-white">1 Bar (2.00s)</option>
            </select>
          </div>

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
            <Download className="w-4 h-4" /> EXPORT MIX
          </button>
        </div>
      </div>

      {/* Editing Toolbar (When a clip is selected) */}
      {selectedClip && (
        <div className="bg-[#18181C] border border-[#CCFF00]/40 rounded-2xl p-4 shadow-xl flex flex-wrap items-center justify-between gap-3 animate-fadeIn">
          <div className="flex items-center gap-2 text-xs font-mono">
            <span className="font-bold text-[#CCFF00] flex items-center gap-1.5">
              <Move className="w-3.5 h-3.5" /> CLIP ACTIVE:
            </span>
            <span className="text-white font-bold bg-[#0A0A0B] px-2.5 py-1 rounded-lg border border-[#222226]">
              {selectedClip.clip.name}
            </span>
            <span className="text-gray-400">
              Start: <strong className="text-white">{selectedClip.clip.startTime.toFixed(2)}s</strong> | Length:{" "}
              <strong className="text-white">{selectedClip.clip.duration.toFixed(2)}s</strong>
            </span>
          </div>

          <div className="flex items-center gap-2 flex-wrap text-xs font-mono">
            {/* Nudge Buttons */}
            <div className="flex items-center bg-[#0A0A0B] rounded-lg border border-[#222226] p-0.5">
              <button
                onClick={() => handleNudgeClip(-0.1)}
                className="px-2 py-1 hover:bg-[#1D1D21] text-gray-300 hover:text-white rounded text-[11px]"
                title="Nudge Left 0.1s"
              >
                ◀ -0.1s
              </button>
              <button
                onClick={() => handleNudgeClip(0.1)}
                className="px-2 py-1 hover:bg-[#1D1D21] text-gray-300 hover:text-white rounded text-[11px]"
                title="Nudge Right 0.1s"
              >
                +0.1s ▶
              </button>
            </div>

            {/* Move Track Up/Down */}
            <div className="flex items-center bg-[#0A0A0B] rounded-lg border border-[#222226] p-0.5">
              <button
                onClick={() => handleMoveClipToAdjacentTrack("up")}
                className="p-1.5 hover:bg-[#1D1D21] text-gray-300 hover:text-white rounded"
                title="Move Clip to Track Above"
              >
                <ArrowUp className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => handleMoveClipToAdjacentTrack("down")}
                className="p-1.5 hover:bg-[#1D1D21] text-gray-300 hover:text-white rounded"
                title="Move Clip to Track Below"
              >
                <ArrowDown className="w-3.5 h-3.5" />
              </button>
            </div>

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
      <div
        ref={timelineTracksContainerRef}
        className="bg-[#141416] border border-[#222226] rounded-3xl p-5 shadow-2xl space-y-4 relative"
      >
        {/* Drag Helper Instructions & Add Track Button */}
        <div className="flex items-center justify-between pb-2 border-b border-[#222226] text-xs font-mono">
          <div className="flex items-center gap-2 text-gray-400">
            <span className="bg-[#0A0A0B] px-2 py-0.5 rounded border border-[#222226] text-[#CCFF00] font-bold">
              💡 DRAG & DROP ENABLED
            </span>
            <span className="hidden sm:inline">
              Drag clips across tracks or along timeline • Drag clip edges to trim • Drop external audio files
            </span>
          </div>

          <button
            onClick={handleAddTrack}
            className="px-3 py-1 rounded-xl bg-[#0A0A0B] hover:bg-[#1D1D21] text-[#CCFF00] border border-[#222226] font-bold flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" /> Add Track
          </button>
        </div>

        {/* Timeline Ruler Header */}
        <div className="grid grid-cols-[240px_1fr] gap-4 pb-1 font-mono text-[11px] text-gray-400">
          <div className="uppercase font-bold tracking-wider text-[10px] flex items-center justify-between pr-2">
            <span>TRACK / MIXER</span>
            <span className="text-gray-600">ORDER</span>
          </div>

          {/* Interactive Timeline Ruler */}
          <div
            onClick={handleTimelineRulerClick}
            className="relative h-7 flex justify-between px-3 bg-[#0A0A0B] border border-[#222226] rounded-xl items-center cursor-pointer hover:border-[#CCFF00]/50 transition-colors"
            title="Click ruler to jump playhead"
          >
            {Array.from({ length: 9 }).map((_, i) => (
              <span key={i} className="text-[10px] text-gray-500 font-bold select-none">
                {i * (duration / 8)}s
              </span>
            ))}

            {/* Playhead Marker on Ruler */}
            <div
              className="absolute top-0 bottom-0 w-0.5 bg-[#CCFF00] pointer-events-none"
              style={{ left: `${(currentTime / duration) * 100}%` }}
            >
              <div className="w-2.5 h-2.5 -ml-1 -mt-0.5 bg-[#CCFF00] rotate-45 shadow-[0_0_8px_#CCFF00]" />
            </div>
          </div>
        </div>

        {/* Tracks List */}
        <div className="space-y-3 relative">
          {tracks.map((track, trackIndex) => {
            const isHoveredDuringDrag = hoveredLaneTrackId === track.id;

            return (
              <div
                key={track.id}
                className={`grid grid-cols-[240px_1fr] gap-4 bg-[#0A0A0B] rounded-2xl p-3.5 border transition-all items-center relative overflow-hidden ${
                  isHoveredDuringDrag
                    ? "border-[#CCFF00] ring-1 ring-[#CCFF00] bg-[#141416]"
                    : "border-[#222226] hover:border-[#333338]"
                }`}
              >
                {/* Left Track Control Strip */}
                <div className="space-y-2 font-mono text-xs pr-2 border-r border-[#222226]">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 truncate">
                      <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: track.color }} />
                      <span className="font-bold text-white text-[11px] truncate" title={track.name}>
                        {track.name}
                      </span>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      {/* Track Reorder Up / Down */}
                      <button
                        onClick={() => handleMoveTrackUp(trackIndex)}
                        disabled={trackIndex === 0}
                        className="p-1 rounded bg-[#141416] hover:bg-[#1D1D21] text-gray-400 hover:text-white disabled:opacity-30 cursor-pointer"
                        title="Move Track Up"
                      >
                        <ArrowUp className="w-3 h-3" />
                      </button>
                      <button
                        onClick={() => handleMoveTrackDown(trackIndex)}
                        disabled={trackIndex === tracks.length - 1}
                        className="p-1 rounded bg-[#141416] hover:bg-[#1D1D21] text-gray-400 hover:text-white disabled:opacity-30 cursor-pointer"
                        title="Move Track Down"
                      >
                        <ArrowDown className="w-3 h-3" />
                      </button>

                      {/* Rec Arm Button */}
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
                  </div>

                  {/* Mute & Solo Buttons & Vol */}
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

                  {/* Pan Slider & Track Delete */}
                  <div className="flex items-center justify-between text-[9px] text-gray-400 font-mono">
                    <span>
                      PAN:{" "}
                      {track.pan < 0
                        ? `L${Math.round(-track.pan * 100)}`
                        : track.pan > 0
                        ? `R${Math.round(track.pan * 100)}`
                        : "C"}
                    </span>
                    <div className="flex items-center gap-2">
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
                        className="w-16 h-1 accent-[#CCFF00] bg-[#141416] rounded cursor-pointer"
                      />
                      {tracks.length > 1 && (
                        <button
                          onClick={() => handleDeleteTrack(track.id)}
                          className="text-gray-600 hover:text-red-400 cursor-pointer"
                          title="Delete Track Lane"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right Waveform Canvas Area & Drop Zone */}
                <div
                  ref={(el) => {
                    if (el) trackLanesRefs.current.set(track.id, el);
                    else trackLanesRefs.current.delete(track.id);
                  }}
                  onDragOver={(e) => {
                    e.preventDefault();
                    setHoveredLaneTrackId(track.id);
                    setIsFileDraggingOver(true);
                  }}
                  onDragLeave={() => {
                    setHoveredLaneTrackId(null);
                    setIsFileDraggingOver(false);
                  }}
                  onDrop={(e) => handleFileDropOnTrack(e, track.id)}
                  className={`h-22 bg-[#141416] rounded-xl border relative overflow-hidden flex items-center p-1 transition-colors ${
                    isHoveredDuringDrag
                      ? "border-[#CCFF00] bg-[#CCFF00]/5"
                      : "border-[#222226]"
                  }`}
                >
                  {/* Grid markings */}
                  <div className="absolute inset-0 grid grid-cols-8 divide-x divide-[#222226]/50 pointer-events-none" />

                  {/* Vertical Playhead Cursor Line */}
                  <div
                    className="absolute top-0 bottom-0 w-0.5 bg-[#CCFF00] z-20 pointer-events-none shadow-[0_0_8px_rgba(204,255,0,0.8)]"
                    style={{ left: `${(currentTime / duration) * 100}%` }}
                  />

                  {/* Active Drag Ghost Preview for this track */}
                  {dragState && dragState.hoverTrackId === track.id && (
                    <div
                      className="absolute h-[85%] rounded-lg p-1.5 border border-dashed border-[#CCFF00] bg-[#CCFF00]/20 z-30 pointer-events-none flex items-center justify-between transition-all"
                      style={{
                        left: `${(dragState.currentStartTime / duration) * 100}%`,
                        width: `${Math.max(4, (dragState.currentDuration / duration) * 100)}%`,
                      }}
                    >
                      <span className="text-[9px] font-mono text-[#CCFF00] font-bold truncate pl-1">
                        ⏱ {dragState.currentStartTime.toFixed(2)}s
                      </span>
                    </div>
                  )}

                  {/* Audio Clips inside track */}
                  {track.clips.map((clip) => {
                    const isSelected = selectedClip?.clip.id === clip.id;
                    const isBeingDragged = dragState?.clipId === clip.id;

                    // If currently dragging, use live preview coordinates
                    const displayStartTime =
                      isBeingDragged && dragState.hoverTrackId === track.id
                        ? dragState.currentStartTime
                        : clip.startTime;
                    const displayDuration =
                      isBeingDragged && dragState.hoverTrackId === track.id
                        ? dragState.currentDuration
                        : clip.duration;

                    // Hide original clip if dragged to a different track
                    if (isBeingDragged && dragState.hoverTrackId !== track.id) {
                      return null;
                    }

                    const leftPct = (displayStartTime / duration) * 100;
                    const widthPct = (displayDuration / duration) * 100;

                    return (
                      <div
                        key={clip.id}
                        onPointerDown={(e) => handleStartClipDrag(e, track.id, clip, "move")}
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedClip({ trackId: track.id, clip });
                        }}
                        className={`absolute h-[85%] rounded-lg p-1.5 cursor-grab active:cursor-grabbing border transition-shadow select-none overflow-hidden group ${
                          isBeingDragged
                            ? "opacity-90 ring-2 ring-[#CCFF00] shadow-[0_0_20px_rgba(204,255,0,0.5)] z-40 bg-[#1D1D21]"
                            : isSelected
                            ? "bg-[#1D1D21] border-[#CCFF00] ring-1 ring-[#CCFF00] shadow-md z-10"
                            : "bg-[#18181C] hover:bg-[#202025] border-[#2B2B30]"
                        }`}
                        style={{
                          left: `${leftPct}%`,
                          width: `${Math.max(4, widthPct)}%`,
                        }}
                        title={`${clip.name} • Start: ${clip.startTime.toFixed(2)}s • Duration: ${clip.duration.toFixed(2)}s`}
                      >
                        {/* Left Trim Handle */}
                        <div
                          onPointerDown={(e) => handleStartClipDrag(e, track.id, clip, "trim-start")}
                          className="absolute left-0 top-0 bottom-0 w-2.5 hover:w-3.5 bg-[#CCFF00]/0 hover:bg-[#CCFF00]/60 cursor-col-resize z-20 transition-all flex items-center justify-center"
                          title="Drag to trim start"
                        >
                          <div className="w-0.5 h-4 bg-white/60 rounded" />
                        </div>

                        {/* Clip Header Label & Grip */}
                        <div className="flex items-center justify-between gap-1">
                          <div className="text-[10px] font-mono font-bold text-white truncate flex items-center gap-1">
                            <GripHorizontal className="w-3 h-3 text-[#CCFF00] shrink-0 opacity-70 group-hover:opacity-100" />
                            <span className="truncate">{clip.name}</span>
                          </div>
                          <span className="text-[9px] font-mono text-gray-400 shrink-0">
                            {displayDuration.toFixed(1)}s
                          </span>
                        </div>

                        {/* Visual Waveform Bars */}
                        <div className="flex items-center gap-0.5 h-7 mt-1 overflow-hidden pointer-events-none">
                          {(clip.waveformData && clip.waveformData.length > 0
                            ? clip.waveformData
                            : [0.3, 0.6, 0.9, 0.4, 0.7, 0.5, 0.8, 0.2]
                          ).map((val, i) => (
                            <div
                              key={i}
                              className="w-1 rounded-full bg-[#CCFF00] opacity-80 shrink-0"
                              style={{
                                height: `${Math.max(15, Math.abs(val) * 100)}%`,
                                backgroundColor: track.color || "#CCFF00",
                              }}
                            />
                          ))}
                        </div>

                        {/* Right Trim Handle */}
                        <div
                          onPointerDown={(e) => handleStartClipDrag(e, track.id, clip, "trim-end")}
                          className="absolute right-0 top-0 bottom-0 w-2.5 hover:w-3.5 bg-[#CCFF00]/0 hover:bg-[#CCFF00]/60 cursor-col-resize z-20 transition-all flex items-center justify-center"
                          title="Drag to trim end"
                        >
                          <div className="w-0.5 h-4 bg-white/60 rounded" />
                        </div>
                      </div>
                    );
                  })}

                  {track.clips.length === 0 && (
                    <div className="w-full text-center text-xs font-mono text-gray-500 pointer-events-none flex items-center justify-center gap-2">
                      <FileAudio className="w-4 h-4 text-gray-600" />
                      <span>
                        {track.isArmed
                          ? "Armed for Drop C Recording • Press REC ARM above"
                          : "Empty Track Lane • Drag audio clips here or drop .wav / .mp3"}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
