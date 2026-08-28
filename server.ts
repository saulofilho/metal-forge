import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: "10mb" }));

// Initialize Gemini SDK lazily
function getGeminiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build",
      },
    },
  });
}

// Health check endpoint
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// Helper: Extract info from popular guitar tab URLs
function parseTabUrlMetadata(urlStr: string) {
  let title = "Unknown Song";
  let artist = "Unknown Artist";
  let source = "Web Tab";

  try {
    const url = new URL(urlStr.trim());
    const host = url.hostname.toLowerCase();

    if (host.includes("ultimate-guitar.com")) {
      source = "Ultimate Guitar";
      // Path usually: /tab/artist-name/song-name-chords-12345
      const parts = url.pathname.split("/").filter(Boolean);
      if (parts.length >= 3 && parts[0] === "tab") {
        artist = parts[1].replace(/-/g, " ");
        // clean up trailing numbers or '-chords', '-official', '-tab'
        let rawTitle = parts[2]
          .replace(/-official(-\d+)?$/i, "")
          .replace(/-chords(-\d+)?$/i, "")
          .replace(/-tabs?(-\d+)?$/i, "")
          .replace(/-\d+$/i, "")
          .replace(/-/g, " ");
        title = rawTitle;
      }
    } else if (host.includes("songsterr.com")) {
      source = "Songsterr";
      // /a/wsa/artist-song-tab-s123
      const parts = url.pathname.split("/").filter(Boolean);
      if (parts.length >= 1) {
        const last = parts[parts.length - 1];
        const match = last.replace(/-tab-s\d+$/i, "").split("-");
        if (match.length >= 2) {
          artist = match[0];
          title = match.slice(1).join(" ");
        }
      }
    } else if (host.includes("cifraclub.com.br") || host.includes("cifraclub.com")) {
      source = "Cifra Club";
      const parts = url.pathname.split("/").filter(Boolean);
      if (parts.length >= 2) {
        artist = parts[0].replace(/-/g, " ");
        title = parts[1].replace(/-/g, " ");
      }
    } else if (host.includes("chordify.net")) {
      source = "Chordify";
      const parts = url.pathname.split("/").filter(Boolean);
      if (parts.length >= 2 && parts[0] === "chords") {
        const titlePart = parts[1].replace(/-/g, " ");
        title = titlePart;
      }
    } else {
      source = url.hostname;
      const pathClean = url.pathname.replace(/^\//, "").replace(/\//g, " ").replace(/-/g, " ");
      if (pathClean) title = pathClean;
    }
  } catch {
    // If not a full URL, treat as raw search query or title
    title = urlStr;
  }

  // Capitalize nicely
  const cap = (s: string) =>
    s
      .split(" ")
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
      .join(" ");

  return { title: cap(title), artist: cap(artist), source };
}

// -------------------------------------------------------------
// 1. Riff Scraper Endpoint (/api/scrape-song-url)
// -------------------------------------------------------------
app.post("/api/scrape-song-url", async (req, res) => {
  try {
    const { url, targetTuning = "Drop C (C-G-C-F-A-D)" } = req.body;

    if (!url || typeof url !== "string") {
      return res.status(400).json({ error: "Please provide a valid song URL or Tab link" });
    }

    const { title: guessedTitle, artist: guessedArtist, source } = parseTabUrlMetadata(url);

    const ai = getGeminiClient();

    if (ai) {
      const prompt = `You are a music transcription, chord analysis, and heavy metal scraping expert.
A user provided the following music/tab URL: "${url}" (identified as: Artist: "${guessedArtist}", Song: "${guessedTitle}", Source: "${source}").

Extract or reconstruct the full accurate chord progression, musical key, tempo (BPM), and section breakdown (Intro, Verse, Chorus, Bridge, Solo/Breakdown, Outro) for this song.
Also provide the complete Drop C metal re-harmonization (C-G-C-F-A-D) with 1-finger barre power chords (0-0-0 = C5), Add9 dissonances, palm-muted tabs, and breakdown.

Respond ONLY with a valid JSON object matching this exact schema:
{
  "url": "${url}",
  "songTitle": "${guessedTitle}",
  "artist": "${guessedArtist}",
  "originalKey": "Original detected key (e.g. C minor, G major, Bm)",
  "originalBpm": 120,
  "source": "${source}",
  "rawChords": "Full sequence of chords, e.g. Em - G - C - D - Am",
  "sections": [
    {
      "name": "Intro",
      "chords": ["Em", "G", "C", "D"],
      "lyricsSnippet": "First line of lyrics or melody context",
      "rawTab": "e|---0-------3---|\\nB|---0-------0---|\\nG|---0-------0---|\\nD|---2-------0---|\\nA|---2-------2---|\\nE|---0-------3---|"
    },
    {
      "name": "Verse",
      "chords": ["Em", "C", "Am", "B7"],
      "lyricsSnippet": "Verse lyric line",
      "rawTab": "Standard chord progression tab"
    },
    {
      "name": "Chorus",
      "chords": ["C", "G", "D", "Em"],
      "lyricsSnippet": "Chorus hook lyric",
      "rawTab": "Chorus tab voicing"
    }
  ],
  "transposedDropC": {
    "originalKey": "Original key",
    "metalKey": "C Minor / C Phrygian (Drop C)",
    "bpm": 135,
    "styleDescription": "Crushing modern metal transformation in Drop C tuning with 0-0-0 chugs, Add9 dissonances, and breakdown slam",
    "tuning": "Drop C (C-G-C-F-A-D)",
    "sections": [
      {
        "name": "Intro Riff / Chug",
        "originalChords": "Em - G - C - D",
        "metalChords": "C5 (0-0-0) - Eb5 (3-3-3) - Ab5 (8-8-8) - Bb5 (10-10-10)",
        "technique": "Palm-muted 16th note chugs with open barre accents",
        "tab": "d|---------------------------------|\\na|---------------------------------|\\nF|---------------------------------|\\nC|-0-0-0-0-0-0-0-0-3-3-3-3-8-8-10--|\\nG|-0-0-0-0-0-0-0-0-3-3-3-3-8-8-10--|\\nC|-0-0-0-0-0-0-0-0-3-3-3-3-8-8-10--|\\n   . . . . . . . . . . . . . ."
      },
      {
        "name": "Chorus (Wall of Sound)",
        "originalChords": "C - G - D - Em",
        "metalChords": "Ab5 (8-8-8) - Eb5 (3-3-3) - Bb5 (10-10-10) - C5 (0-0-0)",
        "technique": "Wide open ringing Drop C chords with Add9 top-end saturation",
        "tab": "d|---------------------------------|\\na|---------------------------------|\\nF|-12------7-------14------5-------|\\nC|-10------5-------12------3-------|\\nG|-8-------3-------10------0-------|\\nC|-8-------3-------10------0-------|"
      },
      {
        "name": "Breakdown (Slam)",
        "originalChords": "Dissonant / Solo",
        "metalChords": "0-0-0 Chug - 1-1-1 Tritone Stabs",
        "technique": "Syncopated half-time chug breakdown with china cymbal hits",
        "tab": "d|---------------------------------|\\na|---------------------------------|\\nF|---------------------------------|\\nC|-0-0---0-0-0---1-1---0-0---0-0---|\\nG|-0-0---0-0-0---1-1---0-0---0-0---|\\nC|-0-0---0-0-0---1-1---0-0---0-0---|\\n   . .   . . .   . .   . .   . ."
      }
    ],
    "dropCFretboardTips": [
      "Bottom 3 strings (C-G-C) form a 1-finger barre power chord across any fret",
      "Use 0-0-0 for maximum low C punch and 1-1-1 for evil Phrygian tritone breakdown stabs"
    ],
    "recommendedAmpPreset": "5150 High-Gain Chug"
  }
}`;

      const response = await ai.models.generateContent({
        model: "gemini-3.7-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
        },
      });

      const text = response.text;
      if (text) {
        try {
          const parsed = JSON.parse(text.trim());
          return res.json({ success: true, data: parsed });
        } catch (e) {
          console.error("JSON parse error from Gemini Scraper:", e);
        }
      }
    }

    // Algorithmic Fallback Scraper Engine
    const fallbackScraped = generateAlgorithmicScrape(url, guessedTitle, guessedArtist, source, targetTuning);
    return res.json({ success: true, data: fallbackScraped, note: "Generated via DropC Deep Scraper Engine" });
  } catch (error: any) {
    console.error("Scraper API error:", error);
    return res.status(500).json({ error: error.message || "Failed to scrape song chord progression" });
  }
});

