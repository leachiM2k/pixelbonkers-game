import Phaser from 'phaser';
import { settings } from '../game/settings';

// Export-Vertrag (FX/AUDIO -> alle Szenen):
// export type SfxName = 'menuSelect'|'jump'|'land'|'hit'|'heavyHit'|'pickup'|'throw'|
//   'weaponImpact'|'ko'|'victory'|'countdown'|'fight'|'squeak'|'bonk';
// export class AudioSystem { constructor(scene: Phaser.Scene); play(name: SfxName): void }
// Komplett prozedural (WebAudio-Oszillatoren + Noise-Buffer), keine Dateien.
// AudioContext lazy, resume auf erstem User-Gesture (Autoplay-Sperre, nie werfen).
// play() respektiert settings.sound live. Master-Gain 0.3.

export type SfxName =
  | 'menuSelect'
  | 'jump'
  | 'land'
  | 'hit'
  | 'heavyHit'
  | 'pickup'
  | 'throw'
  | 'weaponImpact'
  | 'ko'
  | 'victory'
  | 'countdown'
  | 'fight'
  | 'squeak'
  | 'bonk';

const MASTER_GAIN = 0.3;

export class AudioSystem {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private noise: AudioBuffer | null = null;

  constructor(scene: Phaser.Scene) {
    scene.input.keyboard?.once('keydown', () => {
      const ctx = this.ensure();
      if (ctx && ctx.state === 'suspended') ctx.resume().catch(() => undefined);
    });
  }

  play(name: SfxName): void {
    if (!settings.sound) return;
    const ctx = this.ensure();
    if (!ctx) return;
    if (ctx.state === 'suspended') {
      ctx.resume().catch(() => undefined);
      return;
    }
    if (ctx.state !== 'running') return;
    const t = ctx.currentTime + 0.001;
    switch (name) {
      case 'menuSelect':
        this.tone(t, 'square', 880, 1320, 0.06, 0.12);
        break;
      case 'jump':
        this.tone(t, 'square', 220, 660, 0.12, 0.11);
        break;
      case 'land':
        this.tone(t, 'sine', 130, 60, 0.09, 0.2);
        this.noiseBurst(t, 0.06, 0.1, 600, 150, 'lowpass');
        break;
      case 'hit':
        this.tone(t, 'square', 330, 160, 0.08, 0.14);
        this.noiseBurst(t, 0.05, 0.07, 2500, 800, 'bandpass');
        break;
      case 'heavyHit':
        this.tone(t, 'square', 160, 55, 0.2, 0.18);
        this.noiseBurst(t, 0.12, 0.11, 900, 200, 'lowpass');
        break;
      case 'pickup':
        this.tone(t, 'triangle', 523, 523, 0.05, 0.12);
        this.tone(t + 0.06, 'triangle', 659, 659, 0.05, 0.12);
        this.tone(t + 0.12, 'triangle', 784, 784, 0.07, 0.12);
        break;
      case 'throw':
        this.noiseBurst(t, 0.2, 0.12, 500, 3500, 'bandpass');
        break;
      case 'weaponImpact':
        this.tone(t, 'square', 1800, 900, 0.02, 0.08);
        this.tone(t, 'sine', 110, 70, 0.08, 0.15);
        break;
      case 'ko': {
        const notes = [660, 554, 440, 330, 220];
        notes.forEach((f, i) => this.tone(t + i * 0.09, 'square', f, f * 0.98, 0.09, 0.13));
        break;
      }
      case 'victory': {
        const fanfare = [523, 659, 784, 1046];
        fanfare.forEach((f, i) =>
          this.tone(t + i * 0.11, 'square', f, f, i === 3 ? 0.3 : 0.12, 0.13),
        );
        break;
      }
      case 'countdown':
        this.tone(t, 'square', 440, 440, 0.08, 0.12);
        break;
      case 'fight':
        this.tone(t, 'square', 880, 880, 0.07, 0.12);
        this.tone(t + 0.1, 'square', 440, 880, 0.18, 0.13);
        break;
      case 'squeak':
        this.tone(t, 'sine', 1250, 880, 0.11, 0.17, 120);
        this.tone(t + 0.16, 'sine', 1200, 850, 0.11, 0.17, 120);
        break;
      case 'bonk':
        this.tone(t, 'sine', 150, 75, 0.18, 0.24);
        this.tone(t, 'triangle', 300, 150, 0.05, 0.07);
        break;
    }
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
      this.master.gain.value = MASTER_GAIN;
      this.master.connect(this.ctx.destination);
    } catch {
      this.ctx = null;
    }
    return this.ctx;
  }

  private tone(t: number, type: OscillatorType, f0: number, f1: number,
    dur: number, gain: number, vibratoCents = 0): void {
    const ctx = this.ctx;
    const master = this.master;
    if (!ctx || !master) return;
    const osc = ctx.createOscillator();
    osc.type = type;
    osc.frequency.setValueAtTime(Math.max(1, f0), t);
    osc.frequency.exponentialRampToValueAtTime(Math.max(1, f1), t + dur);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(gain, t + 0.006);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    osc.connect(g);
    g.connect(master);
    if (vibratoCents > 0) {
      const lfo = ctx.createOscillator();
      lfo.frequency.value = 40;
      const lfoGain = ctx.createGain();
      lfoGain.gain.value = vibratoCents;
      lfo.connect(lfoGain);
      lfoGain.connect(osc.detune);
      lfo.start(t);
      lfo.stop(t + dur);
    }
    osc.start(t);
    osc.stop(t + dur + 0.02);
  }

  private noiseBurst(t: number, dur: number, gain: number, f0: number, f1: number,
    type: BiquadFilterType): void {
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
    src.loop = true;
    const filter = ctx.createBiquadFilter();
    filter.type = type;
    filter.frequency.setValueAtTime(Math.max(1, f0), t);
    filter.frequency.exponentialRampToValueAtTime(Math.max(1, f1), t + dur);
    const g = ctx.createGain();
    g.gain.setValueAtTime(gain, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    src.connect(filter);
    filter.connect(g);
    g.connect(master);
    src.start(t);
    src.stop(t + dur + 0.02);
  }
}
