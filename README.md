# ⚡ TLDR Whiteboard

> **A tactile, local-first backlog and idea whiteboard tracker for developers, designers, and creatives.**  
> Keep your sparks alive, document micro-updates, break down sub-ideas, and never lose track of what to build next.

![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)
![React 19](https://img.shields.io/badge/React-19-61dafb.svg)
![TypeScript](https://img.shields.io/badge/TypeScript-6.0-blue.svg)
![Tailwind CSS](https://img.shields.io/badge/TailwindCSS-v4-38bdf8.svg)
![Electron](https://img.shields.io/badge/Electron-Desktop-47848F.svg)
![Local First](https://img.shields.io/badge/Data-Local--First-emerald.svg)

---

## 🌟 Why TLDR Whiteboard?

Most issue trackers and project management tools are designed for enterprise sprints, corporate ticket queues, and rigid deadlines. **TLDR Whiteboard** is built for the messy, exciting early phase of ideas:

- 🎯 **TLDR-First Philosophy**: Every idea gets a punchy 1-2 sentence core premise. No bloated 10-page spec docs required before you even start.
- ⚡ **Tactile Whiteboard Canvas**: Freely position sticky cards inside customizable colored zones with fluid 4-corner multi-directional resizing.
- 🎨 **Creative vs. Tech Classification**: Instantly tag and filter projects into *Creative* (audio, storytelling, games), *Tech* (tools, systems, CLIs), or *Hybrid*.
- 📝 **Micro-Updates & Momentum Feed**: Add quick log entries and milestone notes as you make progress without getting interrupted.
- 🧩 **Sub-Ideas with Interactive Progress**: Break projects down into actionable hypotheses (`Spark` ➔ `Building` ➔ `Done` 🎉).
- 🔒 **100% Local & Private**: No mandatory cloud accounts, no subscription lock-in, zero tracking. All your projects are saved directly to human-readable JSON files right on your machine.
- 🖥️ **Runs Everywhere**: Use it as a native Windows desktop app (`.exe`) via Electron or in your browser via Vite.

---

## ✨ Features Overview

| Feature | Description |
| :--- | :--- |
| **📐 4-Corner Zone Resizing** | Resize your canvas zones from any of the 4 corners (NE, NW, SE, SW) with real-time pixel dimensions. |
| **🖐️ Zone & Card Movement** | Drag and organize your zones and project cards smoothly across the whiteboard. |
| **🧩 Sub-Ideas Tracker** | Add sub-tasks and step ideas to any project with single-click status cycling and progress bars. |
| **📝 Persistent Project Modal** | Add updates, change statuses, and manage sub-ideas without the modal closing or losing context. |
| **💾 Silent Passive Persistence** | Smooth background disk saving with zero UI jumps or screen reloads. |
| **📊 Kanban & List Views** | Switch between the tactile whiteboard, a classic Kanban status board, or a dense list view. |
| **📦 Portable Import / Export** | Export your entire backlog to a `.json` backup file or import existing project collections with one click. |

---

## 🚀 Quick Start

### Prerequisites
- [Node.js](https://nodejs.org/) (version 18 or higher recommended)
- Git

### 1. Clone the Repository
```bash
git clone https://github.com/your-username/tldr-whiteboard.git
cd tldr-whiteboard
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Run the App

#### 🌐 Option A: Run in the Browser (Web App)
```bash
npm run dev
```
Open **[http://localhost:5173](http://localhost:5173)** in your browser.

#### 🖥️ Option B: Run as Desktop App (Electron)
```bash
npm run electron:dev
```
Launches the native standalone desktop application window with live hot-reloading.

---

## 📦 Building the Standalone Desktop App (`.exe`)

To package a standalone Windows installer and portable `.exe`:

```bash
npm run electron:build
```

The compiled Windows binaries will be generated in the `./release` folder:
- **`TLDR Whiteboard Setup x.x.x.exe`**: Full Windows installer with Start Menu and desktop shortcuts.
- **`TLDR Whiteboard x.x.x.exe`**: Standalone portable single-file executable (run directly from anywhere, e.g. a USB stick).

---

## 🛠️ Tech Stack

- **Frontend**: [React 19](https://react.dev/), [TypeScript](https://www.typescriptlang.org/)
- **Bundler & Tooling**: [Vite 8](https://vite.dev/)
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/)
- **Desktop Packaging**: [Electron](https://www.electronjs.org/), [electron-builder](https://www.electron.build/)
- **Icons**: [Lucide React](https://lucide.dev/)
- **Visuals**: [Canvas Confetti](https://github.com/catdad/canvas-confetti)
- **Data Layer**: Direct JSON file storage & browser localStorage hybrid sync

---

## 📂 Project Structure

```
tldr-whiteboard/
├── data/
│   ├── backlog.example.json      # Sample starter projects for new installations
│   └── backlog.json              # Your private local backlog data (git-ignored)
├── electron/
│   ├── main.cjs                  # Electron main process & IPC handlers
│   └── preload.cjs               # Safe contextBridge exposing electronAPI
├── src/
│   ├── components/
│   │   ├── Navigation/           # Header bar, view toggles, filters
│   │   ├── ProjectModal/         # Project details, quick update, new project modals
│   │   ├── Stats/                # Analytics drawer & data import/export
│   │   ├── Views/                # Kanban & List alternate views
│   │   └── Whiteboard/           # Interactive canvas, zones, cards
│   ├── services/
│   │   └── storage.ts            # Hybrid Electron IPC + Web storage provider
│   ├── types/                    # TypeScript interfaces & types
│   ├── utils/                    # Colors, badges, time utilities
│   ├── App.tsx                   # Root application state & controllers
│   └── main.tsx                  # React entrypoint
├── package.json
├── vite.config.ts
└── README.md
```

---

## 🔒 Privacy & Your Data

Your ideas belong to you.
- When running locally, all data is stored inside `data/backlog.json`.
- `data/backlog.json` is included in `.gitignore` by default so your personal projects are never accidentally pushed to GitHub.
- Starter demo projects are provided in `data/backlog.example.json`.

---

## 🤝 Contributing

Contributions, feedback, and feature ideas are warmly welcome!
1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-idea`)
3. Commit your changes (`git commit -m 'feat: add amazing idea'`)
4. Push to the branch (`git push origin feature/amazing-idea`)
5. Open a Pull Request

---

## 📄 License

Distributed under the **MIT License**. See [`LICENSE`](./LICENSE) for more information.
