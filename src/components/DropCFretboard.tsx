import React, { useState } from "react";
import { AudioEngine } from "../audio/audioEngine";
import { DROP_C_STRINGS, METAL_SCALES } from "../audio/dropCData";
import { Volume2, Play, Sparkles } from "lucide-react";

interface DropCFretboardProps {
  selectedChordFrets?: (number | "x")[];
  chordName?: string;
}

export const DropCFretboard: React.FC<DropCFretboardProps> = ({
  selectedChordFrets,
  chordName,
}) => {
  const [activeScaleIndex, setActiveScaleIndex] = useState<number | null>(0);
  const [hoveredNote, setHoveredNote] = useState<{ stringIdx: number; fret: number; note: string } | null>(null);
  const audioEngine = AudioEngine.getInstance();

  const numFrets = 15; // Frets 0 to 15 displayed
  const fretMarkers = [3, 5, 7, 9, 12, 15];

  // String base notes: 0 = Low C (string 6), 5 = High D (string 1)
  // [C2, G2, C3, F3, A3, D4]
  const stringNotesBase = ["C", "G", "C", "F", "A", "D"];
  const chromaticScale = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];

  const getNoteAtFret = (stringIdx: number, fret: number): string => {
    const base = stringNotesBase[stringIdx];
    const baseIdx = chromaticScale.indexOf(base);
    return chromaticScale[(baseIdx + fret) % 12];
  };

  const handlePlayNote = (stringIdx: number, fret: number) => {
    audioEngine.init().then(() => {
      audioEngine.playDropCNote(stringIdx, fret, 0.7, false);
    });
  };

  const handlePlayBarreChug = (fret: number) => {
    audioEngine.init().then(() => {
      audioEngine.playDropCVoicing([fret, fret, fret, "x", "x", "x"], true, 0.5);
    });
  };

  const activeScale = activeScaleIndex !== null ? METAL_SCALES[activeScaleIndex] : null;

  return (
    <div id="drop-c-fretboard-container" className="bg-[#141416] border border-[#222226] rounded-2xl p-4 sm:p-5 shadow-2xl">
      {/* Header & Scale Selector */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-4 border-b border-[#222226]">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#CCFF00] shadow-[0_0_8px_rgba(204,255,0,0.8)]" />
            <h3 className="text-sm sm:text-base font-bold text-white font-mono tracking-widest uppercase">
              DROP C INTERACTIVE FRETBOARD
            </h3>
            <span className="px-2 py-0.5 text-[10px] font-mono font-bold uppercase bg-[#1D1D21] text-[#CCFF00] rounded border border-[#333338]">
              C2 - G2 - C3 - F3 - A3 - D4
            </span>
          </div>
          <p className="text-xs text-gray-400 mt-1">
            Click any fret to play high-gain note. In Drop C, low 3 strings (C-G-C) form 1-finger barre power chords.
          </p>
        </div>

        {/* Scale highlights */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs font-mono text-gray-400">Scale Overlay:</span>
          <select
            id="fretboard-scale-select"
            value={activeScaleIndex ?? ""}
            onChange={(e) => setActiveScaleIndex(e.target.value === "" ? null : Number(e.target.value))}
            className="bg-[#0A0A0B] border border-[#333338] text-xs text-gray-200 rounded-lg px-3 py-1.5 font-mono focus:border-[#CCFF00] outline-none cursor-pointer"
          >
            <option value="">None (Chords Only)</option>
            {METAL_SCALES.map((scale, i) => (
              <option key={scale.name} value={i}>
                {scale.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Scale Formula pill */}
      {activeScale && (
        <div className="mt-3 py-2 px-3.5 rounded-xl bg-[#0A0A0B] border border-[#222226] flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2">
            <Sparkles className="w-3.5 h-3.5 text-[#CCFF00]" />
            <span className="font-bold text-[#CCFF00] font-mono">{activeScale.name}:</span>
            <span className="text-gray-200 font-mono">{activeScale.formula}</span>
            <span className="text-gray-400">({activeScale.notes.join(" - ")})</span>
          </div>
          <span className="text-[11px] text-gray-400 italic">{activeScale.vibe}</span>
        </div>
      )}

      {/* Quick 1-Finger Barre Chug Shortcuts along bottom */}
      <div className="mt-3.5 flex items-center gap-1.5 overflow-x-auto pb-1 text-xs scrollbar-none">
        <span className="text-[10px] font-mono uppercase tracking-widest text-gray-500 whitespace-nowrap flex items-center gap-1">
          <Volume2 className="w-3 h-3 text-[#CCFF00]" /> Barre Chugs:
        </span>
        {[
          { fret: 0, label: "0 (C5 Root)" },
          { fret: 1, label: "1 (C#5 Tritone)" },
          { fret: 2, label: "2 (D5)" },
          { fret: 3, label: "3 (Eb5 Min3)" },
          { fret: 5, label: "5 (F5 4th)" },
          { fret: 7, label: "7 (G5 5th)" },
          { fret: 8, label: "8 (Ab5 Min6)" },
          { fret: 10, label: "10 (Bb5 Min7)" },
          { fret: 12, label: "12 (C5 Octave)" },
        ].map((item) => (
          <button
            key={item.fret}
            id={`barre-chug-btn-${item.fret}`}
            onClick={() => handlePlayBarreChug(item.fret)}
            className="px-2.5 py-1 rounded-lg bg-[#1D1D21] hover:bg-[#CCFF00] hover:text-black text-gray-300 border border-[#333338] hover:border-[#CCFF00] font-mono text-[11px] font-bold whitespace-nowrap transition-all flex items-center gap-1 cursor-pointer"
          >
            <Play className="w-2.5 h-2.5 fill-current" /> {item.label}
          </button>
        ))}
      </div>

      {/* Interactive Fretboard Visualizer */}
      <div className="mt-4 overflow-x-auto select-none pb-2">
        <div className="min-w-[760px] bg-[#0A0A0B] rounded-xl p-3 border border-[#222226] shadow-inner relative">
          {/* Fret Numbers on Top */}
          <div className="grid grid-cols-[50px_repeat(16,1fr)] gap-0 text-center font-mono text-[10px] text-gray-400 pb-1.5 border-b border-[#222226]">
            <div>STR</div>
            <div className="text-[#CCFF00] font-bold">NUT (0)</div>
            {Array.from({ length: numFrets }).map((_, i) => (
              <div key={i + 1} className={fretMarkers.includes(i + 1) ? "text-[#CCFF00] font-bold" : ""}>
                {i + 1}
              </div>
            ))}
          </div>

          {/* 6 Strings (Low C to High D) */}
          <div className="flex flex-col divide-y divide-[#1D1D21] mt-1">
            {DROP_C_STRINGS.slice()
              .reverse() // Display string 1 (High D) on top down to string 6 (Low C) on bottom
              .map((str, displayIdx) => {
                const actualStringIdx = 5 - displayIdx; // 0 for low C, 5 for high D
                const stringThickness = `${1.5 + (5 - actualStringIdx) * 0.7}px`;

                return (
                  <div
                    key={str.stringNumber}
                    className="grid grid-cols-[50px_repeat(16,1fr)] gap-0 items-center relative h-9 group/str"
                  >
                    {/* String label & target */}
                    <div className="flex items-center gap-1 font-mono text-xs text-gray-300 font-bold px-1">
                      <span className="w-4 text-center text-gray-400">{str.stringNumber}</span>
                      <span className="text-[#CCFF00]">{str.name}</span>
                    </div>

                    {/* Fret 0 (Nut / Open string) */}
                    <div className="relative h-full flex items-center justify-center border-r-2 border-[#333338] bg-[#141416]">
                      {/* String wire line */}
                      <div
                        className="absolute w-full bg-gradient-to-r from-gray-600 to-gray-400 opacity-80 pointer-events-none"
                        style={{ height: stringThickness }}
                      />

                      {/* Note button */}
                      {renderFretNode(actualStringIdx, 0)}
                    </div>

                    {/* Frets 1 to 15 */}
                    {Array.from({ length: numFrets }).map((_, fretIdx) => {
                      const fretNumber = fretIdx + 1;
                      const isFretMarker = fretMarkers.includes(fretNumber);
                      const isDoubleMarker = fretNumber === 12;

                      return (
                        <div
                          key={fretNumber}
                          className={`relative h-full flex items-center justify-center border-r border-[#222226] ${
                            isFretMarker ? "bg-[#141416]/50" : ""
                          }`}
                        >
                          {/* Fret marker dot */}
                          {displayIdx === 2 && isFretMarker && (
                            <div className="absolute pointer-events-none flex gap-1 z-0">
                              <div className="w-2 h-2 rounded-full bg-gray-700/60" />
                              {isDoubleMarker && <div className="w-2 h-2 rounded-full bg-gray-700/60" />}
                            </div>
                          )}

                          {/* String wire line */}
                          <div
                            className="absolute w-full bg-gradient-to-r from-gray-600 to-gray-400 opacity-80 pointer-events-none"
                            style={{ height: stringThickness }}
                          />

                          {/* Note Button */}
                          {renderFretNode(actualStringIdx, fretNumber)}
                        </div>
                      );
                    })}
                  </div>
                );
              })}
          </div>

          {/* Fretboard Wood Inlay markers along bottom */}
          <div className="grid grid-cols-[50px_repeat(16,1fr)] gap-0 text-center font-mono text-[9px] text-gray-500 pt-2 border-t border-[#222226]">
            <div></div>
            <div></div>
            {Array.from({ length: numFrets }).map((_, i) => {
              const f = i + 1;
              return (
                <div key={f} className="flex justify-center items-center">
                  {fretMarkers.includes(f) && (
                    <span className="w-1.5 h-1.5 rounded-full bg-[#CCFF00]/60 inline-block" />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Chord Info Footer */}
      {chordName && selectedChordFrets && (
        <div className="mt-3 p-3.5 rounded-xl bg-[#0A0A0B] border border-[#222226] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-[#CCFF00]">Selected Voicing:</span>
            <span className="text-sm font-bold text-white font-mono">{chordName}</span>
            <span className="text-xs font-mono text-gray-400">
              [{selectedChordFrets.map((f) => (f === "x" ? "X" : f)).join("-")}]
            </span>
          </div>
          <button
            onClick={() => {
              audioEngine.init().then(() => {
                audioEngine.playDropCVoicing(selectedChordFrets, false, 0.8);
              });
            }}
            className="px-3.5 py-1.5 rounded-lg bg-[#CCFF00] hover:bg-[#b8e600] text-black font-bold text-xs flex items-center gap-1.5 transition-all shadow-md cursor-pointer"
          >
            <Play className="w-3.5 h-3.5 fill-current" /> Play Voicing
          </button>
        </div>
      )}
    </div>
  );

  function renderFretNode(stringIdx: number, fret: number) {
    const note = getNoteAtFret(stringIdx, fret);
    const isRootC = note === "C";
    const isInScale = activeScale ? activeScale.notes.includes(note) : false;

    // Check if in selected chord
    const isChordFret =
      selectedChordFrets &&
      selectedChordFrets[stringIdx] !== undefined &&
      selectedChordFrets[stringIdx] !== "x" &&
      selectedChordFrets[stringIdx] === fret;

    // Note colors
    let bgClasses = "bg-[#1D1D21] text-gray-400 border-[#333338] hover:bg-[#25252b] hover:text-white";
    if (isChordFret) {
      bgClasses = "bg-[#CCFF00] text-black font-black border-[#CCFF00] shadow-[0_0_10px_rgba(204,255,0,0.9)] scale-110";
    } else if (isRootC) {
      bgClasses = "bg-red-600 text-white font-bold border-red-400 shadow-[0_0_6px_rgba(239,68,68,0.7)]";
    } else if (isInScale) {
      bgClasses = "bg-[#141416] text-[#CCFF00] font-bold border-[#CCFF00]/50";
    }

    return (
      <button
        id={`fret-node-${stringIdx}-${fret}`}
        onClick={() => handlePlayNote(stringIdx, fret)}
        onMouseEnter={() => setHoveredNote({ stringIdx, fret, note })}
        onMouseLeave={() => setHoveredNote(null)}
        className={`relative z-10 w-6 h-6 rounded-full border flex items-center justify-center font-mono text-[10px] transition-all transform active:scale-90 cursor-pointer ${bgClasses}`}
        title={`String ${6 - stringIdx} (${stringNotesBase[stringIdx]}), Fret ${fret}: Note ${note}`}
      >
        {note}
      </button>
    );
  }
};
