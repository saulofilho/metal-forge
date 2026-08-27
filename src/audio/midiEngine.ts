/**
 * DropC MetalForge - Web MIDI Integration Engine
 * Connects hardware pedalboards (FCB1010, Morningstar, Line 6, MeloAudio, Ampero)
 * for zero-latency live control during performances.
 */

import { MidiDevice, MidiMapping } from "../types";

export type MidiListenerCallback = (mapping: MidiMapping, rawValue: number) => void;

export class MidiEngine {
  private static instance: MidiEngine | null = null;
  public isSupported = false;
  public midiAccess: any = null;
  public connectedDevices: MidiDevice[] = [];
  public mappings: MidiMapping[] = [];
  public isLearning = false;
  public learningAction: Partial<MidiMapping> | null = null;
  private listeners: MidiListenerCallback[] = [];
  public lastReceivedMessage: {
    type: string;
    channel: number;
    number: number;
    value: number;
    time: string;
  } | null = null;

  private constructor() {
    this.loadDefaultMappings();
  }

  public static getInstance(): MidiEngine {
    if (!MidiEngine.instance) {
      MidiEngine.instance = new MidiEngine();
    }
    return MidiEngine.instance;
  }

  public async init(): Promise<boolean> {
    if (typeof navigator !== "undefined" && "requestMIDIAccess" in navigator) {
      try {
        this.midiAccess = await (navigator as any).requestMIDIAccess({ sysex: false });
        this.isSupported = true;
        this.updateDeviceList();

        this.midiAccess.onstatechange = () => {
          this.updateDeviceList();
        };

        this.attachInputListeners();
        return true;
      } catch (err) {
        console.warn("Web MIDI Access request denied or failed:", err);
        this.isSupported = false;
        return false;
      }
    } else {
      this.isSupported = false;
      return false;
    }
  }

  private updateDeviceList(): void {
    if (!this.midiAccess) return;
    const devices: MidiDevice[] = [];
    const inputs = this.midiAccess.inputs.values();

    for (const input of inputs) {
      devices.push({
        id: input.id,
        name: input.name || "MIDI Foot Controller",
        manufacturer: input.manufacturer || "Generic MIDI",
        state: input.state || "connected",
        type: "input",
      });
    }

    this.connectedDevices = devices;
    this.attachInputListeners();
  }

  private attachInputListeners(): void {
    if (!this.midiAccess) return;
    const inputs = this.midiAccess.inputs.values();

    for (const input of inputs) {
      input.onmidimessage = (event: any) => this.handleMidiMessage(event);
    }
  }

  private handleMidiMessage(event: any): void {
    const data = event.data;
    if (!data || data.length < 2) return;

    const statusByte = data[0];
    const messageTypeByte = statusByte & 0xf0;
    const channel = statusByte & 0x0f;

    let messageType: "pc" | "cc" | "note" = "cc";
    let number = 0;
    let value = 0;

    // 0x90 = Note On, 0x80 = Note Off
    if (messageTypeByte === 0x90 || messageTypeByte === 0x80) {
      messageType = "note";
      number = data[1];
      value = data[2] || 0;
    }
    // 0xB0 = Control Change (CC)
    else if (messageTypeByte === 0xb0) {
      messageType = "cc";
      number = data[1];
      value = data[2] || 0;
    }
    // 0xC0 = Program Change (PC)
    else if (messageTypeByte === 0xc0) {
      messageType = "pc";
      number = data[1];
      value = 127;
    } else {
      return;
    }

    this.lastReceivedMessage = {
      type: messageType.toUpperCase(),
      channel: channel + 1,
      number,
      value,
      time: new Date().toLocaleTimeString(),
    };

    // If currently in MIDI Learn mode
    if (this.isLearning && this.learningAction) {
      const newMapping: MidiMapping = {
        action: this.learningAction.action || "preset",
        targetPresetId: this.learningAction.targetPresetId,
        messageType,
        channel,
        number,
        description: this.learningAction.description || `Mapped to ${messageType.toUpperCase()} ${number}`,
      };

      // Remove conflicting mapping and add
      this.mappings = this.mappings.filter(
        (m) => !(m.messageType === messageType && m.number === number && m.channel === channel)
      );
      this.mappings.push(newMapping);
      this.saveMappings();

      this.isLearning = false;
      this.learningAction = null;
      return;
    }

    // Match existing mappings
    for (const mapping of this.mappings) {
      const channelMatches = mapping.channel === -1 || mapping.channel === channel;
      if (mapping.messageType === messageType && mapping.number === number && channelMatches) {
        // Trigger registered listener callbacks
        this.listeners.forEach((cb) => cb(mapping, value));
      }
    }
  }

