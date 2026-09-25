/**
 * All sound is synthesised with Web Audio: no audio files. The signature sound
 * is the slap of a card snapped down on the table; around it are koto plucks
 * (Karplus–Strong), taiko, a temple bell and hyoshigi wooden clappers.
 */
import type { Season } from '@/content/cards';

type Ctx = AudioContext;

let ctx: Ctx | null = null;
let master: GainNode | null = null;
let sfxBus: GainNode | null = null;
let musicBus: GainNode | null = null;
let reverb: ConvolverNode | null = null;
let reverbSend: GainNode | null = null;
let noiseBuffer: AudioBuffer | null = null;
const pluckCache = new Map<string, AudioBuffer>();
let volumes = { sfx: 0.8, music: 0.5 };

/** The koto "in" (miyako-bushi) scale, D-based. */
const IN_SCALE = [293.66, 311.13, 392.0, 440.0, 466.16];

export function setVolumes(sfx: number, music: number): void {
  volumes = { sfx, music };
  if (sfxBus) sfxBus.gain.value = sfx;
  if (musicBus) musicBus.gain.value = music * 0.55;
}

/** True while we have paused the sound because the page is hidden. */
let pausedForHidden = false;

/**
 * Silence everything while the game is in a background tab or the app is minimised, and pick up
 * again on return. Every sound (music notes included) checks `ready()`, which is false while the
 * context is suspended, so nothing queues up and plays in a burst on return.
 */
function onVisibilityChange(): void {
  if (!ctx) return;
  if (document.hidden) {
    if (ctx.state === 'running') {
      pausedForHidden = true;
      void ctx.suspend();
    }
  } else if (pausedForHidden) {
    pausedForHidden = false;
    void ctx.resume();
  }
}

/** Create (or resume) the audio context. Must be called from a user gesture. */
export function unlockAudio(): void {
  try {
    if (!ctx) {
      const AC =
        window.AudioContext ??
        (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!AC) return;
      ctx = new AC();
      master = ctx.createGain();
      master.gain.value = 0.9;
      const comp = ctx.createDynamicsCompressor();
      comp.threshold.value = -14;
      comp.ratio.value = 4;
      master.connect(comp).connect(ctx.destination);
      sfxBus = ctx.createGain();
      musicBus = ctx.createGain();
      sfxBus.connect(master);
      musicBus.connect(master);
      reverb = ctx.createConvolver();
      reverb.buffer = impulse(ctx, 2.8, 2.2);
      reverbSend = ctx.createGain();
      reverbSend.gain.value = 0.35;
      reverbSend.connect(reverb).connect(master);
      noiseBuffer = makeNoise(ctx);
      setVolumes(volumes.sfx, volumes.music);
      document.addEventListener('visibilitychange', onVisibilityChange);
    }
    if (ctx.state === 'suspended') void ctx.resume();
  } catch {
    ctx = null;
  }
}

function impulse(c: Ctx, seconds: number, decay: number): AudioBuffer {
  const len = Math.floor(c.sampleRate * seconds);
  const buf = c.createBuffer(2, len, c.sampleRate);
  for (let ch = 0; ch < 2; ch++) {
    const d = buf.getChannelData(ch);
    for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, decay);
  }
  return buf;
}

