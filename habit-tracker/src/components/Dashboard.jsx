import React, { useMemo } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  Area, AreaChart, Cell, ComposedChart, Line, Legend
} from 'recharts';
import {
  Flame, Trophy, TrendingUp, CalendarCheck, Target, Award, Zap, Clock, AlertCircle
} from 'lucide-react';
import {
  calculateStreak,
  calculateBreakStreak,
  getCompletionRate,
  getHoursByCategory,
  getProductivityByDay,
  getMostProductiveDay,
  getWeekDays,
  getMonthDays,
  getCorrelationByWeekday,
  getSuccessByCategory,
  getSuccessByTimeSlot,
  getAnnualHeatmap,
  getProactiveAlerts,
  CATEGORIES,
  formatDate,
} from '../utils/helpers';

const HEAT_COLORS = [
  'bg-slate-800',
  'bg-emerald-900/70',
  'bg-emerald-700/80',
  'bg-emerald-500',
  'bg-emerald-400',
];

export default function Dashboard({ habits, completions, timeBlocks, onNavigate }) {
  const year = new Date().getFullYear();

  const stats = useMemo(() => {
    const buildHabits = habits.filter((h) => h.type !== 'break');
    const habitIds = buildHabits.map((h) => h.id);
    const weekDays = getWeekDays();
    const monthDays = getMonthDays();

    let bestCurrent = 0;
    let bestMax = 0;
    buildHabits.forEach((h) => {
      const s = calculateStreak(completions, h.id);
      if (s.current > bestCurrent) bestCurrent = s.current;
      if (s.max > bestMax) bestMax = s.max;
    });
    habits.filter((h) => h.type === 'break').forEach((h) => {
      const s = calculateBreakStreak(h);
      if (s.current > bestCurrent) bestCurrent = s.current;
      if (s.max > bestMax) bestMax = s.max;
    });

    const weeklyRate = getCompletionRate(completions, habitIds, weekDays);
    const monthlyRate = getCompletionRate(completions, habitIds, monthDays);
    const hoursByCat = getHoursByCategory(timeBlocks);
    const productivity = getProductivityByDay(completions, habits, 30);
    const mostProductive = getMostProductiveDay(completions, habits);
    const correlation = getCorrelationByWeekday(completions, habits, timeBlocks, 60);
    const byCategory = getSuccessByCategory(completions, habits, 30);
    const bySlot = getSuccessByTimeSlot(completions, habits, 30);
    const heatmap = getAnnualHeatmap(completions, habits, year);

    const barData = Object.entries(hoursByCat)
      .filter(([, hours]) => hours > 0)
      .map(([cat, hours]) => ({
        name: CATEGORIES[cat]?.label || cat,
        hours: Math.round(hours * 10) / 10,
        fill: CATEGORIES[cat]?.color || '#64748b',
      }));

    return {
      bestCurrent,
      bestMax,
      weeklyRate,
      monthlyRate,
      barData,
      productivity,
      mostProductive,
      correlation,
      byCategory,
      bySlot,
      heatmap,
    };
  }, [habits, completions, timeBlocks, year]);

  const alerts = useMemo(
    () => getProactiveAlerts(habits, completions, timeBlocks),
    [habits, completions, timeBlocks]
  );

  // Group heatmap by weeks (GitHub-style columns)
  const heatmapWeeks = useMemo(() => {
    const data = stats.heatmap;
    if (!data.length) return [];
    const weeks = [];
    let week = [];
    // pad start: first day of year weekday
    const firstDow = data[0]?.day ?? 0; // 0=Sun
    // convert to Mon-start: Mon=0
    const pad = (firstDow + 6) % 7;
    for (let i = 0; i < pad; i++) week.push(null);
    data.forEach((d) => {
      week.push(d);
      if (week.length === 7) {
        weeks.push(week);
        week = [];
      }
    });
    if (week.length) {
      while (week.length < 7) week.push(null);
      weeks.push(week);
    }
    return weeks;
  }, [stats.heatmap]);

  const tooltipStyle = {
    backgroundColor: '#0f172a',
    border: '1px solid #1e293b',
    borderRadius: '12px',
    color: '#e2e8f0',
  };

  return (
    <div className="space-y-6">
      {/* Proactive alerts */}
      {alerts.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm text-slate-400">
            <Zap className="w-4 h-4 text-amber-400" />
            Motor de proactividad
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {alerts.map((a) => (
              <button
                key={a.id}
                type="button"
                onClick={() => a.action && onNavigate?.(a.action)}
                className="card p-4 text-left card-hover flex gap-3 items-start"
              >
                <AlertCircle
                  className={`w-5 h-5 shrink-0 mt-0.5 ${
                    a.type === 'science'
                      ? 'text-amber-400'
                      : a.type === 'habit'
                        ? 'text-emerald-400'
                        : a.type === 'block'
                          ? 'text-indigo-400'
                          : 'text-slate-400'
                  }`}
                />
                <div>
                  <p className="font-medium text-sm text-white">{a.title}</p>
                  <p className="text-xs text-slate-400 mt-0.5">{a.message}</p>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card p-5 card-hover">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-slate-400 font-medium">Racha Actual</p>
              <p className="text-3xl font-bold mt-1 text-emerald-400">{stats.bestCurrent} días</p>
              <p className="text-xs text-slate-500 mt-1">Mejor racha activa</p>
            </div>
            <div className="p-2.5 rounded-xl bg-emerald-500/15">
              <Flame className="w-5 h-5 text-emerald-400" />
            </div>
          </div>
        </div>
        <div className="card p-5 card-hover">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-slate-400 font-medium">Racha Máxima</p>
              <p className="text-3xl font-bold mt-1 text-amber-400">{stats.bestMax} días</p>
              <p className="text-xs text-slate-500 mt-1">Récord histórico</p>
            </div>
            <div className="p-2.5 rounded-xl bg-amber-500/15">
              <Trophy className="w-5 h-5 text-amber-400" />
            </div>
          </div>
        </div>
        <div className="card p-5 card-hover">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-slate-400 font-medium">Cumplimiento Semanal</p>
              <p className="text-3xl font-bold mt-1 text-indigo-400">{stats.weeklyRate}%</p>
              <p className="text-xs text-slate-500 mt-1">Últimos 7 días</p>
            </div>
            <div className="p-2.5 rounded-xl bg-indigo-500/15">
              <CalendarCheck className="w-5 h-5 text-indigo-400" />
            </div>
          </div>
        </div>
        <div className="card p-5 card-hover">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-slate-400 font-medium">Cumplimiento Mensual</p>
              <p className="text-3xl font-bold mt-1 text-violet-400">{stats.monthlyRate}%</p>
              <p className="text-xs text-slate-500 mt-1">Este mes</p>
            </div>
            <div className="p-2.5 rounded-xl bg-violet-500/15">
              <Target className="w-5 h-5 text-violet-400" />
            </div>
          </div>
        </div>
      </div>

      {/* Most productive day */}
      <div className="card p-5 flex items-center gap-4 bg-gradient-to-r from-emerald-500/10 to-indigo-500/10 border-emerald-500/20">
        <div className="p-3 rounded-2xl bg-emerald-500/20">
          <Award className="w-6 h-6 text-emerald-400" />
        </div>
        <div>
          <p className="text-sm text-slate-400">Tu día más productivo de la semana</p>
          <p className="text-xl font-semibold text-white">
            {stats.mostProductive.day}
            <span className="text-emerald-400 ml-2 text-base font-medium">
              ({stats.mostProductive.rate}% promedio)
            </span>
          </p>
        </div>
      </div>

      {/* Annual heatmap */}
      <div className="card p-5 overflow-x-auto">
        <h3 className="text-lg font-semibold mb-1 flex items-center gap-2">
          <CalendarCheck className="w-5 h-5 text-emerald-400" />
          Mapa de calor {year}
        </h3>
        <p className="text-sm text-slate-500 mb-4">Consistencia global (estilo contribuciones)</p>
        <div className="flex gap-0.5 min-w-max">
          {heatmapWeeks.map((week, wi) => (
            <div key={wi} className="flex flex-col gap-0.5">
              {week.map((cell, di) =>
                cell ? (
                  <div
                    key={cell.date}
                    title={`${cell.date}: ${cell.count} hábitos`}
                    className={`heatmap-cell ${HEAT_COLORS[cell.level]}`}
                  />
                ) : (
                  <div key={`e-${wi}-${di}`} className="w-3 h-3" />
                )
              )}
            </div>
          ))}
        </div>
        <div className="flex items-center gap-1 mt-3 text-xs text-slate-500">
          <span>Menos</span>
          {HEAT_COLORS.map((c, i) => (
            <div key={i} className={`w-3 h-3 rounded-sm ${c}`} />
          ))}
          <span>Más</span>
        </div>
      </div>

      {/* Charts row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card p-5">
          <h3 className="text-lg font-semibold mb-1 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-indigo-400" />
            Horas por categoría
          </h3>
          <p className="text-sm text-slate-500 mb-4">Distribución de time blocking</p>
          {stats.barData.length > 0 ? (
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={stats.barData} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="name" tick={{ fill: '#94a3b8', fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#94a3b8', fontSize: 12 }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={tooltipStyle} formatter={(v) => [`${v}h`, 'Horas']} />
                <Bar dataKey="hours" radius={[8, 8, 0, 0]}>
                  {stats.barData.map((entry, index) => (
                    <Cell key={index} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-60 flex items-center justify-center text-slate-500 text-sm">
              Aún no hay bloques de tiempo
            </div>
          )}
        </div>

        <div className="card p-5">
          <h3 className="text-lg font-semibold mb-1 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-emerald-400" />
            Evolución de productividad
          </h3>
          <p className="text-sm text-slate-500 mb-4">Últimos 30 días · % hábitos completados</p>
          <ResponsiveContainer width="100%" height={240}>
            <AreaChart data={stats.productivity} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
              <defs>
                <linearGradient id="prodGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="date" tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} interval="preserveStartEnd" />
              <YAxis domain={[0, 100]} tick={{ fill: '#94a3b8', fontSize: 12 }} axisLine={false} tickLine={false} unit="%" />
              <Tooltip
                contentStyle={tooltipStyle}
                formatter={(value, _n, props) => [
                  `${value}% (${props.payload.completed}/${props.payload.total})`,
                  'Completado',
                ]}
              />
              <Area type="monotone" dataKey="value" stroke="#10b981" strokeWidth={2.5} fill="url(#prodGradient)" dot={false} activeDot={{ r: 5, fill: '#10b981' }} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Correlation + category/slot */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card p-5">
          <h3 className="text-lg font-semibold mb-1 flex items-center gap-2">
            <Clock className="w-5 h-5 text-violet-400" />
            Correlación hábitos vs bloques
          </h3>
          <p className="text-sm text-slate-500 mb-4">Por día de la semana (últimos 60 días)</p>
          <ResponsiveContainer width="100%" height={260}>
            <ComposedChart data={stats.correlation} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="name" tick={{ fill: '#94a3b8', fontSize: 12 }} axisLine={false} tickLine={false} />
              <YAxis yAxisId="left" tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} unit="%" />
              <YAxis yAxisId="right" orientation="right" tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} unit="h" />
              <Tooltip contentStyle={tooltipStyle} />
              <Legend />
              <Bar yAxisId="left" dataKey="habitRate" name="% hábitos" fill="#10b981" radius={[4, 4, 0, 0]} />
              <Line yAxisId="right" type="monotone" dataKey="hours" name="Horas bloque" stroke="#818cf8" strokeWidth={2} dot={{ r: 3 }} />
            </ComposedChart>
          </ResponsiveContainer>
        </div>

        <div className="space-y-6">
          <div className="card p-5">
            <h3 className="text-lg font-semibold mb-1">Éxito por categoría</h3>
            <p className="text-sm text-slate-500 mb-3">Últimos 30 días</p>
            {stats.byCategory.length > 0 ? (
              <ResponsiveContainer width="100%" height={160}>
                <BarChart data={stats.byCategory} layout="vertical" margin={{ top: 0, right: 20, left: 10, bottom: 0 }}>
                  <XAxis type="number" domain={[0, 100]} hide />
                  <YAxis type="category" dataKey="name" width={70} tick={{ fill: '#94a3b8', fontSize: 12 }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={tooltipStyle} formatter={(v) => [`${v}%`, 'Éxito']} />
                  <Bar dataKey="rate" radius={[0, 6, 6, 0]}>
                    {stats.byCategory.map((e, i) => (
                      <Cell key={i} fill={e.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-sm text-slate-500 py-8 text-center">Sin datos aún</p>
            )}
          </div>

          <div className="card p-5">
            <h3 className="text-lg font-semibold mb-1">Éxito por franja horaria</h3>
            <p className="text-sm text-slate-500 mb-3">Según hora de intención de implementación</p>
            <div className="grid grid-cols-3 gap-3">
              {stats.bySlot.map((s) => (
                <div key={s.key} className="text-center p-3 rounded-xl bg-slate-800/50">
                  <p className="text-xs text-slate-500">{s.name}</p>
                  <p className="text-2xl font-bold text-emerald-400 mt-1">{s.rate}%</p>
                </div>
              ))}
            </div>
            {stats.bySlot.every((s) => s.rate === 0) && (
              <p className="text-xs text-slate-500 mt-2 text-center">
                Define horas ancla en tus hábitos para ver esta métrica
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
