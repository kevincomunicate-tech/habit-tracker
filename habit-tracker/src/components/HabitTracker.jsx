import React, { useState, useMemo } from 'react';
import {
  format, addMonths, subMonths, isToday,
  startOfMonth, endOfMonth, eachDayOfInterval, subDays, addDays
} from 'date-fns';
import { es } from 'date-fns/locale';
import {
  ChevronLeft, ChevronRight, Plus, Check, X, Flame, Ban, Target, AlertTriangle
} from 'lucide-react';
import {
  getWeekDays, formatDate, calculateStreak, calculateBreakStreak,
  calcSavings, HABIT_ICONS, CATEGORIES
} from '../utils/helpers';

const emptyForm = () => ({
  name: '',
  category: 'salud',
  color: '#10b981',
  icon: '💪',
  type: 'build',
  intentionHour: '08:00',
  intentionPlace: '',
  anchorHabit: '',
  minVersion: '',
  costPerDay: '',
  timePerDayMinutes: '',
});

export default function HabitTracker({ habits, setHabits, completions, setCompletions }) {
  const [view, setView] = useState('week');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [showModal, setShowModal] = useState(false);
  const [selectedHabit, setSelectedHabit] = useState(null);
  const [form, setForm] = useState(emptyForm());
  const [relapseModal, setRelapseModal] = useState(null);
  const [trigger, setTrigger] = useState('');

  const weekDays = useMemo(() => getWeekDays(currentDate), [currentDate]);
  const monthDays = useMemo(() => {
    const start = startOfMonth(currentDate);
    const end = endOfMonth(currentDate);
    return eachDayOfInterval({ start, end });
  }, [currentDate]);

  const toggleCompletion = (habitId, date, minVersionDone = false) => {
    const key = formatDate(date);
    setCompletions((prev) => {
      const day = { ...(prev[key] || {}) };
      if (day[habitId] && !minVersionDone) {
        delete day[habitId];
      } else {
        day[habitId] = minVersionDone ? 'min' : true;
      }
      return { ...prev, [key]: day };
    });
  };

  const openCreate = () => {
    setSelectedHabit(null);
    setForm(emptyForm());
    setShowModal(true);
  };

  const openEdit = (habit) => {
    setSelectedHabit(habit);
    setForm({
      name: habit.name,
      category: habit.category,
      color: habit.color,
      icon: habit.icon,
      type: habit.type || 'build',
      intentionHour: habit.intentionHour || '08:00',
      intentionPlace: habit.intentionPlace || '',
      anchorHabit: habit.anchorHabit || '',
      minVersion: habit.minVersion || '',
      costPerDay: habit.costPerDay ?? '',
      timePerDayMinutes: habit.timePerDayMinutes ?? '',
    });
    setShowModal(true);
  };

  const saveHabit = () => {
    if (!form.name.trim()) return;
    const payload = {
      name: form.name.trim(),
      category: form.category,
      color: form.color,
      icon: form.icon,
      type: form.type,
      intentionHour: form.type === 'build' ? form.intentionHour || null : null,
      intentionPlace: form.type === 'build' ? form.intentionPlace.trim() || null : null,
      anchorHabit: form.type === 'build' ? form.anchorHabit.trim() || null : null,
      minVersion: form.type === 'build' ? form.minVersion.trim() || null : null,
      costPerDay: form.type === 'break' ? Number(form.costPerDay) || 0 : undefined,
      timePerDayMinutes: form.type === 'break' ? Number(form.timePerDayMinutes) || 0 : undefined,
    };

    if (selectedHabit) {
      setHabits((prev) =>
        prev.map((h) => (h.id === selectedHabit.id ? { ...h, ...payload } : h))
      );
    } else {
      const newHabit = {
        id: `h${Date.now()}`,
        ...payload,
        createdAt: formatDate(new Date()),
      };
      if (form.type === 'break') {
        newHabit.lastRelapse = formatDate(new Date());
        newHabit.relapseHistory = [];
      }
      setHabits((prev) => [...prev, newHabit]);
    }
    setShowModal(false);
  };

  const deleteHabit = (id) => {
    if (!window.confirm('¿Eliminar este hábito y su historial de marcas?')) return;
    setHabits((prev) => prev.filter((h) => h.id !== id));
    setCompletions((prev) => {
      const next = { ...prev };
      Object.keys(next).forEach((day) => {
        if (next[day] && next[day][id] !== undefined) {
          const copy = { ...next[day] };
          delete copy[id];
          next[day] = copy;
        }
      });
      return next;
    });
    setShowModal(false);
  };

  const confirmRelapse = () => {
    if (!relapseModal) return;
    const today = formatDate(new Date());
    setHabits((prev) =>
      prev.map((h) => {
        if (h.id !== relapseModal.id) return h;
        return {
          ...h,
          lastRelapse: today,
          relapseHistory: [
            ...(h.relapseHistory || []),
            { date: today, trigger: trigger.trim() || 'Sin especificar' },
          ],
        };
      })
    );
    setRelapseModal(null);
    setTrigger('');
  };

  const buildHabits = habits.filter((h) => h.type !== 'break');
  const breakHabits = habits.filter((h) => h.type === 'break');

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white">Habit Tracker</h2>
          <p className="text-slate-400 text-sm mt-0.5">
            {format(currentDate, 'MMMM yyyy', { locale: es })}
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex bg-slate-800/60 rounded-xl p-1">
            {['week', 'month'].map((v) => (
              <button
                key={v}
                onClick={() => setView(v)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  view === v ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                {v === 'week' ? 'Semana' : 'Mes'}
              </button>
            ))}
          </div>
          <button onClick={openCreate} className="btn-primary flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Nuevo hábito
          </button>
        </div>
      </div>

      {(view === 'week' || view === 'month') && (
        <div className="flex items-center justify-between">
          <button
            onClick={() =>
              setCurrentDate(view === 'week' ? subDays(currentDate, 7) : subMonths(currentDate, 1))
            }
            className="btn-ghost p-2"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button onClick={() => setCurrentDate(new Date())} className="btn-secondary text-sm">
            Hoy
          </button>
          <button
            onClick={() =>
              setCurrentDate(view === 'week' ? addDays(currentDate, 7) : addMonths(currentDate, 1))
            }
            className="btn-ghost p-2"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      )}

      {/* Break / abstinence cards */}
      {breakHabits.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-slate-400 flex items-center gap-2">
            <Ban className="w-4 h-4 text-rose-400" />
            Dejar hábitos · Abstinencia
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {breakHabits.map((habit) => {
              const streak = calculateBreakStreak(habit);
              const savings = calcSavings(habit);
              return (
                <div key={habit.id} className="card p-4 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <button onClick={() => openEdit(habit)} className="flex items-center gap-3 text-left">
                      <span
                        className="w-10 h-10 rounded-xl flex items-center justify-center text-lg"
                        style={{ backgroundColor: `${habit.color}22` }}
                      >
                        {habit.icon}
                      </span>
                      <div>
                        <p className="font-medium text-white">{habit.name}</p>
                        <p className="text-xs text-slate-500">{CATEGORIES[habit.category]?.label}</p>
                      </div>
                    </button>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-rose-400">{streak.current}</p>
                      <p className="text-[10px] text-slate-500">días limpios</p>
                    </div>
                  </div>
                  <div className="flex gap-3 text-xs text-slate-400">
                    <span>Récord: {streak.max}d</span>
                    {savings.money > 0 && <span>Ahorro: {savings.money}€</span>}
                    {savings.timeHours > 0 && <span>{savings.timeHours}h recuperadas</span>}
                  </div>
                  <button
                    onClick={() => {
                      setRelapseModal(habit);
                      setTrigger('');
                    }}
                    className="w-full text-sm py-2 rounded-xl border border-rose-500/40 text-rose-400 hover:bg-rose-500/10 transition-colors flex items-center justify-center gap-2"
                  >
                    <AlertTriangle className="w-4 h-4" />
                    Registrar recaída
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Week view */}
      {view === 'week' && (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px]">
              <thead>
                <tr className="border-b border-slate-800">
                  <th className="text-left p-4 text-sm font-medium text-slate-400 w-52">Hábito</th>
                  {weekDays.map((day) => (
                    <th
                      key={day.toISOString()}
                      className={`p-3 text-center text-sm font-medium ${
                        isToday(day) ? 'text-emerald-400' : 'text-slate-400'
                      }`}
                    >
                      <div>{format(day, 'EEE', { locale: es })}</div>
                      <div
                        className={`text-lg font-semibold mt-0.5 ${
                          isToday(day) ? 'text-emerald-400' : 'text-slate-200'
                        }`}
                      >
                        {format(day, 'd')}
                      </div>
                    </th>
                  ))}
                  <th className="p-3 text-center text-sm font-medium text-slate-400">Racha</th>
                </tr>
              </thead>
              <tbody>
                {buildHabits.map((habit) => {
                  const streak = calculateStreak(completions, habit.id);
                  return (
                    <tr key={habit.id} className="border-b border-slate-800/60 hover:bg-slate-800/30">
                      <td className="p-4">
                        <button onClick={() => openEdit(habit)} className="flex items-center gap-3 text-left group">
                          <span
                            className="w-9 h-9 rounded-xl flex items-center justify-center text-lg"
                            style={{ backgroundColor: `${habit.color}22` }}
                          >
                            {habit.icon}
                          </span>
                          <div>
                            <p className="font-medium text-slate-100 group-hover:text-emerald-400 transition-colors">
                              {habit.name}
                            </p>
                            <p className="text-xs text-slate-500">
                              {CATEGORIES[habit.category]?.label}
                              {habit.minVersion && (
                                <span className="text-slate-600"> · 2min: {habit.minVersion}</span>
                              )}
                            </p>
                          </div>
                        </button>
                      </td>
                      {weekDays.map((day) => {
                        const key = formatDate(day);
                        const val = completions[key]?.[habit.id];
                        const done = !!val;
                        const isMin = val === 'min';
                        return (
                          <td key={day.toISOString()} className="p-2 text-center">
                            <button
                              onClick={() => toggleCompletion(habit.id, day)}
                              onContextMenu={(e) => {
                                e.preventDefault();
                                if (habit.minVersion) toggleCompletion(habit.id, day, true);
                              }}
                              title={habit.minVersion ? 'Clic: completo · Clic derecho: versión 2 min' : ''}
                              className={`w-10 h-10 rounded-xl mx-auto flex items-center justify-center transition-all duration-200 ${
                                done
                                  ? 'text-white shadow-lg scale-105'
                                  : 'bg-slate-800/80 text-slate-600 hover:bg-slate-700 hover:text-slate-300'
                              }`}
                              style={done ? { backgroundColor: isMin ? '#64748b' : habit.color } : {}}
                            >
                              {done ? <Check className="w-5 h-5" /> : null}
                            </button>
                          </td>
                        );
                      })}
                      <td className="p-3 text-center">
                        <div className="flex items-center justify-center gap-1 text-sm">
                          <Flame
                            className={`w-4 h-4 ${streak.current > 0 ? 'text-orange-400' : 'text-slate-600'}`}
                          />
                          <span
                            className={
                              streak.current > 0 ? 'text-orange-400 font-semibold' : 'text-slate-500'
                            }
                          >
                            {streak.current}
                          </span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {buildHabits.length === 0 && (
            <div className="p-12 text-center text-slate-500">
              <Target className="w-10 h-10 mx-auto mb-3 opacity-40" />
              <p>No hay hábitos de construcción todavía.</p>
              <button onClick={openCreate} className="btn-primary mt-4 inline-flex items-center gap-2">
                <Plus className="w-4 h-4" />
                Crear hábito
              </button>
            </div>
          )}
        </div>
      )}

      {/* Month view simplified */}
      {view === 'month' && (
        <div className="space-y-4">
          {buildHabits.map((habit) => {
            const streak = calculateStreak(completions, habit.id);
            return (
              <div key={habit.id} className="card p-4">
                <div className="flex items-center justify-between mb-3">
                  <button onClick={() => openEdit(habit)} className="flex items-center gap-2">
                    <span className="text-lg">{habit.icon}</span>
                    <span className="font-medium">{habit.name}</span>
                  </button>
                  <span className="text-sm text-orange-400 flex items-center gap-1">
                    <Flame className="w-4 h-4" />
                    {streak.current}
                  </span>
                </div>
                <div className="flex flex-wrap gap-1">
                  {monthDays.map((day) => {
                    const key = formatDate(day);
                    const done = !!completions[key]?.[habit.id];
                    return (
                      <button
                        key={key}
                        onClick={() => toggleCompletion(habit.id, day)}
                        className={`w-7 h-7 rounded-md text-[10px] flex items-center justify-center ${
                          done ? 'text-white' : 'bg-slate-800 text-slate-600 hover:bg-slate-700'
                        } ${isToday(day) ? 'ring-1 ring-emerald-500/50' : ''}`}
                        style={done ? { backgroundColor: habit.color } : {}}
                      >
                        {format(day, 'd')}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
          {buildHabits.length === 0 && (
            <div className="card p-12 text-center text-slate-500">Sin hábitos aún</div>
          )}
        </div>
      )}

      {/* Create / Edit modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="card w-full max-w-md p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-semibold">
                {selectedHabit ? 'Editar hábito' : 'Nuevo hábito'}
              </h3>
              <button onClick={() => setShowModal(false)} className="btn-ghost p-1.5">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setForm({ ...form, type: 'build' })}
                className={`p-3 rounded-xl border text-sm ${
                  form.type === 'build'
                    ? 'border-emerald-500 bg-emerald-500/10 text-emerald-400'
                    : 'border-slate-700 text-slate-400'
                }`}
              >
                <Target className="w-4 h-4 inline mr-1" />
                Construir
              </button>
              <button
                type="button"
                onClick={() => setForm({ ...form, type: 'break' })}
                className={`p-3 rounded-xl border text-sm ${
                  form.type === 'break'
                    ? 'border-rose-500 bg-rose-500/10 text-rose-400'
                    : 'border-slate-700 text-slate-400'
                }`}
              >
                <Ban className="w-4 h-4 inline mr-1" />
                Dejar
              </button>
            </div>

            <div>
              <label className="block text-sm text-slate-400 mb-1">Nombre</label>
              <input
                className="input-field w-full"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder={form.type === 'build' ? 'Ej: Leer 30 min' : 'Ej: Sin alcohol'}
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
                <label className="block text-sm text-slate-400 mb-1">Color</label>
                <input
                  type="color"
                  className="w-full h-10 rounded-xl bg-slate-800 border border-slate-700 cursor-pointer"
                  value={form.color}
                  onChange={(e) => setForm({ ...form, color: e.target.value })}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm text-slate-400 mb-1">Icono</label>
              <div className="flex flex-wrap gap-1">
                {HABIT_ICONS.map((ic) => (
                  <button
                    key={ic}
                    type="button"
                    onClick={() => setForm({ ...form, icon: ic })}
                    className={`w-8 h-8 rounded-lg text-sm ${
                      form.icon === ic ? 'bg-emerald-600' : 'bg-slate-800 hover:bg-slate-700'
                    }`}
                  >
                    {ic}
                  </button>
                ))}
              </div>
            </div>

            {form.type === 'build' && (
              <>
                <div className="p-3 rounded-xl bg-slate-800/50 border border-slate-700/60 space-y-2">
                  <p className="text-xs font-medium text-emerald-400">
                    Intención de implementación (Habit Stacking)
                  </p>
                  <p className="text-[11px] text-slate-500">
                    Haré [hábito] a las [hora] en [lugar] después de [ancla]
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
                  <label className="block text-sm text-slate-400 mb-1">
                    Regla de los 2 minutos (versión mínima)
                  </label>
                  <input
                    className="input-field w-full"
                    placeholder="Ej: Leer 1 página"
                    value={form.minVersion}
                    onChange={(e) => setForm({ ...form, minVersion: e.target.value })}
                  />
                  <p className="text-[11px] text-slate-500 mt-1">
                    Clic derecho en el check = marcar versión mínima (nunca falles dos veces)
                  </p>
                </div>
              </>
            )}

            {form.type === 'break' && (
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
                  />
                </div>
                <div>
                  <label className="block text-sm text-slate-400 mb-1">Minutos / día</label>
                  <input
                    type="number"
                    min="0"
                    className="input-field w-full"
                    value={form.timePerDayMinutes}
                    onChange={(e) => setForm({ ...form, timePerDayMinutes: e.target.value })}
                  />
                </div>
              </div>
            )}

            <div className="flex gap-2 pt-2">
              {selectedHabit && (
                <button
                  onClick={() => deleteHabit(selectedHabit.id)}
                  className="btn-ghost text-rose-400 hover:text-rose-300"
                >
                  Eliminar
                </button>
              )}
              <button onClick={() => setShowModal(false)} className="btn-secondary ml-auto">
                Cancelar
              </button>
              <button onClick={saveHabit} className="btn-primary" disabled={!form.name.trim()}>
                Guardar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Relapse modal */}
      {relapseModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="card w-full max-w-sm p-6 space-y-4">
            <h3 className="text-lg font-semibold text-white">Recaída · {relapseModal.name}</h3>
            <p className="text-sm text-slate-400">
              La racha se reinicia. Registrar el detonante ayuda a detectar patrones (Clear /
              neurociencia de craving).
            </p>
            <div>
              <label className="block text-sm text-slate-400 mb-1">Detonante / contexto</label>
              <input
                className="input-field w-full"
                value={trigger}
                onChange={(e) => setTrigger(e.target.value)}
                placeholder="Ej: estrés laboral, fiesta, aburrimiento..."
                autoFocus
              />
            </div>
            <div className="flex gap-2">
              <button onClick={() => setRelapseModal(null)} className="btn-secondary flex-1">
                Cancelar
              </button>
              <button onClick={confirmRelapse} className="btn-primary flex-1 bg-rose-600 hover:bg-rose-500">
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
