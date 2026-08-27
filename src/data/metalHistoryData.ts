export interface MetalEra {
  id: string;
  period: string;
  title: string;
  subtitle: string;
  badge: string;
  color: string;
  summary: string;
  keyInnovations: string[];
  definingBands: string[];
  iconicAlbums: { artist: string; album: string; year: number; tuning: string; standoutTrack: string }[];
  guitarToneTech: string;
}

export interface MetalSubgenre {
  id: string;
  name: string;
  era: string;
  tuning: string;
  bpmRange: string;
  color: string;
  recommendedPresetId: string;
  riffType: "chug" | "gallop" | "add9" | "breakdown" | "ambient";
  description: string;
  toneCharacteristics: {
    ampModel: string;
    pedals: string[];
    eqCurve: string;
    technique: string;
  };
  pioneerBands: { name: string; country: string; keyGuitarist: string; signatureGear: string }[];
  essentialAlbums: { artist: string; title: string; year: number; track: string }[];
  harmonicFeatures: string[];
}

export interface MetalGuitarLore {
  id: string;
  title: string;
  category: "Gear Secret" | "Tuning Lore" | "Production Milestone" | "Riff Theory";
  iconName: string;
  summary: string;
  details: string;
  keyArtists: string[];
}

export const METAL_ERAS: MetalEra[] = [
  {
    id: "era-genesis",
    period: "1968 - 1979",
    title: "The Genesis & Proto-Doom",
    subtitle: "The Tritone & High-Wattage Valve Amplification",
    badge: "1st Generation",
    color: "#f59e0b",
    summary:
      "Heavy metal was born from the industrial smog of Birmingham, UK. Black Sabbath popularized the 'Diabolus in Musica' (augmented fourth / diminished fifth), tuned down to C# Standard due to Tony Iommi's fingertip prosthetics, while Deep Purple and Led Zeppelin pushed Marshall and Laney full-stacks to acoustic overdrive limits.",
    keyInnovations: [
      "Use of the medieval forbidden Tritone (♭5 interval) for menacing dread",
      "Power chords (Root + 5th) eliminating muddy 3rds under heavy distortion",
      "Accidental genesis of down-tuning (Tony Iommi slackened strings to C# Standard)",
      "Treble booster (Dallas Rangemaster) into dimed valve amplifiers",
    ],
    definingBands: ["Black Sabbath", "Led Zeppelin", "Deep Purple", "Judas Priest", "Motörhead", "Rainbow"],
    iconicAlbums: [
      { artist: "Black Sabbath", album: "Paranoid", year: 1970, tuning: "E Standard", standoutTrack: "War Pigs" },
      { artist: "Black Sabbath", album: "Master of Reality", year: 1971, tuning: "C# Standard", standoutTrack: "Into the Void" },
      { artist: "Deep Purple", album: "Machine Head", year: 1972, tuning: "E Standard", standoutTrack: "Highway Star" },
      { artist: "Judas Priest", album: "Sad Wings of Destiny", year: 1976, tuning: "E Standard", standoutTrack: "Victim of Changes" },
      { artist: "Motörhead", album: "Overkill", year: 1979, tuning: "E♭ Standard", standoutTrack: "Overkill" },
    ],
    guitarToneTech: "Laney Supergroup / Marshall Plexi cranked to power-tube saturation, Dallas Rangemaster Treble Booster, Gibson SG with light gauges.",
  },
  {
    id: "era-thrash",
    period: "1980 - 1988",
    title: "NWOBHM & Thrash Aggression",
    subtitle: "Galloping Downpicking, Palm-Mutes & Scooped Mids",
    badge: "2nd Generation",
    color: "#ef4444",
    summary:
      "The New Wave of British Heavy Metal (Iron Maiden, Judas Priest) married punk tempo with dual-guitar harmony. In California and the Bay Area, Metallica, Slayer, and Megadeth stripped away glam tropes to pioneer high-speed downpicked palm muting and surgical razor-sharp treble bite.",
    keyInnovations: [
      "Strict downpicking at 200+ BPM (James Hetfield rhythm masterclass)",
      "Gallop rhythm pattern (1-sixteenth + 2-thirty-seconds / 'da-da-dum')",
      "Modified Marshall JCM800 (Jose Arredondo mod) with cascaded gain stages",
      "Dual harmonized melodic guitar lines in thirds and fifths (Maiden, Mercyful Fate)",
    ],
    definingBands: ["Metallica", "Slayer", "Megadeth", "Iron Maiden", "Anthrax", "Judas Priest", "Celtic Frost"],
    iconicAlbums: [
      { artist: "Iron Maiden", album: "The Number of the Beast", year: 1982, tuning: "E Standard", standoutTrack: "Hallowed Be Thy Name" },
      { artist: "Metallica", album: "Master of Puppets", year: 1986, tuning: "E Standard", standoutTrack: "Master of Puppets" },
      { artist: "Slayer", album: "Reign in Blood", year: 1986, tuning: "E♭ Standard", standoutTrack: "Angel of Death" },
      { artist: "Megadeth", album: "Peace Sells... but Who's Buying?", year: 1986, tuning: "E Standard", standoutTrack: "Peace Sells" },
      { artist: "Anthrax", album: "Among the Living", year: 1987, tuning: "E Standard", standoutTrack: "Caught in a Mosh" },
    ],
    guitarToneTech: "Mesa/Boogie Mark IIC+ (Graphic EQ 'V-shape' scoop), Marshall JCM800 2203 with Ibanez TS9 / Boss SD-1 overdrive boost.",
  },
  {
    id: "era-extreme",
    period: "1989 - 1995",
    title: "Extreme Metal & The Swedish Chainsaw",
    subtitle: "Death Metal, Black Metal & Low-Tuning Dominance",
    badge: "3rd Generation",
    color: "#a855f7",
    summary:
      "Florida and Gothenburg spawned Death Metal. Chuck Schuldiner (Death) and Carcass introduced complex anatomical riffs and down-tuning to D Standard. Simultaneously in Stockholm, Sunlight Studio (Entombed, Dismember) invented the iconic HM-2 'buzzsaw' guitar sound with all pedal knobs maxed out.",
    keyInnovations: [
      "Stockholm 'Chainsaw' distortion: Boss HM-2 Heavy Metal with all 4 knobs dimed into clean Peavey/Marshall",
      "Blast beats (traditional, bomb blast, gravity rolls) by Gene Hoglan and Pete Sandoval",
      "D Standard (D-G-C-F-A-D) and Drop D becoming genre standards for guttural resonance",
      "Norwegian Black Metal cold tremolo picking and atmospheric open-chord dissonances",
    ],
    definingBands: ["Death", "Entombed", "Morbid Angel", "Carcass", "Cannibal Corpse", "Pantera", "Mayhem", "Dissection"],
    iconicAlbums: [
      { artist: "Death", album: "Symbolic", year: 1995, tuning: "D Standard", standoutTrack: "Crystal Mountain" },
      { artist: "Entombed", album: "Left Hand Path", year: 1990, tuning: "D Standard / B", standoutTrack: "Left Hand Path" },
      { artist: "Pantera", album: "Vulgar Display of Power", year: 1992, tuning: "D♭ (¼ step down)", standoutTrack: "Walk" },
      { artist: "Morbid Angel", album: "Altars of Madness", year: 1989, tuning: "E♭ Standard", standoutTrack: "Immortal Rites" },
      { artist: "Carcass", album: "Heartwork", year: 1993, tuning: "B Standard", standoutTrack: "Heartwork" },
    ],
    guitarToneTech: "Peavey 5150 (Eddie Van Halen signature, 1992), Boss HM-2 Chainsaw, Randall Century 200 (Dimebag Darrell solid-state razor bite).",
  },
  {
    id: "era-metalcore-dropc",
    period: "1996 - 2004",
    title: "Nu-Metal, Metalcore & The Drop C Revolution",
    subtitle: "The Golden Era of Drop C (C-G-C-F-A-D) & Dual-Rectifier Walls",
    badge: "The Drop C Era",
    color: "#CCFF00",
    summary:
      "Drop C became the undisputed king of guitar tunings. Nu-metal (Slipknot, Deftones, SOAD) utilized the deep 65.4Hz Low C for seismic bounce and groove. Meanwhile, the New Wave of American Heavy Metal / Metalcore (Killswitch Engage, As I Lay Dying, Avenged Sevenfold) combined Swedish melodic death metal twin harmonies with crushing one-finger Drop C breakdowns.",
    keyInnovations: [
      "Standardization of Drop C (C-G-C-F-A-D): 10-52 'Skinny Top Heavy Bottom' strings on 25.5-inch scale guitars",
      "One-finger barre power chords allowing lightning-fast 0-0-0 chugs and fretboard shifts",
      "The Modern Metalcore Formula: Melodic Swedish chorus + Add9 dissonance + Brutal half-time breakdown",
      "Maxon OD808 / Ibanez TS9 boost in front of high-gain amps with Gain at 0, Level at 10 to tighten low-end",
    ],
    definingBands: [
      "Killswitch Engage",
      "Slipknot",
      "System of a Down",
      "As I Lay Dying",
      "Deftones",
      "Avenged Sevenfold",
      "Trivium",
      "Shadows Fall",
      "Bullet for My Valentine",
    ],
    iconicAlbums: [
      { artist: "Killswitch Engage", album: "The End of Heartache", year: 2004, tuning: "Drop C", standoutTrack: "The End of Heartache" },
      { artist: "System of a Down", album: "Toxicity", year: 2001, tuning: "Drop C", standoutTrack: "Chop Suey!" },
      { artist: "Slipknot", album: "Iowa", year: 2001, tuning: "Drop B / Drop A", standoutTrack: "People = Shit" },
      { artist: "As I Lay Dying", album: "Frail Words Collapse", year: 2003, tuning: "Drop C", standoutTrack: "94 Hours" },
      { artist: "Avenged Sevenfold", album: "Waking the Fallen", year: 2003, tuning: "Drop D / Drop C", standoutTrack: "Unholy Confessions" },
      { artist: "Deftones", album: "White Pony", year: 2000, tuning: "Drop C", standoutTrack: "Change (In the House of Flies)" },
    ],
    guitarToneTech: "Peavey 5150 / 6505+ & Mesa Dual Rectifier multi-mic blend with Celestion Vintage 30s, TS9 overdrive, ISP Decimator gate.",
  },
  {
    id: "era-djent-prog",
    period: "2005 - 2015",
    title: "Djent, Prog Metal & Extended Range",
    subtitle: "Meshuggah Syncopation, Digital DSP & Laser-Tight Gates",
    badge: "5th Generation",
    color: "#06b6d4",
    summary:
      "Pioneered by Fredrik Thordendal & Mårten Hagström (Meshuggah) and popularized by Misha Mansoor (Periphery), 'Djent' revolutionized metal tone. Characterized by high-mid pick clank, zero bass overhang, multi-stage noise gating, 7/8-string guitars, and complex polymetric time signatures.",
    keyInnovations: [
      "Ultra-fast clamping noise gates (clamping within 1ms for staccato silence between notes)",
      "High-pass filtering in front of distortion (cutting everything below 120Hz before hitting the preamp)",
      "Polymeter and additive rhythm: 4/4 drum cymbal pulse against 17/16 or 23/16 syncopated guitar chugs",
      "Rise of Digital Modeler/Profiling Tech (Fractal Axe-FX, Kemper Profiler, Line 6 Helix)",
    ],
    definingBands: ["Meshuggah", "Periphery", "Animals as Leaders", "Architects", "Bring Me The Horizon", "Gojira", "Whitechapel"],
    iconicAlbums: [
      { artist: "Meshuggah", album: "obZen", year: 2008, tuning: "8-String F Standard", standoutTrack: "Bleed" },
      { artist: "Periphery", album: "Periphery II: This Time It's Personal", year: 2012, tuning: "Drop C / Drop Ab", standoutTrack: "Scarlet" },
      { artist: "Architects", album: "Lost Forever // Lost Together", year: 2014, tuning: "Drop C# / Drop B", standoutTrack: "Naysayer" },
      { artist: "Gojira", album: "From Mars to Sirius", year: 2005, tuning: "D Standard", standoutTrack: "Flying Whales" },
      { artist: "Animals as Leaders", album: "The Joy of Motion", year: 2014, tuning: "8-String EAEADGBE", standoutTrack: "Physical Education" },
    ],
    guitarToneTech: "Fractal Axe-FX / Neural DSP, Precision Drive, Bare Knuckle Aftermath pickups, 7/8 String guitars, Lundgren M8 pickups.",
  },
  {
    id: "era-modern-thall",
    period: "2016 - Present",
    title: "Modern Metal, Thall & Neo-Math",
    subtitle: "Pitch-Shifting, Thall Low-End & Cyber-Symphonic Hybrids",
    badge: "Current Era",
    color: "#3b82f6",
    summary:
      "Today's heavy music blends virtuoso math-rock guitar dexterity (Polyphia, Ichika Nito), subterranean 'Thall' pitch-shifted drops (Vildhjarta, Humanity's Last Breath), symphonic deathcore breakdowns (Lorna Shore), and arena-sized ethereal hooks (Spiritbox, Sleep Token).",
    keyInnovations: [
      "Thall tone: Dissonant minor second chords pitch-shifted down an octave with resonant high-pass filters",
      "Nylon/Electric hybrid tapping, microtonal slides, and percussive thumb slaps (Tim Henson)",
      "Studio convolution IR cabinets with stereo room mic simulation",
      "Sub-bass 808 frequency drops synced with heavy breakdown downbeats",
    ],
    definingBands: ["Polyphia", "Spiritbox", "Lorna Shore", "Sleep Token", "Bad Omens", "Vildhjarta", "Humanity's Last Breath", "Knocked Loose"],
    iconicAlbums: [
      { artist: "Polyphia", album: "Remember That You Will Die", year: 2022, tuning: "Drop D / E Standard", standoutTrack: "Playing God" },
      { artist: "Spiritbox", album: "Eternal Blue", year: 2021, tuning: "Drop F# / Drop C#", standoutTrack: "Holy Roller" },
      { artist: "Lorna Shore", album: "Pain Remains", year: 2022, tuning: "Drop A", standoutTrack: "To the Hellfire" },
      { artist: "Sleep Token", album: "Take Me Back to Eden", year: 2023, tuning: "8-String / Drop D", standoutTrack: "The Summoning" },
      { artist: "Vildhjarta", album: "måsstaden under vatten", year: 2021, tuning: "Drop E (Thall)", standoutTrack: "när de du älskar kommer tillbaka från de döda" },
    ],
    guitarToneTech: "Neural DSP Quad Cortex, Archetype: Tim Henson / Nolly, Evertune bridge, Fishman Fluence Modern active pickups.",
  },
];