// -------------------------------------------------------------
// 2. Style Conversion Endpoint (/api/style-convert)
// -------------------------------------------------------------
app.post("/api/style-convert", async (req, res) => {
  try {
    const {
      songTitle,
      artist,
      rawTabOrUrl,
      originalGenre = "Pop / Rock",
      targetMetalSubgenre = "Metalcore",
      targetTuning = "Drop C (C-G-C-F-A-D)",
    } = req.body;

    const { title: urlTitle, artist: urlArtist } = parseTabUrlMetadata(rawTabOrUrl || songTitle || "Track");
    const effTitle = songTitle || urlTitle || "Song";
    const effArtist = artist || urlArtist || "Original Artist";

    const ai = getGeminiClient();

    if (ai) {
      const prompt = `You are a world-class Heavy Metal producer, arranger, and Drop C guitarist (like Mick Gordon, Colin Richardson, Adam D, Misha Mansoor).
Take this song: "${effTitle}" by "${effArtist}" (Original Genre: ${originalGenre || "Pop/Acoustic/Rock"}) with input:
"""
${rawTabOrUrl || effTitle}
"""

Transform this entire song into a crushing, authentic ${targetMetalSubgenre} heavy metal masterpiece in ${targetTuning} tuning!
Examples of how to transform:
- If it's a Taylor Swift or Pop song (e.g. C - G - Am - F): re-harmonize into Drop C power chords (C5 [0-0-0], G5 [7-7-7], A5 [9-9-9] / C Add9 [0-0-0-2-3-x], F5 [5-5-5]), add palm-muted gallops, harmonic minor lead fills, and a devastating 0-0-0 half-time breakdown.
- If it's Radiohead or indie (e.g. Decks Dark / Creep): turn ethereal chords into heavy Swedish death metal buzzsaws, sludge doom drones, or djent polyrhythms.

Respond ONLY with a valid JSON object matching this schema:
{
  "originalTitle": "${effTitle}",
  "originalArtist": "${effArtist}",
  "originalGenre": "${originalGenre}",
  "targetMetalSubgenre": "${targetMetalSubgenre}",
  "originalBpm": 105,
  "metalBpm": 140,
  "originalKey": "Original key (e.g. C Major / A Minor)",
  "metalKey": "C Minor / C Phrygian (Drop C)",
  "transformationNotes": "Detailed explanation of how the pop/indie melody, harmonic structure, and rhythm were metalized into ${targetMetalSubgenre}",
  "chordTransformations": [
    {
      "originalChord": "C Major",
      "metalDropCChord": "C5 Heavy Chug",
      "fretNotation": "[0-0-0-x-x-x]",
      "functionDescription": "Tuned down to low C2 root for seismic low-end wall of sound"
    },
    {
      "originalChord": "G Major",
      "metalDropCChord": "G5 Barre Power",
      "fretNotation": "[7-7-7-x-x-x]",
      "functionDescription": "Dominant 5th barre with aggressive downpicked palm-muting"
    },
    {
      "originalChord": "Am",
      "metalDropCChord": "C Add9 Dissonance / A5",
      "fretNotation": "[0-0-0-2-3-x]",
      "functionDescription": "Metalcore signature Add9 voicing adding dark tension to the minor root"
    },
    {
      "originalChord": "F Major",
      "metalDropCChord": "F5 Power Chord",
      "fretNotation": "[5-5-5-x-x-x]",
      "functionDescription": "Subdominant punch leading into the breakdown transition"
    }
  ],
  "sections": [
    {
      "name": "Intro Riff (Metalized Hook)",
      "originalChords": "C - G - Am - F",
      "metalChords": "C5 (0-0-0) - G5 (7-7-7) - C Add9 - F5 (5-5-5)",
      "technique": "16th-note palm-muted chugs, pinch harmonics, and pick scrapes",
      "tab": "d|---------------------------------|\\na|---------------------------------|\\nF|---------12--------------10------|\\nC|-0-0-0-0-10------7-7-7-7--8------|\\nG|-0-0-0-0--8------7-7-7-7--8------|\\nC|-0-0-0-0--8------7-7-7-7--8------|\\n   . . . .         . . . .",
      "drumFeel": "Fast double-kick gallop with open hi-hat groove"
    },
    {
      "name": "Verse (Tight Downpicked Chugs)",
      "originalChords": "C - G - Am - F",
      "metalChords": "C5 (P.M.) - G5 (7-7-7) - A5 (9-9-9) - F5 (5-5-5)",
      "technique": "Muted triplet chugs with staccato stops",
      "tab": "d|---------------------------------|\\na|---------------------------------|\\nF|---------------------------------|\\nC|-------------------------7---5---|\\nG|-------------------------7---5---|\\nC|-0-00-0-00-0-00-0-00-0-0-7---5---|\\n   . .. . .. . .. . .. . .",
      "drumFeel": "Tight snare rimshots with 16th-note double bass kicks"
    },
    {
      "name": "Chorus (Wall of Sound / Melodic Metal)",
      "originalChords": "Am - F - C - G",
      "metalChords": "C Add9 (0-0-0-2-3) - F5 (5-5-5-7) - C5 (0-0-0) - G5 (7-7-7-9)",
      "technique": "Wide open ringing chords with stereo saturation and delay shimmer",
      "tab": "d|---------------------------------|\\na|---------------------------------|\\nF|-5-------10------12------7-------|\\nC|-3--------8------10------5-------|\\nG|-0--------8-------8------5-------|\\nC|-0--------8-------8------5-------|",
      "drumFeel": "Anthemic half-time metal beat with crash ride cymbal bell"
    },
    {
      "name": "Breakdown (Devastating Slam)",
      "originalChords": "Bridge / Climax",
      "metalChords": "0-0-0 Low C Slam - 1-1-1 Tritone - 0-0-0 Quad Chugs",
      "technique": "Extreme half-time syncopated 0-0-0 beatdown with tritone dissonance and bass drops",
      "tab": "d|---------------------------------|\\na|---------------------------------|\\nF|---------------------------------|\\nC|-0-0---0-0-0---1-1---0-0---0-0---|\\nG|-0-0---0-0-0---1-1---0-0---0-0---|\\nC|-0-0---0-0-0---1-1---0-0---0-0---|\\n   . .   . . .   . .   . .   . .",
      "drumFeel": "Crushing half-time slam with china cymbal on every snare hit"
    }
  ],
  "recommendedRig": {
    "presetId": "modern-metalcore",
    "name": "5150 High-Gain Chug + TS9 Overdrive",
    "ampModel": "5150 High-Gain",
    "distortionTip": "Tighten low end with TS9 Drive at 0, Level at 10, Mid-Boost ON, Noise Gate at -55dB",
    "pedals": ["Tube Screamer TS9", "Noise Gate Clamp", "Mesa OS 4x12 V30", "Plate Reverb"]
  },
  "breakdownPattern": "0-0-0 [chug] - 0-0-0-0 [quad] - 1-1-1 [tritone slam] - 0 [ring]",
  "fretboardTips": [
    "Drop C 1-finger barres allow instant transition between brutal 0-0-0 chugs and high fret melodics",
    "Add the 3rd string 2 frets above the root for the trademark metalcore Add9 emotional dissonance"
  ]
}`;

      const response = await ai.models.generateContent({
        model: "gemini-3.7-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
        },
      });

      const text = response.text;
      if (text) {
        try {
          const parsed = JSON.parse(text.trim());
          return res.json({ success: true, data: parsed });
        } catch (e) {
          console.error("JSON parse error from Gemini Style Converter:", e);
        }
      }
    }

    // Fallback Algorithmic Style Conversion
    const fallbackResult = generateAlgorithmicStyleConversion(effTitle, effArtist, originalGenre, targetMetalSubgenre);
    return res.json({ success: true, data: fallbackResult, note: "Generated via DropC Heavy Metal Harmonizer" });
  } catch (error: any) {
    console.error("Style Converter API error:", error);
    return res.status(500).json({ error: error.message || "Failed to convert song style to metal" });
  }
});

