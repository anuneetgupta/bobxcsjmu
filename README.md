<p align="center">
  <img src="https://img.shields.io/badge/Platform-Android%20%7C%20Web-blue?style=for-the-badge" alt="Platform" />
  <img src="https://img.shields.io/badge/Status-Prototype-orange?style=for-the-badge" alt="Status" />
  <img src="https://img.shields.io/badge/University-CSJMU%20Kanpur-green?style=for-the-badge" alt="University" />
</p>

# 🧭 CampusOS — Smart Campus Navigator

> AI-powered campus navigation system for **Chhatrapati Shahu Ji Maharaj University (CSJMU), Kanpur**

CampusOS helps students, parents, and visitors navigate the vast CSJMU campus with confidence — find buildings, classrooms, exam halls, and nearby amenities in seconds.

---

## 📸 Screenshots

| Map (Dark) | Map (Light) | Navigation | SOS |
|:---:|:---:|:---:|:---:|
| Dark map with markers | Light mode with tiles | Turn-by-turn routing | Emergency dispatch |

| Schedule | Chat | Building Detail | Profile |
|:---:|:---:|:---:|:---:|
| Today's timetable | AI assistant | Building info sheet | Settings & toggles |

---

## ✨ Features

### 🗺️ Interactive Campus Map
- **20+ buildings** plotted with category-colored markers (Academic, Admin, Residential, Emergency, Landmarks)
- **Dark & Light map tiles** (CartoDB) with smooth theme switching
- **GPS location dot** with pulsing animation
- **Walking / Cycling / Vehicle** mode selector

### 🔍 Smart Search
- Fuzzy search across building names, departments, room numbers, and tags
- Instant results with highlighted matches
- One-tap navigation from search results

### 🧭 Turn-by-Turn Navigation
- Animated dashed-polyline route overlay
- Real-time ETA, distance, and speed display
- Multi-modal time estimates (walk / cycle / vehicle)

### 🚰 Amenity Finder
- Quick-access pills: **Water · Washroom · ATM · Print · Charging · Security**
- Distance-sorted results from your current location
- One-tap navigate to nearest amenity

### 📅 Schedule & Exam Mode
- Today's classes with time, room, building, and walk distance
- **"NOW" indicator** for current class
- **Exam Mode**: Enter roll number → find your exam hall instantly

### 🚨 SOS Emergency
- **One-tap emergency dispatch**: Medical, Fire, Security, Accident, Harassment
- Auto-shares your GPS location with campus security
- Nearest resource card with navigate button
- Emergency contacts with direct call buttons

### 💬 AI Chat Assistant
- Natural language queries: *"Where is UIET?"*, *"Nearest washroom"*, *"Library timings"*
- Contextual responses with "Navigate" action buttons
- Quick suggestion chips

### 👤 Profile & Settings
- Role-based profiles: Student / Parent / Visitor / Faculty
- **Dark / Light mode toggle** with map tile switching
- Accessibility mode (larger text)
- Amenity visibility toggle
- Voice navigation toggle

### 📲 QR Code Indoor Positioning
- Scan QR codes at building entrances for precise indoor location
- Simulated scanner with viewfinder animation (demo)

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────┐
│            Android WebView              │
│  (Full-screen, GPS, Camera, Immersive)  │
├─────────────────────────────────────────┤
│              Web App Layer              │
│  HTML5 + Vanilla CSS + ES Modules JS    │
├─────────────────────────────────────────┤
│     Leaflet.js    │    Campus Data      │
│   (Map Rendering) │  (Graph + Coords)   │
├─────────────────────────────────────────┤
│           CartoDB Tile Server           │
│      (dark_all / light_all tiles)       │
└─────────────────────────────────────────┘
```

- **Offline-first**: All web assets bundled in APK `assets/` folder
- **Zero backend**: No server, no paid APIs, no database
- **ES Modules**: Clean import/export architecture
- **CSS Variables**: Entire theme swappable via `body.light-mode` class

---

## 📁 Project Structure

```
bobxcsjmu/
├── index.html                  # Main app (all 9 screens)
├── css/
│   └── styles.css              # Design system (dark + light themes)
├── js/
│   ├── data.js                 # Campus data module (buildings, amenities, routes, timetable)
│   └── app.js                  # App logic (map, nav, search, chat, SOS, settings)
├── android-app/                # Native Android wrapper
│   ├── app/
│   │   └── src/main/
│   │       ├── AndroidManifest.xml
│   │       ├── assets/         # Web files (auto-copied)
│   │       ├── java/.../MainActivity.kt  # WebView launcher
│   │       └── res/            # Icons, themes, strings
│   ├── build.gradle.kts
│   └── gradlew.bat
└── README.md
```

---

## 🚀 Quick Start

### Web (Browser Preview)
```bash
# Serve locally
npx serve ./ -l 3000

