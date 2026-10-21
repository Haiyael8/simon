import type { ColorId } from './colors';

const FREQUENCIES: Record<ColorId, number> = {
  green: 415,
  red: 310,
  yellow: 252,
  blue: 209,
};

const ATTACK_S = 0.01;
const RELEASE_S = 0.04;
const PEAK_GAIN = 0.25;

type ActiveSound = { stop: () => void };

let ctx: AudioContext | null = null;
const active = new Set<ActiveSound>();

function getContext(): AudioContext | null {
  if (ctx) return ctx;
  const Ctor =
    window.AudioContext ??
    (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!Ctor) return null;
  ctx = new Ctor();
  return ctx;
}

// Must be called synchronously from a user gesture handler
export async function unlockAudio(): Promise<boolean> {
  try {
    const context = getContext();
    if (!context) return false;
    if (context.state !== 'running') await context.resume();
    return (context.state as AudioContextState) === 'running';
  } catch {
    return false;
  }
}

// Starts a tone and returns a function that releases it
function startOscillator(
  frequency: number,
  type: OscillatorType = 'triangle',
  startAt?: number,
): ActiveSound | null {
  if (!ctx) return null;
  const context = ctx;
  const osc = context.createOscillator();
  const gain = context.createGain();
  const t0 = startAt ?? context.currentTime;
  osc.type = type;
  osc.frequency.value = frequency;
  gain.gain.setValueAtTime(0, t0);
  gain.gain.linearRampToValueAtTime(PEAK_GAIN, t0 + ATTACK_S);
  osc.connect(gain).connect(context.destination);
  osc.start(t0);

  let stopped = false;
  const sound: ActiveSound = {
    stop: () => {
      if (stopped) return;
      stopped = true;
      active.delete(sound);
      const now = Math.max(context.currentTime, t0);
      gain.gain.cancelScheduledValues(now);
      gain.gain.setValueAtTime(gain.gain.value, now);
      gain.gain.linearRampToValueAtTime(0, now + RELEASE_S);
      osc.stop(now + RELEASE_S + 0.01);
    },
  };
  active.add(sound);
  return sound;
}

export function startTone(color: ColorId): () => void {
  const sound = startOscillator(FREQUENCIES[color]);
  return () => sound?.stop();
}

function playMotif(notes: number[], type: OscillatorType) {
  if (!ctx) return;
  const step = 0.16;
  notes.forEach((frequency, i) => {
    const sound = startOscillator(frequency, type, ctx!.currentTime + i * step);
    if (!sound) return;
    // Release each note shortly before the next one starts
    const timer = window.setTimeout(sound.stop, (i + 1) * step * 1000 - 20);
    const stop = sound.stop;
    sound.stop = () => {
      window.clearTimeout(timer);
      stop();
    };
  });
}

export function playWin() {
  playMotif([523, 659, 784, 1047], 'triangle');
}

export function playLoss() {
  playMotif([311, 261, 220, 174], 'sawtooth');
}

export function stopAll() {
  for (const sound of [...active]) sound.stop();
}
