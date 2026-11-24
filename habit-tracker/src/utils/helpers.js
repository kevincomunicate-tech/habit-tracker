import {
  format,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameDay,
  subDays,
  startOfMonth,
  endOfMonth,
  getDay,
  differenceInDays,
  parseISO,
  startOfYear,
  endOfYear,
} from 'date-fns';
import { es } from 'date-fns/locale';

export const CATEGORIES = {
  trabajo: { label: 'Trabajo', color: '#6366f1', bg: 'bg-indigo-500/20', text: 'text-indigo-400' },
  estudio: { label: 'Estudio', color: '#8b5cf6', bg: 'bg-violet-500/20', text: 'text-violet-400' },
  salud: { label: 'Salud', color: '#10b981', bg: 'bg-emerald-500/20', text: 'text-emerald-400' },
  ocio: { label: 'Ocio', color: '#f59e0b', bg: 'bg-amber-500/20', text: 'text-amber-400' },
  personal: { label: 'Personal', color: '#ec4899', bg: 'bg-pink-500/20', text: 'text-pink-400' },
};

export const HABIT_ICONS = [
  '💪', '📚', '🏃', '💧', '🧘', '✍️', '🎯', '😴',
  '🥗', '🎸', '💻', '🧠', '❤️', '🌱', '🔥', '⭐',
  '🚭', '🍺', '📱', '🍫', '☕', '🎮'
];

export const TIME_SLOTS = {
  manana: { label: 'Mañana', start: 5, end: 12 },
  tarde: { label: 'Tarde', start: 12, end: 18 },
  noche: { label: 'Noche', start: 18, end: 24 },
};

export function formatDate(date, fmt = 'yyyy-MM-dd') {
  return format(date, fmt);
}

export function formatDisplayDate(date) {
  return format(date, "EEEE d 'de' MMMM", { locale: es });
}

export function getWeekDays(date = new Date()) {
  const start = startOfWeek(date, { weekStartsOn: 1 });
  const end = endOfWeek(date, { weekStartsOn: 1 });
  return eachDayOfInterval({ start, end });
}

export function getMonthDays(date = new Date()) {
  const start = startOfMonth(date);
  const end = endOfMonth(date);
  return eachDayOfInterval({ start, end });
}

export function getLastNDays(n = 30) {
  const end = new Date();
  const start = subDays(end, n - 1);
  return eachDayOfInterval({ start, end });
}

export function getYearDays(year = new Date().getFullYear()) {
  const start = startOfYear(new Date(year, 0, 1));
  const end = endOfYear(new Date(year, 0, 1));
  return eachDayOfInterval({ start, end });
}

/** Streak for build habits (boolean completions) */
export function calculateStreak(completions, habitId) {
  const dates = Object.keys(completions)
    .filter((d) => completions[d]?.[habitId])
    .sort()
    .reverse();

  if (dates.length === 0) return { current: 0, max: 0 };

  let current = 0;
  let max = 0;
  let temp = 0;
  let checkDate = new Date();
  checkDate.setHours(0, 0, 0, 0);

  for (let i = 0; i < dates.length; i++) {
    const d = parseISO(dates[i]);
    d.setHours(0, 0, 0, 0);
    const expected = subDays(checkDate, i);
    expected.setHours(0, 0, 0, 0);

    if (isSameDay(d, expected)) {
      current++;
    } else if (i === 0 && isSameDay(d, subDays(checkDate, 1))) {
      current++;
      checkDate = subDays(checkDate, 1);
    } else {
      break;
    }
  }

  const allDates = dates.map((d) => parseISO(d)).sort((a, b) => a - b);
  for (let i = 0; i < allDates.length; i++) {
    if (i === 0) {
      temp = 1;
    } else {
      const diff = differenceInDays(allDates[i], allDates[i - 1]);
      if (diff === 1) {
        temp++;
      } else {
        max = Math.max(max, temp);
        temp = 1;
      }
    }
  }
  max = Math.max(max, temp, current);

  return { current, max };
}

