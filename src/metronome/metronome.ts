import { scheduleClick } from "../audio/click";

export type Subdivision = "quarter" | "eighth" | "triplet" | "sixteenth";

export type TimeSignature = {
  beatsPerBar: number; // numerator
  noteValue: 4 | 8; // denominator (kept simple for now)
};

export type MetronomeState = {
  isRunning: boolean;
  bpm: number;
  timeSignature: TimeSignature;
  subdivision: Subdivision;
  /** Quando ligado, o 1.º tempo soa mais forte (estresse na cabeça de compasso). */
  stressFirstBeat: boolean;
};

type TickInfo = {
  /** 0-based within bar */
  beatIndex: number;
  /** 0-based within subdivision */
  subIndex: number;
  /** AudioContext time */
  time: number;
};

export type MetronomeCallbacks = {
  onTick?: (info: TickInfo) => void;
  onState?: (state: MetronomeState) => void;
};

const clamp = (n: number, min: number, max: number) => Math.min(max, Math.max(min, n));

function subdivisionFactor(sub: Subdivision) {
  switch (sub) {
    case "quarter":
      return 1;
    case "eighth":
      return 2;
    case "triplet":
      return 3;
    case "sixteenth":
      return 4;
  }
}

export class Metronome {
  private ctx: AudioContext | null = null;
  private timerId: number | null = null;
  /** Timeouts para alinhar `onTick` ao instante real de cada nota (o scheduler agenda várias de uma vez). */
  private uiTimerIds: number[] = [];
  private nextNoteTime = 0;
  private currentSubTick = 0;

  private lookaheadMs = 25;
  private scheduleAheadTimeSec = 0.12;

  private state: MetronomeState = {
    isRunning: false,
    bpm: 120,
    timeSignature: { beatsPerBar: 4, noteValue: 4 },
    subdivision: "quarter",
    stressFirstBeat: false,
  };

  constructor(private cb: MetronomeCallbacks = {}) {}

  getState(): MetronomeState {
    return this.state;
  }

  setBpm(bpm: number) {
    const next = clamp(Math.round(bpm), 30, 280);
    this.state = { ...this.state, bpm: next };
    this.cb.onState?.(this.state);
  }

  setSubdivision(subdivision: Subdivision) {
    this.state = { ...this.state, subdivision };
    this.cb.onState?.(this.state);
  }

  setTimeSignature(sig: TimeSignature) {
    this.state = { ...this.state, timeSignature: sig };
    if (this.state.isRunning) this.currentSubTick = 0;
    this.cb.onState?.(this.state);
  }

  /** Número de tempos por compasso (numerador). Mantém o denominador atual. */
  setBeatsPerBar(beatsPerBar: number) {
    const b = clamp(Math.round(beatsPerBar), 1, 12);
    this.state = {
      ...this.state,
      timeSignature: { ...this.state.timeSignature, beatsPerBar: b },
    };
    if (this.state.isRunning) this.currentSubTick = 0;
    this.cb.onState?.(this.state);
  }

  setStressFirstBeat(on: boolean) {
    this.state = { ...this.state, stressFirstBeat: on };
    this.cb.onState?.(this.state);
  }

  toggleStressFirstBeat() {
    this.setStressFirstBeat(!this.state.stressFirstBeat);
  }

  async start() {
    if (this.state.isRunning) return;
    if (!this.ctx) this.ctx = new AudioContext();

    // Required on iOS/Safari after user gesture; safe elsewhere.
    if (this.ctx.state !== "running") {
      await this.ctx.resume();
    }

    this.currentSubTick = 0;
    this.nextNoteTime = this.ctx.currentTime + 0.05;
    this.state = { ...this.state, isRunning: true };
    this.cb.onState?.(this.state);

    this.timerId = window.setInterval(() => this.scheduler(), this.lookaheadMs);
  }

  stop() {
    if (!this.state.isRunning) return;
    if (this.timerId) window.clearInterval(this.timerId);
    this.timerId = null;
    for (const id of this.uiTimerIds) window.clearTimeout(id);
    this.uiTimerIds = [];
    this.state = { ...this.state, isRunning: false };
    this.cb.onState?.(this.state);
  }

  toggle() {
    if (this.state.isRunning) this.stop();
    else void this.start();
  }

  private scheduler() {
    const ctx = this.ctx;
    if (!ctx) return;

    while (this.nextNoteTime < ctx.currentTime + this.scheduleAheadTimeSec) {
      this.scheduleNote(this.nextNoteTime);
      this.advanceNote();
    }
  }

  private scheduleNote(time: number) {
    const ctx = this.ctx;
    if (!ctx) return;

    const factor = subdivisionFactor(this.state.subdivision);
    const beatsPerBar = this.state.timeSignature.beatsPerBar;
    const subPerBar = beatsPerBar * factor;

    const subTick = this.currentSubTick % subPerBar;
    const beatIndex = Math.floor(subTick / factor);
    const subIndex = subTick % factor;

    const isDownbeat = beatIndex === 0 && subIndex === 0;
    const isBeat = subIndex === 0;
    const stressDownbeat = isDownbeat && this.state.stressFirstBeat;

    // Com estresse no 1.º tempo: cabeça de compasso mais alta; sem: todos os tempos fortes iguais.
    const frequencyHz = stressDownbeat ? 1760 : isBeat ? 1320 : 980;
    const gain = stressDownbeat ? 0.22 : isBeat ? 0.14 : 0.08;

    scheduleClick(ctx, { time, frequencyHz, gain });

    const delayMs = Math.max(0, (time - ctx.currentTime) * 1000 - 4);
    const tid = window.setTimeout(() => {
      this.uiTimerIds = this.uiTimerIds.filter((x) => x !== tid);
      if (!this.state.isRunning) return;
      this.cb.onTick?.({ time, beatIndex, subIndex });
    }, delayMs);
    this.uiTimerIds.push(tid);
  }

  private advanceNote() {
    const factor = subdivisionFactor(this.state.subdivision);
    // Quarter note duration based on BPM.
    const secondsPerBeat = 60.0 / this.state.bpm;
    const secondsPerSub = secondsPerBeat / factor;

    this.nextNoteTime += secondsPerSub;
    this.currentSubTick += 1;
  }
}

