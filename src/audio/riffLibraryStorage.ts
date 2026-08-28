import { SavedRiffItem, MetalSubgenre } from "../types";

const STORAGE_KEY = "dropc_metalforge_saved_riffs_v1";

export const DEFAULT_SAVED_RIFFS: SavedRiffItem[] = [
  {
    id: "riff-radiohead-decks-dark-hm2",
    title: "Decks Dark (Swedish Death Metal)",
    originalArtist: "Radiohead",
    originalGenre: "Art Rock / Ambient",
    subgenre: "Swedish Death Metal",
    originalKey: "D Minor",
    metalKey: "C Minor / C Phrygian",
    bpm: 125,
    tuning: "Drop C (C-G-C-F-A-D)",
    sourceType: "converted",
    sourceUrl: "https://tabs.ultimate-guitar.com/tab/radiohead/decks-dark-official-4270984",
    tags: ["Radiohead", "HM-2 Buzzsaw", "Dissonant", "Breakdown"],
    isFavorite: true,
    createdAt: "2026-08-28T07:00:00.000Z",
    updatedAt: "2026-08-28T07:00:00.000Z",
    userNotes: "Chainsaw Stockholm guitar tone with crushing low C palm-mutes and eerie octave chords.",
    recommendedRig: {
      presetId: "swedish-chainsaw",
      name: "Stockholm Buzzsaw (Boss HM-2 Maxed)",
      ampModel: "Marshall JCM800 + HM-2",
      distortionTip: "Crank HM-2 High and Low controls to 10 for authentic chainsaw buzz.",
      pedals: ["HM-2 Chainsaw Fuzz", "Noise Gate", "Mesa 4x12"],
    },
    breakdownPattern: "0-0-0 [chug] - 0-0-0-0 [quad] - 1-1-1 [tritone slam] - 0 [ring]",
    sections: [
      {
        name: "Intro (HM-2 Buzzsaw Theme)",
        originalChords: "Dm - Bb - Gm - A7",
        metalChords: "C5 [0-0-0] - G#5 [8-8-8] - D#5 [3-3-3] - A#5 [10-10-10]",
        technique: "Full Stockholm chainsaw tremolo and low palm-muted 16th chugs",
        tab: "d|---------------------------------|\na|---------------------------------|\nF|---------12--------------10------|\nC|-0-0-0-0-10------8-8-8-8--8------|\nG|-0-0-0-0--8------8-8-8-8--8------|\nC|-0-0-0-0--8------8-8-8-8--8------|\n   . . . .         . . . .",
      },
      {
        name: "Verse (Melodic Death Gallop)",
        originalChords: "Dm - C - Bb - Gm",
        metalChords: "C5 (P.M.) - A#5 (10-10-10) - G#5 (8-8-8) - F5 (5-5-5)",
        technique: "Fast Swedish downpicking gallop with harmonic pinch accents",
        tab: "d|---------------------------------|\na|---------------------------------|\nF|---------------------------------|\nC|-------------------------8---5---|\nG|-------------------------8---5---|\nC|-0-00-0-00-0-00-0-00-0-0-8---5---|\n   . .. . .. . .. . .. . .",
      },
      {
        name: "Breakdown (Devastating Half-Time)",
        originalChords: "Atmospheric Climax",
        metalChords: "0-0-0 Low C Slam - 1-1-1 Tritone Stabs",
        technique: "Crushing half-time syncopation with china cymbal on every snare hit",
        tab: "d|---------------------------------|\na|---------------------------------|\nF|---------------------------------|\nC|-0-0---0-0-0---1-1---0-0---0-0---|\nG|-0-0---0-0-0---1-1---0-0---0-0---|\\nC|-0-0---0-0-0---1-1---0-0---0-0---|\n   . .   . . .   . .   . .   . .",
      },
    ],
    chordTransformations: [
      {
        originalChord: "Dm / i",
        metalDropCChord: "C5 Low Chug",
        fretNotation: "[0-0-0-x-x-x]",
        functionDescription: "Re-pitched to low C2 root for massive fundamental weight",
      },
      {
        originalChord: "Bb / VI",
        metalDropCChord: "G#5 Barre",
        fretNotation: "[8-8-8-x-x-x]",
        functionDescription: "8th fret 1-finger barre power chord",
      },
      {
        originalChord: "Gm / iv",
        metalDropCChord: "D#5 Barre",
        fretNotation: "[3-3-3-x-x-x]",
        functionDescription: "3rd fret Drop C barre punch",
      },
    ],
  },
  {
    id: "riff-taylor-anti-hero-metalcore",
    title: "Anti-Hero (0-0-0 Metalcore Slam)",
    originalArtist: "Taylor Swift",
    originalGenre: "Pop / Synth",
    subgenre: "Metalcore",
    originalKey: "C Major",
    metalKey: "C Minor / C Phrygian",
    bpm: 142,
    tuning: "Drop C (C-G-C-F-A-D)",
    sourceType: "converted",
    sourceUrl: "https://tabs.ultimate-guitar.com/tab/taylor-swift/anti-hero-chords-4389025",
    tags: ["Taylor Swift", "Metalcore", "Add9 Voicing", "Chug Breakdown"],
    isFavorite: true,
    createdAt: "2026-08-28T07:01:00.000Z",
    updatedAt: "2026-08-28T07:01:00.000Z",
    userNotes: "Pop synth hook transformed into blistering metalcore riff with Add9 chorus and 0-0-0 beatdown.",
    recommendedRig: {
      presetId: "modern-metalcore",
      name: "5150 High-Gain Chug + TS9 Overdrive",
      ampModel: "5150 High-Gain",
      distortionTip: "TS9 level 10, drive 0, tight gate clamping.",
      pedals: ["Tube Screamer", "Noise Gate Clamp", "Mesa OS 4x12"],
    },
    breakdownPattern: "0-0-0 [chug] - 0-0-0-0 [quad] - 1-1-1 [tritone slam] - 0 [ring]",
    sections: [
      {
        name: "Intro (Metalized Pop Hook)",
        originalChords: "C - G - Am - F",
        metalChords: "C5 (0-0-0) - G5 (7-7-7) - C Add9 (0-0-0-2-3) - F5 (5-5-5)",
        technique: "Palm-muted 16th chugs with pinch harmonics and open chord stabs",
        tab: "d|---------------------------------|\na|---------------------------------|\nF|---------12--------------10------|\nC|-0-0-0-0-10------7-7-7-7--8------|\nG|-0-0-0-0--8------7-7-7-7--8------|\nC|-0-0-0-0--8------7-7-7-7--8------|\n   . . . .         . . . .",
      },
      {
        name: "Chorus (Add9 Wall of Sound)",
        originalChords: "Am - F - C - G",
        metalChords: "C Add9 (0-0-0-2-3) - F5 (5-5-5) - C5 (0-0-0) - G5 (7-7-7)",
        technique: "Wide open ringing chords with stereo saturation and delay shimmer",
        tab: "d|---------------------------------|\na|---------------------------------|\nF|-5-------10------12------7-------|\nC|-3--------8------10------5-------|\nG|-0--------8-------8------5-------|\nC|-0--------8-------8------5-------|",
      },
      {
        name: "Breakdown ('It's Me, Hi' Slam)",
        originalChords: "Pop Bridge",
        metalChords: "0-0-0 Low C Slam - 1-1-1 Tritone Stabs",
        technique: "Syncopated half-time 0-0-0 slam with china cymbal on 2 and 4",
        tab: "d|---------------------------------|\na|---------------------------------|\nF|---------------------------------|\nC|-0-0---0-0-0---1-1---0-0---0-0---|\nG|-0-0---0-0-0---1-1---0-0---0-0---|\nC|-0-0---0-0-0---1-1---0-0---0-0---|\n   . .   . . .   . .   . .   . .",
      },
    ],
  },
  {
    id: "riff-deftones-change-dropc",
    title: "Change (In the House of Flies)",
    originalArtist: "Deftones",
    originalGenre: "Alt-Metal",
    subgenre: "Nu-Metal",
    originalKey: "D Minor",
    metalKey: "C Minor (Drop C Low)",
    bpm: 105,
    tuning: "Drop C (C-G-C-F-A-D)",
    sourceType: "scraped",
    sourceUrl: "https://tabs.ultimate-guitar.com/tab/deftones/change-in-the-house-of-flies-tabs-12847",
    tags: ["Deftones", "Nu-Metal", "Dissonance", "Atmospheric"],
    isFavorite: true,
    createdAt: "2026-08-28T07:02:00.000Z",
    updatedAt: "2026-08-28T07:02:00.000Z",
    userNotes: "Signature Deftones octave-scrape chords with heavy low-end chorus wash.",
    recommendedRig: {
      presetId: "nu-metal-groove",
      name: "Deftones Atmospheric Wall of Sound",
      ampModel: "Mesa Dual Rectifier + Chorus",
      distortionTip: "Thick low-mid rumble with lush analog chorus pedal in front.",
      pedals: ["Analog Chorus", "Dual Rectifier", "Tape Delay"],
    },
    sections: [
      {
        name: "Intro & Verse (Eerie Whispers)",
        originalChords: "Dm - F - Bb",
        metalChords: "C Octave (0-x-0-12-x-x) - Eb5 (3-3-3) - Ab5 (8-8-8)",
        technique: "Loose open string scrapes with chorus and plate reverb",
        tab: "d|---------------------------------|\na|---------------------------------|\nF|---10--10--10--10---12--12--12--12|\nC|----0---0---0---0----0---0---0---0|\nG|----8---8---8---8---10--10--10--10|\nC|-0----------------0--------------|",
      },
      {
        name: "Chorus (Heavy Wall of Sound)",
        originalChords: "Dm - Bb - C - F",
        metalChords: "C5 [0-0-0] - Ab5 [8-8-8] - Bb5 [10-10-10] - Eb5 [3-3-3]",
        technique: "Full 6-string Drop C strumming with heavy tube overdrive",
        tab: "d|---------------------------------|\na|---------------------------------|\nF|---------------------------------|\nC|-0-0-0-0-8-8-8-8-10-10-10-10-3-3-3|\nG|-0-0-0-0-8-8-8-8-10-10-10-10-3-3-3|\nC|-0-0-0-0-8-8-8-8-10-10-10-10-3-3-3|",
      },
    ],
  },
  {
    id: "riff-radiohead-creep-djent",
    title: "Creep (Djent 7/8 Polyrhythm)",
    originalArtist: "Radiohead",
    originalGenre: "90s Alt-Rock",
    subgenre: "Djent",
    originalKey: "G Major",
    metalKey: "C Phrygian / C Djent",
    bpm: 130,
    tuning: "Drop C (C-G-C-F-A-D)",
    sourceType: "converted",
    sourceUrl: "https://tabs.ultimate-guitar.com/tab/radiohead/creep-chords-4169",
    tags: ["Radiohead", "Djent", "Polyrhythm", "Thall", "Tight Gate"],
    isFavorite: false,
    createdAt: "2026-08-28T07:03:00.000Z",
    updatedAt: "2026-08-28T07:03:00.000Z",
    userNotes: "Reconstructed into syncopated 7/8 thall stabs with noise gate clamping.",
    recommendedRig: {
      presetId: "djent-periphery",
      name: "Tight Djent (Gate & Horizon Drive)",
      ampModel: "Peavey Invective + Horizon Drive",
      distortionTip: "Hard gate clamp, attack boost on highs, bass roll-off.",
      pedals: ["Horizon Precision Drive", "Zuul Gate", "Zilla 4x12"],
    },
    sections: [
      {
        name: "Verse (Syncopated Thall Chugs)",
        originalChords: "G - B - C - Cm",
        metalChords: "0-0-0 [staccato] - 6-6-6 [tritone] - 7-7-7 - 7-7-6",
        technique: "7/8 time signature staccato downstrokes with gate clamping",
        tab: "d|---------------------------------|\na|---------------------------------|\nF|---------------------------------|\nC|-0-0---0-0-0---0---6-6---7-7-7---|\nG|-0-0---0-0-0---0---6-6---7-7-7---|\nC|-0-0---0-0-0---0---6-6---7-7-7---|\n   . .   . . .   .   . .   . . .",
      },
    ],
  },
  {
    id: "riff-nirvana-teen-spirit-sludge",
    title: "Smells Like Teen Spirit (Sludge Doom)",
    originalArtist: "Nirvana",
    originalGenre: "Grunge",
    subgenre: "Doom / Sludge",
    originalKey: "F Minor",
    metalKey: "C Sludge Doom (Drop C)",
    bpm: 68,
    tuning: "Drop C (C-G-C-F-A-D)",
    sourceType: "converted",
    sourceUrl: "https://tabs.ultimate-guitar.com/tab/nirvana/smells-like-teen-spirit-chords-807283",
    tags: ["Nirvana", "Sludge", "Doom", "Fuzz", "Slow Heavy"],
    isFavorite: false,
    createdAt: "2026-08-28T07:04:00.000Z",
    updatedAt: "2026-08-28T07:04:00.000Z",
    userNotes: "Iconic 4-chord progression slowed to 68 BPM with suffocating low fuzz and sustained feedback.",
    recommendedRig: {
      presetId: "doom-sludge-fuzz",
      name: "Electric Wizard Fuzz Drone",
      ampModel: "Orange Thunderverb + Big Muff",
      distortionTip: "Russian Big Muff fuzz maxed into saturated EL34 power amp.",
      pedals: ["Green Russian Big Muff", "Orange 4x12", "Analog Delay"],
    },
    sections: [
      {
        name: "Main Riff (Low Fuzz Drag)",
        originalChords: "F - Bb - Ab - Db",
        metalChords: "C5 [0-0-0] - F5 [5-5-5] - Eb5 [3-3-3] - Ab5 [8-8-8]",
        technique: "Slow dragged downstrokes with thick sustain and sub-octave rumble",
        tab: "d|---------------------------------|\na|---------------------------------|\nF|---------------------------------|\nC|-0~~~~~~~~~~~5~~~~~~~~~3~~~~~8~~~|\nG|-0~~~~~~~~~~~5~~~~~~~~~3~~~~~8~~~|\nC|-0~~~~~~~~~~~5~~~~~~~~~3~~~~~8~~~|",
      },
    ],
  },
];

