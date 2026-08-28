/**
 * DropC MetalForge - Shared Types & Interfaces
 */

export type MetalSubgenre =
  | "Metalcore"
  | "Djent"
  | "Thrash Metal"
  | "Swedish Death Metal"
  | "Doom / Sludge"
  | "Prog Metal"
  | "Nu-Metal"
  | "Black Metal";

export type TuningPreset =
  | "Drop C (C-G-C-F-A-D)"
  | "Drop D (D-A-D-G-B-E)"
  | "D Standard (D-G-C-F-A-D)"
  | "Standard E (E-A-D-G-B-E)"
  | "Drop B (B-F#-B-E-G#-C#)"
  | "Drop A (A-E-A-D-F#-B)";

export interface GuitarStringNote {
  stringNumber: number; // 1 = high D, 6 = low C
  name: string; // e.g. "C2"
  note: string; // e.g. "C"
  octave: number; // e.g. 2
  targetFreq: number; // e.g. 65.41 Hz
}

export interface ChordVoicing {
  chordName: string;
  metalName: string; // e.g. "C5 Heavy Chug", "C Add9 Dissonance"
  fretPositions: (number | "x")[]; // 6 strings from low to high: [0, 0, 0, 2, 3, "x"]
  fingering?: string[];
  description: string;
  isBarre: boolean;
  metalType: "Power Chord" | "Add9 / Metalcore" | "Tritone / Diminished" | "Djent Inversion" | "Open Resonant";
}

export interface SongSection {
  name: string;
  originalChords: string;
  metalChords: string;
  technique: string;
  tab: string;
}

export interface TransposedSongData {
  originalKey: string;
  metalKey: string;
  bpm: number;
  styleDescription: string;
  tuning: string;
  sections: SongSection[];
  dropCFretboardTips: string[];
  recommendedAmpPreset: string;
}

export interface AmpParams {
  // Gate
  gateEnabled: boolean;
  gateThreshold: number; // -80 to -20 dB
  gateRelease: number; // 0.01 to 0.5 s

  // Signal Normalizer (Pre-Distortion Input Conditioner & Acoustic/Clean Clean-Up)
  normalizerEnabled?: boolean;
  normalizerProfile?: "Acoustic / Piezo" | "Direct Single-Coil" | "Hot Humbucker" | "Active Pickups" | "Custom / Manual";
  normalizerThreshold?: number; // -40 to 0 dB (e.g. -18 dB)
  normalizerRatio?: number; // 1 to 20 (e.g. 4:1)
  normalizerAttack?: number; // 0.001 to 0.05 s (1ms to 50ms, e.g. 0.005)
  normalizerRelease?: number; // 0.02 to 0.5 s (20ms to 500ms, e.g. 0.08)
  normalizerMakeupGain?: number; // 0 to +18 dB (e.g. +3 dB)
  normalizerLowCut?: number; // 20 to 300 Hz (e.g. 80 Hz, anti-boom / body rumble)
  normalizerHighCut?: number; // 4000 to 20000 Hz (e.g. 12000 Hz, anti-fizz / clack)
  normalizerDeMud?: number; // -12 to +6 dB cut around 400 Hz (e.g. -3 dB)

  // Overdrive (Tube Screamer TS9)
  driveEnabled: boolean;
  driveGain: number; // 0 to 10
  driveTone: number; // 0 to 10
  driveLevel: number; // 0 to 10
  driveMidBoost: boolean;

  // Preamp & Amp Head
  ampModel: "5150 High-Gain" | "Mesa Dual Rectifier" | "Diezel VH4" | "ENGL Savage" | "Marshall JCM800" | "HM-2 Chainsaw";
  gain: number; // 0 to 10
  bass: number; // 0 to 10
  middle: number; // 0 to 10
  treble: number; // 0 to 10
  presence: number; // 0 to 10
  resonance: number; // 0 to 10
  master: number; // 0 to 10

  // Cabinet & Mic
  cabModel: "Mesa OS 4x12 V30" | "Marshall 1960A Greenback" | "ENGL Pro V30" | "Peavey 5150 Sheffield" | "Orange PPC412" | "Diezel 4x12";
  micType: "Shure SM57 Dynamic" | "Royer R-121 Ribbon" | "Sennheiser MD421";
  micPlacement: "Center" | "Cap-Edge" | "Cone" | "Off-Axis";
  cabAir: number; // 0 to 10

  // 5-Band Metal Graphic EQ
  eqEnabled: boolean;
  eq80Hz: number; // -12 to +12 dB
  eq250Hz: number;
  eq750Hz: number; // Scoop or push
  eq2200Hz: number;
  eq6000Hz: number;

  // Modulation (Chorus / Flanger)
  chorusEnabled: boolean;
  chorusRate: number; // 0.1 to 5 Hz
  chorusDepth: number; // 0 to 10
  chorusMix: number; // 0 to 10

  // Delay
  delayEnabled: boolean;
  delayTime: number; // 50 to 1000 ms or sync fractions
  delayFeedback: number; // 0 to 10
  delayMix: number; // 0 to 10
  delayPingPong?: boolean;

  // Reverb
  reverbEnabled: boolean;
  reverbType: "Catacomb Hall" | "Plate Metal" | "Dark Room" | "Shimmer Ambient";
  reverbDecay: number; // 0.5 to 10 s
  reverbMix: number; // 0 to 10

  // Output Gain-Staging & Normalization Trim
  gainStageTrim?: number; // -12 to +12 dB output trim for preset level matching (default 0 dB)
}

