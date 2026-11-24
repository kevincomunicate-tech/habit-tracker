import React, { useState, useEffect, useCallback } from 'react';
import {
  LayoutDashboard,
  CalendarCheck,
  Clock,
  Focus,
  Menu,
  X,
  Sparkles,
  Settings,
} from 'lucide-react';
import { useAppStore } from './hooks/useAppStore';
import Dashboard from './components/Dashboard';
import HabitTracker from './components/HabitTracker';
import TimeBlocking from './components/TimeBlocking';
import FocusMode from './components/FocusMode';
import Onboarding from './components/Onboarding';
import SettingsPanel from './components/SettingsPanel';
import { checkScheduledAlerts } from './services/notifications';

const TABS = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'habits', label: 'Hábitos', icon: CalendarCheck },
  { id: 'time', label: 'Time Blocking', icon: Clock },
  { id: 'focus', label: 'Focus', icon: Focus },
];

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [focusBlock, setFocusBlock] = useState(null);

  const {
    ready,
    habits,
    completions,
    timeBlocks,
    settings,
    setHabits,
    setCompletions,
    setTimeBlocks,
    setSettings,
    replaceAll,
    getSnapshot,
  } = useAppStore();

  useEffect(() => {
    document.documentElement.classList.add('dark');
  }, []);

  // Reminder loop — works while app is open or hidden in tray (WebView still runs)
  useEffect(() => {
    if (!settings?.notificationsEnabled) return undefined;
    const tick = () => {
      checkScheduledAlerts({ habits, completions, timeBlocks });
    };
    tick();
    const id = setInterval(tick, 30000);
    return () => clearInterval(id);
  }, [settings?.notificationsEnabled, habits, completions, timeBlocks]);

  const handleOnboardingComplete = useCallback(
    ({ habits: firstHabits }) => {
      if (firstHabits?.length) setHabits(firstHabits);
      setSettings((s) => ({ ...s, onboardingDone: true }));
    },
    [setHabits, setSettings]
  );

  const startFocus = (block) => {
    setFocusBlock(block || null);
    setActiveTab('focus');
  };

  if (!ready) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-400">
        <div className="text-center space-y-2">
          <div className="w-10 h-10 mx-auto rounded-xl bg-gradient-to-br from-emerald-500 to-indigo-600 flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-white animate-pulse" />
          </div>
          <p className="text-sm">Cargando Pulse…</p>
        </div>
      </div>
    );
  }

  if (!settings?.onboardingDone) {
    return <Onboarding onComplete={handleOnboardingComplete} />;
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return (
          <Dashboard
            habits={habits}
            completions={completions}
            timeBlocks={timeBlocks}
            onNavigate={setActiveTab}
          />
        );
      case 'habits':
        return (
          <HabitTracker
            habits={habits}
            setHabits={setHabits}
            completions={completions}
            setCompletions={setCompletions}
          />
        );
      case 'time':
        return (
          <TimeBlocking
            timeBlocks={timeBlocks}
            setTimeBlocks={setTimeBlocks}
            onStartFocus={startFocus}
          />
        );
      case 'focus':
        return <FocusMode linkedBlock={focusBlock} />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <header className="sticky top-0 z-40 border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-emerald-500/20">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold tracking-tight text-white">Pulse</h1>
                <p className="text-[10px] text-slate-500 -mt-0.5 leading-none">
                  Habit & Time Manager
                </p>
              </div>
            </div>

            <nav className="hidden md:flex items-center gap-1 bg-slate-900/60 rounded-xl p-1">
              {TABS.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                      isActive
                        ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
                        : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {tab.label}
                  </button>
                );
              })}
            </nav>

            <div className="flex items-center gap-1">
              <button
                onClick={() => setSettingsOpen(true)}
                className="btn-ghost p-2 hidden sm:inline-flex"
                title="Configuración"
              >
                <Settings className="w-5 h-5" />
              </button>
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="md:hidden btn-ghost p-2"
              >
                {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>

        {mobileMenuOpen && (
          <div className="md:hidden border-t border-slate-800 bg-slate-900/95 backdrop-blur-xl">
            <div className="px-4 py-3 space-y-1">
              {TABS.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => {
                      setActiveTab(tab.id);
                      setMobileMenuOpen(false);
                    }}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors ${
                      isActive
                        ? 'bg-emerald-600/20 text-emerald-400'
                        : 'text-slate-400 hover:bg-slate-800'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    {tab.label}
                  </button>
                );
              })}
              <button
                onClick={() => {
                  setSettingsOpen(true);
                  setMobileMenuOpen(false);
                }}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-slate-400 hover:bg-slate-800"
              >
                <Settings className="w-5 h-5" />
                Configuración
              </button>
            </div>
          </div>
        )}
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8">{renderContent()}</main>

      <footer className="border-t border-slate-800/60 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 flex flex-col sm:flex-row items-center justify-between gap-2 text-sm text-slate-500">
          <p>Pulse · Datos en AppData/data.json · Cerrar = bandeja del sistema</p>
          <p className="text-xs">Tauri · Hábitos Atómicos · Deep Work</p>
        </div>
      </footer>

      <SettingsPanel
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        habits={habits}
        completions={completions}
        timeBlocks={timeBlocks}
        settings={settings}
        setHabits={setHabits}
        setCompletions={setCompletions}
        setTimeBlocks={setTimeBlocks}
        setSettings={setSettings}
        replaceAll={replaceAll}
        getSnapshot={getSnapshot}
      />
    </div>
  );
}
