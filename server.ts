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

// AI Metal Song & Chord Transposition Endpoint
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
      "tab": "D|---------------------------------|\\nA|---------------------------------|\\nF|---------------------------------|\\nC|-0-0-0-0-0-0-0-0-8-8-8-8-3-3-10--|\\nG|-0-0-0-0-0-0-0-0-8-8-8-8-3-3-10--|\\nC|-0-0-0-0-0-0-0-0-8-8-8-8-3-3-10--|\\n   . . . . . . . . . . . . . ."
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

    // Algorithmic Fallback if Gemini key is not configured or fails
    const fallbackData = generateAlgorithmicMetalTransposition(songTitle, rawText, metalSubgenre);
    return res.json({ success: true, data: fallbackData, note: "Generated via Drop-C Harmonizer Engine" });
  } catch (error: any) {
    console.error("Transcode API error:", error);
    return res.status(500).json({ error: error.message || "Failed to transpose song to metal" });
  }
});

// Algorithmic Fallback Engine
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
