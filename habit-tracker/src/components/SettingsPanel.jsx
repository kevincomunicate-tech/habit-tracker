import React, { useRef, useState, useEffect } from 'react';
import {
  Download, Upload, Bell, BellOff, TestTube2, X, Power, HardDrive
} from 'lucide-react';
import { exportBackup, parseImport } from '../utils/helpers';
import {
  getNotificationPermission,
  requestNotificationPermission,
  testNotification,
} from '../services/notifications';
import { getAutostartEnabled, setAutostartEnabled } from '../services/autostart';
import { getStorageLocation, isTauri } from '../services/storage';

export default function SettingsPanel({
  open,
  onClose,
  habits,
  completions,
  timeBlocks,
  settings,
  setSettings,
  replaceAll,
  getSnapshot,
}) {
  const fileRef = useRef(null);
  const [msg, setMsg] = useState(null);
  const [perm, setPerm] = useState('…');
  const [storagePath, setStoragePath] = useState('');
  const [autoOn, setAutoOn] = useState(!!settings?.autostartEnabled);

  useEffect(() => {
    if (!open) return;
    getNotificationPermission().then(setPerm);
    getStorageLocation().then(setStoragePath);
    if (isTauri()) {
      getAutostartEnabled().then((v) => {
        setAutoOn(v);
        setSettings((s) => ({ ...s, autostartEnabled: v }));
      });
    }
  }, [open, setSettings]);

  if (!open) return null;

  const handleExport = () => {
    const snap = getSnapshot ? getSnapshot() : { habits, completions, timeBlocks, settings };
    const json = exportBackup(snap);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `pulse-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setMsg('Backup exportado (data.json compatible)');
  };

  const handleImport = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const data = parseImport(reader.result);
        if (!window.confirm('Esto reemplazará tus datos actuales. ¿Continuar?')) return;
        if (replaceAll) {
          replaceAll(data);
        }
        setMsg('Importación correcta — guardado en data.json');
      } catch (err) {
        setMsg('Error al importar: ' + (err.message || 'JSON inválido'));
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handlePermission = async () => {
    const p = await requestNotificationPermission();
    setPerm(p);
    setMsg(p === 'granted' ? 'Permiso concedido' : p === 'denied' ? 'Permiso denegado' : p);
  };

  const handleTest = async () => {
    await testNotification();
    setMsg('Notificación de prueba enviada al centro del SO');
  };

  const handleAutostart = async (checked) => {
    setAutoOn(checked);
    const ok = await setAutostartEnabled(checked);
    setSettings((s) => ({ ...s, autostartEnabled: checked && ok }));
    setMsg(
      ok
        ? checked
          ? 'Inicio automático activado (arranca minimizado en bandeja)'
          : 'Inicio automático desactivado'
        : 'Autostart solo disponible en la app de escritorio (Tauri)'
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="card w-full max-w-md p-6 space-y-5 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-semibold">Configuración</h3>
          <button onClick={onClose} className="btn-ghost p-1.5">
            <X className="w-5 h-5" />
          </button>
        </div>

        {msg && (
          <div className="text-sm px-3 py-2 rounded-xl bg-slate-800 text-slate-300 border border-slate-700">
            {msg}
          </div>
        )}

        <section className="space-y-3">
          <h4 className="text-sm font-medium text-slate-400 flex items-center gap-2">
            <HardDrive className="w-4 h-4" />
            Almacenamiento
          </h4>
          <p className="text-xs text-slate-500 break-all">
            {storagePath || '…'}
          </p>
          <p className="text-xs text-slate-500">
            Los datos se guardan en <code className="text-emerald-400">data.json</code> dentro de la
            carpeta de datos de la app (persisten entre actualizaciones).
          </p>
          <div className="flex gap-2">
            <button onClick={handleExport} className="btn-secondary flex-1 flex items-center justify-center gap-2">
              <Download className="w-4 h-4" />
              Exportar
            </button>
            <button
              onClick={() => fileRef.current?.click()}
              className="btn-secondary flex-1 flex items-center justify-center gap-2"
            >
              <Upload className="w-4 h-4" />
              Importar
            </button>
            <input
              ref={fileRef}
              type="file"
              accept="application/json,.json"
              className="hidden"
              onChange={handleImport}
            />
          </div>
        </section>

        <section className="space-y-3">
          <h4 className="text-sm font-medium text-slate-400">Notificaciones nativas</h4>
          <p className="text-xs text-slate-500">
            Estado: <span className="text-slate-300">{perm}</span>
            {isTauri() ? ' · plugin Tauri (centro de notificaciones del SO)' : ' · Web API (navegador)'}
          </p>
          <div className="flex gap-2 flex-wrap">
            <button onClick={handlePermission} className="btn-secondary flex items-center gap-2">
              {perm === 'granted' ? <Bell className="w-4 h-4" /> : <BellOff className="w-4 h-4" />}
              Solicitar permiso
            </button>
            <button
              onClick={handleTest}
              className="btn-secondary flex items-center gap-2"
              disabled={perm !== 'granted'}
            >
              <TestTube2 className="w-4 h-4" />
              Probar
            </button>
          </div>
          <label className="flex items-center gap-2 text-sm text-slate-300 cursor-pointer">
            <input
              type="checkbox"
              checked={!!settings?.notificationsEnabled}
              onChange={(e) =>
                setSettings((s) => ({ ...s, notificationsEnabled: e.target.checked }))
              }
              className="rounded border-slate-600 bg-slate-800 text-emerald-500 focus:ring-emerald-500"
            />
            Activar alertas (bloques, hábitos ancla, fin de foco)
          </label>
        </section>

        <section className="space-y-3">
          <h4 className="text-sm font-medium text-slate-400 flex items-center gap-2">
            <Power className="w-4 h-4" />
            Escritorio
          </h4>
          <p className="text-xs text-slate-500">
            La X cierra a la bandeja del sistema (timers y recordatorios siguen activos).
            Usa “Salir” en el menú del icono para cerrar del todo.
          </p>
          <label className="flex items-center gap-2 text-sm text-slate-300 cursor-pointer">
            <input
              type="checkbox"
              checked={autoOn}
              onChange={(e) => handleAutostart(e.target.checked)}
              className="rounded border-slate-600 bg-slate-800 text-emerald-500 focus:ring-emerald-500"
            />
            Iniciar con el sistema (minimizado en bandeja)
          </label>
        </section>

        <section className="space-y-2">
          <h4 className="text-sm font-medium text-slate-400">Datos en memoria</h4>
          <p className="text-xs text-slate-500">
            {habits.length} hábitos · {Object.keys(completions).length} días con registros ·{' '}
            {Object.keys(timeBlocks).length} días con bloques
          </p>
        </section>
      </div>
    </div>
  );
}
