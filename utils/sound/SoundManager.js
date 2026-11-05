/**
 * SoundManager — central audio control for the 3D portfolio.
 * Uses the Web Audio API. All sounds are synthesized so no audio
 * assets need to be shipped. No external audio files are required.
 *
 * Guarded against SSR: the constructor defers initialization until
 * the browser exposes the `window` object.
 */
"use strict";

export class SoundManager {
  constructor() {
    this.enabled = true;
    this.ctx = null;
  }

  _init() {
    if (this.ctx) return;
    if (typeof window === "undefined") return;
    try {
      this.ctx = new (window.AudioContext || window.webkitAudioContext)();
    } catch (e) {
      console.warn("Web Audio API not available:", e);
      this.enabled = false;
    }
  }

  get isReady() {
    return !!this.ctx;
  }

  get volume() {
    return this._volume;
  }

  set volume(v) {
    this._volume = Math.min(1, Math.max(0, v));
  }

  toggle() {
    this.enabled = !this.enabled;
    if (!this.enabled && this.ctx && this.ctx.state !== "closed") {
      this.ctx.suspend();
    } else if (this.enabled && this.ctx && this.ctx.state === "suspended") {
      this.ctx.resume();
    }
  }

  async ensureContext() {
    if (!this.ctx) {
      await this._init();
    }
    if (this.ctx && this.ctx.state === "suspended") {
      await this.ctx.resume();
    }
  }

  dispose() {
    if (this.ctx && this.ctx.state !== "closed") {
      this.ctx.close();
    }
    this.ctx = null;
    this.enabled = false;
  }

  play(type) {
    if (!this.enabled) return;
    if (!this.ctx) return;
    const ctx = this.ctx;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    gain.gain.value = 0;
    osc.type = "sine";
    let freq = 440,
      dur = 0.15,
      start = now;
    switch (type) {
      case "power":
        freq = 220;
        dur = 0.4;
        start = now;
        break;
      case "roll":
        freq = 60;
        dur = 0.08;
        start = now;
        break;
      case "vehicle":
        freq = 120;
        dur = 0.25;
        start = now;
        break;
      case "ui":
        freq = 660;
        dur = 0.05;
        start = now;
        break;
      case "select":
        freq = 880;
        dur = 0.1;
        start = now;
        break;
      case "error":
        freq = 200;
        dur = 0.25;
        start = now;
        break;
      default:
        break;
    }
    osc.frequency.setValueAtTime(freq, start);
    osc.connect(gain);
    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.exponentialRampToValueAtTime(0.18, start + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + dur);
    osc.start(start);
    osc.stop(start + dur + 0.05);
  }
}

// Singleton (client-side only — guarded against SSR)
let soundManagerInstance = null;
export const getSoundManager = () => {
  if (typeof window === "undefined") return null;
  if (!soundManagerInstance) {
    soundManagerInstance = new SoundManager();
  }
  return soundManagerInstance;
};
export default soundManagerInstance || null;
