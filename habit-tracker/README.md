# Pulse — Habit Tracker & Time Manager

Aplicación personal de hábitos y time blocking, optimizada con principios de **Hábitos Atómicos** (James Clear) y protocolos de neurociencia (Huberman).

## Stack

- React 18 + Vite
- Tailwind CSS (dark mode)
- Recharts
- date-fns
- lucide-react
- localStorage
- Web Notifications API + Web Audio API (sin dependencias extra)

## Instalación

```bash
cd habit-tracker
npm install
npm run dev
```

Ya incluidas en `package.json`: `react`, `react-dom`, `recharts`, `lucide-react`, `date-fns`. **No hace falta instalar nada más.**

## Características nuevas

1. **Onboarding real** — sin `sampleData` al iniciar. Estado vacío o primer hábito.
2. **Exportar / Importar JSON** — Configuración (engranaje).
3. **Construir vs Dejar hábitos** — abstinencia con días limpios, récord, recaída + detonante, ahorro €/tiempo.
4. **Intenciones de implementación** — “Haré X a las HORA en LUGAR después de ANCLA”.
5. **Regla de los 2 minutos** — versión mínima; clic derecho en el check semanal.
6. **Motor de proactividad** — alertas por hora del día en el Dashboard.
7. **Analítica** — heatmap anual, correlación hábitos/bloques por weekday, éxito por categoría y franja.
8. **Focus Mode** — Pomodoro 25/5, Ultradiano 90/20, 52/17; ruido blanco/marrón/binaural 40 Hz; log de distracciones.
9. **Notificaciones nativas** — permiso + prueba; alertas de bloques, hábitos ancla y fin de foco (pestaña abierta).

## Estructura

```
src/
  App.jsx
  components/
    Dashboard.jsx
    HabitTracker.jsx
    TimeBlocking.jsx
    FocusMode.jsx
    Onboarding.jsx
    SettingsPanel.jsx
  hooks/useLocalStorage.js
  services/notifications.js
  utils/helpers.js
```

## Notas

- Dark mode por defecto.
- Si tenías datos de la demo antigua en localStorage, puedes seguir usándolos o importar un backup limpio.
- Para reiniciar onboarding: borra la clave `pulse_settings` en localStorage o importa un backup sin `onboardingDone`.