export const METAL_SUBGENRES: MetalSubgenre[] = [
  {
    id: "genre-dropc-metalcore",
    name: "Drop C Metalcore",
    era: "2000 - Present",
    tuning: "Drop C (C-G-C-F-A-D)",
    bpmRange: "130 - 180 BPM",
    color: "#CCFF00",
    recommendedPresetId: "preset-5150-chug",
    riffType: "chug",
    description:
      "The defining sound of 2000s American heavy music. Combines aggressive 0-0-0 palm-muted breakdowns with melodic Swedish death metal harmonies, syncopated pedal tones, and soaring chorus hooks.",
    toneCharacteristics: {
      ampModel: "Peavey 5150 / 6505+ Lead Channel",
      pedals: ["Ibanez TS9 / Maxon OD808 (Drive 0, Level 10)", "Hard Noise Gate"],
      eqCurve: "Bass: 6.5, Mids: 5.5, Treble: 6.5, Presence: 7.0, Depth: 7.5",
      technique: "Tight downpicked 0-0-0 chugs, one-finger drop power chords, 5th-to-7th fret melodic pedal notes.",
    },
    pioneerBands: [
      { name: "Killswitch Engage", country: "USA", keyGuitarist: "Adam Dutkiewicz & Joel Stroetzel", signatureGear: "Caparison Dellinger / 5150 / Maxon OD808" },
      { name: "As I Lay Dying", country: "USA", keyGuitarist: "Nick Hipa & Phil Sgrosso", signatureGear: "Ibanez / ESP / 6505+" },
      { name: "Avenged Sevenfold", country: "USA", keyGuitarist: "Synyster Gates & Zacky Vengeance", signatureGear: "Schecter Synyster Custom / Bogner Uberschall" },
      { name: "August Burns Red", country: "USA", keyGuitarist: "JB Brubaker", signatureGear: "Ibanez JBBM / Peavey 6505" },
    ],
    essentialAlbums: [
      { artist: "Killswitch Engage", title: "Alive or Just Breathing", year: 2002, track: "My Last Serenade" },
      { artist: "As I Lay Dying", title: "Shadows Are Security", year: 2005, track: "Confined" },
      { artist: "All That Remains", title: "The Fall of Ideals", year: 2006, track: "This Calling" },
      { artist: "Trivium", title: "Ascendancy", year: 2005, track: "Pull Harder on the Strings of Your Martyr" },
    ],
    harmonicFeatures: ["Natural Minor (Aeolian)", "Harmonic Minor for neo-classical lead runs", "Add9 minor chords for melancholic dissonance", "One-finger root-5th-octave power chords"],
  },
  {
    id: "genre-djent-prog",
    name: "Djent & Progressive Metal",
    era: "2008 - Present",
    tuning: "Drop C, Drop Ab, 8-String Drop E",
    bpmRange: "100 - 150 BPM (Complex Meters)",
    color: "#06b6d4",
    recommendedPresetId: "preset-djent-808",
    riffType: "breakdown",
    description:
      "Precision-engineered syncopation, polyrhythmic grooves, and razor-sharp high-mid pick clank. Guitar notes are gated with surgical speed so that silence is as punchy as the notes themselves.",
    toneCharacteristics: {
      ampModel: "Mesa Boogie / Peavey 5150 / Modeler DSP",
      pedals: ["Horizon Devices Precision Drive", "Multi-band Noise Gate (Fast Release)", "Pre-EQ High Pass Cut"],
      eqCurve: "Bass: 4.5, Mids: 7.5 (1.5kHz Boost), Treble: 7.0, Presence: 8.0, Depth: 5.0",
      technique: "Heavy pick attack near bridge pickup, palm mutes releasing only on the exact 16th note, thumb slap syncopation.",
    },
    pioneerBands: [
      { name: "Meshuggah", country: "Sweden", keyGuitarist: "Fredrik Thordendal & Mårten Hagström", signatureGear: "Ibanez M8M 8-String / Lundgren M8" },
      { name: "Periphery", country: "USA", keyGuitarist: "Misha Mansoor, Jake Bowen, Mark Holcomb", signatureGear: "Jackson Mansoor Signature / Fractal Axe-FX" },
      { name: "Architects", country: "UK", keyGuitarist: "Tom Searle & Josh Middleton", signatureGear: "ESP E-II / Peavey 5150" },
      { name: "Monuments", country: "UK", keyGuitarist: "John Browne", signatureGear: "Mayones Duvell / Browne Flux" },
    ],
    essentialAlbums: [
      { artist: "Meshuggah", title: "obZen", year: 2008, track: "Bleed" },
      { artist: "Periphery", title: "Periphery II", year: 2012, track: "Make Total Destroy" },
      { artist: "Architects", title: "All Our Gods Have Abandoned Us", year: 2016, track: "Doomsday" },
      { artist: "TesseracT", title: "Altered State", year: 2013, track: "Of Mind - Nocturne" },
    ],
    harmonicFeatures: ["Phrygian Mode", "Minor 2nd dissonance clashes", "Open string drone pedal points with sliding octaves", "7/8, 9/8, 11/8 metric modulations over 4/4 kick pulse"],
  },
  {
    id: "genre-swedish-death",
    name: "Swedish Death Metal (Stockholm HM-2)",
    era: "1990 - Present",
    tuning: "D Standard / Drop C / B Standard",
    bpmRange: "160 - 220 BPM",
    color: "#e11d48",
    recommendedPresetId: "preset-hm2-chainsaw",
    riffType: "gallop",
    description:
      "The legendary Stockholm 'Chainsaw' buzzsaw sound pioneered by Tomas Skogsberg at Sunlight Studios. Produced by maxing out every single knob on a Boss HM-2 Heavy Metal pedal into a roaring tube amp.",
    toneCharacteristics: {
      ampModel: "Marshall JCM800 / Peavey 5150 / Valvestate",
      pedals: ["Boss HM-2 Heavy Metal (Level 10, Low 10, High 10, Dist 10)", "Analog Delay"],
      eqCurve: "Extreme mid-range resonant boost at ~1.3kHz (HM-2 gyrator filter curve), High: 9.0, Low: 8.5",
      technique: "Fast alternate-picked tremolo riffs on low strings, chromatic doom breaks, and d-beat punk rhythm.",
    },
    pioneerBands: [
      { name: "Entombed", country: "Sweden", keyGuitarist: "Alex Hellid & Uffe Cederlund", signatureGear: "Ibanez / Boss HM-2 / Peavey Bandit" },
      { name: "Dismember", country: "Sweden", keyGuitarist: "David Blomqvist & Robert Sennebäck", signatureGear: "Gibson Flying V / HM-2" },
      { name: "Bloodbath", country: "Sweden", keyGuitarist: "Anders Nyström & Per Eriksson", signatureGear: "Boss HM-2 / 5150" },
      { name: "At The Gates", country: "Sweden", keyGuitarist: "Anders Björler & Martin Larsson", signatureGear: "Boss HM-2 / Boss Metal Zone (used as boost)" },
    ],
    essentialAlbums: [
      { artist: "Entombed", title: "Left Hand Path", year: 1990, track: "Left Hand Path" },
      { artist: "Dismember", title: "Like an Ever Flowing Stream", year: 1991, track: "Override of the Overture" },
      { artist: "Bloodbath", title: "Nightmares Made Flesh", year: 2004, track: "Eaten" },
      { artist: "Grave", title: "Into the Grave", year: 1991, track: "Into the Grave" },
    ],
    harmonicFeatures: ["Locrian & Phrygian scales", "Dissonant diminished arpeggios", "Chromatic half-step shift chord progressions", "Grim tritone tremolo picking"],
  },
  {
    id: "genre-nu-metal",
    name: "Nu-Metal & Alternative Groove",
    era: "1994 - 2003",
    tuning: "Drop C, Drop D, Drop B, 7-String A",
    bpmRange: "85 - 130 BPM",
    color: "#f59e0b",
    recommendedPresetId: "preset-mesa-nu-metal",
    riffType: "chug",
    description:
      "Bouncing hip-hop infused grooves, down-tuned 7-string crunch, industrial samples, and soaring emotional catharsis. Relied heavily on the thick, saggy low-end of Mesa/Boogie Dual Rectifier half-stacks.",
    toneCharacteristics: {
      ampModel: "Mesa/Boogie Dual Rectifier (Modern High-Gain Channel)",
      pedals: ["Digitech Whammy Pitch Shifter", "Boss BF-2 Flanger", "Dunlop Crybaby Wah"],
      eqCurve: "Bass: 8.0, Mids: 3.5 (Scooped), Treble: 7.0, Presence: 6.5, Resonance: 8.0",
      technique: "Syncopated bounce grooves, pick hand dead note scratches, wide octave slides, harmonic squeals.",
    },
    pioneerBands: [
      { name: "Slipknot", country: "USA", keyGuitarist: "Mick Thomson (#7) & Jim Root (#4)", signatureGear: "Ibanez MTM / Fender Jim Root Tele / Rivera Knucklehead" },
      { name: "System of a Down", country: "USA", keyGuitarist: "Daron Malakian", signatureGear: "Ibanez Iceman / Marshall JMP / Mesa Dual Rectifier" },
      { name: "Deftones", country: "USA", keyGuitarist: "Stephen Carpenter", signatureGear: "ESP SC 7/8-String / Marshall JMP-1" },
      { name: "Korn", country: "USA", keyGuitarist: "Munky & Head", signatureGear: "Ibanez K7 7-String / Mesa Dual Rectifier" },
    ],
    essentialAlbums: [
      { artist: "Slipknot", title: "Iowa", year: 2001, track: "People = Shit" },
      { artist: "System of a Down", title: "Toxicity", year: 2001, track: "Chop Suey!" },
      { artist: "Deftones", title: "White Pony", year: 2000, track: "Change (In the House of Flies)" },
      { artist: "Korn", title: "Follow the Leader", year: 1998, track: "Freak on a Leash" },
    ],
    harmonicFeatures: ["Heavy syncopated groove riffs", "Open drop-tuned low string bounce with muted strums", "Minor 9th and Major 7th ethereal clean verse chords", "Abrupt dynamics (Whisper-to-Scream)"],
  },
  {
    id: "genre-thrash-bayarea",
    name: "80s Bay Area Thrash",
    era: "1983 - 1991",
    tuning: "E Standard / E♭ Standard",
    bpmRange: "180 - 240+ BPM",
    color: "#ef4444",
    recommendedPresetId: "preset-80s-thrash",
    riffType: "gallop",
    description:
      "Lightning-fast downpicking, razor-sharp high-frequency cut, scooped mid-range crunch, and aggressive anti-establishment lyrical themes. Founded the modern metal rhythm guitar discipline.",
    toneCharacteristics: {
      ampModel: "Marshall JCM800 2203 / Mesa/Boogie Mark IIC+",
      pedals: ["Ibanez TS9 Tube Screamer", "Boss GE-7 Graphic EQ (Mid Scoop)"],
      eqCurve: "Bass: 7.0, Mids: 3.5, Treble: 8.5, Presence: 8.0, Gain: 8.5",
      technique: "Machine-gun strict downpicking, galloping 16th notes, fast alternate picking over multiple strings.",
    },
    pioneerBands: [
      { name: "Metallica", country: "USA", keyGuitarist: "James Hetfield & Kirk Hammett", signatureGear: "ESP MX-220 'EET FUK' / Mesa Mark IIC+" },
      { name: "Slayer", country: "USA", keyGuitarist: "Kerry King & Jeff Hanneman", signatureGear: "BC Rich / ESP / Marshall JCM800" },
      { name: "Megadeth", country: "USA", keyGuitarist: "Dave Mustaine & Marty Friedman", signatureGear: "Jackson King V / Marshall JCM800" },
      { name: "Exodus", country: "USA", keyGuitarist: "Gary Holt & Rick Hunolt", signatureGear: "Gibson Flying V / Modded Marshall" },
    ],
    essentialAlbums: [
      { artist: "Metallica", title: "Master of Puppets", year: 1986, track: "Master of Puppets" },
      { artist: "Slayer", title: "Reign in Blood", year: 1986, track: "Raining Blood" },
      { artist: "Megadeth", title: "Rust in Peace", year: 1990, track: "Holy Wars... The Punishment Due" },
      { artist: "Anthrax", title: "Spreading the Disease", year: 1985, track: "Madhouse" },
    ],
    harmonicFeatures: ["Locrian & Minor Pentatonic speed runs", "Chromatic tritone passing notes (E -> Bb -> A)", "Open E-string gallop pedal tones with syncopated power chords", "Two-handed tapping shred solos"],
  },
  {
    id: "genre-math-modern",
    name: "Math-Rock & Modern Progressive",
    era: "2015 - Present",
    tuning: "Drop D, Drop C, DAEAC#E, FACGCE",
    bpmRange: "110 - 160 BPM",
    color: "#a855f7",
    recommendedPresetId: "preset-clean-polyphia-twang",
    riffType: "add9",
    description:
      "Hyper-articulate nylon and electric guitar wizardry. Blends trap hi-hats, neo-soul chord voicings, classical flamenco fingerpicking, microtonal whammy flutter, and percussive slap guitar techniques.",
    toneCharacteristics: {
      ampModel: "Fender Twin Reverb / Vox AC30 Clean Channel + High-Gain Lead",
      pedals: ["Compressor / Sustainer", "Stereo Chorus", "Pitch Shifter Whammy", "Fast Tap Delay"],
      eqCurve: "Bass: 5.0, Mids: 6.5, Treble: 8.0, Presence: 8.5 (Sparkle Glassy Twang)",
      technique: "Hybrid picking, two-hand polyphonic tapping, thumb slap + pop, harmonic cascading harp runs.",
    },
    pioneerBands: [
      { name: "Polyphia", country: "USA", keyGuitarist: "Tim Henson & Scott LePage", signatureGear: "Ibanez TOD10N / TOD10 / Archetype: Tim Henson" },
      { name: "Covet", country: "USA", keyGuitarist: "Yvette Young", signatureGear: "Ibanez YY10 / Vox AC30" },
      { name: "Chon", country: "USA", keyGuitarist: "Mario Camarena & Erick Hansel", signatureGear: "Ibanez AZ Series / Fender Clean Amps" },
      { name: "Unprocessed", country: "Germany", keyGuitarist: "Manuel Gardner Fernandes", signatureGear: "Ibanez Custom / Neural DSP" },
    ],
    essentialAlbums: [
      { artist: "Polyphia", title: "New Levels New Devils", year: 2018, track: "G.O.A.T." },
      { artist: "Polyphia", title: "Remember That You Will Die", year: 2022, track: "Playing God" },
      { artist: "Covet", title: "Effloresce", year: 2018, track: "Shibuya" },
      { artist: "Chon", title: "Grow", year: 2015, track: "Story" },
    ],
    harmonicFeatures: ["Major 7th and Minor 9th jazz chord substitutions", "Lydian Mode sharp 11ths", "Open-string harmonic tapping arpeggios", "Flamenco rasgueado strumming"],
  },
];

