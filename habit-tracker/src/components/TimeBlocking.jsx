import React, { useState, useMemo } from 'react';
import { format, addDays, subDays, isToday } from 'date-fns';
import { es } from 'date-fns/locale';
import {
  ChevronLeft, ChevronRight, Plus, X, Focus
} from 'lucide-react';
import { formatDate, CATEGORIES } from '../utils/helpers';

const HOURS = Array.from({ length: 16 }, (_, i) => i + 6);

export default function TimeBlocking({ timeBlocks, setTimeBlocks, onStartFocus }) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [showModal, setShowModal] = useState(false);
  const [editingBlock, setEditingBlock] = useState(null);
  const [form, setForm] = useState({
    title: '',
    category: 'trabajo',
    start: '09:00',
    end: '10:00',
  });

  const dateKey = formatDate(currentDate);
  const dayBlocks = timeBlocks[dateKey] || [];

  const openCreate = (hour = null) => {
    setEditingBlock(null);
    setForm({
      title: '',
      category: 'trabajo',
      start: hour !== null ? `${String(hour).padStart(2, '0')}:00` : '09:00',
      end: hour !== null ? `${String(hour + 1).padStart(2, '0')}:00` : '10:00',
    });
    setShowModal(true);
  };

  const openEdit = (block) => {
    setEditingBlock(block);
    setForm({
      title: block.title,
      category: block.category,
      start: block.start,
      end: block.end,
    });
    setShowModal(true);
  };

  const saveBlock = () => {
    if (!form.title.trim()) return;
    const color = CATEGORIES[form.category]?.color || '#64748b';
    const newBlock = {
      id: editingBlock?.id || `tb${Date.now()}`,
      title: form.title,
      category: form.category,
      start: form.start,
      end: form.end,
      color,
    };

    setTimeBlocks((prev) => {
      const day = [...(prev[dateKey] || [])];
      if (editingBlock) {
        const idx = day.findIndex((b) => b.id === editingBlock.id);
        if (idx >= 0) day[idx] = newBlock;
      } else {
        day.push(newBlock);
      }
      day.sort((a, b) => a.start.localeCompare(b.start));
      return { ...prev, [dateKey]: day };
    });
    setShowModal(false);
  };

  const deleteBlock = (id) => {
    setTimeBlocks((prev) => {
      const day = (prev[dateKey] || []).filter((b) => b.id !== id);
      return { ...prev, [dateKey]: day };
    });
    setShowModal(false);
  };

  const dayStats = useMemo(() => {
    const stats = {};
    Object.keys(CATEGORIES).forEach((c) => (stats[c] = 0));
    dayBlocks.forEach((block) => {
      const [sh, sm] = block.start.split(':').map(Number);
      const [eh, em] = block.end.split(':').map(Number);
      const hours = eh + em / 60 - (sh + sm / 60);
      if (stats[block.category] !== undefined) {
        stats[block.category] += Math.max(0, hours);
      }
    });
    return stats;
  }, [dayBlocks]);

  const totalHours = Object.values(dayStats).reduce((a, b) => a + b, 0);

  const getBlockStyle = (block) => {
    const [sh, sm] = block.start.split(':').map(Number);
    const [eh, em] = block.end.split(':').map(Number);
    const startHour = 6;
    const totalMinutes = 16 * 60;
    const top = ((sh - startHour) * 60 + sm) / totalMinutes * 100;
    const height = ((eh * 60 + em) - (sh * 60 + sm)) / totalMinutes * 100;
    return {
      top: `${top}%`,
      height: `${Math.max(height, 2.5)}%`,
      backgroundColor: `${block.color}33`,
      borderLeft: `3px solid ${block.color}`,
    };
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white">Time Blocking</h2>
          <p className="text-slate-400 text-sm mt-0.5 capitalize">
            {format(currentDate, "EEEE d 'de' MMMM yyyy", { locale: es })}
          </p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => onStartFocus?.(null)} className="btn-secondary flex items-center gap-2">
            <Focus className="w-4 h-4" />
            Focus Mode
          </button>
          <button onClick={() => openCreate()} className="btn-primary flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Añadir bloque
          </button>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <button onClick={() => setCurrentDate(subDays(currentDate, 1))} className="btn-ghost p-2">
          <ChevronLeft className="w-5 h-5" />
        </button>
        <button
          onClick={() => setCurrentDate(new Date())}
          className={`btn-secondary text-sm ${isToday(currentDate) ? 'ring-1 ring-emerald-500/50' : ''}`}
        >
          Hoy
        </button>
        <button onClick={() => setCurrentDate(addDays(currentDate, 1))} className="btn-ghost p-2">
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="card p-3 text-center">
          <p className="text-xs text-slate-500">Total</p>
          <p className="text-xl font-bold text-white mt-0.5">{totalHours.toFixed(1)}h</p>
        </div>
        {Object.entries(dayStats)
          .filter(([, h]) => h > 0)
          .map(([cat, hours]) => (
            <div key={cat} className="card p-3 text-center">
              <p className={`text-xs ${CATEGORIES[cat]?.text || 'text-slate-500'}`}>
                {CATEGORIES[cat]?.label}
              </p>
              <p className="text-xl font-bold text-white mt-0.5">{hours.toFixed(1)}h</p>
            </div>
          ))}
      </div>

      <div className="card overflow-hidden">
        <div className="relative min-h-[640px]">
          {HOURS.map((hour) => (
            <div
              key={hour}
              className="absolute left-0 right-0 border-t border-slate-800/60 flex"
              style={{ top: `${((hour - 6) / 16) * 100}%` }}
            >
              <div className="w-16 flex-shrink-0 text-xs text-slate-500 pr-3 text-right -mt-2.5 select-none">
                {String(hour).padStart(2, '0')}:00
              </div>
              <div className="flex-1 relative group">
                <button
                  onClick={() => openCreate(hour)}
                  className="absolute inset-0 opacity-0 group-hover:opacity-100 bg-slate-800/30 transition-opacity flex items-center justify-center"
                >
                  <Plus className="w-4 h-4 text-slate-500" />
                </button>
              </div>
            </div>
          ))}

          <div className="absolute left-16 right-0 top-0 bottom-0">
            {dayBlocks.map((block) => (
              <button
                key={block.id}
                onClick={() => openEdit(block)}
                className="absolute left-1 right-2 rounded-lg px-3 py-1.5 text-left transition-all hover:brightness-110 hover:scale-[1.01] cursor-pointer overflow-hidden"
                style={getBlockStyle(block)}
              >
                <p className="text-sm font-medium text-white truncate">{block.title}</p>
                <p className="text-xs text-slate-300/80">
                  {block.start} – {block.end}
                </p>
              </button>
            ))}
          </div>
        </div>
      </div>

      {dayBlocks.length > 0 && (
        <div className="card p-4 space-y-2 lg:hidden">
          <h3 className="text-sm font-medium text-slate-400 mb-3">Bloques del día</h3>
          {dayBlocks.map((block) => (
            <div key={block.id} className="flex items-center gap-2">
              <button
                onClick={() => openEdit(block)}
                className="flex-1 flex items-center gap-3 p-3 rounded-xl bg-slate-800/50 hover:bg-slate-800 transition-colors text-left"
              >
                <div className="w-1 h-10 rounded-full" style={{ backgroundColor: block.color }} />
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-slate-100 truncate">{block.title}</p>
                  <p className="text-xs text-slate-500">
                    {block.start} – {block.end} · {CATEGORIES[block.category]?.label}
                  </p>
                </div>
              </button>
              <button
                onClick={() => onStartFocus?.(block)}
                className="btn-ghost p-2 text-indigo-400"
                title="Iniciar Focus Mode"
              >
                <Focus className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="card w-full max-w-md p-6 space-y-5">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-semibold">
                {editingBlock ? 'Editar bloque' : 'Nuevo bloque'}
              </h3>
              <button onClick={() => setShowModal(false)} className="btn-ghost p-1.5">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm text-slate-400 mb-1.5">Título</label>
                <input
                  className="input-field w-full"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder="Ej: Deep Work - Feature X"
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-1.5">Categoría</label>
                <select
                  className="input-field w-full"
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                >
                  {Object.entries(CATEGORIES).map(([key, val]) => (
                    <option key={key} value={key}>{val.label}</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm text-slate-400 mb-1.5">Inicio</label>
                  <input
                    type="time"
                    className="input-field w-full"
                    value={form.start}
                    onChange={(e) => setForm({ ...form, start: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm text-slate-400 mb-1.5">Fin</label>
                  <input
                    type="time"
                    className="input-field w-full"
                    value={form.end}
                    onChange={(e) => setForm({ ...form, end: e.target.value })}
                  />
                </div>
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              {editingBlock && (
                <>
                  <button
                    onClick={() => deleteBlock(editingBlock.id)}
                    className="btn-ghost text-rose-400"
                  >
                    Eliminar
                  </button>
                  <button
                    onClick={() => {
                      setShowModal(false);
                      onStartFocus?.(editingBlock);
                    }}
                    className="btn-secondary flex items-center gap-1"
                  >
                    <Focus className="w-4 h-4" />
                    Focus
                  </button>
                </>
              )}
              <button onClick={() => setShowModal(false)} className="btn-secondary ml-auto">
                Cancelar
              </button>
              <button onClick={saveBlock} className="btn-primary" disabled={!form.title.trim()}>
                Guardar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
