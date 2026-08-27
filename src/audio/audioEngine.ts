/**
 * DropC MetalForge - High-Fidelity Web Audio DSP Engine
 * Real-time guitar amp & pedalboard simulator, Drop C synth, tuner, metal drum machine, and multitrack DAW recorder.
 */

import { AmpParams, DrumBeatPattern, TunerResult } from "../types";
import { DROP_C_STRINGS, TUNING_PRESETS_MAP } from "./dropCData";

export class AudioEngine {
  private static instance: AudioEngine | null = null;

  public ctx: AudioContext | null = null;
  public isRunning = false;
  public inputGainNode: GainNode | null = null;
  public micStream: MediaStream | null = null;
  public micSourceNode: MediaStreamAudioSourceNode | null = null;

  // DSP Node Graph
  private gateGainNode: GainNode | null = null;
  private drivePreFilter: BiquadFilterNode | null = null;
  private drivePostFilter: BiquadFilterNode | null = null;
  private driveWaveshaper: WaveShaperNode | null = null;
  private driveGainNode: GainNode | null = null;
  private driveDryWet: GainNode | null = null;
  private preampWaveshaper: WaveShaperNode | null = null;
  private tonestackBass: BiquadFilterNode | null = null;
  private tonestackMid: BiquadFilterNode | null = null;
  private tonestackTreble: BiquadFilterNode | null = null;
  private tonestackPresence: BiquadFilterNode | null = null;
  private tonestackResonance: BiquadFilterNode | null = null;
  private ampMasterGain: GainNode | null = null;

  // Cab sim filters
  private cabLowCut: BiquadFilterNode | null = null;
  private cabHighCut: BiquadFilterNode | null = null;
  private cabResonancePeak: BiquadFilterNode | null = null;
  private cabAirFilter: BiquadFilterNode | null = null;

  // 5-band Graphic EQ
  private eq80: BiquadFilterNode | null = null;
  private eq250: BiquadFilterNode | null = null;
  private eq750: BiquadFilterNode | null = null;
  private eq2200: BiquadFilterNode | null = null;
  private eq6000: BiquadFilterNode | null = null;

  // Chorus
  private chorusDelayL: DelayNode | null = null;
  private chorusDelayR: DelayNode | null = null;
  private chorusLfoL: OscillatorNode | null = null;
  private chorusLfoR: OscillatorNode | null = null;
  private chorusLfoGainL: GainNode | null = null;
  private chorusLfoGainR: GainNode | null = null;
  private chorusDry: GainNode | null = null;
  private chorusWet: GainNode | null = null;

  // Delay
  private delayNodeL: DelayNode | null = null;
  private delayNodeR: DelayNode | null = null;
  private delayFeedbackGainL: GainNode | null = null;
  private delayFeedbackGainR: GainNode | null = null;
  private delayDry: GainNode | null = null;
  private delayWet: GainNode | null = null;

  // Reverb
  private reverbConvolver: ConvolverNode | null = null;
  private reverbDry: GainNode | null = null;
  private reverbWet: GainNode | null = null;

  // Master output
  private masterGain: GainNode | null = null;
  private masterLimiter: DynamicsCompressorNode | null = null;
  public analyserNode: AnalyserNode | null = null;

  // Tuner Analyser & Processing
  private tunerAnalyser: AnalyserNode | null = null;
  private tunerBuffer: Float32Array = new Float32Array(2048);

  // Metering & Gate monitoring
  public inputLevel = 0;
  public outputLevel = 0;
  public isGateOpen = true;

  // Virtual Synth Gain
  public synthBusGain: GainNode | null = null;

  // Metronome & Drum State
  private metronomeTimer: number | null = null;
  public isDrumPlaying = false;
  public bpm = 135;
  public currentBeatPattern: DrumBeatPattern = "0-0-0 Breakdown Heavy";
  private currentStep = 0;

  // Live Input Monitoring Toggle
  public isDirectInputActive = false;
  public isMuted = false;

  private currentParams: AmpParams | null = null;

  private constructor() {}

  public static getInstance(): AudioEngine {
    if (!AudioEngine.instance) {
      AudioEngine.instance = new AudioEngine();
    }
    return AudioEngine.instance;
  }

  public async init(): Promise<void> {
    if (this.ctx && this.ctx.state !== "closed") {
      if (this.ctx.state === "suspended") {
        await this.ctx.resume();
      }
      return;
    }

    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    this.ctx = new AudioContextClass({ latencyHint: "interactive", sampleRate: 48000 });
    this.tunerBuffer = new Float32Array(2048);

    this.buildDspGraph();
    this.isRunning = true;
    this.startMeteringLoop();
  }