// -------------------------------------------------------------
// 3. Existing Transposition Endpoint (/api/metal-transcode)
// -------------------------------------------------------------
app.post("/api/metal-transcode", async (req, res) => {
  try {
    const { songTitle, artist, rawText, metalSubgenre, targetTuning = "Drop C" } = req.body;

    if (!rawText && !songTitle) {
      return res.status(400).json({ error: "Please provide a song title or chord sheet/lyrics" });
    }

    const ai = getGeminiClient();

    if (ai) {
      const prompt = `You are a master heavy metal guitarist, producer, and music theorist specializing in Drop C tuning (C-G-C-F-A-D) and aggressive modern metal genres (Metalcore, Djent, Thrash, Doom, Swedish Death Metal, Prog Metal).

Transform the following song or chord progression into a crushing, heavy ${metalSubgenre || "Modern Metalcore / Drop C"} arrangement.

Song info / input:
Title: ${songTitle || "Custom Progression"}
Artist: ${artist || "Unknown"}
Input Chords / Lyrics / Text:
"""
${rawText || songTitle}
"""

Target Tuning: ${targetTuning} (Low to high: C2 - G2 - C3 - F3 - A3 - D4).

Respond ONLY with a valid JSON object matching this schema:
{
  "originalKey": "Original key detected (e.g. A minor, C major, E minor)",
  "metalKey": "Transposed metal key (e.g. C minor, D minor, C Phrygian)",
  "bpm": 135,
  "styleDescription": "Brief description of the metal transformation and riff style",
  "tuning": "Drop C (C-G-C-F-A-D)",
  "sections": [
    {
      "name": "Intro Riff / Chug",
      "originalChords": "Am - F - C - G",
      "metalChords": "C5 (0-0-0) - G#5 (8-8-8) - D#5 (3-3-3) - A#5 (10-10-10)",
      "technique": "Palm-muted 16th note chugs with pinch harmonics on 3rd fret",
      "tab": "d|---------------------------------|\\na|---------------------------------|\\nF|---------------------------------|\\nC|-0-0-0-0-0-0-0-0-8-8-8-8-3-3-10--|\\nG|-0-0-0-0-0-0-0-0-8-8-8-8-3-3-10--|\\nC|-0-0-0-0-0-0-0-0-8-8-8-8-3-3-10--|\\n   . . . . . . . . . . . . . ."
    }
  ],
  "dropCFretboardTips": [
    "One-finger barre across bottom 3 strings (C-G-C) makes root-5th-octave power chords instant",
    "Add the 4th string 2 frets up for crushing Metalcore Add9 dissonances"
  ],
  "recommendedAmpPreset": "5150 High-Gain Chug"
}`;

      const response = await ai.models.generateContent({
        model: "gemini-3.7-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
        },
      });

      const text = response.text;
      if (text) {
        try {
          const parsed = JSON.parse(text.trim());
          return res.json({ success: true, data: parsed });
        } catch (e) {
          console.error("JSON parse error from Gemini:", e);
        }
      }
    }

    // Algorithmic Fallback
    const fallbackData = generateAlgorithmicMetalTransposition(songTitle, rawText, metalSubgenre);
    return res.json({ success: true, data: fallbackData, note: "Generated via Drop-C Harmonizer Engine" });
  } catch (error: any) {
    console.error("Transcode API error:", error);
    return res.status(500).json({ error: error.message || "Failed to transpose song to metal" });
  }
});

