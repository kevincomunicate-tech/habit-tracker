<div align="center">

# ⚡ Pulse — Habit Tracker & Time Manager

**Aplicación personal de productividad, construcción de hábitos y gestión de tiempo basada en ciencia del comportamiento.**

[![Live Demo](https://shields.io🌐_Live_Demo-GitHub_Pages-2ea44f?style=for-the-badge)](https://github.io)
[![React](https://shields.ioReact-18-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://react.dev)
[![Vite](https://shields.ioVite-5-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev)
[![Tailwind CSS](https://shields.ioTailwind_CSS-3-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com)
[![License: MIT](https://shields.ioLicense-MIT-yellow.svg?style=for-the-badge)](https://opensource.org)

</div>

---

## 📖 Acerca del Proyecto

**Pulse** es un sistema personal diseñado para optimizar la ejecución diaria combinando **Time Blocking**, seguimiento de hábitos y sesiones de trabajo profundo (*Deep Work*). Sus mecánicas están basadas en principios prácticos de **Hábitos Atómicos** (James Clear) y protocolos de neurociencia conductual (Andrew Huberman).

Funciona 100% en el navegador con persistencia local (`localStorage`) y respaldos portables en JSON, garantizando privacidad absoluta sin depender de servidores externos.

👉 **Accede a la aplicación en vivo:** [https://github.io](https://github.io)

---

## ✨ Características Principales

### 🧠 Ciencia del Comportamiento & Proactividad
* **Construir vs. Dejar Hábitos:** Seguimiento dual para crear rutinas positivas o llevar un contador de abstinencia (días limpios, récord histórico, registro de detonantes ante recaídas y cálculo de tiempo/dinero ahorrado).
* **Intenciones de Implementación (*Habit Stacking*):** Creación estructurada bajo la fórmula: *"Haré `[HÁBITO]` a las `[HORA]` en `[LUGAR]` después de `[HÁBITO ANCLA]`"*.
* **Regla de los 2 Minutos:** Versión mínima viable para días de baja energía (accesible mediante **clic derecho** en el check semanal) para evitar romper la cadena (*nunca falles dos veces*).
* **Motor de Proactividad:** Alertas dinámicas en el Dashboard adaptadas a la franja horaria actual para priorizar tareas de alta demanda cognitiva o cierres de jornada.

### 🎯 Enfoque y Ejecución
* **Focus Mode Integrado:** Temporizadores científicos seleccionables (**Pomodoro 25/5**, **Ciclo Ultradiano 90/20** y **52/17**).
* **Paisajes Sonoros Nativos:** Generador de ruido blanco, ruido marrón y tonos binaurales de **40 Hz** mediante *Web Audio API* (sin dependencias ni archivos externos).
* **Registro de Distracciones:** Bloc rápido dentro de la sesión de enfoque para capturar pensamientos intrusivos sin perder el flujo de trabajo.
* **Notificaciones Nativas de Escritorio:** Alertas mediante *Web Notifications API* para inicio de bloques de tiempo, recordatorios de hábitos ancla y fin de sesiones de enfoque.

### 📊 Analítica y Respaldo
* **Dashboard Analítico:** Mapa de calor anual (estilo GitHub), correlación entre cumplimiento de hábitos y bloques de tiempo por día de la semana, y tasa de éxito por categoría y franja horaria.
* **Onboarding Limpio & Portabilidad JSON:** Inicio desde cero sin datos ficticios, con exportación e importación de copias de seguridad en `.json`.

---

## 🛠️ Stack Tecnológico

* **Frontend:** React + Vite
* **Estilos:** Tailwind CSS (Dark Mode nativo)
* **Visualización de Datos:** Recharts
* **Iconografía & Fechas:** Lucide React + `date-fns`
* **APIs Nativas:** `localStorage`, Web Notifications API, Web Audio API
* **Despliegue:** GitHub Pages (`gh-pages`)

---

## 🚀 Instalación y Uso Local

### Prerrequisitos
* **Node.js** (versión 18 o superior) y **npm** instalados.

### Pasos para ejecutar en tu PC

1. **Clona el repositorio:**
   ```bash
   git clone https://github.com
   ```

2. **Ingresa a la carpeta del proyecto:**
   ```bash
   cd Pulse
   ```

3. **Instala las dependencias:**
   ```bash
   npm install
   ```

4. **Inicia el servidor de desarrollo:**
   ```bash
   npm run dev
   ```
   Abre `http://localhost:5173` en tu navegador.

### Despliegue en GitHub Pages
Para publicar cambios nuevos directamente en la web:
```bash
npm run deploy
```

---

## 📂 Estructura del Proyecto

```text
src/
├── components/
│   ├── Dashboard.jsx       # Panel principal, motor proactivo y gráficas
│   ├── HabitTracker.jsx    # Gestión de hábitos positivos y abstinencia
│   ├── TimeBlocking.jsx    # Planificador diario por bloques de tiempo
│   ├── FocusMode.jsx       # Temporizadores, Web Audio API y log de distracciones
│   ├── Onboarding.jsx      # Flujo inicial de configuración personal
│   └── SettingsPanel.jsx   # Respaldos JSON y configuración de alertas
├── hooks/
│   └── useLocalStorage.js  # Persistencia reactiva en navegador
├── services/
│   └── notifications.js    # Gestión de permisos y alertas nativas
├── utils/
│   └── helpers.js          # Utilidades de fechas y cálculos estadísticos
├── App.jsx                 # Navegación y estado global
├── index.css               # Configuración de Tailwind CSS
└── main.jsx                # Punto de entrada
```

---

## 💡 Notas

* **Privacidad:** Todos los datos viven exclusivamente en el `localStorage` de tu navegador. Usa la función **Exportar JSON** en *Configuración (⚙️)* para guardar copias de seguridad periódicas.
* **Reiniciar Onboarding:** Borra la clave `pulse_settings` en las herramientas de desarrollador de tu navegador (`F12 > Application > Local Storage`) o importa un respaldo sin `onboardingDone`.
