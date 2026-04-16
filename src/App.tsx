import React from "react";
import logoUrl from "../logo.png";
import { Metronome, Subdivision } from "./metronome/metronome";

const subdivisions: Array<{ id: Subdivision; label: string; symbol: string }> = [
  { id: "quarter", label: "Semínima", symbol: "♩" },
  { id: "eighth", label: "Colcheia", symbol: "♪" },
  { id: "triplet", label: "Tercina", symbol: "3" },
  { id: "sixteenth", label: "Semicolcheia", symbol: "♬" },
];

/** Indicação de andamento por BPM (faixas inclusivas). Acima de 240: Prestissimo. */
function tempoName(bpm: number) {
  const n = Math.round(bpm);
  if (n <= 20) return "Larghissimo";
  if (n <= 40) return "Grave";
  if (n <= 45) return "Lento";
  if (n <= 50) return "Largo";
  if (n <= 60) return "Adagio";
  if (n <= 70) return "Adagietto";
  if (n <= 85) return "Andante";
  if (n <= 97) return "Moderato";
  if (n <= 109) return "Allegretto";
  if (n <= 132) return "Allegro";
  if (n <= 140) return "Vivace";
  if (n <= 177) return "Presto";
  if (n <= 240) return "Prestissimo";
  return "Prestissimo";
}

function nextSubdivision(current: Subdivision): Subdivision {
  const order: Subdivision[] = ["quarter", "eighth", "triplet", "sixteenth"];
  const i = order.indexOf(current);
  return order[(i + 1) % order.length]!;
}

const STUDY_MIN_MIN = 1;
const STUDY_MAX_MIN = 180;

/** Apenas dígitos; no máx. 3 caracteres (até 180). */
function studyDraftDigitsOnly(raw: string) {
  return raw.replace(/\D/g, "").slice(0, 3);
}

function parseStudyMinutesInt(draft: string): number | null {
  const d = studyDraftDigitsOnly(draft);
  if (d === "") return null;
  const n = parseInt(d, 10);
  if (!Number.isInteger(n) || n < 1) return null;
  return n;
}

