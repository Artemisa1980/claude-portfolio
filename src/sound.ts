/**
 * Tiny WebAudio chiptune engine — square/triangle beeps, no samples.
 * Everything is synthesized so the site stays a zero-asset retro machine.
 */
let ctx: AudioContext | null = null;
let muted = false;

function audio(): AudioContext {
  if (!ctx) ctx = new AudioContext();
  if (ctx.state === 'suspended') ctx.resume();
  return ctx;
}

export function setMuted(value: boolean) {
  muted = value;
}

export function isMuted() {
  return muted;
}

function tone(
  freq: number,
  duration: number,
  type: OscillatorType = 'square',
  volume = 0.04,
  when = 0,
  slideTo?: number
) {
  if (muted) return;
  try {
    const ac = audio();
    const osc = ac.createOscillator();
    const gain = ac.createGain();
    const t0 = ac.currentTime + when;
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t0);
    if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, t0 + duration);
    gain.gain.setValueAtTime(volume, t0);
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + duration);
    osc.connect(gain).connect(ac.destination);
    osc.start(t0);
    osc.stop(t0 + duration + 0.05);
  } catch {
    /* audio unavailable — stay silent */
  }
}

export const sfx = {
  click: () => tone(660, 0.06, 'square', 0.03),
  hover: () => tone(880, 0.04, 'square', 0.015),
  coin: () => {
    tone(988, 0.09, 'square', 0.04);
    tone(1319, 0.35, 'square', 0.04, 0.09);
  },
  twist: () => tone(330, 0.08, 'triangle', 0.05, 0, 520),
  locked: () => {
    tone(220, 0.1, 'sawtooth', 0.035);
    tone(165, 0.18, 'sawtooth', 0.035, 0.1);
  },
  boot: () => {
    [262, 330, 392, 523].forEach((f, i) => tone(f, 0.12, 'square', 0.035, i * 0.11));
  },
  win: () => {
    [523, 659, 784, 1047].forEach((f, i) => tone(f, 0.14, 'square', 0.04, i * 0.12));
  },
  lose: () => {
    [392, 330, 262, 196].forEach((f, i) => tone(f, 0.16, 'triangle', 0.05, i * 0.13));
  },
  pop: () => tone(440, 0.05, 'triangle', 0.05, 0, 880),
  channel: () => tone(196, 0.07, 'square', 0.04, 0, 392),
  send: () => {
    tone(523, 0.1, 'square', 0.04);
    tone(784, 0.1, 'square', 0.04, 0.1);
    tone(1047, 0.25, 'square', 0.04, 0.2);
  },
  waka: () => {
    tone(440, 0.06, 'triangle', 0.05, 0, 330);
    tone(330, 0.06, 'triangle', 0.05, 0.07, 440);
  },
  laugh: () => {
    [420, 470, 380, 430, 320, 250].forEach((f, i) => tone(f, 0.09, 'sawtooth', 0.03, i * 0.09, f * 0.85));
  },
  fanfare: () => {
    [523, 659, 784, 1047, 784, 1319].forEach((f, i) => tone(f, i === 5 ? 0.4 : 0.13, 'square', 0.04, i * 0.13));
  },
  slash: () => tone(620, 0.09, 'sawtooth', 0.035, 0, 180),
  hurt: () => {
    tone(120, 0.12, 'square', 0.05);
    tone(85, 0.18, 'square', 0.05, 0.08);
  },
  key: () => {
    [784, 988, 1319].forEach((f, i) => tone(f, 0.11, 'triangle', 0.05, i * 0.09));
  },
  pipe: () => tone(640, 0.45, 'triangle', 0.06, 0, 140),
};
