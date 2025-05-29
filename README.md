# CS-174A-Computer-Graphics

- Assignment 1: Prepare Environment
- Assignment 2: Transformations
- Assignment 3: Shading
- Assignment 4: Texture
- Final Project: Sailing The Spectrum

# 🚀 Sailing The Spectrum – Deployment Guide

## 📦 Project Overview

**Project Title**: Sailing The Spectrum  
**Type**: Web-based 3D game built with WebGL  
**Language & Framework**: JavaScript + WebGL, powered by Tiny Graphics  
**Features**: Keyboard controls, real-time physics, dynamic lighting, textured models, background music, and scoring.

---

## 🗂️ Project Structure

```
Sailing-The-Spectrum/
├── index.html                 # 🟢 Entry point: HTML page that hosts the canvas and UI buttons
│   └── loadScript()          #    → Injects a <script type="module"> that loads main-scene.js
│       └── gameover()        #    → Called on collision with obstacle to end the game
│
├── main-scene.js             # 🎬 JS module that imports and registers the main scene
│   └── Sailing_The_Spectrum  #    ← Defined in sailing-the-spectrum.js
│   └── Canvas_Widget         #    → Creates and attaches WebGL canvas to DOM
│
├── sailing-the-spectrum.js   # 🎮 The main scene class that manages rendering and control
│   ├── Spectrum              #    → Renders background visual effects
│   ├── Rewards               #    → Generates falling objects with physics
│   ├── Boat                  #    → Draws and animates the controllable sailboat
│   └── Game                  #    → Handles score, collision, and game state
│
├── reward.js                 # 💎 Defines randomly falling reward/obstacle objects
│
├── boat.js                   # ⛵ Defines boat shape, motion, and collision response
│
├── spectrum.js               # 🌈 Renders animated RGB spectrum background + lighting
│
├── game.js                   # 🧠 Handles game logic: scoring, text display, collision detection
│
├── styles.css                # 🎨 Styles for UI elements (buttons, text, background)
│
├── server.py                 # 🌐 Local HTTP server (Python), required for module loading
├── host.bat                  # ⚡ One-click launch for Windows (runs `python server.py`)
├── host.command              # ⚡ One-click launch for macOS/Linux (runs `python3 server.py`)
│
├── examples/                 # 📚 Contains Tiny Graphics framework (common.js, shaders, loaders)
│
└── assets/                   # 🖼️ Models, textures, audio
    ├── *.obj                 #    → 3D models: sailboat, diamond, coin, etc.
    ├── *.png / *.jpg         #    → Textures for background, text, shapes
    └── bgm.mp3               #    → Background music
``` 

---

## ⚙️ Setup Requirements

- Modern browser (Chrome, Edge, Firefox)
- Python 2.x or 3.x
- Tiny Graphics is already included in the `examples/` folder

---

## 🚀 How to Run

### 🟦 Windows

- **Double-click `host.bat`**
- Then open [http://localhost:8000](http://localhost:8000)

### 🍎 macOS / Linux

- **Double-click `host.command`**
- Then open [http://localhost:8000](http://localhost:8000)

--- 

## 🕹️ Game Instructions

- After launching the site, click the "GO" button to start the game

- Control the boat using:

  - ← / → to move left/right

  - ↑ / ↓ to increase/decrease falling speed of rewards

  - M to toggle background music

  - R to restart the game

- Earn points by collecting different rewards:

  - 🟡 Coin: +5 points

  - 💎 Diamond: +10 points

  - 🟠 Donut: +1 point

  - ⚽ Ball: +2 points

- Avoid hitting the obstacle – it ends the game!

---

### 📌 Useful Tips
- Game starts when Canvas_Widget is loaded inside #main-canvas div

- All rendering happens in sailing-the-spectrum.js

- Game ends and score is displayed via gameover() in index.html