/** Streak for break/abstinence habits based on last relapse */
export function calculateBreakStreak(habit) {
  if (!habit || habit.type !== 'break') return { current: 0, max: 0 };
  const lastRelapse = habit.lastRelapse || habit.createdAt;
  const start = parseISO(lastRelapse);
  start.setHours(0, 0, 0, 0);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const current = Math.max(0, differenceInDays(today, start));

  const history = habit.relapseHistory || [];
  let max = current;
  let prev = parseISO(habit.createdAt);
  prev.setHours(0, 0, 0, 0);
  const sorted = [...history].sort((a, b) => a.date.localeCompare(b.date));
  for (const r of sorted) {
    const d = parseISO(r.date);
    d.setHours(0, 0, 0, 0);
    const streak = Math.max(0, differenceInDays(d, prev));
    if (streak > max) max = streak;
    prev = d;
  }
  // final segment after last relapse already in current
  return { current, max: Math.max(max, current) };
}

export function getCompletionRate(completions, habitIds, days) {
  if (habitIds.length === 0 || days.length === 0) return 0;
  let totalPossible = 0;
  let completed = 0;

  days.forEach((day) => {
    const key = formatDate(day);
    habitIds.forEach((id) => {
      totalPossible++;
      if (completions[key]?.[id]) completed++;
    });
  });

  return totalPossible === 0 ? 0 : Math.round((completed / totalPossible) * 100);
}

export function getHoursByCategory(timeBlocks) {
  const result = {};
  Object.keys(CATEGORIES).forEach((cat) => {
    result[cat] = 0;
  });

  Object.values(timeBlocks).forEach((dayBlocks) => {
    if (!Array.isArray(dayBlocks)) return;
    dayBlocks.forEach((block) => {
      if (block.category && result[block.category] !== undefined) {
        const [sh, sm] = block.start.split(':').map(Number);
        const [eh, em] = block.end.split(':').map(Number);
        result[block.category] += Math.max(0, eh + em / 60 - (sh + sm / 60));
      }
    });
  });

  return result;
}

export function getProductivityByDay(completions, habits, days = 30) {
  const buildHabits = habits.filter((h) => h.type !== 'break');
  const lastDays = getLastNDays(days);
  return lastDays.map((day) => {
    const key = formatDate(day);
    const dayCompletions = completions[key] || {};
    const total = buildHabits.length;
    const done = buildHabits.filter((h) => dayCompletions[h.id]).length;
    return {
      date: format(day, 'dd/MM'),
      fullDate: key,
      value: total > 0 ? Math.round((done / total) * 100) : 0,
      completed: done,
      total,
    };
  });
}

export function getMostProductiveDay(completions, habits) {
  const buildHabits = habits.filter((h) => h.type !== 'break');
  const dayScores = { 0: 0, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 };
  const dayCounts = { 0: 0, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 };
  const dayNames = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

  Object.entries(completions).forEach(([dateStr, dayData]) => {
    const date = parseISO(dateStr);
    const dayOfWeek = getDay(date);
    const done = buildHabits.filter((h) => dayData[h.id]).length;
    const rate = buildHabits.length > 0 ? done / buildHabits.length : 0;
    dayScores[dayOfWeek] += rate;
    dayCounts[dayOfWeek]++;
  });

  let bestDay = 1;
  let bestAvg = 0;

  Object.keys(dayScores).forEach((d) => {
    const avg = dayCounts[d] > 0 ? dayScores[d] / dayCounts[d] : 0;
    if (avg > bestAvg) {
      bestAvg = avg;
      bestDay = parseInt(d, 10);
    }
  });

  return {
    day: dayNames[bestDay],
    rate: Math.round(bestAvg * 100),
  };
}

