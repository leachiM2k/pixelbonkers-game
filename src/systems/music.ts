import type Phaser from 'phaser';
import { settings } from '../game/settings';

// Export-Vertrag (FX/AUDIO -> META/ORCHESTRATOR):
// export class MusicSystem { constructor(scene?: Phaser.Scene); start(): void; stop(): void }
// Prozeduraler Chiptune-Loop (WebAudio): Square-Lead (C-Pentatonik, sprunghaft),
// Triangle-Bass, Noise-Hi-Hats, 160 BPM, 16 Takte. Lookahead-Scheduler
// (setInterval 100ms, scheduleAhead 0.2s). start() idempotent, stop() mit Gain-Fadeout.
// Respektiert settings.music live: off -> es wird nichts geschedult.

const BPM = 160;
const STEP = 60 / BPM / 2;
const TICK_MS = 100;
const SCHEDULE_AHEAD = 0.2;
const MUSIC_GAIN = 0.22;

const LEAD: number[] = [
  72, 76, 79, 76, 81, 79, 76, 72,
  74, 76, 74, 72, 67, 69, 72, 0,
  72, 76, 79, 81, 84, 81, 79, 76,
  79, 76, 74, 72, 74, 72, 69, 67,
  81, 84, 81, 79, 76, 79, 81, 84,
  79, 76, 74, 76, 72, 74, 76, 79,
  84, 81, 79, 76, 74, 72, 74, 76,
  72, 0, 67, 0, 72, 0, 0, 0,
  72, 76, 79, 76, 81, 79, 76, 72,
  74, 76, 74, 72, 67, 69, 72, 0,
  72, 76, 79, 81, 84, 81, 79, 76,
  79, 76, 74, 72, 74, 72, 69, 67,
  81, 79, 81, 84, 81, 79, 76, 74,
  72, 74, 76, 79, 76, 74, 72, 69,
  67, 69, 72, 74, 76, 74, 72, 74,
  72, 0, 72, 0, 79, 0, 0, 0,
];

const BASS_ROOTS = [48, 48, 43, 43, 45, 45, 41, 43, 48, 48, 43, 43, 45, 41, 48, 43];

function midiHz(m: number): number {
  return 440 * Math.pow(2, (m - 69) / 12);
}

export class MusicSystem {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private noise: AudioBuffer | null = null;
  private timer: number | null = null;
  private running = false;
  private step = 0;
  private nextTime = 0;

  constructor(_scene?: Phaser.Scene) {}

  start(): void {
    if (this.running) return;
    const ctx = this.ensure();
    if (!ctx) return;
    if (ctx.state === 'suspended') ctx.resume().catch(() => undefined);
    this.running = true;
    this.step = 0;
    this.nextTime = ctx.currentTime + 0.1;
    const master = this.master;
    if (master) {
      const g = master.gain;
      g.cancelScheduledValues(ctx.currentTime);
      g.setValueAtTime(0.0001, ctx.currentTime);
      g.linearRampToValueAtTime(MUSIC_GAIN, ctx.currentTime + 0.2);
    }
    this.timer = window.setInterval(() => this.tick(), TICK_MS);
  }

  stop(): void {
    if (!this.running) return;
    this.running = false;
    if (this.timer !== null) {
      window.clearInterval(this.timer);
      this.timer = null;
    }
    const ctx = this.ctx;
    const master = this.master;
    if (ctx && master) {
      const g = master.gain;
      g.cancelScheduledValues(ctx.currentTime);
      g.setValueAtTime(Math.max(g.value, 0.0001), ctx.currentTime);
      g.linearRampToValueAtTime(0.0001, ctx.currentTime + 0.3);
    }
  }

  private tick(): void {
    const ctx = this.ctx;
    if (!ctx || !this.running) return;
    if (!settings.music || ctx.state !== 'running') return;
    while (this.nextTime < ctx.currentTime + SCHEDULE_AHEAD) {
      this.scheduleStep(this.step, this.nextTime);
      this.nextTime += STEP;
      this.step = (this.step + 1) % LEAD.length;
    }
  }

  private scheduleStep(step: number, t: number): void {
    const bar = Math.floor(step / 8);
    const s = step % 8;
    const lead = LEAD[step];
    if (lead > 0) this.note(t, 'square', midiHz(lead), STEP * 0.85, 0.09);
    const root = BASS_ROOTS[bar];
    if (s % 2 === 0) {
      this.note(t, 'triangle', midiHz(root), STEP * 0.9, 0.16);
    } else if (s === 3 || s === 7) {
      this.note(t, 'triangle', midiHz(root + 7), STEP * 0.9, 0.13);
    }
    if (s === 0 || s === 4) this.note(t, 'triangle', 65, 0.05, 0.18);
    this.hat(t, s % 4 === 0 ? 0.04 : 0.018, s % 2 === 1 ? 0.05 : 0.03);
  }

  private note(t: number, type: OscillatorType, freq: number, dur: number, gain: number): void {
    const ctx = this.ctx;
    const master = this.master;
    if (!ctx || !master) return;
    const osc = ctx.createOscillator();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(gain, t + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    osc.connect(g);
    g.connect(master);
    osc.start(t);
    osc.stop(t + dur + 0.02);
  }

  private hat(t: number, gain: number, dur: number): void {
    const ctx = this.ctx;
    const master = this.master;
    if (!ctx || !master) return;
    if (!this.noise) {
      const len = Math.floor(ctx.sampleRate);
      this.noise = ctx.createBuffer(1, len, ctx.sampleRate);
      const data = this.noise.getChannelData(0);
      for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
    }
    const src = ctx.createBufferSource();
    src.buffer = this.noise;
    const filter = ctx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.value = 8000;
    const g = ctx.createGain();
    g.gain.setValueAtTime(gain, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    src.connect(filter);
    filter.connect(g);
    g.connect(master);
    src.start(t);
    src.stop(t + dur + 0.02);
  }

  private ensure(): AudioContext | null {
    if (this.ctx) return this.ctx;
    try {
      const Ctor =
        window.AudioContext ??
        (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!Ctor) return null;
      this.ctx = new Ctor();
      this.master = this.ctx.createGain();
      this.master.gain.value = 0.0001;
      this.master.connect(this.ctx.destination);
    } catch {
      this.ctx = null;
    }
    return this.ctx;
  }
}
