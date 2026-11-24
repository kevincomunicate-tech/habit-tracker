import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Play, Pause, RotateCcw, Volume2, VolumeX, Brain, Coffee, Timer, X, Plus
} from 'lucide-react';
import { notifyFocusEnd } from '../services/notifications';

const PROTOCOLS = [
  { id: 'pomodoro', label: 'Pomodoro', work: 25 * 60, break: 5 * 60, desc: '25/5 clásico' },
  { id: 'ultradian', label: 'Ciclo Ultradiano', work: 90 * 60, break: 20 * 60, desc: '90/20 Huberman' },
  { id: '5217', label: '52/17', work: 52 * 60, break: 17 * 60, desc: 'Desktop productivity' },
];

function formatTime(sec) {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

/** Ambient noise via Web Audio API — no external files */
function useAmbientNoise() {
  const ctxRef = useRef(null);
  const nodesRef = useRef([]);
  const [type, setType] = useState('off'); // off | white | brown | binaural

  const stop = useCallback(() => {
    nodesRef.current.forEach((n) => {
      try {
        n.stop?.();
        n.disconnect?.();
      } catch { /* */ }
    });
    nodesRef.current = [];
    if (ctxRef.current) {
      try {
        ctxRef.current.close();
      } catch { /* */ }
      ctxRef.current = null;
    }
  }, []);

  const start = useCallback(
    (noiseType) => {
      stop();
      if (noiseType === 'off') {
        setType('off');
        return;
      }
      try {
        const ctx = new (window.AudioContext || window.webkitAudioContext)();
        ctxRef.current = ctx;
        const master = ctx.createGain();
        master.gain.value = 0.12;
        master.connect(ctx.destination);

        if (noiseType === 'white' || noiseType === 'brown') {
          const bufferSize = 2 * ctx.sampleRate;
          const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
          const data = buffer.getChannelData(0);
          let last = 0;
          for (let i = 0; i < bufferSize; i++) {
            const white = Math.random() * 2 - 1;
            if (noiseType === 'brown') {
              last = (last + 0.02 * white) / 1.02;
              data[i] = last * 3.5;
            } else {
              data[i] = white;
            }
          }
          const src = ctx.createBufferSource();
          src.buffer = buffer;
          src.loop = true;
          src.connect(master);
          src.start();
          nodesRef.current = [src, master];
        } else if (noiseType === 'binaural') {
          // 40 Hz gamma (concentration) carrier ~200 Hz
          const carrier = 200;
          const beat = 40;
          const left = ctx.createOscillator();
          const right = ctx.createOscillator();
          left.frequency.value = carrier;
          right.frequency.value = carrier + beat;
          left.type = 'sine';
          right.type = 'sine';
          const merger = ctx.createChannelMerger(2);
          const gL = ctx.createGain();
          const gR = ctx.createGain();
          gL.gain.value = 0.08;
          gR.gain.value = 0.08;
          left.connect(gL);
          right.connect(gR);
          gL.connect(merger, 0, 0);
          gR.connect(merger, 0, 1);
          merger.connect(master);
          left.start();
          right.start();
          nodesRef.current = [left, right, merger, gL, gR, master];
        }
        setType(noiseType);
      } catch (e) {
        console.error(e);
        setType('off');
      }
    },
    [stop]
  );

  useEffect(() => () => stop(), [stop]);

  return { type, start, stop };
}

export default function FocusMode({ linkedBlock }) {
  const [protocol, setProtocol] = useState(PROTOCOLS[0]);
  const [phase, setPhase] = useState('work'); // work | break
  const [seconds, setSeconds] = useState(PROTOCOLS[0].work);
  const [running, setRunning] = useState(false);
  const [distractions, setDistractions] = useState([]);
  const [distractionText, setDistractionText] = useState('');
  const ambient = useAmbientNoise();
  const intervalRef = useRef(null);

  const resetTimer = useCallback(
    (p = protocol, ph = 'work') => {
      setPhase(ph);
      setSeconds(ph === 'work' ? p.work : p.break);
      setRunning(false);
    },
    [protocol]
  );

  useEffect(() => {
    resetTimer(protocol, 'work');
  }, [protocol, resetTimer]);

  useEffect(() => {
    if (!running) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      return;
    }
    intervalRef.current = setInterval(() => {
      setSeconds((s) => {
        if (s <= 1) {
          clearInterval(intervalRef.current);
          setRunning(false);
          const label =
            phase === 'work'
              ? `Trabajo ${protocol.label} completado — descanso ${Math.round(protocol.break / 60)} min`
              : `Descanso terminado — listo para otro bloque`;
          notifyFocusEnd(label);
          if (phase === 'work') {
            setPhase('break');
            return protocol.break;
          }
          setPhase('work');
          return protocol.work;
        }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(intervalRef.current);
  }, [running, phase, protocol]);

  const progress =
    phase === 'work'
      ? 1 - seconds / protocol.work
      : 1 - seconds / protocol.break;

  const addDistraction = () => {
    if (!distractionText.trim()) return;
    setDistractions((d) => [
      { id: Date.now(), text: distractionText.trim(), at: new Date().toLocaleTimeString() },
      ...d,
    ]);
    setDistractionText('');
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white">Focus Mode</h2>
          <p className="text-slate-400 text-sm mt-0.5">
            Deep Work · timers científicos + ruido ambiental
            {linkedBlock ? ` · vinculado a “${linkedBlock.title}”` : ''}
          </p>
        </div>
      </div>

      {/* Protocol picker */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {PROTOCOLS.map((p) => (
          <button
            key={p.id}
            onClick={() => setProtocol(p)}
            className={`card p-4 text-left transition-all ${
              protocol.id === p.id
                ? 'ring-2 ring-emerald-500/60 border-emerald-500/40'
                : 'hover:border-slate-700'
            }`}
          >
            <div className="flex items-center gap-2 mb-1">
              <Timer className={`w-4 h-4 ${protocol.id === p.id ? 'text-emerald-400' : 'text-slate-500'}`} />
              <span className="font-medium text-sm">{p.label}</span>
            </div>
            <p className="text-xs text-slate-500">{p.desc}</p>
          </button>
        ))}
      </div>

      {/* Timer */}
      <div className="card p-8 flex flex-col items-center">
        <div className="relative w-56 h-56 mb-6">
          <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
            <circle cx="60" cy="60" r="54" fill="none" stroke="#1e293b" strokeWidth="8" />
            <circle
              cx="60"
              cy="60"
              r="54"
              fill="none"
              stroke={phase === 'work' ? '#10b981' : '#6366f1'}
              strokeWidth="8"
              strokeLinecap="round"
              strokeDasharray={2 * Math.PI * 54}
              strokeDashoffset={2 * Math.PI * 54 * (1 - progress)}
              className="transition-all duration-1000 linear"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-4xl font-bold tabular-nums text-white">{formatTime(seconds)}</span>
            <span className="text-xs text-slate-400 mt-1 uppercase tracking-wider">
              {phase === 'work' ? 'Enfoque' : 'Descanso'}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setRunning((r) => !r)}
            className="btn-primary flex items-center gap-2 px-6"
          >
            {running ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            {running ? 'Pausa' : 'Iniciar'}
          </button>
          <button onClick={() => resetTimer(protocol, phase)} className="btn-secondary p-2.5">
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Ambient noise */}
      <div className="card p-5">
        <div className="flex items-center gap-2 mb-3">
          {ambient.type === 'off' ? (
            <VolumeX className="w-4 h-4 text-slate-500" />
          ) : (
            <Volume2 className="w-4 h-4 text-emerald-400" />
          )}
          <h3 className="font-medium text-sm">Ruido ambiental (Web Audio)</h3>
        </div>
        <div className="flex flex-wrap gap-2">
          {[
            { id: 'off', label: 'Silencio' },
            { id: 'white', label: 'Blanco' },
            { id: 'brown', label: 'Marrón' },
            { id: 'binaural', label: 'Binaural 40 Hz' },
          ].map((n) => (
            <button
              key={n.id}
              onClick={() => ambient.start(n.id)}
              className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
                ambient.type === n.id
                  ? 'bg-emerald-600 text-white'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              {n.label}
            </button>
          ))}
        </div>
        <p className="text-xs text-slate-500 mt-2">
          40 Hz (gamma) se asocia a concentración sostenida. Sin archivos externos.
        </p>
      </div>

      {/* Distraction log */}
      <div className="card p-5 space-y-3">
        <div className="flex items-center gap-2">
          <Brain className="w-4 h-4 text-violet-400" />
          <h3 className="font-medium text-sm">Registro de distracciones</h3>
        </div>
        <p className="text-xs text-slate-500">
          Anota pensamientos intrusivos sin salir del bloque. Libera la memoria de trabajo.
        </p>
        <div className="flex gap-2">
          <input
            className="input-field flex-1 text-sm"
            placeholder="Pensamiento / impulso..."
            value={distractionText}
            onChange={(e) => setDistractionText(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && addDistraction()}
          />
          <button onClick={addDistraction} className="btn-secondary p-2.5">
            <Plus className="w-4 h-4" />
          </button>
        </div>
        {distractions.length > 0 && (
          <ul className="space-y-1.5 max-h-40 overflow-y-auto">
            {distractions.map((d) => (
              <li
                key={d.id}
                className="flex items-start justify-between gap-2 text-sm px-3 py-2 rounded-lg bg-slate-800/60"
              >
                <span className="text-slate-300">{d.text}</span>
                <span className="text-xs text-slate-500 shrink-0">{d.at}</span>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="card p-4 flex items-start gap-3 bg-indigo-500/5 border-indigo-500/20">
        <Coffee className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
        <p className="text-sm text-slate-400">
          Durante el descanso: muévete, hidrátate o mira lejos (regla 20-20-20). Evita pantallas
          intensas para preservar el efecto del ciclo de foco.
        </p>
      </div>
    </div>
  );
}