/** Correlation: habit completion rate vs time-block hours by weekday */
export function getCorrelationByWeekday(completions, habits, timeBlocks, days = 60) {
  const buildHabits = habits.filter((h) => h.type !== 'break');
  const dayNames = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
  const lastDays = getLastNDays(days);
  const agg = Array.from({ length: 7 }, () => ({ habitSum: 0, habitCount: 0, hours: 0, days: 0 }));

  lastDays.forEach((day) => {
    const key = formatDate(day);
    const dow = getDay(day);
    const dayComp = completions[key] || {};
    const done = buildHabits.filter((h) => dayComp[h.id]).length;
    const rate = buildHabits.length > 0 ? done / buildHabits.length : 0;
    agg[dow].habitSum += rate;
    agg[dow].habitCount++;
    const blocks = timeBlocks[key] || [];
    let hours = 0;
    blocks.forEach((b) => {
      const [sh, sm] = b.start.split(':').map(Number);
      const [eh, em] = b.end.split(':').map(Number);
      hours += Math.max(0, eh + em / 60 - (sh + sm / 60));
    });
    agg[dow].hours += hours;
    agg[dow].days++;
  });

  return dayNames.map((name, i) => ({
    name,
    habitRate: agg[i].habitCount > 0 ? Math.round((agg[i].habitSum / agg[i].habitCount) * 100) : 0,
    hours: agg[i].days > 0 ? Math.round((agg[i].hours / agg[i].days) * 10) / 10 : 0,
  }));
}

/** Success rate by category (build habits only) */
export function getSuccessByCategory(completions, habits, days = 30) {
  const buildHabits = habits.filter((h) => h.type !== 'break');
  const lastDays = getLastNDays(days);
  const byCat = {};

  buildHabits.forEach((h) => {
    if (!byCat[h.category]) byCat[h.category] = { done: 0, total: 0 };
  });

  lastDays.forEach((day) => {
    const key = formatDate(day);
    const dayComp = completions[key] || {};
    buildHabits.forEach((h) => {
      if (!byCat[h.category]) byCat[h.category] = { done: 0, total: 0 };
      byCat[h.category].total++;
      if (dayComp[h.id]) byCat[h.category].done++;
    });
  });

  return Object.entries(byCat).map(([cat, v]) => ({
    name: CATEGORIES[cat]?.label || cat,
    rate: v.total > 0 ? Math.round((v.done / v.total) * 100) : 0,
    fill: CATEGORIES[cat]?.color || '#64748b',
  }));
}

/** Success by time slot using implementation intention hour */
export function getSuccessByTimeSlot(completions, habits, days = 30) {
  const buildHabits = habits.filter((h) => h.type !== 'break' && h.intentionHour);
  const lastDays = getLastNDays(days);
  const slots = {
    manana: { done: 0, total: 0 },
    tarde: { done: 0, total: 0 },
    noche: { done: 0, total: 0 },
  };

  const slotForHour = (hour) => {
    if (hour >= 5 && hour < 12) return 'manana';
    if (hour >= 12 && hour < 18) return 'tarde';
    return 'noche';
  };

  lastDays.forEach((day) => {
    const key = formatDate(day);
    const dayComp = completions[key] || {};
    buildHabits.forEach((h) => {
      const hour = parseInt(String(h.intentionHour).split(':')[0], 10);
      if (Number.isNaN(hour)) return;
      const slot = slotForHour(hour);
      slots[slot].total++;
      if (dayComp[h.id]) slots[slot].done++;
    });
  });

  return Object.entries(slots).map(([key, v]) => ({
    name: TIME_SLOTS[key].label,
    rate: v.total > 0 ? Math.round((v.done / v.total) * 100) : 0,
    key,
  }));
}

/** Annual heatmap intensity (all build habits) */
export function getAnnualHeatmap(completions, habits, year = new Date().getFullYear()) {
  const buildHabits = habits.filter((h) => h.type !== 'break');
  const days = getYearDays(year);
  return days.map((day) => {
    const key = formatDate(day);
    const dayData = completions[key] || {};
    const count = buildHabits.filter((h) => dayData[h.id]).length;
    const level = buildHabits.length === 0 ? 0 : Math.min(4, Math.ceil((count / buildHabits.length) * 4));
    return { date: key, count, level, day: getDay(day) };
  });
}

