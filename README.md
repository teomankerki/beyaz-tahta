# ⚡ TLDR Whiteboard — Local Backlog & Idea Tracker

A tactile, local-first backlog and idea tracker designed with an interactive whiteboard feel, punchy TLDR summaries, classification (Creative vs. Tech), project update logs, and automatic local file persistence.

---

## ✨ Features

- **📌 Interactive Whiteboard Canvas**:
  - Pan and zoom around an expansive canvas with dot-grid styling and designated idea zones (*In Flight*, *Creative Playground*, *Tech Lab*, *Icebox*).
  - Drag and drop cards anywhere with smooth physics and snap-to-grid alignment.
  - **Auto-Tidy**: Instantly organize and pack cards into clean clusters with one click.
  - Double-click anywhere on open canvas space to drop a new idea right at that position.

- **⚡ TLDR-First Project Cards**:
  - Every project features a high-impact **TLDR summary callout** right at the top.
  - Washi tape accents, colored card stock (Canary, Parchment, Mint, Cyan, Lavender, Coral, Slate), and pin/tag badges.
  - Preview the latest micro-update snippet directly on the card face.

- **🎨 Classification & Filtering**:
  - Classify projects as **Creative** (🎨), **Tech** (💻), or **Hybrid** (⚡).
  - Filter effortlessly using the top navigation tabs to focus on pure creative writing/art/audio or deep technical systems/tools.
  - Secondary status filtering: **Spark (💡)**, **In Flight (🚧)**, **On Ice (🧊)**, **Shipped (🚀)**.
  - Instant fuzzy search across titles, TLDRs, tags, and update logs.

- **📝 Project Updates & Micro-Logs**:
  - Post chronological updates under each project (categorized as *Notes*, *Milestones*, *Roadblocks*, or *Sparks*).
  - Quick "+ Add Update" button on any card without leaving your workflow.
  - Celebratory confetti on major milestones and shipped projects!

- **📊 Multi-View Layouts**:
  - **Whiteboard Canvas**: Freeform spatial brainstorming.
  - **Kanban Board**: Drag-and-drop column-based workflow.
  - **List Feed**: Scannable tabular review with expandable updates timelines.

- **💾 True Local Persistence**:
  - Automatically saves all your ideas and positions directly to `./data/backlog.json` on disk.
  - You can commit `data/backlog.json` to git, back it up, or edit it directly.
  - Redundant caching in browser `localStorage`.
  - One-click **Export JSON** and **Import JSON** buttons in the Insights drawer.

---

## 🚀 Quickstart

### 1. Install Dependencies
```bash
npm install
```

### 2. Start the Local Tracker
```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

---

## ⌨️ Shortcuts & Canvas Controls

| Action | Shortcut / Control |
| :--- | :--- |
| **New Idea** | Press `N` anywhere on the page (or click `+ New Idea`) |
| **Create Idea at Location** | Double-click any empty spot on the whiteboard canvas |
| **Pan Canvas** | Click & drag canvas background, or mouse wheel / trackpad scroll |
| **Zoom In / Out** | `Ctrl` + Mouse Wheel or use the floating bottom-right controls |
| **Reposition Card** | Click & drag any card body |
| **Quick Update** | Click `+ Add Update` at the bottom of any card |
| **Open Full Details** | Click the card or `Open Board` |
| **Auto-Tidy** | Click the ✨ `Auto-Tidy` button on the bottom control pill |

---

## 📁 Storage Structure

Your data lives locally in:
```
data/
└── backlog.json    # Complete project data, updates log, positions, and whiteboard zones
```