  private buildDspGraph(): void {
    if (!this.ctx) return;
    const ctx = this.ctx;

    // 1. Input Stage
    this.inputGainNode = ctx.createGain();
    this.inputGainNode.gain.value = 1.0;

    // Tuner tap (before noise gate)
    this.tunerAnalyser = ctx.createAnalyser();
    this.tunerAnalyser.fftSize = 2048;
    this.inputGainNode.connect(this.tunerAnalyser);

    // Synth Bus
    this.synthBusGain = ctx.createGain();
    this.synthBusGain.gain.value = 1.0;
    this.synthBusGain.connect(this.inputGainNode);

    // 2. Noise Gate Stage
    this.gateGainNode = ctx.createGain();
    this.gateGainNode.gain.value = 1.0;
    this.inputGainNode.connect(this.gateGainNode);

    // 3. Tube Screamer Overdrive (TS9 Style Mid Boost + Bass Cut)
    this.drivePreFilter = ctx.createBiquadFilter();
    this.drivePreFilter.type = "peaking";
    this.drivePreFilter.frequency.value = 720;
    this.drivePreFilter.Q.value = 1.5;
    this.drivePreFilter.gain.value = 6.0;

    this.driveWaveshaper = ctx.createWaveShaper();
    this.driveWaveshaper.curve = this.generateOverdriveCurve(3.0);
    this.driveWaveshaper.oversample = "4x";

    this.drivePostFilter = ctx.createBiquadFilter();
    this.drivePostFilter.type = "lowpass";
    this.drivePostFilter.frequency.value = 4500;

    this.driveGainNode = ctx.createGain();
    this.driveGainNode.gain.value = 1.2;

    this.driveDryWet = ctx.createGain();
    this.driveDryWet.gain.value = 1.0;

    this.gateGainNode.connect(this.drivePreFilter);
    this.drivePreFilter.connect(this.driveWaveshaper);
    this.driveWaveshaper.connect(this.drivePostFilter);
    this.drivePostFilter.connect(this.driveGainNode);

    // 4. Preamp & High-Gain Tube Power Stage
    this.preampWaveshaper = ctx.createWaveShaper();
    this.preampWaveshaper.curve = this.generateTubeDistortionCurve(7.5);
    this.preampWaveshaper.oversample = "4x";
    this.driveGainNode.connect(this.preampWaveshaper);

    // Tonestack
    this.tonestackBass = ctx.createBiquadFilter();
    this.tonestackBass.type = "lowshelf";
    this.tonestackBass.frequency.value = 120;
    this.tonestackBass.gain.value = 3.0;

    this.tonestackMid = ctx.createBiquadFilter();
    this.tonestackMid.type = "peaking";
    this.tonestackMid.frequency.value = 850;
    this.tonestackMid.Q.value = 1.2;
    this.tonestackMid.gain.value = 4.0;

    this.tonestackTreble = ctx.createBiquadFilter();
    this.tonestackTreble.type = "highshelf";
    this.tonestackTreble.frequency.value = 3200;
    this.tonestackTreble.gain.value = 4.0;

    this.tonestackPresence = ctx.createBiquadFilter();
    this.tonestackPresence.type = "peaking";
    this.tonestackPresence.frequency.value = 4800;
    this.tonestackPresence.Q.value = 2.0;
    this.tonestackPresence.gain.value = 5.0;

    this.tonestackResonance = ctx.createBiquadFilter();
    this.tonestackResonance.type = "peaking";
    this.tonestackResonance.frequency.value = 90;
    this.tonestackResonance.Q.value = 2.5;
    this.tonestackResonance.gain.value = 4.0;

    this.ampMasterGain = ctx.createGain();
    this.ampMasterGain.gain.value = 0.8;

    this.preampWaveshaper.connect(this.tonestackBass);
    this.tonestackBass.connect(this.tonestackMid);
    this.tonestackMid.connect(this.tonestackTreble);
    this.tonestackTreble.connect(this.tonestackPresence);
    this.tonestackPresence.connect(this.tonestackResonance);
    this.tonestackResonance.connect(this.ampMasterGain);

    // 5. Cabinet Simulator (Mesa 4x12 / ENGL V30 Response)
    this.cabLowCut = ctx.createBiquadFilter();
    this.cabLowCut.type = "highpass";
    this.cabLowCut.frequency.value = 75;

    this.cabHighCut = ctx.createBiquadFilter();
    this.cabHighCut.type = "lowpass";
    this.cabHighCut.frequency.value = 5200;

    this.cabResonancePeak = ctx.createBiquadFilter();
    this.cabResonancePeak.type = "peaking";
    this.cabResonancePeak.frequency.value = 2400;
    this.cabResonancePeak.Q.value = 1.8;
    this.cabResonancePeak.gain.value = 3.5;

    this.cabAirFilter = ctx.createBiquadFilter();
    this.cabAirFilter.type = "highshelf";
    this.cabAirFilter.frequency.value = 4000;
    this.cabAirFilter.gain.value = 2.0;

    this.ampMasterGain.connect(this.cabLowCut);
    this.cabLowCut.connect(this.cabHighCut);
    this.cabHighCut.connect(this.cabResonancePeak);
    this.cabResonancePeak.connect(this.cabAirFilter);

    // 6. 5-Band Metal Graphic EQ
    this.eq80 = ctx.createBiquadFilter();
    this.eq80.type = "peaking";
    this.eq80.frequency.value = 80;
    this.eq80.Q.value = 1.4;

    this.eq250 = ctx.createBiquadFilter();
    this.eq250.type = "peaking";
    this.eq250.frequency.value = 250;
    this.eq250.Q.value = 1.4;

    this.eq750 = ctx.createBiquadFilter();
    this.eq750.type = "peaking";
    this.eq750.frequency.value = 750;
    this.eq750.Q.value = 1.4;

    this.eq2200 = ctx.createBiquadFilter();
    this.eq2200.type = "peaking";
    this.eq2200.frequency.value = 2200;
    this.eq2200.Q.value = 1.4;

    this.eq6000 = ctx.createBiquadFilter();
    this.eq6000.type = "peaking";
    this.eq6000.frequency.value = 6000;
    this.eq6000.Q.value = 1.4;

    this.cabAirFilter.connect(this.eq80);
    this.eq80.connect(this.eq250);
    this.eq250.connect(this.eq750);
    this.eq750.connect(this.eq2200);
    this.eq2200.connect(this.eq6000);

    // 7. Stereo Chorus & Flanger
    this.chorusDry = ctx.createGain();
    this.chorusWet = ctx.createGain();
    this.chorusWet.gain.value = 0;

    this.chorusDelayL = ctx.createDelay();
    this.chorusDelayR = ctx.createDelay();
    this.chorusDelayL.delayTime.value = 0.025;
    this.chorusDelayR.delayTime.value = 0.028;

    this.chorusLfoL = ctx.createOscillator();
    this.chorusLfoR = ctx.createOscillator();
    this.chorusLfoL.frequency.value = 1.2;
    this.chorusLfoR.frequency.value = 1.5;

    this.chorusLfoGainL = ctx.createGain();
    this.chorusLfoGainR = ctx.createGain();
    this.chorusLfoGainL.gain.value = 0.003;
    this.chorusLfoGainR.gain.value = 0.003;

    this.chorusLfoL.connect(this.chorusLfoGainL);
    this.chorusLfoGainL.connect(this.chorusDelayL.delayTime);
    this.chorusLfoR.connect(this.chorusLfoGainR);
    this.chorusLfoGainR.connect(this.chorusDelayR.delayTime);

    this.chorusLfoL.start();
    this.chorusLfoR.start();

    this.eq6000.connect(this.chorusDry);
    this.eq6000.connect(this.chorusDelayL);
    this.eq6000.connect(this.chorusDelayR);
    this.chorusDelayL.connect(this.chorusWet);
    this.chorusDelayR.connect(this.chorusWet);

    const chorusSum = ctx.createGain();
    this.chorusDry.connect(chorusSum);
    this.chorusWet.connect(chorusSum);

    // 8. Stereo Delay
    this.delayDry = ctx.createGain();
    this.delayWet = ctx.createGain();
    this.delayWet.gain.value = 0;

    this.delayNodeL = ctx.createDelay();
    this.delayNodeR = ctx.createDelay();
    this.delayNodeL.delayTime.value = 0.38;
    this.delayNodeR.delayTime.value = 0.38;

    this.delayFeedbackGainL = ctx.createGain();
    this.delayFeedbackGainR = ctx.createGain();
    this.delayFeedbackGainL.gain.value = 0.35;
    this.delayFeedbackGainR.gain.value = 0.35;

    this.delayNodeL.connect(this.delayFeedbackGainL);
    this.delayFeedbackGainL.connect(this.delayNodeL);
    this.delayNodeR.connect(this.delayFeedbackGainR);
    this.delayFeedbackGainR.connect(this.delayNodeR);

    chorusSum.connect(this.delayDry);
    chorusSum.connect(this.delayNodeL);
    chorusSum.connect(this.delayNodeR);
    this.delayNodeL.connect(this.delayWet);
    this.delayNodeR.connect(this.delayWet);

    const delaySum = ctx.createGain();
    this.delayDry.connect(delaySum);
    this.delayWet.connect(delaySum);

    // 9. Reverb
    this.reverbDry = ctx.createGain();
    this.reverbWet = ctx.createGain();
    this.reverbWet.gain.value = 0.2;

    this.reverbConvolver = ctx.createConvolver();
    this.reverbConvolver.buffer = this.createSyntheticReverbBuffer(2.0, 0.5);

    delaySum.connect(this.reverbDry);
    delaySum.connect(this.reverbConvolver);
    this.reverbConvolver.connect(this.reverbWet);

    const reverbSum = ctx.createGain();
    this.reverbDry.connect(reverbSum);
    this.reverbWet.connect(reverbSum);

    // 10. Master Limiter & Analyser
    this.masterLimiter = ctx.createDynamicsCompressor();
    this.masterLimiter.threshold.value = -1.0;
    this.masterLimiter.knee.value = 3.0;
    this.masterLimiter.ratio.value = 16.0;
    this.masterLimiter.attack.value = 0.001;
    this.masterLimiter.release.value = 0.05;

    this.masterGain = ctx.createGain();
    this.masterGain.gain.value = 0.85;

    this.analyserNode = ctx.createAnalyser();
    this.analyserNode.fftSize = 512;
    this.analyserNode.smoothingTimeConstant = 0.8;

    reverbSum.connect(this.masterLimiter);
    this.masterLimiter.connect(this.masterGain);
    this.masterGain.connect(this.analyserNode);
    this.analyserNode.connect(ctx.destination);
  }