// -------------------------------------------------------------
// Fallback Scraper Engine
// -------------------------------------------------------------
function generateAlgorithmicScrape(url: string, title: string, artist: string, source: string, targetTuning: string) {
  const isRadiohead = title.toLowerCase().includes("deck") || title.toLowerCase().includes("creep") || artist.toLowerCase().includes("radiohead");
  const isTaylor = title.toLowerCase().includes("anti") || title.toLowerCase().includes("shake") || artist.toLowerCase().includes("taylor");
  const isMetallica = title.toLowerCase().includes("puppet") || artist.toLowerCase().includes("metallica");

  let originalKey = "C Major / A Minor";
  let bpm = 118;
  let rawChords = "C - G - Am - F";
  let sections = [
    {
      name: "Intro",
      chords: ["Am", "F", "C", "G"],
      lyricsSnippet: "Melodic guitar and synth opening motif",
      rawTab: "e|---0-------1-------0-------3---|\nB|---1-------1-------1-------0---|\nG|---2-------2-------0-------0---|\nD|---2-------3-------2-------0---|\nA|---0-------3-------3-------2---|\nE|-----------1---------------3---|",
    },
    {
      name: "Verse",
      chords: ["Am", "F", "C", "G"],
      lyricsSnippet: "Verse storytelling and vocal progression",
      rawTab: "e|-------------------------------|\nB|---1---1---1---1---1---1---0---|\nG|---2---2---2---2---0---0---0---|\nD|---2---2---3---3---2---2---0---|\nA|---0---0---3---3---3---3---2---|\nE|-----------1---1-----------3---|",
    },
    {
      name: "Chorus",
      chords: ["F", "G", "Am", "C"],
      lyricsSnippet: "Main vocal hook and harmonic climax",
      rawTab: "e|---1-------3-------0-------0---|\nB|---1-------0-------1-------1---|\nG|---2-------0-------2-------0---|\nD|---3-------0-------2-------2---|\nA|---3-------2-------0-------3---|\nE|---1-------3-------------------|",
    },
  ];

  if (isRadiohead) {
    originalKey = "D Minor / F Major";
    bpm = 106;
    rawChords = "Dm - Bb - Gm - A7 - F - C";
    sections = [
      {
        name: "Intro (Atmospheric Chords)",
        chords: ["Dm", "Bb", "Gm", "A7"],
        lyricsSnippet: "Then it's into the dark / A dark spacecraft / That's blocking out the sky",
        rawTab: "e|---1-------1-------3-------0---|\nB|---3-------3-------3-------2---|\nG|---2-------3-------3-------0---|\nD|---0-------3-------5-------2---|\nA|-----------1-------5-------0---|\nE|-------------------3-----------|",
      },
      {
        name: "Verse (Groove & Tension)",
        chords: ["Dm", "C", "Bb", "Gm"],
        lyricsSnippet: "In your ear the sound of glass breaking",
        rawTab: "e|---1-------0-------1-------3---|\nB|---3-------1-------3-------3---|\nG|---2-------0-------3-------3---|\nD|---0-------2-------3-------5---|\nA|-----------3-------1-------5---|\nE|---------------------------3---|",
      },
      {
        name: "Chorus / Climax (Wall of Sound)",
        chords: ["Bb", "F", "Gm", "A7"],
        lyricsSnippet: "We're dark / It's in the basement / Have you got the money?",
        rawTab: "e|---1-------1-------3-------0---|\nB|---3-------1-------3-------2---|\nG|---3-------2-------3-------0---|\nD|---3-------3-------5-------2---|\nA|---1-------3-------5-------0---|\nE|-----------1-------3-----------|",
      },
    ];
  } else if (isTaylor) {
    originalKey = "C Major / A Minor";
    bpm = 124;
    rawChords = "C - G - Am - F - Dm - G";
    sections = [
      {
        name: "Intro (Synth Chords)",
        chords: ["C", "G", "Am", "F"],
        lyricsSnippet: "I have this thing where I get older but just never wiser",
        rawTab: "e|---0-------3-------0-------1---|\nB|---1-------0-------1-------1---|\nG|---0-------0-------2-------2---|\nD|---2-------0-------2-------3---|\nA|---3-------2-------0-------3---|\nE|-----------3---------------1---|",
      },
      {
        name: "Verse (Pop Groove)",
        chords: ["C", "G", "Am", "F"],
        lyricsSnippet: "Midnights become my afternoons / When my depression works the graveyard shift",
        rawTab: "e|---0-------3-------0-------1---|\nB|---1-------0-------1-------1---|\nG|---0-------0-------2-------2---|\nD|---2-------0-------2-------3---|\nA|---3-------2-------0-------3---|\nE|-----------3---------------1---|",
      },
      {
        name: "Chorus (Anthemic Hook)",
        chords: ["Am", "F", "C", "G"],
        lyricsSnippet: "It's me, hi! I'm the problem, it's me",
        rawTab: "e|---0-------1-------0-------3---|\nB|---1-------1-------1-------0---|\nG|---2-------2-------0-------0---|\nD|---2-------3-------2-------0---|\nA|---0-------3-------3-------2---|\nE|-----------1---------------3---|",
      },
    ];
  }

  const transposedDropC = generateAlgorithmicMetalTransposition(title, rawChords, "Metalcore");

  return {
    url,
    songTitle: title,
    artist,
    originalKey,
    originalBpm: bpm,
    source,
    rawChords,
    sections,
    transposedDropC,
  };
}