export type PresetCategory = "All" | "High-Gain" | "Clean" | "Experimental" | "Custom";

export interface PresetUsageStat {
  count: number;
  lastUsed: number; // epoch timestamp in ms
}

export interface AmpPreset {
  id: string;
  name: string;
  subgenre: MetalSubgenre;
  category?: "High-Gain" | "Clean" | "Experimental" | "Custom";
  description: string;
  iconName: string;
  params: AmpParams;
}

export interface AbPresetSlot {
  name: string;
  presetId?: string;
  params: AmpParams;
  timestamp: number;
}

export interface MidiMapping {
  action: "preset" | "toggle_drive" | "toggle_delay" | "toggle_mute" | "tap_tempo" | "daw_record" | "daw_play" | "toggle_ab";
  targetPresetId?: string;
  messageType: "pc" | "cc" | "note";
  channel: number; // 0-15 (or -1 for any)
  number: number; // CC number or Note number or PC number
  description: string;
}

export interface MidiDevice {
  id: string;
  name: string;
  manufacturer: string;
  state: string;
  type: "input" | "output";
}

export interface AudioClip {
  id: string;
  name: string;
  startTime: number; // in seconds on the timeline
  duration: number; // in seconds
  audioBuffer?: AudioBuffer;
  blobUrl?: string;
  waveformData?: number[];
  fadeIn?: number; // seconds
  fadeOut?: number; // seconds
  volume: number; // 0 to 2 (1 = 0dB)
  pan?: number; // -1 (left) to +1 (right)
  pitchShift?: number;
  pitchShiftSemitones?: number; // -12 to +12
  isReversed?: boolean;
  color?: string;
}

export interface DawTrack {
  id: string;
  name: string;
  trackType?: "rhythm_l" | "rhythm_r" | "lead" | "drums_bass" | "custom";
  color: string;
  volume: number; // 0 to 1.5
  pan: number; // -1 (L) to +1 (R)
  isMuted: boolean;
  isSolo: boolean;
  isArmed: boolean;
  clips: AudioClip[];
}

export type DrumBeatPattern =
  | "0-0-0 Breakdown Heavy"
  | "Double Bass Gallop (Thrash)"
  | "Blast Beat (Death/Black)"
  | "Half-Time Groove (Metalcore)"
  | "Djent Polyrhythm (7/8 & 4/4)"
  | "Classic 4/4 Hard Rock"
  | "Slow Sludge Doom (60 BPM)"
  | "None / Click Only";

export type StrumPatternFeel = "sustain" | "chug8ths" | "chug16ths" | "gallop" | "syncopated" | "muted";

export interface BacktrackerChordItem {
  id: string;
  chordName: string;
  metalName?: string;
  fretPositions: (number | "x")[];
  durationBeats: number; // 1, 2, 3, 4 beats
  isPalmMute?: boolean;
  strumPattern?: StrumPatternFeel;
  tabSnippet?: string;
}

export interface BacktrackerProgressionPreset {
  id: string;
  title: string;
  subgenre: MetalSubgenre;
  defaultBpm: number;
  drumPattern: DrumBeatPattern;
  strumFeel: StrumPatternFeel;
  description: string;
  chords: BacktrackerChordItem[];
}

export interface ScrapedSongSection {
  name: string;
  chords: string[];
  lyricsSnippet?: string;
  rawTab?: string;
}

export interface ScrapedSongResult {
  url: string;
  songTitle: string;
  artist: string;
  originalKey: string;
  originalBpm: number;
  source: string;
  rawChords: string;
  sections: ScrapedSongSection[];
  transposedDropC?: TransposedSongData;
}

export interface ChordTransformItem {
  originalChord: string;
  metalDropCChord: string;
  fretNotation: string;
  functionDescription: string;
}

export interface StyleConvertedSection {
  name: string;
  originalChords: string;
  metalChords: string;
  technique: string;
  tab: string;
  drumFeel: string;
  audioVoicings?: { frets: (number | "x")[]; pm: boolean; dur: number }[];
}

export interface StyleConversionResult {
  originalTitle: string;
  originalArtist: string;
  originalGenre: string;
  targetMetalSubgenre: MetalSubgenre;
  originalBpm: number;
  metalBpm: number;
  originalKey: string;
  metalKey: string;
  transformationNotes: string;
  chordTransformations: ChordTransformItem[];
  sections: StyleConvertedSection[];
  recommendedRig: {
    presetId: string;
    name: string;
    ampModel: string;
    distortionTip: string;
    pedals: string[];
  };
  breakdownPattern?: string;
  fretboardTips: string[];
}

export type TransposedSongSection = SongSection;

export interface SavedRiffItem {
  id: string;
  title: string;
  originalArtist: string;
  originalGenre?: string;
  subgenre: MetalSubgenre;
  originalKey?: string;
  metalKey: string;
  bpm: number;
  tuning: string;
  sourceType: "scraped" | "converted" | "manual" | "preset";
  sourceUrl?: string;
  tags: string[];
  isFavorite: boolean;
  createdAt: string;
  updatedAt: string;
  userNotes?: string;
  sections: SongSection[];
  chordTransformations?: ChordTransformItem[];
  recommendedRig?: {
    presetId: string;
    name: string;
    ampModel: string;
    distortionTip?: string;
    pedals?: string[];
  };
  breakdownPattern?: string;
}

export interface TunerResult {
  frequency: number;
  note: string;
  octave: number;
  cents: number; // -50 to +50
  targetString: GuitarStringNote | null;
  isInTune: boolean;
  clarity: number; // 0 to 1 (confidence)
}