/** Money/time saved for break habits */
export function calcSavings(habit) {
  if (!habit || habit.type !== 'break') return { days: 0, money: 0, timeHours: 0 };
  const { current } = calculateBreakStreak(habit);
  const moneyPerDay = Number(habit.costPerDay) || 0;
  const timePerDay = Number(habit.timePerDayMinutes) || 0;
  return {
    days: current,
    money: Math.round(current * moneyPerDay * 100) / 100,
    timeHours: Math.round(((current * timePerDay) / 60) * 10) / 10,
  };
}

export function getProactiveAlerts(habits, completions, timeBlocks) {
  const now = new Date();
  const hour = now.getHours();
  const todayKey = formatDate(now);
  const alerts = [];

  // Morning: dopamine/cortisol peak ~ first hours after waking → hard tasks
  if (hour >= 6 && hour < 11) {
    alerts.push({
      id: 'morning-focus',
      type: 'science',
      title: 'Ventana de alto foco',
      message:
        'Pico de cortisol/dopamina matutino. Ideal para la tarea más difícil del día (Deep Work).',
      action: 'focus',
    });
  }

  // Afternoon energy dip
  if (hour >= 13 && hour < 16) {
    alerts.push({
      id: 'afternoon-dip',
      type: 'tip',
      title: 'Baja de energía post-comida',
      message: 'Usa la Regla de los 2 Minutos o un bloque ligero. No rompas la cadena.',
      action: 'habits',
    });
  }

  // Evening wind-down
  if (hour >= 20 && hour < 23) {
    alerts.push({
      id: 'evening-close',
      type: 'close',
      title: 'Cierre del día',
      message: 'Revisa hábitos pendientes y planifica el primer bloque de mañana.',
      action: 'habits',
    });
  }

  // Pending build habits with intention hour near
  const buildHabits = habits.filter((h) => h.type !== 'break');
  const dayComp = completions[todayKey] || {};
  buildHabits.forEach((h) => {
    if (dayComp[h.id]) return;
    if (!h.intentionHour) return;
    const [ih] = String(h.intentionHour).split(':').map(Number);
    if (Math.abs(hour - ih) <= 1) {
      alerts.push({
        id: `habit-${h.id}`,
        type: 'habit',
        title: `Hora de: ${h.name}`,
        message: h.intentionPlace
          ? `Intención: a las ${h.intentionHour} en ${h.intentionPlace}${h.anchorHabit ? ` después de ${h.anchorHabit}` : ''}`
          : `Tu ancla horaria es ${h.intentionHour}`,
        action: 'habits',
        habitId: h.id,
      });
    }
  });

  // Upcoming time blocks in next 30 min
  const blocks = timeBlocks[todayKey] || [];
  blocks.forEach((b) => {
    const [sh, sm] = b.start.split(':').map(Number);
    const startMin = sh * 60 + sm;
    const nowMin = hour * 60 + now.getMinutes();
    const diff = startMin - nowMin;
    if (diff >= 0 && diff <= 30) {
      alerts.push({
        id: `block-${b.id}`,
        type: 'block',
        title: `Próximo bloque: ${b.title}`,
        message: `Empieza a las ${b.start}`,
        action: 'time',
      });
    }
  });

  return alerts.slice(0, 5);
}

export function exportBackup({ habits, completions, timeBlocks, settings }) {
  return JSON.stringify(
    {
      version: 2,
      exportedAt: new Date().toISOString(),
      habits,
      completions,
      timeBlocks,
      settings: settings || {},
    },
    null,
    2
  );
}

export function parseImport(jsonText) {
  const data = JSON.parse(jsonText);
  if (!data || typeof data !== 'object') throw new Error('JSON inválido');
  return {
    habits: Array.isArray(data.habits) ? data.habits : [],
    completions: data.completions && typeof data.completions === 'object' ? data.completions : {},
    timeBlocks: data.timeBlocks && typeof data.timeBlocks === 'object' ? data.timeBlocks : {},
    settings: data.settings && typeof data.settings === 'object' ? data.settings : {},
  };
}
