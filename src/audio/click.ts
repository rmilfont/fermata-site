export type ClickOptions = {
  /** Loudness multiplier, 0..1 (recommended). */
  gain: number;
  /** Higher pitch for accents. */
  frequencyHz: number;
  /** Start time in AudioContext seconds. */
  time: number;
};

export function scheduleClick(ctx: AudioContext, opts: ClickOptions) {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = "triangle";
  osc.frequency.setValueAtTime(opts.frequencyHz, opts.time);

  const attack = 0.0015;
  const decay = 0.03;

  gain.gain.setValueAtTime(0, opts.time);
  gain.gain.linearRampToValueAtTime(opts.gain, opts.time + attack);
  gain.gain.exponentialRampToValueAtTime(0.0001, opts.time + attack + decay);

  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.start(opts.time);
  osc.stop(opts.time + attack + decay + 0.02);
}