# Open in Chrome with mobile emulation
# → http://localhost:3000
```

### Android (Build APK)
```bash
cd android-app

# Build debug APK
./gradlew assembleDebug

# APK location:
# android-app/app/build/outputs/apk/debug/app-debug.apk

# Install on connected device
adb install app/build/outputs/apk/debug/app-debug.apk
```

### Prerequisites
- **Web**: Any modern browser (Chrome recommended)
- **Android Build**: JDK 17+, Android SDK (auto-downloaded by Gradle)
- **No API keys required** — all services are free-tier

---

## 🎨 Design System

| Token | Dark Mode | Light Mode | Usage |
|-------|-----------|------------|-------|
| `--primary` | `#C75B39` | `#C75B39` | Terracotta — CTAs, active states |
| `--secondary` | `#1A535C` | `#1A535C` | Deep Teal — secondary actions |
| `--bg` | `#0D1117` | `#F5F3EF` | App background |
| `--surface` | `#161B22` | `#FFFFFF` | Input backgrounds |
| `--card` | `#1C2128` | `#FFFFFF` | Cards, sheets |
| `--cream` | `#F7F0E3` | `#1A1A2E` | Heading text |
| `--text` | `#E6EDF3` | `#2D2D3A` | Body text |
| `--text-dim` | `#8B949E` | `#6B7280` | Muted/secondary text |
| `--danger` | `#EF4444` | `#EF4444` | SOS, alerts |

**Typography**: [Outfit](https://fonts.google.com/specimen/Outfit) (headings) + [Inter](https://fonts.google.com/specimen/Inter) (body)

---

## 🗂️ Campus Data

The campus data in `js/data.js` includes:

| Data | Count | Description |
|------|-------|-------------|
| Buildings | 20+ | Coords, type, floors, hours, departments, rooms, tags |
| Amenities | 15+ | Water coolers, washrooms, ATMs, chargers, security posts |
| Routes | 5 | Pre-computed paths with waypoints and turn instructions |
| Timetable | 6 entries | Day schedule with subjects, rooms, buildings |
| Emergency Contacts | 6 | Campus security, medical, fire, police, women's helpline |
| Chat Responses | 15+ | Intent-matched responses for common queries |
| Reviews | 4 buildings | Student ratings and feedback |

---

## 📱 Positioning Strategy

| Environment | Method | Accuracy |
|-------------|--------|----------|
| **Outdoor** | GPS (device native) | 3-10m |
| **Indoor Entrance** | QR Code scan | Room-level (exact) |
| **Indoor** | Wi-Fi fingerprinting (planned) | 5-15m |

---

## 🛣️ Roadmap

- [x] Interactive campus map with building markers
- [x] Smart search with fuzzy matching
- [x] Turn-by-turn navigation with animated routes
- [x] Timetable with navigate-to-class
- [x] SOS emergency system
- [x] AI chat assistant
- [x] Dark / Light mode
- [x] Android WebView wrapper
- [ ] Real-time GPS tracking during navigation
- [ ] Wi-Fi fingerprint indoor positioning
- [ ] Camera-based QR scanning (ZXing integration)
- [ ] Offline map tile caching (MBTiles)
- [ ] Push notifications for class reminders
- [ ] Crowd density heatmap
- [ ] Multi-language support (Hindi/English)

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| **UI** | HTML5, Vanilla CSS, JavaScript (ES Modules) |
| **Map** | [Leaflet.js](https://leafletjs.com/) 1.9.4 |
| **Tiles** | [CartoDB Basemaps](https://carto.com/basemaps/) (dark + light) |
| **Fonts** | [Google Fonts](https://fonts.google.com/) (Outfit, Inter) |
| **Android** | Kotlin, WebView, AndroidX, AGP 9.0 |
| **Pathfinding** | A* (planned), currently weighted graph |
| **Storage** | localStorage (preferences) |

---

## 👥 Team

Built for the **CSJMU Smart Campus Hackathon 2026**

---

## 📄 License

This project is built for educational and hackathon purposes at CSJMU, Kanpur.