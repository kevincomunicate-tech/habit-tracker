import React, { useState } from 'react';
import { Sparkles, Target, Ban, ArrowRight, Check } from 'lucide-react';
import { formatDate, HABIT_ICONS, CATEGORIES } from '../utils/helpers';

const STEPS = ['welcome', 'first-habit', 'done'];

export default function Onboarding({ onComplete }) {
  const [step, setStep] = useState(0);
  const [habitType, setHabitType] = useState('build');
  const [form, setForm] = useState({
    name: '',
    category: 'salud',
    icon: '💪',
    color: '#10b981',
    intentionHour: '08:00',
    intentionPlace: '',
    anchorHabit: '',
    minVersion: '',
    costPerDay: '',
    timePerDayMinutes: '',
  });

  const finishEmpty = () => {
    onComplete({ habits: [], skip: true });
  };

  const createFirst = () => {
    if (!form.name.trim()) return;
    const id = `h${Date.now()}`;
    const base = {
      id,
      name: form.name.trim(),
      category: form.category,
      icon: form.icon,
      color: form.color,
      type: habitType,
      createdAt: formatDate(new Date()),
      intentionHour: form.intentionHour || null,
      intentionPlace: form.intentionPlace.trim() || null,
      anchorHabit: form.anchorHabit.trim() || null,
      minVersion: form.minVersion.trim() || null,
    };
    if (habitType === 'break') {
      base.lastRelapse = formatDate(new Date());
      base.relapseHistory = [];
      base.costPerDay = Number(form.costPerDay) || 0;
      base.timePerDayMinutes = Number(form.timePerDayMinutes) || 0;
    }
    onComplete({ habits: [base], skip: false });
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        <div className="flex items-center gap-2.5 mb-8 justify-center">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-emerald-500/20">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">Pulse</h1>
            <p className="text-[10px] text-slate-500 -mt-0.5">Habit & Time Manager</p>
          </div>
        </div>

        <div className="card p-6 sm:p-8 space-y-6">
          {step === 0 && (
            <>
              <div className="text-center space-y-3">
                <h2 className="text-2xl font-bold text-white">Bienvenido a tu sistema de hábitos</h2>
                <p className="text-slate-400 text-sm leading-relaxed">
                  Basado en Hábitos Atómicos (James Clear) y protocolos de neurociencia.
                  Empieza desde cero con tus hábitos reales — sin datos de demostración.
                </p>
              </div>
              <ul className="space-y-2 text-sm text-slate-300">
                <li className="flex gap-2 items-start">
                  <Check className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" />
                  Intenciones de implementación y Habit Stacking
                </li>
                <li className="flex gap-2 items-start">
                  <Check className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" />
                  Construir hábitos y dejar hábitos (abstinencia)
                </li>
                <li className="flex gap-2 items-start">
                  <Check className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" />
                  Focus Mode, time blocking y notificaciones nativas
                </li>
              </ul>
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={() => setStep(1)}
                  className="btn-primary flex-1 flex items-center justify-center gap-2"
                >
                  Crear mi primer hábito
                  <ArrowRight className="w-4 h-4" />
                </button>
                <button onClick={finishEmpty} className="btn-secondary flex-1">
                  Empezar vacío
                </button>
              </div>
            </>
          )}

          {step === 1 && (
            <>
              <div>
                <h2 className="text-xl font-bold text-white">Primer hábito</h2>
                <p className="text-sm text-slate-400 mt-1">Elige tipo y define la intención de implementación.</p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setHabitType('build')}
                  className={`p-4 rounded-xl border text-left transition-all ${
                    habitType === 'build'
                      ? 'border-emerald-500 bg-emerald-500/10'
                      : 'border-slate-700 bg-slate-800/40 hover:border-slate-600'
                  }`}
                >
                  <Target className={`w-5 h-5 mb-2 ${habitType === 'build' ? 'text-emerald-400' : 'text-slate-400'}`} />
                  <p className="font-medium text-sm">Construir</p>
                  <p className="text-xs text-slate-500 mt-0.5">Hacer algo nuevo</p>
                </button>
                <button
                  type="button"
                  onClick={() => setHabitType('break')}
                  className={`p-4 rounded-xl border text-left transition-all ${
                    habitType === 'break'
                      ? 'border-rose-500 bg-rose-500/10'
                      : 'border-slate-700 bg-slate-800/40 hover:border-slate-600'
                  }`}
                >
                  <Ban className={`w-5 h-5 mb-2 ${habitType === 'break' ? 'text-rose-400' : 'text-slate-400'}`} />
                  <p className="font-medium text-sm">Dejar / Abstinencia</p>
                  <p className="text-xs text-slate-500 mt-0.5">Días limpios</p>
                </button>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="block text-sm text-slate-400 mb-1">Nombre</label>
                  <input
                    className="input-field w-full"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder={habitType === 'build' ? 'Ej: Meditar 10 min' : 'Ej: Sin redes sociales'}
                    autoFocus
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm text-slate-400 mb-1">Categoría</label>
                    <select
                      className="input-field w-full"
                      value={form.category}
                      onChange={(e) => setForm({ ...form, category: e.target.value })}
                    >
                      {Object.entries(CATEGORIES).map(([k, v]) => (
                        <option key={k} value={k}>{v.label}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm text-slate-400 mb-1">Icono</label>
                    <div className="flex flex-wrap gap-1 max-h-20 overflow-y-auto">
                      {HABIT_ICONS.slice(0, 12).map((ic) => (
                        <button
                          key={ic}
                          type="button"
                          onClick={() => setForm({ ...form, icon: ic })}
                          className={`w-8 h-8 rounded-lg text-sm ${form.icon === ic ? 'bg-emerald-600' : 'bg-slate-800'}`}
                        >
                          {ic}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {habitType === 'build' && (
                  <>
                    <div className="p-3 rounded-xl bg-slate-800/50 border border-slate-700/60 space-y-2">
                      <p className="text-xs font-medium text-emerald-400">Intención de implementación</p>
                      <p className="text-xs text-slate-500">
                        Haré <strong className="text-slate-300">[hábito]</strong> a las{' '}
                        <strong className="text-slate-300">[hora]</strong> en{' '}
                        <strong className="text-slate-300">[lugar]</strong> después de{' '}
                        <strong className="text-slate-300">[ancla]</strong>
                      </p>
                      <div className="grid grid-cols-2 gap-2">
                        <input
                          type="time"
                          className="input-field w-full text-sm"
                          value={form.intentionHour}
                          onChange={(e) => setForm({ ...form, intentionHour: e.target.value })}
                        />
                        <input
                          className="input-field w-full text-sm"
                          placeholder="Lugar"
                          value={form.intentionPlace}
                          onChange={(e) => setForm({ ...form, intentionPlace: e.target.value })}
                        />
                      </div>
                      <input
                        className="input-field w-full text-sm"
                        placeholder="Después de (hábito ancla)"
                        value={form.anchorHabit}
                        onChange={(e) => setForm({ ...form, anchorHabit: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-slate-400 mb-1">Versión 2 minutos (días de baja energía)</label>
                      <input
                        className="input-field w-full"
                        placeholder="Ej: Leer 1 página"
                        value={form.minVersion}
                        onChange={(e) => setForm({ ...form, minVersion: e.target.value })}
                      />
                    </div>
                  </>
                )}

                {habitType === 'break' && (
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm text-slate-400 mb-1">Coste / día (€)</label>
                      <input
                        type="number"
                        min="0"
                        step="0.5"
                        className="input-field w-full"
                        value={form.costPerDay}
                        onChange={(e) => setForm({ ...form, costPerDay: e.target.value })}
                        placeholder="0"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-slate-400 mb-1">Minutos / día perdidos</label>
                      <input
                        type="number"
                        min="0"
                        className="input-field w-full"
                        value={form.timePerDayMinutes}
                        onChange={(e) => setForm({ ...form, timePerDayMinutes: e.target.value })}
                        placeholder="0"
                      />
                    </div>
                  </div>
                )}
              </div>

              <div className="flex gap-3">
                <button onClick={() => setStep(0)} className="btn-ghost">
                  Atrás
                </button>
                <button
                  onClick={createFirst}
                  disabled={!form.name.trim()}
                  className="btn-primary flex-1 disabled:opacity-40"
                >
                  Continuar
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
