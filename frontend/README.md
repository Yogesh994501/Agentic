# SentinelFlow — Frontend Web Console

This is the interactive frontend application for **SentinelFlow**, an autonomous SOC investigation & response agent console designed for live operations and hackathon demonstrations.

## 🚀 Key Features

- **Procedural Cyber Background Engine (`60 FPS Canvas`)**:
  - Real-time reactive particle network running on HTML5 Canvas.
  - Dynamically modulates particle velocity, connection density, and glow based on user scroll depth (calm surveillance state at top $\rightarrow$ high-energy threat mode at bottom).
- **Tactical EMP Click Feedback & HUD Reticle**:
  - Independent foreground HUD overlay (`z-index: 9999`) that renders a localized targeting reticle (`[ ┐ ┘ └ ┌ ]`), center targeting dot, and dual expanding cyan shockwave rings at the exact cursor click coordinates.
  - Background canvas particles physically push outward radially upon click.
- **Hackathon-Grade Human Readability**:
  - 3-level typography hierarchy designed for comfortable viewing from across the room during live stage demos:
    - Primary KPIs (26–30px)
    - Incident Outcomes (20–24px)
    - Content & Evidence (13–15px)
    - Metadata & Tags (11–12px)
- **Semi-Opaque Glassmorphic Panels**:
  - Calibrated 72% opacity cards (`rgba(10, 17, 30, 0.72)`) that let background lights and particle motion bleed through while maintaining crisp contrast for forensic text.
- **Persistent Command Header & Quick Drawer**:
  - Sticky header with real-time agent status, sandbox isolation badge, 1-click sandbox reset, and slide-out navigation drawer.
- **Client-Side Simulation Fallback**:
  - Contains a full client-side reactive simulation engine enabling complete standalone functionality on GitHub Pages without requiring a backend server.

---

## 🛠️ Technology Stack

- **Framework**: React 18 + TypeScript
- **Bundler**: Vite 6+
- **Styling**: Tailwind CSS v4 + Custom Cyberpunk / SOC Theme
- **Icons**: Lucide React
- **Animations**: CSS Keyframes + Canvas 2D Context (`requestAnimationFrame`)

---

## 💻 Local Development

### Prerequisites
- Node.js 18+
- npm 9+

### Install Dependencies
```bash
npm install
```

### Run Local Dev Server
```bash
npm run dev
```
Open [http://localhost:5173](http://localhost:5173) in your browser.

### Build for Production
```bash
npm run build
```
Production assets are output to `dist/`.