  // Distortion curve generators
  private generateTubeDistortionCurve(gain: number): Float32Array {
    const n = 4096;
    const curve = new Float32Array(n);
    const k = Math.max(1, gain * 2.5);

    for (let i = 0; i < n; ++i) {
      const x = (i * 2) / n - 1;
      // Asymmetric saturation (tube sag)
      if (x >= 0) {
        curve[i] = Math.tanh(x * k * 0.9);
      } else {
        curve[i] = -Math.tanh(-x * k * 1.25) * 0.95;
      }
    }
    return curve;
  }

  private generateOverdriveCurve(gain: number): Float32Array {
    const n = 2048;
    const curve = new Float32Array(n);
    const k = gain * 2;

    for (let i = 0; i < n; ++i) {
      const x = (i * 2) / n - 1;
      curve[i] = ((1 + k) * x) / (1 + k * Math.abs(x));
    }
    return curve;
  }

  private createSyntheticReverbBuffer(duration: number, decayRate: number): AudioBuffer {
    if (!this.ctx) return {} as AudioBuffer;
    const sampleRate = this.ctx.sampleRate;
    const length = sampleRate * duration;
    const impulse = this.ctx.createBuffer(2, length, sampleRate);
    const left = impulse.getChannelData(0);
    const right = impulse.getChannelData(1);

    for (let i = 0; i < length; i++) {
      const t = i / length;
      const decay = Math.exp(-t * (decayRate * 8));
      left[i] = (Math.random() * 2 - 1) * decay;
      right[i] = (Math.random() * 2 - 1) * decay;
    }
    return impulse;
  }