export const METAL_GUITAR_LORE: MetalGuitarLore[] = [
  {
    id: "lore-drop-c-origin",
    title: "Why Drop C Became the Heavy Standard",
    category: "Tuning Lore",
    iconName: "Flame",
    summary: "The mathematical acoustic sweet-spot for 25.5-inch standard scale electric guitars.",
    details:
      "Tuning down a full whole-step to D Standard (D-G-C-F-A-D) and dropping the 6th string to C (65.41 Hz) allowed guitarists using standard 10-52 gauge strings to achieve approximately 16.5 lbs of string tension—virtually identical to standard tuning. This prevented string flop while producing thunderous sub-harmonics and enabling one-finger bar power chords.",
    keyArtists: ["Killswitch Engage", "System of a Down", "Deftones", "Slipknot", "As I Lay Dying", "Bullet for My Valentine"],
  },
  {
    id: "lore-ts9-gain-zero-secret",
    title: "The Tube Screamer 'Drive at Zero' Secret",
    category: "Gear Secret",
    iconName: "Sliders",
    summary: "How an overdrive pedal is used as a dynamic pre-EQ tightening filter rather than for distortion.",
    details:
      "Metal producers discovered that setting a TS9 / Maxon OD808 with Drive at 0, Level at 10, and Tone at 6-7 cuts the muddy sub-bass frequencies below 720Hz before the signal hits the high-gain amplifier preamp. This tightens the attack and prevents the amplifier's tube stage from choking on low frequencies during rapid palm muting.",
    keyArtists: ["Colin Richardson (Producer)", "Sneap (Producer)", "Adam Dutkiewicz", "Misha Mansoor"],
  },
  {
    id: "lore-hm2-chainsaw-discovery",
    title: "The Accidental Invention of the Stockholm Chainsaw",
    category: "Production Milestone",
    iconName: "Zap",
    summary: "How Entombed and Tomas Skogsberg created Swedish Death Metal's greatest signature sound.",
    details:
      "In 1989 at Sunlight Studio in Stockholm, Leif Cuzner and Uffe Cederlund plugged a cheap Boss HM-2 Heavy Metal pedal into a small Peavey practice amplifier with all four knobs (Level, Low, High, Dist) turned all the way clockwise to 10. The dual gyrator filters created a massive resonant spike at 1.3kHz and 87Hz, creating the iconic grinding buzzsaw guitar tone heard on Entombed's 'Left Hand Path'.",
    keyArtists: ["Entombed", "Dismember", "Bloodbath", "Nails", "Gatecreeper"],
  },
  {
    id: "lore-peavey-5150-genesis",
    title: "The Genesis of the Peavey 5150 (6505)",
    category: "Gear Secret",
    iconName: "Activity",
    summary: "Eddie Van Halen's 1992 collaboration that accidentally created the most recorded metal amp in history.",
    details:
      "Engineered by James Brown and Eddie Van Halen at Peavey in 1992, the 5150 utilized five 12AX7 preamp tubes and four 6L6 power tubes with an innovative resonance control. While intended for Eddie's hard rock tone, extreme metal producers Colin Richardson and Andy Sneap realized the Lead Channel had unprecedented harmonic saturation, making it the bedrock of modern metal for 30+ years.",
    keyArtists: ["Machine Head (Burn My Eyes)", "Carcass (Heartwork)", "In Flames (Jester Race)", "Killswitch Engage", "Trivium"],
  },
];