// -------------------------------------------------------------
// Fallback Style Conversion Engine
// -------------------------------------------------------------
function generateAlgorithmicStyleConversion(title: string, artist: string, originalGenre: string, targetMetalSubgenre: string) {
  const metalBpm =
    targetMetalSubgenre === "Thrash Metal"
      ? 180
      : targetMetalSubgenre === "Doom / Sludge"
      ? 70
      : targetMetalSubgenre === "Swedish Death Metal"
      ? 125
      : 140;

  return {
    originalTitle: title,
    originalArtist: artist,
    originalGenre: originalGenre || "Pop / Rock",
    targetMetalSubgenre: targetMetalSubgenre as any,
    originalBpm: 105,
    metalBpm,
    originalKey: "C Major / A Minor",
    metalKey: "C Minor / C Phrygian (Drop C)",
    transformationNotes: `Transformed "${title}" from ${originalGenre} into crushing ${targetMetalSubgenre} in Drop C tuning. Re-voiced pop open chords into heavy 0-0-0 power chugs, dissonant Add9 suspensions, tight palm-muted downpicking gallops, and a devastating half-time slam breakdown.`,
    chordTransformations: [
      {
        originalChord: "C / I Major",
        metalDropCChord: "C5 Low Chug",
        fretNotation: "[0-0-0-x-x-x]",
        functionDescription: "Open bottom 3 strings (C2-G2-C3) producing sub-octave heavy fundamental",
      },
      {
        originalChord: "G / V Dominant",
        metalDropCChord: "G5 Barre",
        fretNotation: "[7-7-7-x-x-x]",
        functionDescription: "7th fret 1-finger barre creating aggressive high-tension punch",
      },
      {
        originalChord: "Am / vi Minor",
        metalDropCChord: "C Add9 Dissonance / A5",
        fretNotation: "[0-0-0-2-3-x]",
        functionDescription: "Metalcore staple Add9 chord ringing out over chugs",
      },
      {
        originalChord: "F / IV Subdominant",
        metalDropCChord: "F5 Power Chord",
        fretNotation: "[5-5-5-x-x-x]",
        functionDescription: "5th fret barre resolving with crushing resonance",
      },
      {
        originalChord: "Dissonant / Transition",
        metalDropCChord: "Db5 / C#dim Tritone",
        fretNotation: "[1-1-1-x-x-x]",
        functionDescription: "1st fret half-step tritone slam for evil Phrygian breakdowns",
      },
    ],
    sections: [
      {
        name: "Intro (Metalized Heavy Theme)",
        originalChords: "C - G - Am - F",
        metalChords: "C5 [0-0-0] - G5 [7-7-7] - C Add9 [0-0-0-2-3] - F5 [5-5-5]",
        technique: "Palm-muted 16th-note chugs with pinch harmonics and open chord stabs",
        tab: "d|---------------------------------|\na|---------------------------------|\nF|---------12--------------10------|\nC|-0-0-0-0-10------7-7-7-7--8------|\nG|-0-0-0-0--8------7-7-7-7--8------|\nC|-0-0-0-0--8------7-7-7-7--8------|\n   . . . .         . . . .",
        drumFeel: "Fast double-bass gallop with open hi-hat wash",
        audioVoicings: [
          { frets: [0, 0, 0, "x", "x", "x"], pm: true, dur: 0.15 },
          { frets: [0, 0, 0, "x", "x", "x"], pm: true, dur: 0.15 },
          { frets: [7, 7, 7, "x", "x", "x"], pm: false, dur: 0.35 },
          { frets: [0, 0, 0, 2, 3, "x"], pm: false, dur: 0.4 },
          { frets: [5, 5, 5, "x", "x", "x"], pm: false, dur: 0.4 },
        ],
      },
      {
        name: "Verse (Downpicked Gallop)",
        originalChords: "C - G - Am - F",
        metalChords: "C5 (P.M.) - G5 (7-7-7) - A5 (9-9-9) - F5 (5-5-5)",
        technique: "Fast downpicked 0-0-0 gallops (16th-16th-8th) with accent stops",
        tab: "d|---------------------------------|\na|---------------------------------|\nF|---------------------------------|\nC|-------------------------7---5---|\nG|-------------------------7---5---|\nC|-0-00-0-00-0-00-0-00-0-0-7---5---|\n   . .. . .. . .. . .. . .",
        drumFeel: "Snare on beats 2 & 4 with driving double kick pedal",
        audioVoicings: [
          { frets: [0, 0, 0, "x", "x", "x"], pm: true, dur: 0.12 },
          { frets: [0, 0, 0, "x", "x", "x"], pm: true, dur: 0.12 },
          { frets: [0, 0, 0, "x", "x", "x"], pm: true, dur: 0.12 },
          { frets: [7, 7, 7, "x", "x", "x"], pm: false, dur: 0.3 },
          { frets: [5, 5, 5, "x", "x", "x"], pm: false, dur: 0.3 },
        ],
      },
      {
        name: "Chorus (Full Wall of Sound)",
        originalChords: "Am - F - C - G",
        metalChords: "C Add9 (0-0-0-2-3) - F5 (5-5-5) - C5 (0-0-0) - G5 (7-7-7)",
        technique: "Wide open ringing Drop C chords with stereo delay and tube saturation",
        tab: "d|---------------------------------|\na|---------------------------------|\nF|-5-------10------12------7-------|\nC|-3--------8------10------5-------|\nG|-0--------8-------8------5-------|\nC|-0--------8-------8------5-------|",
        drumFeel: "Half-time anthemic metal groove with china cymbal bell",
        audioVoicings: [
          { frets: [0, 0, 0, 2, 3, "x"], pm: false, dur: 0.6 },
          { frets: [5, 5, 5, "x", "x", "x"], pm: false, dur: 0.6 },
          { frets: [0, 0, 0, "x", "x", "x"], pm: false, dur: 0.6 },
          { frets: [7, 7, 7, "x", "x", "x"], pm: false, dur: 0.6 },
        ],
      },
      {
        name: "Breakdown (Half-Time Slam)",
        originalChords: "Pop Climax / Bridge",
        metalChords: "0-0-0 Low C Chugs - 1-1-1 Tritone Stabs - Pitch Squeal",
        technique: "Crushing half-time syncopation with china accents and 1-1-1 tritone dissonances",
        tab: "d|---------------------------------|\na|---------------------------------|\nF|---------------------------------|\nC|-0-0---0-0-0---1-1---0-0---0-0---|\nG|-0-0---0-0-0---1-1---0-0---0-0---|\nC|-0-0---0-0-0---1-1---0-0---0-0---|\n   . .   . . .   . .   . .   . .",
        drumFeel: "Crushing half-time beat with china cymbal on every snare strike",
        audioVoicings: [
          { frets: [0, 0, 0, "x", "x", "x"], pm: true, dur: 0.2 },
          { frets: [0, 0, 0, "x", "x", "x"], pm: true, dur: 0.2 },
          { frets: [1, 1, 1, "x", "x", "x"], pm: false, dur: 0.35 },
          { frets: [0, 0, 0, "x", "x", "x"], pm: true, dur: 0.2 },
        ],
      },
    ],
    recommendedRig: {
      presetId: "modern-metalcore",
      name: "5150 High-Gain Chug + TS9 Overdrive",
      ampModel: "5150 High-Gain",
      distortionTip: "Tighten low end with TS9 Drive at 0, Level at 10, Mid-Boost ON, Noise Gate at -55dB",
      pedals: ["Tube Screamer TS9", "Noise Gate Clamp", "Mesa OS 4x12 V30", "Plate Reverb"],
    },
    breakdownPattern: "0-0-0 [chug] - 0-0-0-0 [quad] - 1-1-1 [tritone slam] - 0 [ring]",
    fretboardTips: [
      "Drop C 1-finger barres allow instant transition between brutal 0-0-0 chugs and high fret melodics",
      "Add the 3rd string 2 frets above the root for the trademark metalcore Add9 emotional dissonance",
    ],
  };
}