  // Apply Amp Rig Parameters
  public applyAmpParams(p: AmpParams): void {
    this.currentParams = p;
    if (!this.ctx) return;
    const now = this.ctx.currentTime;

    // Overdrive
    if (this.drivePreFilter && this.driveWaveshaper && this.driveGainNode) {
      if (p.driveEnabled) {
        this.drivePreFilter.gain.setValueAtTime(p.driveMidBoost ? 7.0 : 2.0, now);
        this.driveWaveshaper.curve = this.generateOverdriveCurve(p.driveGain);
        this.driveGainNode.gain.setValueAtTime(0.5 + (p.driveLevel / 10) * 1.5, now);
        if (this.drivePostFilter) {
          this.drivePostFilter.frequency.setValueAtTime(2000 + (p.driveTone / 10) * 5000, now);
        }
      } else {
        this.driveGainNode.gain.setValueAtTime(1.0, now);
      }
    }

    // Preamp Tube Gain
    if (this.preampWaveshaper) {
      const modelMultiplier =
        p.ampModel === "HM-2 Chainsaw"
          ? 1.5
          : p.ampModel === "5150 High-Gain"
          ? 1.3
          : p.ampModel === "Mesa Dual Rectifier"
          ? 1.2
          : 1.0;
      this.preampWaveshaper.curve = this.generateTubeDistortionCurve(p.gain * modelMultiplier);
    }

    // Tonestack
    if (this.tonestackBass) this.tonestackBass.gain.setValueAtTime((p.bass - 5) * 2.5, now);
    if (this.tonestackMid) this.tonestackMid.gain.setValueAtTime((p.middle - 5) * 2.8, now);
    if (this.tonestackTreble) this.tonestackTreble.gain.setValueAtTime((p.treble - 5) * 2.5, now);
    if (this.tonestackPresence) this.tonestackPresence.gain.setValueAtTime((p.presence - 5) * 2.0, now);
    if (this.tonestackResonance) this.tonestackResonance.gain.setValueAtTime((p.resonance - 5) * 2.2, now);
    if (this.ampMasterGain) this.ampMasterGain.gain.setValueAtTime(0.2 + (p.master / 10) * 0.9, now);

    // Cab simulation
    if (this.cabHighCut) {
      const cutoff = p.cabModel.includes("Orange") ? 4800 : p.cabModel.includes("Mesa") ? 5400 : 5800;
      this.cabHighCut.frequency.setValueAtTime(cutoff, now);
    }
    if (this.cabAirFilter) {
      this.cabAirFilter.gain.setValueAtTime((p.cabAir - 5) * 1.5, now);
    }

    // 5-Band EQ
    if (this.eq80 && this.eq250 && this.eq750 && this.eq2200 && this.eq6000) {
      if (p.eqEnabled) {
        this.eq80.gain.setValueAtTime(p.eq80Hz, now);
        this.eq250.gain.setValueAtTime(p.eq250Hz, now);
        this.eq750.gain.setValueAtTime(p.eq750Hz, now);
        this.eq2200.gain.setValueAtTime(p.eq2200Hz, now);
        this.eq6000.gain.setValueAtTime(p.eq6000Hz, now);
      } else {
        this.eq80.gain.setValueAtTime(0, now);
        this.eq250.gain.setValueAtTime(0, now);
        this.eq750.gain.setValueAtTime(0, now);
        this.eq2200.gain.setValueAtTime(0, now);
        this.eq6000.gain.setValueAtTime(0, now);
      }
    }

    // Chorus
    if (this.chorusWet && this.chorusLfoGainL && this.chorusLfoGainR) {
      if (p.chorusEnabled) {
        this.chorusWet.gain.setValueAtTime((p.chorusMix / 10) * 0.8, now);
        const depth = (p.chorusDepth / 10) * 0.005;
        this.chorusLfoGainL.gain.setValueAtTime(depth, now);
        this.chorusLfoGainR.gain.setValueAtTime(depth, now);
      } else {
        this.chorusWet.gain.setValueAtTime(0, now);
      }
    }

    // Delay
    if (this.delayWet && this.delayNodeL && this.delayNodeR && this.delayFeedbackGainL && this.delayFeedbackGainR) {
      if (p.delayEnabled) {
        this.delayWet.gain.setValueAtTime((p.delayMix / 10) * 0.7, now);
        const sec = p.delayTime / 1000;
        this.delayNodeL.delayTime.setValueAtTime(sec, now);
        this.delayNodeR.delayTime.setValueAtTime(p.delayPingPong ? sec * 0.75 : sec, now);
        const fb = Math.min(0.85, (p.delayFeedback / 10) * 0.8);
        this.delayFeedbackGainL.gain.setValueAtTime(fb, now);
        this.delayFeedbackGainR.gain.setValueAtTime(fb, now);
      } else {
        this.delayWet.gain.setValueAtTime(0, now);
      }
    }

    // Reverb
    if (this.reverbWet && this.reverbConvolver) {
      if (p.reverbEnabled) {
        this.reverbWet.gain.setValueAtTime((p.reverbMix / 10) * 0.6, now);
      } else {
        this.reverbWet.gain.setValueAtTime(0, now);
      }
    }
  }