function formatStudyCountdown(ms: number) {
  const sec = Math.max(0, Math.floor(ms / 1000));
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export function App() {
  const metroRef = React.useRef<Metronome | null>(null);

  const [isRunning, setIsRunning] = React.useState(false);
  const [bpm, setBpm] = React.useState(120);
  const [beatsPerBar, setBeatsPerBarState] = React.useState(4);
  const [sub, setSub] = React.useState<Subdivision>("quarter");
  /** Índice da batida principal acesa (0 = primeiro tempo). */
  const [beatHighlight, setBeatHighlight] = React.useState<number | null>(null);
  const [stressFirstBeat, setStressFirstBeat] = React.useState(false);
  /** Minutos configurados para sessão de estudo (contagem após Iniciar). */
  const [studyMinutesConfigured, setStudyMinutesConfigured] = React.useState<number | null>(null);
  const [studyModalOpen, setStudyModalOpen] = React.useState(false);
  const [studyDraftMinutes, setStudyDraftMinutes] = React.useState("1");
  const [studyRemainingMs, setStudyRemainingMs] = React.useState<number | null>(null);
  const studyEndRef = React.useRef<number | null>(null);
  const studyInputRef = React.useRef<HTMLInputElement>(null);

  if (!metroRef.current) {
    metroRef.current = new Metronome({
      onState: (s) => {
        setIsRunning(s.isRunning);
        setBpm(s.bpm);
        setBeatsPerBarState(s.timeSignature.beatsPerBar);
        setSub(s.subdivision);
        setStressFirstBeat(s.stressFirstBeat);
        if (!s.isRunning) {
          setBeatHighlight(null);
        }
      },
      onTick: (t) => {
        if (t.subIndex !== 0) return;
        setBeatHighlight(t.beatIndex);
      },
    });
  }

  React.useEffect(() => {
    setBeatHighlight(null);
  }, [beatsPerBar]);

  React.useEffect(() => {
    if (!studyModalOpen) return;
    const t = window.setTimeout(() => studyInputRef.current?.focus(), 30);
    return () => window.clearTimeout(t);
  }, [studyModalOpen]);

  React.useEffect(() => {
    if (!isRunning || studyEndRef.current == null) return;
    const tick = () => {
      const end = studyEndRef.current;
      if (end == null) return;
      const left = Math.max(0, end - performance.now());
      setStudyRemainingMs(left);
      if (left <= 0 && studyEndRef.current != null) {
        studyEndRef.current = null;
        setStudyRemainingMs(null);
        if (metroRef.current?.getState().isRunning) metroRef.current.stop();
      }
    };
    tick();
    const id = window.setInterval(tick, 200);
    return () => window.clearInterval(id);
  }, [isRunning]);

  React.useEffect(() => {
    if (!studyModalOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setStudyModalOpen(false);
    };
    window.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [studyModalOpen]);

  const metro = metroRef.current;

  const applyBpm = React.useCallback(
    (next: number) => {
      metro.setBpm(next);
    },
    [metro],
  );

  const onBpmSlider = (e: React.ChangeEvent<HTMLInputElement>) => {
    applyBpm(Number(e.target.value));
  };

  const bump = (delta: number) => applyBpm(bpm + delta);

  const setSubdivision = (next: Subdivision) => {
    metro.setSubdivision(next);
  };

  const bumpBeats = (delta: number) => {
    metro.setBeatsPerBar(beatsPerBar + delta);
  };

  const ritmoAtual = subdivisions.find((s) => s.id === sub) ?? subdivisions[0]!;

  const openStudyModal = () => {
    setStudyDraftMinutes(
      studyMinutesConfigured != null ? String(studyMinutesConfigured) : "1",
    );
    setStudyModalOpen(true);
  };

  const studyDraftInt = parseStudyMinutesInt(studyDraftMinutes);
  const studyDraftValid =
    studyDraftInt != null && studyDraftInt >= STUDY_MIN_MIN && studyDraftInt <= STUDY_MAX_MIN;

  const confirmStudyMinutes = () => {
    const n = parseStudyMinutesInt(studyDraftMinutes);
    if (n == null || n < STUDY_MIN_MIN) return;
    const clamped = Math.min(STUDY_MAX_MIN, n);
    setStudyMinutesConfigured(clamped);
    setStudyModalOpen(false);
  };

  const clearStudyTimer = () => {
    setStudyMinutesConfigured(null);
    setStudyModalOpen(false);
  };

  const toggle = () => {
    if (isRunning) {
      studyEndRef.current = null;
      setStudyRemainingMs(null);
      metro.stop();
      return;
    }
    if (studyMinutesConfigured != null && studyMinutesConfigured > 0) {
      studyEndRef.current = performance.now() + studyMinutesConfigured * 60_000;
      setStudyRemainingMs(studyMinutesConfigured * 60_000);
    } else {
      studyEndRef.current = null;
      setStudyRemainingMs(null);
    }
    void metro.start();
  };

  const studyCardMainText =
    isRunning && studyRemainingMs != null
      ? formatStudyCountdown(studyRemainingMs)
      : studyMinutesConfigured != null
        ? `${studyMinutesConfigured} min`
        : "Definir";

  return (
    <div>
      <header className="container">
        <div className="topbar">
          <div className="brand">
            <img className="brandLogo" src={logoUrl} alt="Fermata" />
            <span className="headerTagline font-akrobat">Metrônomo</span>
          </div>
        </div>
      </header>
      <div className="divider" />

      <main className="container">
        <section className="hero">
          <div className="watermark font-moonclaw">f</div>
          <div className="tempoLabel">Tempo atual</div>
          <div className="bpmRow">
            <div className="bpmValue font-moonclaw">{bpm}</div>
            <div className="bpmUnit font-akrobat">BPM</div>
          </div>
          <div
            className="font-akrobat tempoMarking"
            data-pulse={isRunning && beatHighlight !== null ? "1" : "0"}
          >
            {tempoName(bpm)}
          </div>

          <div className="sliderRow" aria-label="Ajuste de BPM">
            <button className="iconBtn" type="button" onClick={() => bump(-1)} aria-label="Diminuir um BPM">
              −
            </button>
            <div className="rangeWrap">
              <label className="srOnly" htmlFor="bpmRange">
                BPM
              </label>
              <input
                id="bpmRange"
                type="range"
                min={30}
                max={280}
                value={bpm}
                onChange={onBpmSlider}
              />
            </div>
            <button className="iconBtn" type="button" onClick={() => bump(1)} aria-label="Aumentar um BPM">
              +
            </button>
          </div>

          <div
            className="beatDots"
            role="img"
            aria-label={`Indicador visual do compasso: ${beatsPerBar} batidas por compasso`}
          >
            {Array.from({ length: beatsPerBar }, (_, i) => (
              <span
                key={i}
                className={[
                  "beatDot",
                  stressFirstBeat && i === 0 ? "beatDot--downbeatSlot" : "",
                  isRunning && beatHighlight === i ? "beatDot--active" : "",
                  stressFirstBeat && isRunning && beatHighlight === i && i === 0
                    ? "beatDot--downbeatActive"
                    : "",
                ]
                  .filter(Boolean)
                  .join(" ")}
              />
            ))}
          </div>
        </section>

        <section className="configSection" aria-label="Configurações do metrônomo">
          <div className="configGrid">
            <div className="configCard">
              <span className="configCardLabel font-akrobat">Batidas</span>
              <div className="configCardRow">
                <span className="configCardValue font-moonclaw" aria-live="polite">
                  {beatsPerBar}
                </span>
                <div className="configCardStepper" aria-label="Ajustar número de batidas por compasso">
                  <button
                    type="button"
                    className="configStepBtn"
                    onClick={() => bumpBeats(1)}
                    disabled={beatsPerBar >= 12}
                    aria-label="Aumentar batidas"
                  >
                    +
                  </button>
                  <button
                    type="button"
                    className="configStepBtn"
                    onClick={() => bumpBeats(-1)}
                    disabled={beatsPerBar <= 1}
                    aria-label="Diminuir batidas"
                  >
                    −
                  </button>
                </div>
              </div>
            </div>

            <button
              type="button"
              className="configCard configCardInteractive"
              onClick={() => setSubdivision(nextSubdivision(sub))}
              aria-label={`Ritmo: ${ritmoAtual.label}. Toque para alternar`}
            >
              <span className="configCardLabel font-akrobat">Ritmo</span>
              <div className="configCardRow">
                <span className="configCardValueText">{ritmoAtual.label}</span>
                <span className="configCardIconPrimary font-moonclaw" aria-hidden="true">
                  {ritmoAtual.symbol}
                </span>
              </div>
            </button>

            <button
              type="button"
              className={[
                "configCard",
                "configCardInteractive",
                "configCardAccent",
                stressFirstBeat ? "configCardAccent--on" : "",
              ]
                .filter(Boolean)
                .join(" ")}
              onClick={() => metro.toggleStressFirstBeat()}
              aria-pressed={stressFirstBeat}
              aria-label={
                stressFirstBeat
                  ? "Estresse no primeiro tempo: ligado. Toque para desligar."
                  : "Estresse no primeiro tempo: desligado. Toque para ligar."
              }
            >
              <span className="configCardLabel font-akrobat">Acento</span>
              <div className="configCardRow">
                <span className="configCardValueText configCardValueStack">Primeiro tempo</span>
                <span
                  className={
                    stressFirstBeat ? "configCardIconAccentOn" : "configCardIconMuted"
                  }
                  aria-hidden="true"
                >
                  <svg width="28" height="22" viewBox="0 0 28 22" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <rect x="2" y="10" width="4" height="10" rx="1" fill="currentColor" opacity="0.35" />
                    <rect x="9" y="4" width="4" height="16" rx="1" fill="currentColor" opacity="0.45" />
                    <rect x="16" y="7" width="4" height="13" rx="1" fill="currentColor" opacity="0.4" />
                    <rect x="23" y="2" width="4" height="18" rx="1" fill="currentColor" opacity="0.35" />
                  </svg>
                </span>
              </div>
            </button>

            <button
              type="button"
              className={[
                "configCard",
                "configCardInteractive",
                isRunning ? "configCard--busy" : "",
              ]
                .filter(Boolean)
                .join(" ")}
              onClick={() => {
                if (!isRunning) openStudyModal();
              }}
              disabled={isRunning}
              aria-label={
                isRunning
                  ? studyRemainingMs != null
                    ? `Estudo: ${formatStudyCountdown(studyRemainingMs)} restantes`
                    : "Estudo (indisponível durante a execução)"
                  : studyMinutesConfigured != null
                    ? `Estudo: ${studyMinutesConfigured} minutos configurados. Toque para alterar`
                    : "Estudo: definir duração em minutos"
              }
            >
              <span className="configCardLabel font-akrobat">Estudo</span>
              <div className="configCardRow">
                <span
                  className={
                    isRunning && studyRemainingMs != null
                      ? "configCardValueText configCardValueMono"
                      : "configCardValueText"
                  }
                >
                  {studyCardMainText}
                </span>
                <span
                  className={
                    studyMinutesConfigured != null && !isRunning
                      ? "configCardIconAccentOn"
                      : "configCardIconMuted"
                  }
                  aria-hidden="true"
                >
                  <svg width="26" height="26" viewBox="0 0 26 26" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <circle cx="13" cy="13" r="9" stroke="currentColor" strokeWidth="1.5" opacity="0.4" />
                    <path d="M13 8v5l3 2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity="0.45" />
                    <path d="M13 4v2M21 13h2M13 22v-2M4 13h2" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" opacity="0.35" />
                  </svg>
                </span>
              </div>
            </button>
          </div>
        </section>

        <div className="fabWrap">
          <button
            type="button"
            className={`fab${isRunning ? " fab--running" : ""}`}
            onClick={toggle}
          >
            <div className="fabText">{isRunning ? "Parar" : "Iniciar"}</div>
            <div className="fabIcon" aria-hidden="true">
              {isRunning ? "■" : "▶"}
            </div>
          </button>
        </div>
      </main>

      {studyModalOpen ? (
        <div
          className="modalOverlay"
          role="presentation"
          onClick={(e) => {
            if (e.target === e.currentTarget) setStudyModalOpen(false);
          }}
        >
          <div
            className="modalPanel"
            role="dialog"
            aria-modal="true"
            aria-labelledby="study-dialog-title"
          >
            <h2 id="study-dialog-title" className="modalTitle font-akrobat">
              Tempo de estudo
            </h2>
            <p className="modalHint">
              Apenas números inteiros entre {STUDY_MIN_MIN} e {STUDY_MAX_MIN}. A contagem começa ao tocar em
              Iniciar.
            </p>
            <label className="modalLabel font-akrobat" htmlFor="studyMinutesInput">
              Minutos
            </label>
            <input
              ref={studyInputRef}
              id="studyMinutesInput"
              className="modalInput"
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              autoComplete="off"
              spellCheck={false}
              value={studyDraftMinutes}
              onChange={(e) => setStudyDraftMinutes(studyDraftDigitsOnly(e.target.value))}
              onKeyDown={(e) => {
                if (e.key === "Enter" && studyDraftValid) confirmStudyMinutes();
              }}
            />
            <div className="modalActions">
              <button type="button" className="modalBtn modalBtnGhost" onClick={() => setStudyModalOpen(false)}>
                Cancelar
              </button>
              {studyMinutesConfigured != null ? (
                <button type="button" className="modalBtn modalBtnGhost" onClick={clearStudyTimer}>
                  Limpar
                </button>
              ) : null}
              <button
                type="button"
                className="modalBtn modalBtnPrimary"
                onClick={confirmStudyMinutes}
                disabled={!studyDraftValid}
              >
                OK
              </button>
            </div>
          </div>
        </div>
      ) : null}

      <footer className="siteFooter">
        <p className="footerCopyright font-akrobat">
          © {new Date().getFullYear()} Fermata Atelier. Feito com precisão.
        </p>
      </footer>
    </div>
  );
}