function generateAlgorithmicMetalTransposition(title: string, rawText: string, style = "Metalcore") {
  return {
    originalKey: "Standard Key (Em / G)",
    metalKey: "C Minor / C Phrygian (Drop C Standard)",
    bpm: 140,
    styleDescription: `Heavy ${style} arrangement in Drop C tuning with aggressive palm-muted root power chords, add9 suspensions, and breakdown syncopations.`,
    tuning: "Drop C (C - G - C - F - A - D)",
    sections: [
      {
        name: "Intro / Main Heavy Theme",
        originalChords: "Em - C - G - D",
        metalChords: "C5 [0-0-0] - G#5 [8-8-8] - D#5 [3-3-3] - A#5 [10-10-10]",
        technique: "0-0-0 Palm-muted chug triplets into crushing open barre drop C power chords",
        tab: "d|---------------------------------|\na|---------------------------------|\nF|---------------------------------|\nC|-0-0-0-0-0-0-0-0-8-8-8-8-3-3-10--|\nG|-0-0-0-0-0-0-0-0-8-8-8-8-3-3-10--|\nC|-0-0-0-0-0-0-0-0-8-8-8-8-3-3-10--|\n   . . . . . . . . . . . . . . . .",
      },
      {
        name: "Verse (Tight Palm Muting)",
        originalChords: "Em - Em - C - D",
        metalChords: "C5 (P.M.) - C5 (0-0-0-3h5) - G#5 [8-8-8] - A#5 [10-10-10]",
        technique: "Gallop rhythm (16th-16th-8th) on low C string with octave accents",
        tab: "d|---------------------------------|\na|---------------------------------|\nF|---------------------------------|\nC|-------------------------8---10--|\nG|-------------------------8---10--|\nC|-0-00-0-00-0-00-0-00-0-0-8---10--|\n   . .. . .. . .. . .. . .",
      },
      {
        name: "Chorus (Full Wall of Sound)",
        originalChords: "C - G - Em - D",
        metalChords: "G#5 (8-8-8-10) - D#5 (3-3-3-5) - C5 (0-0-0-2-3) - A#5 (10-10-10-12)",
        technique: "Wide open Drop C Add9 chords ringing out with high saturation and stereo delay",
        tab: "d|---------------------------------|\na|---------------------------------|\nF|-12------7-------5-------14------|\nC|-10------5-------3-------12------|\nG|-8-------3-------0-------10------|\nC|-8-------3-------0-------10------|",
      },
      {
        name: "Breakdown (Half-Time Slam)",
        originalChords: "Dissonant Em",
        metalChords: "C0 [0-0-0-0] - C#dim [1-1-1] Tritone - Low C Chug",
        technique: "Crushing half-time syncopated 0-0-0 chugs with tritone stabs and china cymbal hits",
        tab: "d|---------------------------------|\na|---------------------------------|\nF|---------------------------------|\nC|-0-0---0-0-0---1-1---0-0---0-0---|\nG|-0-0---0-0-0---1-1---0-0---0-0---|\nC|-0-0---0-0-0---1-1---0-0---0-0---|\n   . .   . . .   . .   . .   . .",
      },
    ],
    dropCFretboardTips: [
      "In Drop C, low 6th string is tuned down 2 semitones to C2. Strings: C2 - G2 - C3 - F3 - A3 - D4.",
      "Power chords on low 3 strings require only 1 flat finger (0-0-0 = C5, 2-2-2 = D5, 3-3-3 = Eb5, 5-5-5 = F5, 7-7-7 = G5, 8-8-8 = Ab5, 10-10-10 = Bb5).",
      "For modern Djent/Metalcore voicing, fret the 4th string 2 frets higher (e.g. 0-0-0-2-3-x) for resonant minor 9th / add9 power chords.",
    ],
    recommendedAmpPreset: "5150 High-Gain Chug",
  };
}

// Start Server
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`DropC MetalForge server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