  // Live Microphone / Guitar Input
  public async enableLiveInput(bufferSize = 256): Promise<boolean> {
    try {
      await this.init();
      if (!this.ctx) return false;

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: false,
          autoGainControl: false,
          noiseSuppression: false,
        } as MediaTrackConstraints,
      });

      this.micStream = stream;
      this.micSourceNode = this.ctx.createMediaStreamSource(stream);
      this.micSourceNode.connect(this.inputGainNode!);
      this.isDirectInputActive = true;
      return true;
    } catch (err) {
      console.error("Microphone/Guitar input error:", err);
      return false;
    }
  }

  public getMediaStreamDestination(): MediaStreamAudioDestinationNode | null {
    if (!this.ctx || !this.masterGain) return null;
    try {
      const dest = this.ctx.createMediaStreamDestination();
      this.masterGain.connect(dest);
      return dest;
    } catch (e) {
      return null;
    }
  }

  public disableLiveInput(): void {
    if (this.micStream) {
      this.micStream.getTracks().forEach((t) => t.stop());
      this.micStream = null;
    }
    if (this.micSourceNode) {
      this.micSourceNode.disconnect();
      this.micSourceNode = null;
    }
    this.isDirectInputActive = false;
  }

  // Master Mute & Volume
  public setMasterVolume(val: number): void {
    if (!this.masterGain || !this.ctx) return;
    this.masterGain.gain.setValueAtTime(this.isMuted ? 0 : Math.max(0, Math.min(1.5, val)), this.ctx.currentTime);
  }

  public toggleMute(): boolean {
    this.isMuted = !this.isMuted;
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setValueAtTime(this.isMuted ? 0 : 0.85, this.ctx.currentTime);
    }
    return this.isMuted;
  }

  // Metering & Noise Gate loop
  private startMeteringLoop(): void {
    const checkLevels = () => {
      if (!this.isRunning || !this.ctx) {
        requestAnimationFrame(checkLevels);
        return;
      }

      // 1. Output level from analyser
      if (this.analyserNode) {
        const data = new Uint8Array(this.analyserNode.frequencyBinCount);
        this.analyserNode.getByteTimeDomainData(data);
        let sum = 0;
        for (let i = 0; i < data.length; i++) {
          const v = (data[i] - 128) / 128;
          sum += v * v;
        }
        this.outputLevel = Math.min(1, Math.sqrt(sum / data.length) * 2.5);
      }

      // 2. Tuner & Input level
      if (this.tunerAnalyser) {
        this.tunerAnalyser.getFloatTimeDomainData(this.tunerBuffer);
        let sum = 0;
        for (let i = 0; i < this.tunerBuffer.length; i++) {
          sum += this.tunerBuffer[i] * this.tunerBuffer[i];
        }
        const rms = Math.sqrt(sum / this.tunerBuffer.length);
        this.inputLevel = Math.min(1, rms * 4);

        // Noise gate evaluation
        if (this.currentParams && this.currentParams.gateEnabled && this.gateGainNode) {
          const db = 20 * Math.log10(rms + 1e-6);
          const threshold = this.currentParams.gateThreshold;
          if (db < threshold) {
            this.isGateOpen = false;
            this.gateGainNode.gain.setTargetAtTime(0.001, this.ctx.currentTime, this.currentParams.gateRelease || 0.05);
          } else {
            this.isGateOpen = true;
            this.gateGainNode.gain.setTargetAtTime(1.0, this.ctx.currentTime, 0.005);
          }
        }
      }

      requestAnimationFrame(checkLevels);
    };

    requestAnimationFrame(checkLevels);
  }

  // Autocorrelation Tuner Pitch Detection
  public getTunerData(tuningKey: string = "Drop C (C-G-C-F-A-D)"): TunerResult | null {
    if (!this.tunerAnalyser || !this.ctx) return null;

    const sampleRate = this.ctx.sampleRate;
    const buf = this.tunerBuffer;
    const len = buf.length;

    // Root mean square (RMS)
    let sumSquares = 0;
    for (let i = 0; i < len; i++) sumSquares += buf[i] * buf[i];
    const rms = Math.sqrt(sumSquares / len);

    // Noise threshold
    if (rms < 0.008) return null;

    // Autocorrelation algorithm (YIN-like normalized difference)
    let r1 = 0,
      r2 = len - 1,
      threshold = 0.15;
    for (let i = 0; i < len / 2; i++) {
      if (Math.abs(buf[i]) < threshold) {
        r1 = i;
        break;
      }
    }
    for (let i = 1; i < len / 2; i++) {
      if (Math.abs(buf[len - i]) < threshold) {
        r2 = len - i;
        break;
      }
    }

    const trimmedBuf = buf.slice(r1, r2);
    const c = new Float32Array(trimmedBuf.length);
    for (let lag = 0; lag < trimmedBuf.length; lag++) {
      for (let i = 0; i < trimmedBuf.length - lag; i++) {
        c[lag] += trimmedBuf[i] * trimmedBuf[i + lag];
      }
    }

    let d = 0;
    while (c[d] > c[d + 1]) d++;
    let maxval = -1,
      maxpos = -1;
    for (let i = d; i < trimmedBuf.length; i++) {
      if (c[i] > maxval) {
        maxval = c[i];
        maxpos = i;
      }
    }

    if (maxpos === -1 || maxval / c[0] < 0.35) return null;

    let T0 = maxpos;
    // Parabolic interpolation for sub-bin pitch accuracy
    if (maxpos > 0 && maxpos < trimmedBuf.length - 1) {
      const alpha = c[maxpos - 1];
      const beta = c[maxpos];
      const gamma = c[maxpos + 1];
      T0 = maxpos + (gamma - alpha) / (2 * (2 * beta - alpha - gamma));
    }

    const frequency = sampleRate / T0;
    if (frequency < 40 || frequency > 1200) return null;

    // Note and cent calculation
    const A4 = 440;
    const semitonesFromA4 = 12 * Math.log2(frequency / A4);
    const midiNote = Math.round(semitonesFromA4) + 69;
    const exactMidi = semitonesFromA4 + 69;
    const cents = Math.round((exactMidi - midiNote) * 100);

    const noteNames = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
    const note = noteNames[((midiNote % 12) + 12) % 12];
    const octave = Math.floor(midiNote / 12) - 1;

    // Match against current selected tuning target strings
    const targetStrings = (TUNING_PRESETS_MAP as any)[tuningKey] || DROP_C_STRINGS;
    let closestString: any = null;
    let minDiff = Infinity;

    for (const str of targetStrings) {
      const diff = Math.abs(frequency - str.targetFreq);
      if (diff < minDiff) {
        minDiff = diff;
        closestString = str;
      }
    }

    return {
      frequency: Math.round(frequency * 10) / 10,
      note,
      octave,
      cents: Math.max(-50, Math.min(50, cents)),
      targetString: closestString,
      isInTune: Math.abs(cents) <= 4,
      clarity: Math.min(1, maxval / c[0]),
    };
  }

  // Virtual Drop C Metal Guitar Synthesizer
  // Allows testing guitar riffs, power chords, and tab sequences through the DSP chain
  public playDropCNote(
    stringIndex: number, // 0 = 6th string low C, 5 = 1st string high D
    fret: number, // 0 to 24
    duration = 0.6,
    isPalmMute = false
  ): void {
    if (!this.ctx || !this.synthBusGain) return;
    const ctx = this.ctx;
    const now = ctx.currentTime;

    // Base frequencies for Drop C strings: C2, G2, C3, F3, A3, D4
    const baseFreqs = [65.41, 98.0, 130.81, 174.61, 220.0, 293.66];
    const baseFreq = baseFreqs[stringIndex] || 65.41;
    const freq = baseFreq * Math.pow(2, fret / 12);

    // Multi-oscillator synthesis for rich guitar string harmonics
    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const oscSub = ctx.createOscillator();

    osc1.type = "sawtooth";
    osc2.type = "triangle";
    oscSub.type = "sine";

    osc1.frequency.setValueAtTime(freq, now);
    osc2.frequency.setValueAtTime(freq * 1.002, now); // slight detune
    oscSub.frequency.setValueAtTime(freq * 0.5, now); // heavy sub octave punch

    // Guitar string pluck transient & palm-mute filter envelope
    const filter = ctx.createBiquadFilter();
    filter.type = "lowpass";
    if (isPalmMute) {
      filter.frequency.setValueAtTime(freq * 3.5, now);
      filter.frequency.exponentialRampToValueAtTime(Math.max(80, freq * 1.2), now + (duration || 0.2));
    } else {
      filter.frequency.setValueAtTime(freq * 8.0, now);
      filter.frequency.exponentialRampToValueAtTime(freq * 2.5, now + duration);
    }

    const noteGain = ctx.createGain();
    const peakVolume = isPalmMute ? 0.9 : 0.8;
    noteGain.gain.setValueAtTime(0.001, now);
    noteGain.gain.linearRampToValueAtTime(peakVolume, now + 0.008);

    if (isPalmMute) {
      noteGain.gain.exponentialRampToValueAtTime(0.001, now + (duration ? Math.min(duration, 0.28) : 0.25));
    } else {
      noteGain.gain.exponentialRampToValueAtTime(0.001, now + duration);
    }

    osc1.connect(filter);
    osc2.connect(filter);
    oscSub.connect(filter);
    filter.connect(noteGain);
    noteGain.connect(this.synthBusGain);

    osc1.start(now);
    osc2.start(now);
    oscSub.start(now);

    const stopTime = now + (isPalmMute ? 0.3 : duration + 0.05);
    osc1.stop(stopTime);
    osc2.stop(stopTime);
    oscSub.stop(stopTime);
  }

  // Play Drop C Power Chord / Complex Voicing
  public playDropCVoicing(fretPositions: (number | "x")[], isPalmMute = false, duration = 0.8): void {
    if (!this.ctx) return;
    // Strumming delay between strings (5ms)
    fretPositions.forEach((fret, stringIdx) => {
      if (typeof fret === "number") {
        setTimeout(() => {
          this.playDropCNote(stringIdx, fret, duration, isPalmMute);
        }, stringIdx * 6);
      }
    });
  }

  // Metal Drum Machine Generator
  public startDrumMachine(pattern: DrumBeatPattern, bpm: number): void {
    this.bpm = bpm;
    this.currentBeatPattern = pattern;
    this.isDrumPlaying = true;
    this.currentStep = 0;

    if (this.metronomeTimer) clearInterval(this.metronomeTimer);

    // 16th-note subdivision clock
    const stepIntervalMs = (60000 / bpm) / 4;
    this.metronomeTimer = window.setInterval(() => {
      if (!this.isDrumPlaying) return;
      this.triggerDrumStep(this.currentStep % 16);
      this.currentStep++;
    }, stepIntervalMs);
  }

  public stopDrumMachine(): void {
    this.isDrumPlaying = false;
    if (this.metronomeTimer) {
      clearInterval(this.metronomeTimer);
      this.metronomeTimer = null;
    }
  }

  private triggerDrumStep(step: number): void {
    if (!this.ctx) return;
    const pattern = this.currentBeatPattern;

    // 1. Click Metronome only
    if (pattern === "None / Click Only") {
      if (step % 4 === 0) this.playDrumSound("click", step === 0 ? 1200 : 800);
      return;
    }

    // 2. 0-0-0 Breakdown Heavy (Half-time, massive china cymbal on beats, double kick syncopation)
    if (pattern === "0-0-0 Breakdown Heavy") {
      // China cymbal on quarter notes
      if (step % 4 === 0) this.playDrumSound("china");
      // Snare on beat 3 (step 8 in half-time)
      if (step === 8) this.playDrumSound("snare");
      // Heavy double kicks (0-0-0 breakdown syncopation)
      if (step === 0 || step === 2 || step === 3 || step === 6 || step === 10 || step === 12 || step === 14) {
        this.playDrumSound("kick");
      }
      if (step % 2 === 0) this.playDrumSound("hihat");
    }

    // 3. Double Bass Gallop (Thrash Metal 16th note double bass)
    else if (pattern === "Double Bass Gallop (Thrash)") {
      this.playDrumSound("kick"); // Non-stop double bass
      if (step === 4 || step === 12) this.playDrumSound("snare");
      if (step % 2 === 0) this.playDrumSound("ride");
    }

    // 4. Blast Beat (Death/Black Metal)
    else if (pattern === "Blast Beat (Death/Black)") {
      if (step % 2 === 0) {
        this.playDrumSound("kick");
        this.playDrumSound("snare");
        this.playDrumSound("hihat");
      } else {
        this.playDrumSound("kick");
      }
    }

    // 5. Half-Time Groove (Metalcore)
    else if (pattern === "Half-Time Groove (Metalcore)") {
      if (step === 0 || step === 6 || step === 10) this.playDrumSound("kick");
      if (step === 8) this.playDrumSound("snare");
      if (step % 2 === 0) this.playDrumSound("hihat");
    }

    // 6. Djent Polyrhythm (7/8 & 4/4)
    else if (pattern === "Djent Polyrhythm (7/8 & 4/4)") {
      if (step === 0 || step === 3 || step === 6 || step === 9 || step === 11 || step === 14) {
        this.playDrumSound("kick");
      }
      if (step === 4 || step === 12) this.playDrumSound("snare");
      if (step % 2 === 0) this.playDrumSound("ride");
    }

    // 7. Slow Sludge Doom
    else if (pattern === "Slow Sludge Doom (60 BPM)") {
      if (step === 0) {
        this.playDrumSound("kick");
        this.playDrumSound("china");
      }
      if (step === 8) this.playDrumSound("snare");
      if (step % 4 === 0) this.playDrumSound("hihat");
    }
  }

  // Procedural Metal Drum Sound Generators
  private playDrumSound(type: "kick" | "snare" | "hihat" | "ride" | "china" | "click", freq = 1000): void {
    if (!this.ctx) return;
    const ctx = this.ctx;
    const now = ctx.currentTime;

    if (type === "kick") {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.frequency.setValueAtTime(140, now);
      osc.frequency.exponentialRampToValueAtTime(38, now + 0.12);
      gain.gain.setValueAtTime(1.0, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
      osc.connect(gain);
      gain.connect(this.masterLimiter || ctx.destination);
      osc.start(now);
      osc.stop(now + 0.26);
    } else if (type === "snare") {
      // Crack tone + White noise body
      const osc = ctx.createOscillator();
      const oscGain = ctx.createGain();
      osc.type = "triangle";
      osc.frequency.setValueAtTime(220, now);
      osc.frequency.exponentialRampToValueAtTime(120, now + 0.08);
      oscGain.gain.setValueAtTime(0.8, now);
      oscGain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
      osc.connect(oscGain);
      oscGain.connect(this.masterLimiter || ctx.destination);
      osc.start(now);
      osc.stop(now + 0.16);

      // Snare noise
      const noiseBuffer = ctx.createBuffer(1, ctx.sampleRate * 0.2, ctx.sampleRate);
      const output = noiseBuffer.getChannelData(0);
      for (let i = 0; i < noiseBuffer.length; i++) output[i] = Math.random() * 2 - 1;

      const whiteNoise = ctx.createBufferSource();
      whiteNoise.buffer = noiseBuffer;
      const noiseFilter = ctx.createBiquadFilter();
      noiseFilter.type = "highpass";
      noiseFilter.frequency.value = 1000;
      const noiseGain = ctx.createGain();
      noiseGain.gain.setValueAtTime(0.9, now);
      noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
      whiteNoise.connect(noiseFilter);
      noiseFilter.connect(noiseGain);
      noiseGain.connect(this.masterLimiter || ctx.destination);
      whiteNoise.start(now);
      whiteNoise.stop(now + 0.21);
    } else if (type === "hihat" || type === "ride" || type === "china") {
      const dur = type === "china" ? 0.7 : type === "ride" ? 0.5 : 0.08;
      const noiseBuffer = ctx.createBuffer(1, ctx.sampleRate * dur, ctx.sampleRate);
      const output = noiseBuffer.getChannelData(0);
      for (let i = 0; i < noiseBuffer.length; i++) output[i] = Math.random() * 2 - 1;

      const whiteNoise = ctx.createBufferSource();
      whiteNoise.buffer = noiseBuffer;
      const noiseFilter = ctx.createBiquadFilter();
      noiseFilter.type = "bandpass";
      noiseFilter.frequency.value = type === "china" ? 4500 : type === "ride" ? 7000 : 9000;
      noiseFilter.Q.value = type === "china" ? 1.5 : 3.0;

      const noiseGain = ctx.createGain();
      noiseGain.gain.setValueAtTime(type === "china" ? 0.9 : 0.45, now);
      noiseGain.gain.exponentialRampToValueAtTime(0.001, now + dur);
      whiteNoise.connect(noiseFilter);
      noiseFilter.connect(noiseGain);
      noiseGain.connect(this.masterLimiter || ctx.destination);
      whiteNoise.start(now);
      whiteNoise.stop(now + dur + 0.01);
    } else if (type === "click") {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, now);
      gain.gain.setValueAtTime(0.7, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);
      osc.connect(gain);
      gain.connect(this.masterLimiter || ctx.destination);
      osc.start(now);
      osc.stop(now + 0.05);
    }
  }

  // AudioBuffer WAV Exporter (24-bit 48kHz Master Mixdown)
  public exportAudioBufferToWav(buffer: AudioBuffer): Blob {
    const numChannels = buffer.numberOfChannels;
    const sampleRate = buffer.sampleRate;
    const length = buffer.length * numChannels * 2 + 44;
    const out = new DataView(new ArrayBuffer(length));

    let offset = 0;
    const writeString = (s: string) => {
      for (let i = 0; i < s.length; i++) out.setUint8(offset++, s.charCodeAt(i));
    };

    writeString("RIFF");
    out.setUint32(offset, length - 8, true);
    offset += 4;
    writeString("WAVE");
    writeString("fmt ");
    out.setUint32(offset, 16, true);
    offset += 4;
    out.setUint16(offset, 1, true); // PCM
    offset += 2;
    out.setUint16(offset, numChannels, true);
    offset += 2;
    out.setUint32(offset, sampleRate, true);
    offset += 4;
    out.setUint32(offset, sampleRate * numChannels * 2, true); // Byte rate
    offset += 4;
    out.setUint16(offset, numChannels * 2, true); // Block align
    offset += 2;
    out.setUint16(offset, 16, true); // 16/24 bit
    offset += 2;
    writeString("data");
    out.setUint32(offset, length - offset - 4, true);
    offset += 4;

    const channels: Float32Array[] = [];
    for (let c = 0; c < numChannels; c++) channels.push(buffer.getChannelData(c));

    for (let i = 0; i < buffer.length; i++) {
      for (let c = 0; c < numChannels; c++) {
        let sample = Math.max(-1, Math.min(1, channels[c][i]));
        sample = sample < 0 ? sample * 0x8000 : sample * 0x7fff;
        out.setInt16(offset, sample, true);
        offset += 2;
      }
    }

    return new Blob([out.buffer], { type: "audio/wav" });
  }
}
