# Pulse + Tauri v2 — App de escritorio

## Requisitos previos

1. **Node.js** 18+
2. **Rust** (stable): https://rustup.rs  
   ```bash
   curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
   ```
3. Dependencias nativas por SO:
   - **Windows**: [Visual Studio Build Tools](https://visualstudio.microsoft.com/visual-cpp-build-tools/) (workload C++)
   - **macOS**: Xcode Command Line Tools (`xcode-select --install`)
   - **Linux** (Debian/Ubuntu):
     ```bash
     sudo apt update
     sudo apt install libwebkit2gtk-4.1-dev build-essential curl wget file \
       libxdo-dev libssl-dev libayatana-appindicator3-dev librsvg2-dev
     ```

---

## Comandos exactos de instalación

```bash
cd habit-tracker

# 1) Dependencias JS (React + plugins Tauri)
npm install

# 2) (Opcional) Regenerar iconos profesionales
# npm run tauri icon path/to/icon-1024.png

# 3) Desarrollo (Vite + ventana Tauri)
npm run tauri:dev

# 4) Instalador nativo (Windows .msi/.exe, macOS .dmg, Linux .AppImage/.deb)
npm run tauri:build
```

Los instaladores quedan en:

```
src-tauri/target/release/bundle/
```

---

## Plugins usados

| Plugin | npm | Cargo | Uso |
|--------|-----|-------|-----|
| Notification | `@tauri-apps/plugin-notification` | `tauri-plugin-notification` | Centro de notificaciones del SO |
| FS | `@tauri-apps/plugin-fs` | `tauri-plugin-fs` | `data.json` en AppData |
| Autostart | `@tauri-apps/plugin-autostart` | `tauri-plugin-autostart` | Inicio con el sistema |
| Single instance | — | `tauri-plugin-single-instance` | Una sola ventana |
| Tray | built-in `tray-icon` feature | — | Bandeja del sistema |

---

## Comportamiento de escritorio

- **Cerrar (X)** → oculta a la bandeja; timers y recordatorios siguen activos.
- **Clic en icono de bandeja** → muestra la ventana.
- **Menú bandeja → Salir** → cierra del todo.
- **Autostart** → arranca con `--minimized` (solo bandeja).
- **Datos** → `$APPDATA/com.pulse.habittracker/data.json` (ruta exacta se muestra en Configuración).

### Rutas típicas de data.json

| SO | Ruta aproximada |
|----|-----------------|
| Windows | `%APPDATA%\com.pulse.habittracker\data.json` |
| macOS | `~/Library/Application Support/com.pulse.habittracker/data.json` |
| Linux | `~/.local/share/com.pulse.habittracker/data.json` |

---

## Importar la base de datos seed

1. Arranca la app (`npm run tauri:dev` o el instalador).
2. Completa o salta el onboarding.
3. **Configuración → Importar** → elige `seed/data.json`.

El archivo seed incluye 3 hábitos de construcción + 1 de abstinencia y `onboardingDone: true`.

También puedes copiar manualmente:

```bash
# Ejemplo Linux
cp seed/data.json ~/.local/share/com.pulse.habittracker/data.json
```

---

## Archivos clave Tauri

```
src-tauri/
  Cargo.toml              # dependencias Rust + tray-icon
  tauri.conf.json         # ventanas, tray, bundle
  capabilities/default.json  # permisos FS / notification / autostart
  src/lib.rs              # tray, close→hide, autostart, single-instance
  src/main.rs
  icons/                  # reemplaza por tus iconos reales
```

Frontend adaptado:

```
src/services/storage.js       # data.json vía plugin-fs
src/services/notifications.js # plugin-notification
src/services/autostart.js
src/hooks/useAppStore.js      # store único persistente
```

---

## Permisos (capabilities/default.json)

- `notification:default` + notify / request-permission  
- `fs:default` + scope `$APPDATA/**`, `$APPCONFIG/**`, `$APPLOCALDATA/**`  
- `autostart:allow-enable|disable|is-enabled`  
- `core:window:allow-show|hide|set-focus|unminimize`  
- `core:tray:default`

---

## Notas

- En **Windows**, las notificaciones nativas funcionan de forma fiable en apps **instaladas** (no siempre en `tauri dev`).
- Iconos `.ico` / `.icns` generados aquí son placeholders PNG; para producción ejecuta:
  ```bash
  npx tauri icon ruta/a/logo-1024.png
  ```
- El frontend sigue funcionando en el navegador (`npm run dev`) con fallback a `localStorage`.