  // MIDI Learn Trigger
  public startMidiLearn(action: Partial<MidiMapping>): void {
    this.isLearning = true;
    this.learningAction = action;
  }

  public cancelMidiLearn(): void {
    this.isLearning = false;
    this.learningAction = null;
  }

  public addListener(callback: MidiListenerCallback): () => void {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter((cb) => cb !== callback);
    };
  }

  // Default Factory Pedalboard Mappings (Behringer FCB1010 / Line 6 / Morningstar)
  private loadDefaultMappings(): void {
    try {
      const saved = localStorage.getItem("dropc_metal_midi_mappings");
      if (saved) {
        this.mappings = JSON.parse(saved);
        return;
      }
    } catch (e) {
      console.error("Error loading saved MIDI mappings:", e);
    }

    // Default FCB1010 / Morningstar PC & CC layout
    this.mappings = [
      {
        action: "preset",
        targetPresetId: "preset-5150-chug",
        messageType: "pc",
        channel: -1,
        number: 0,
        description: "Pedal 1 -> 5150 Modern Metalcore Chug",
      },
      {
        action: "preset",
        targetPresetId: "preset-mesa-nu-metal",
        messageType: "pc",
        channel: -1,
        number: 1,
        description: "Pedal 2 -> Mesa Dual Rectifier Nu-Metal",
      },
      {
        action: "preset",
        targetPresetId: "preset-djent-808",
        messageType: "pc",
        channel: -1,
        number: 2,
        description: "Pedal 3 -> Djent 808 Laser",
      },
      {
        action: "preset",
        targetPresetId: "preset-prog-liquid-lead",
        messageType: "pc",
        channel: -1,
        number: 3,
        description: "Pedal 4 -> Prog Metal Liquid Lead",
      },
      {
        action: "preset",
        targetPresetId: "preset-clean-ambient-shimmer",
        messageType: "pc",
        channel: -1,
        number: 4,
        description: "Pedal 5 -> Clean Ambient Shimmer",
      },
      {
        action: "toggle_drive",
        messageType: "cc",
        channel: -1,
        number: 64,
        description: "CC 64 (Sustain/Stomp 6) -> Tube Screamer Boost Toggle",
      },
      {
        action: "toggle_delay",
        messageType: "cc",
        channel: -1,
        number: 65,
        description: "CC 65 (Stomp 7) -> Stereo Delay Toggle",
      },
      {
        action: "toggle_mute",
        messageType: "cc",
        channel: -1,
        number: 66,
        description: "CC 66 (Stomp 8) -> Tuner / Mute Toggle",
      },
      {
        action: "tap_tempo",
        messageType: "cc",
        channel: -1,
        number: 67,
        description: "CC 67 (Stomp 9) -> Tap Tempo",
      },
      {
        action: "daw_record",
        messageType: "cc",
        channel: -1,
        number: 68,
        description: "CC 68 (Stomp 10) -> DAW Arm / Record",
      },
    ];
  }

  public saveMappings(): void {
    try {
      localStorage.setItem("dropc_metal_midi_mappings", JSON.stringify(this.mappings));
    } catch (e) {
      console.error("Error saving MIDI mappings:", e);
    }
  }

  public resetToDefaults(): void {
    localStorage.removeItem("dropc_metal_midi_mappings");
    this.loadDefaultMappings();
  }

  public deleteMapping(index: number): void {
    this.mappings.splice(index, 1);
    this.saveMappings();
  }

  // Virtual MIDI message simulation for keyboard shortcuts or on-screen pedals
  public simulateMidi(messageType: "pc" | "cc" | "note", number: number, value = 127): void {
    this.handleMidiMessage({
      data: [messageType === "pc" ? 0xc0 : messageType === "cc" ? 0xb0 : 0x90, number, value],
    });
  }
}