function makeNoise(c: Ctx): AudioBuffer {
  const len = c.sampleRate;
  const buf = c.createBuffer(1, len, c.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
  return buf;
}

function ready(): Ctx | null {
  if (!ctx || !sfxBus || ctx.state !== 'running') return null;
  return ctx;
}

function noise(c: Ctx, when: number, dur: number): AudioBufferSourceNode {
  const src = c.createBufferSource();
  src.buffer = noiseBuffer;
  src.loop = true;
  src.start(when, Math.random() * 0.5, dur + 0.05);
  return src;
}

function env(c: Ctx, when: number, attack: number, peak: number, decay: number): GainNode {
  const g = c.createGain();
  g.gain.setValueAtTime(0.0001, when);
  g.gain.exponentialRampToValueAtTime(peak, when + attack);
  g.gain.exponentialRampToValueAtTime(0.0001, when + attack + decay);
  return g;
}

// ---------------------------------------------------------------------------
// The slap

export function slap(strength = 1): void {
  const c = ready();
  if (!c || !sfxBus) return;
  const t = c.currentTime + 0.005;
  const jitter = 0.85 + Math.random() * 0.3;
  // Crack: band-passed noise, very short.
  const n = noise(c, t, 0.12);
  const bp = c.createBiquadFilter();
  bp.type = 'bandpass';
  bp.frequency.value = 2100 * jitter;
  bp.Q.value = 0.9;
  const hp = c.createBiquadFilter();
  hp.type = 'highpass';
  hp.frequency.value = 500;
  const g1 = env(c, t, 0.001, 0.9 * strength, 0.07);
  n.connect(bp).connect(hp).connect(g1).connect(sfxBus);
  // Body: a pitched thump of the card on the table.
  const o = c.createOscillator();
  o.type = 'sine';
  o.frequency.setValueAtTime(170 * jitter, t);
  o.frequency.exponentialRampToValueAtTime(55, t + 0.07);
  const g2 = env(c, t, 0.002, 0.7 * strength, 0.1);
  o.connect(g2).connect(sfxBus);
  o.start(t);
  o.stop(t + 0.2);
  // Room.
  if (reverbSend) g1.connect(reverbSend);
}

export function flipSound(): void {
  const c = ready();
  if (!c || !sfxBus) return;
  const t = c.currentTime + 0.005;
  const n = noise(c, t, 0.12);
  const f = c.createBiquadFilter();
  f.type = 'bandpass';
  f.Q.value = 1.2;
  f.frequency.setValueAtTime(3200, t);
  f.frequency.exponentialRampToValueAtTime(900, t + 0.09);
  const g = env(c, t, 0.01, 0.35, 0.09);
  n.connect(f).connect(g).connect(sfxBus);
}

export function tock(freq = 950, gain = 0.5): void {
  const c = ready();
  if (!c || !sfxBus) return;
  const t = c.currentTime + 0.005;
  const n = noise(c, t, 0.08);
  const f = c.createBiquadFilter();
  f.type = 'bandpass';
  f.frequency.value = freq;
  f.Q.value = 12;
  const g = env(c, t, 0.001, gain, 0.06);
  n.connect(f).connect(g).connect(sfxBus);
}

/** Hyoshigi: two wooden clappers struck together. */
export function clack(): void {
  const c = ready();
  if (!c || !sfxBus) return;
  for (const [delay, freq] of [
    [0, 2300],
    [0.012, 1650],
  ] as const) {
    const t = c.currentTime + 0.005 + delay;
    const n = noise(c, t, 0.05);
    const f = c.createBiquadFilter();
    f.type = 'bandpass';
    f.frequency.value = freq;
    f.Q.value = 18;
    const g = env(c, t, 0.0008, 1.4, 0.05);
    n.connect(f).connect(g).connect(sfxBus);
    if (reverbSend) g.connect(reverbSend);
  }
}

// ---------------------------------------------------------------------------
// Koto (Karplus–Strong, rendered offline once per pitch)

function pluckBuffer(c: Ctx, freq: number, bright: number): AudioBuffer {
  const key = `${freq.toFixed(2)}:${bright}`;
  const hit = pluckCache.get(key);
  if (hit) return hit;
  const sr = c.sampleRate;
  const len = Math.floor(sr * 2.2);
  const buf = c.createBuffer(1, len, sr);
  const out = buf.getChannelData(0);
  const period = Math.max(2, Math.round(sr / freq));
  const line = new Float32Array(period);
  for (let i = 0; i < period; i++)
    line[i] = (Math.random() * 2 - 1) * (i < period * bright ? 1 : 0.4);
  let idx = 0;
  let prev = 0;
  for (let i = 0; i < len; i++) {
    const cur = line[idx] as number;
    const next = line[(idx + 1) % period] as number;
    const v = 0.4985 * (cur + next) + 0.001 * prev;
    line[idx] = v;
    prev = v;
    out[i] = cur * Math.min(1, i / 40);
    idx = (idx + 1) % period;
  }
  pluckCache.set(key, buf);
  return buf;
}

export function pluck(freq: number, delay = 0, gain = 0.5, bus: 'sfx' | 'music' = 'sfx'): void {
  const c = ready();
  const target = bus === 'sfx' ? sfxBus : musicBus;
  if (!c || !target) return;
  const t = c.currentTime + 0.01 + delay;
  const src = c.createBufferSource();
  src.buffer = pluckBuffer(c, freq, 0.6);
  const lp = c.createBiquadFilter();
  lp.type = 'lowpass';
  lp.frequency.value = Math.min(6000, freq * 9);
  const g = c.createGain();
  g.gain.value = gain;
  src.connect(lp).connect(g).connect(target);
  if (reverbSend) g.connect(reverbSend);
  src.start(t);
}

function scaleNote(step: number): number {
  const octave = Math.floor(step / IN_SCALE.length);
  const i = ((step % IN_SCALE.length) + IN_SCALE.length) % IN_SCALE.length;
  return (IN_SCALE[i] as number) * Math.pow(2, octave);
}

/** Rising koto arpeggio; longer for bigger yaku. */
export function yakuChime(size = 3): void {
  for (let i = 0; i < size; i++) pluck(scaleNote(i + 3), i * 0.085, 0.45);
}

export function tick(step: number, kind: 'chips' | 'mult' = 'chips'): void {
  pluck(scaleNote((kind === 'chips' ? 3 : 5) + Math.min(step, 10)), 0, 0.3);
}

// ---------------------------------------------------------------------------
// UI sounds: paper, wood and water, to match the woodblock look.

/** A few damped, slightly inharmonic sine partials: the ring of a struck object. */
function modes(c: Ctx, t: number, partials: readonly (readonly [number, number, number])[]): void {
  if (!sfxBus) return;
  for (const [freq, gain, decay] of partials) {
    const o = c.createOscillator();
    o.type = 'sine';
    o.frequency.value = freq;
    const g = env(c, t, 0.001, gain, decay);
    o.connect(g).connect(sfxBus);
    o.start(t);
    o.stop(t + decay + 0.05);
  }
}

/** A small wooden block, knocked: every button press. */
export function woodTock(gain = 0.22): void {
  const c = ready();
  if (!c || !sfxBus) return;
  const t = c.currentTime + 0.004;
  const j = 0.95 + Math.random() * 0.1;
  modes(c, t, [
    [720 * j, 0.55 * gain, 0.05],
    [1310 * j, 0.25 * gain, 0.035],
    [2150 * j, 0.1 * gain, 0.02],
  ]);
  // The knock itself: a tiny, bright click of noise.
  const n = noise(c, t, 0.02);
  const f = c.createBiquadFilter();
  f.type = 'bandpass';
  f.frequency.value = 3000;
  f.Q.value = 2;
  n.connect(f)
    .connect(env(c, t, 0.0005, 0.25 * gain, 0.012))
    .connect(sfxBus);
}

/** Washi paper, handled: a sheet opening or a panel sliding in. */
export function paperRustle(gain = 0.3): void {
  const c = ready();
  if (!c || !sfxBus) return;
  const t0 = c.currentTime + 0.005;
  // Three quick crinkles, each a short burst of high-passed noise.
  for (const [d, g, f] of [
    [0, 1, 4200],
    [0.045, 0.7, 5600],
    [0.1, 0.5, 3600],
  ] as const) {
    const t = t0 + d + Math.random() * 0.012;
    const n = noise(c, t, 0.07);
    const hp = c.createBiquadFilter();
    hp.type = 'highpass';
    hp.frequency.value = f;
    const bp = c.createBiquadFilter();
    bp.type = 'peaking';
    bp.frequency.value = f * 1.4;
    bp.gain.value = 6;
    n.connect(hp)
      .connect(bp)
      .connect(env(c, t, 0.004, g * gain, 0.05))
      .connect(sfxBus);
  }
}

/** A card slid off the hand: a soft paper swish. */
export function paperSlide(gain = 0.22): void {
  const c = ready();
  if (!c || !sfxBus) return;
  const t = c.currentTime + 0.005;
  const n = noise(c, t, 0.14);
  const f = c.createBiquadFilter();
  f.type = 'bandpass';
  f.Q.value = 0.8;
  f.frequency.setValueAtTime(1800, t);
  f.frequency.exponentialRampToValueAtTime(4200, t + 0.1);
  n.connect(f)
    .connect(env(c, t, 0.03, gain, 0.09))
    .connect(sfxBus);
}

/** A drop into still water: the peek. */
export function waterDrop(gain = 0.3): void {
  const c = ready();
  if (!c || !sfxBus) return;
  const t = c.currentTime + 0.005;
  const o = c.createOscillator();
  o.type = 'sine';
  o.frequency.setValueAtTime(520, t);
  o.frequency.exponentialRampToValueAtTime(1350, t + 0.045);
  const g = env(c, t, 0.002, gain, 0.09);
  o.connect(g).connect(sfxBus);
  if (reverbSend) g.connect(reverbSend);
  o.start(t);
  o.stop(t + 0.15);
}

/** Lifting a card from your hand. */
export function uiTap(): void {
  paperSlide(0.18);
}

// ---------------------------------------------------------------------------
// Drums and bells

export function taiko(gain = 1): void {
  const c = ready();
  if (!c || !sfxBus) return;
  const t = c.currentTime + 0.005;
  const o = c.createOscillator();
  o.type = 'sine';
  o.frequency.setValueAtTime(110, t);
  o.frequency.exponentialRampToValueAtTime(48, t + 0.25);
  const g = env(c, t, 0.004, 1.2 * gain, 0.45);
  o.connect(g).connect(sfxBus);
  o.start(t);
  o.stop(t + 0.6);
  const n = noise(c, t, 0.08);
  const f = c.createBiquadFilter();
  f.type = 'lowpass';
  f.frequency.value = 900;
  const g2 = env(c, t, 0.001, 0.5 * gain, 0.06);
  n.connect(f).connect(g2).connect(sfxBus);
  if (reverbSend) g.connect(reverbSend);
}

export function koikoiSound(): void {
  taiko(1);
  setTimeout(() => taiko(0.8), 160);
  for (let i = 0; i < 5; i++) pluck(scaleNote(5 + i), 0.3 + i * 0.06, 0.4);
}

export function bell(gain = 0.8, base = 220): void {
  const c = ready();
  if (!c || !sfxBus) return;
  const t = c.currentTime + 0.01;
  const partials: [number, number, number][] = [
    [1, 1, 3.5],
    [2.76, 0.5, 2.2],
    [5.4, 0.28, 1.4],
    [8.93, 0.16, 0.9],
  ];
  for (const [ratio, amp, dur] of partials) {
    const o = c.createOscillator();
    o.type = 'sine';
    o.frequency.value = base * ratio;
    const g = env(c, t, 0.003, gain * amp, dur);
    o.connect(g).connect(sfxBus);
    if (reverbSend) g.connect(reverbSend);
    o.start(t);
    o.stop(t + dur + 0.1);
  }
}

export function stopSound(): void {
  bell(0.7, 196);
}

export function strikeSound(big: boolean): void {
  taiko(big ? 1.3 : 0.9);
  clack();
}

export function hurtSound(): void {
  taiko(1.1);
  pluck(scaleNote(-2), 0.05, 0.4);
  pluck(scaleNote(-1) * 1.06, 0.07, 0.3);
}

/** Old bronze mon, dropped into a wooden tray: two damped clinks over a soft wooden thud. */
export function coinSound(): void {
  const c = ready();
  if (!c || !sfxBus) return;
  const t0 = c.currentTime + 0.01;
  for (const [d, k] of [
    [0, 1],
    [0.065, 1.07],
  ] as const) {
    const t = t0 + d;
    modes(c, t, [
      [2210 * k, 0.16, 0.09],
      [3470 * k, 0.09, 0.06],
      [5120 * k, 0.04, 0.035],
    ]);
  }
  // The tray.
  modes(c, t0, [
    [340, 0.22, 0.06],
    [610, 0.08, 0.04],
  ]);
}

export function victorySound(): void {
  bell(0.6, 262);
  for (let i = 0; i < 9; i++) pluck(scaleNote(3 + i), 0.15 + i * 0.07, 0.4);
}

export function defeatSound(): void {
  bell(0.9, 110);
  pluck(scaleNote(0), 0.4, 0.4);
  pluck(scaleNote(-1), 0.9, 0.35);
}

// ---------------------------------------------------------------------------
// Ambient music: sparse koto over a season's soundscape.

let musicTimer: ReturnType<typeof setTimeout> | null = null;
let ambience: { stop: () => void } | null = null;
let musicSeason: Season | null = null;

export function startMusic(season: Season): void {
  if (musicSeason === season && musicTimer) return;
  stopMusic();
  const c = ready();
  if (!c || !musicBus) return;
  musicSeason = season;
  ambience = startAmbience(c, season);
  const phraseRoot = { spring: 5, summer: 3, autumn: 2, winter: 0 }[season];
  const loop = () => {
    const pause = 1600 + Math.random() * 2600;
    const notes = 1 + Math.floor(Math.random() * 3);
    const start = phraseRoot + Math.floor(Math.random() * 6);
    for (let i = 0; i < notes; i++) {
      const step = start + (Math.random() < 0.5 ? i : -i);
      pluck(scaleNote(step), i * (0.18 + Math.random() * 0.2), 0.22, 'music');
    }
    if (Math.random() < 0.25) pluck(scaleNote(phraseRoot - 5), 0.05, 0.18, 'music');
    musicTimer = setTimeout(loop, pause);
  };
  musicTimer = setTimeout(loop, 600);
}

export function stopMusic(): void {
  if (musicTimer) clearTimeout(musicTimer);
  musicTimer = null;
  ambience?.stop();
  ambience = null;
  musicSeason = null;
}

function startAmbience(c: Ctx, season: Season): { stop: () => void } {
  if (!musicBus || !noiseBuffer) return { stop: () => undefined };
  const out = c.createGain();
  out.gain.value = 0;
  out.gain.linearRampToValueAtTime(1, c.currentTime + 3);
  out.connect(musicBus);
  const n = c.createBufferSource();
  n.buffer = noiseBuffer;
  n.loop = true;
  const f = c.createBiquadFilter();
  const g = c.createGain();
  const lfo = c.createOscillator();
  const lfoGain = c.createGain();
  if (season === 'summer') {
    // Cicadas: high band-passed noise pulsing fast.
    f.type = 'bandpass';
    f.frequency.value = 5200;
    f.Q.value = 6;
    g.gain.value = 0.05;
    lfo.frequency.value = 38;
    lfoGain.gain.value = 0.04;
  } else if (season === 'autumn') {
    // Crickets over a low breeze.
    f.type = 'bandpass';
    f.frequency.value = 4300;
    f.Q.value = 20;
    g.gain.value = 0.05;
    lfo.frequency.value = 9;
    lfoGain.gain.value = 0.05;
  } else if (season === 'winter') {
    // Wind.
    f.type = 'lowpass';
    f.frequency.value = 520;
    f.Q.value = 3;
    g.gain.value = 0.12;
    lfo.frequency.value = 0.12;
    lfoGain.gain.value = 0.08;
  } else {
    // Spring: a soft stream.
    f.type = 'bandpass';
    f.frequency.value = 1400;
    f.Q.value = 0.6;
    g.gain.value = 0.035;
    lfo.frequency.value = 0.3;
    lfoGain.gain.value = 0.015;
  }
  lfo.connect(lfoGain).connect(g.gain);
  n.connect(f).connect(g).connect(out);
  n.start();
  lfo.start();
  let birds: ReturnType<typeof setTimeout> | null = null;
  if (season === 'spring') {
    const chirp = () => {
      const t = c.currentTime + 0.02;
      const o = c.createOscillator();
      o.type = 'sine';
      const base = 2400 + Math.random() * 1400;
      o.frequency.setValueAtTime(base, t);
      o.frequency.exponentialRampToValueAtTime(base * 1.6, t + 0.08);
      o.frequency.exponentialRampToValueAtTime(base * 0.9, t + 0.16);
      const ge = env(c, t, 0.01, 0.05, 0.15);
      o.connect(ge).connect(out);
      o.start(t);
      o.stop(t + 0.2);
      birds = setTimeout(chirp, 2500 + Math.random() * 6000);
    };
    birds = setTimeout(chirp, 2000);
  }
  return {
    stop: () => {
      if (birds) clearTimeout(birds);
      try {
        out.gain.cancelScheduledValues(c.currentTime);
        out.gain.setValueAtTime(out.gain.value, c.currentTime);
        out.gain.linearRampToValueAtTime(0, c.currentTime + 1.2);
        n.stop(c.currentTime + 1.3);
        lfo.stop(c.currentTime + 1.3);
      } catch {
        // Already stopped.
      }
    },
  };
}