export class RiffLibraryStorage {
  private static instance: RiffLibraryStorage;
  private riffs: SavedRiffItem[] = [];

  private constructor() {
    this.loadFromStorage();
  }

  public static getInstance(): RiffLibraryStorage {
    if (!RiffLibraryStorage.instance) {
      RiffLibraryStorage.instance = new RiffLibraryStorage();
    }
    return RiffLibraryStorage.instance;
  }

  private loadFromStorage(): void {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          this.riffs = parsed;
          return;
        }
      }
    } catch (e) {
      console.warn("Could not parse saved riffs from localStorage:", e);
    }
    // Pre-seed with default curated riffs
    this.riffs = [...DEFAULT_SAVED_RIFFS];
    this.persist();
  }

  private persist(): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.riffs));
    } catch (e) {
      console.error("Failed to save riffs to localStorage:", e);
    }
  }

  public getAll(): SavedRiffItem[] {
    return [...this.riffs];
  }

  public getById(id: string): SavedRiffItem | undefined {
    return this.riffs.find((r) => r.id === id);
  }

  public saveRiff(riff: Omit<SavedRiffItem, "id" | "createdAt" | "updatedAt"> & { id?: string }): SavedRiffItem {
    const now = new Date().toISOString();
    const existingIdx = riff.id ? this.riffs.findIndex((r) => r.id === riff.id) : -1;

    if (existingIdx >= 0) {
      const updated: SavedRiffItem = {
        ...this.riffs[existingIdx],
        ...riff,
        id: this.riffs[existingIdx].id,
        updatedAt: now,
      };
      this.riffs[existingIdx] = updated;
      this.persist();
      return updated;
    } else {
      const newRiff: SavedRiffItem = {
        ...riff,
        id: riff.id || `riff-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
        createdAt: now,
        updatedAt: now,
      };
      this.riffs.unshift(newRiff);
      this.persist();
      return newRiff;
    }
  }

  public deleteRiff(id: string): boolean {
    const initialLen = this.riffs.length;
    this.riffs = this.riffs.filter((r) => r.id !== id);
    if (this.riffs.length !== initialLen) {
      this.persist();
      return true;
    }
    return false;
  }

  public toggleFavorite(id: string): boolean {
    const riff = this.riffs.find((r) => r.id === id);
    if (riff) {
      riff.isFavorite = !riff.isFavorite;
      riff.updatedAt = new Date().toISOString();
      this.persist();
      return riff.isFavorite;
    }
    return false;
  }

  public updateNotes(id: string, notes: string): void {
    const riff = this.riffs.find((r) => r.id === id);
    if (riff) {
      riff.userNotes = notes;
      riff.updatedAt = new Date().toISOString();
      this.persist();
    }
  }

  public addTag(id: string, tag: string): void {
    const riff = this.riffs.find((r) => r.id === id);
    if (riff && tag.trim() && !riff.tags.includes(tag.trim())) {
      riff.tags.push(tag.trim());
      riff.updatedAt = new Date().toISOString();
      this.persist();
    }
  }

  public removeTag(id: string, tag: string): void {
    const riff = this.riffs.find((r) => r.id === id);
    if (riff) {
      riff.tags = riff.tags.filter((t) => t !== tag);
      riff.updatedAt = new Date().toISOString();
      this.persist();
    }
  }

  public resetToDefaults(): void {
    this.riffs = [...DEFAULT_SAVED_RIFFS];
    this.persist();
  }

  public exportJson(): string {
    return JSON.stringify(this.riffs, null, 2);
  }

  public importJson(jsonStr: string): { success: boolean; count: number; error?: string } {
    try {
      const parsed = JSON.parse(jsonStr);
      if (!Array.isArray(parsed)) {
        return { success: false, count: 0, error: "JSON must be an array of riff items." };
      }
      let count = 0;
      for (const item of parsed) {
        if (item.title && item.sections && Array.isArray(item.sections)) {
          this.saveRiff({
            title: item.title,
            originalArtist: item.originalArtist || "Unknown",
            originalGenre: item.originalGenre,
            subgenre: (item.subgenre as MetalSubgenre) || "Metalcore",
            originalKey: item.originalKey,
            metalKey: item.metalKey || "C Minor",
            bpm: item.bpm || 135,
            tuning: item.tuning || "Drop C (C-G-C-F-A-D)",
            sourceType: item.sourceType || "manual",
            sourceUrl: item.sourceUrl,
            tags: Array.isArray(item.tags) ? item.tags : [],
            isFavorite: !!item.isFavorite,
            userNotes: item.userNotes,
            sections: item.sections,
            chordTransformations: item.chordTransformations,
            recommendedRig: item.recommendedRig,
            breakdownPattern: item.breakdownPattern,
          });
          count++;
        }
      }
      return { success: true, count };
    } catch (e: any) {
      return { success: false, count: 0, error: e.message || "Invalid JSON syntax." };
    }
  }
}
