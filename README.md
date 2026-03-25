<div align="center">

# 🖥️ CtrlAltDefeat

### *A Retro-Inspired Real-Time Multiplayer Quiz Battle Royale*

[![FastAPI](https://img.shields.io/badge/FastAPI-005571?style=for-the-badge&logo=fastapi)](https://fastapi.tiangolo.com/)
[![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://reactjs.org/)
[![Socket.io](https://img.shields.io/badge/Socket.io-010101?style=for-the-badge&logo=socket.io)](https://socket.io/)
[![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![Vite](https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev/)

---

**CtrlAltDefeat** is a fast-paced, eliminate-to-win trivia game. Players join a room, answer questions against a ticking clock, and survive the round to be the last one standing. Wrapped in a nostalgic Windows XP UI.

[**Explore the Backend**](./backend) • [**Explore the Frontend**](./frontend)

</div>

## ✨ Features

- 🕒 **Real-time Interaction:** Powered by Socket.io for instantaneous game updates and timer synchronization.
- 🎨 **Retro UI:** Styled with `xp.css` and Tailwind CSS for that classic "Blue Hill" 2000s desktop experience.
- 🎮 **Multiplayer Lobby:** Create or join rooms using unique 4-character codes.
- ⚡ **Fast Mode:** Automatic transitions when all alive players have answered.
- 💀 **Elimination Mechanics:** Get a question wrong? You're out. Survive until the end to claim victory!

## 🛠️ Tech Stack

### Backend
- **Framework:** FastAPI (Python)
- **Real-time:** Socket.io (python-socketio)
- **Server:** Uvicorn (ASGI)

### Frontend
- **Framework:** React 19 + Vite
- **Styling:** Tailwind CSS + xp.css
- **Icons:** Lucide React
- **Routing:** React Router 7

## 🚀 Getting Started

### Prerequisites
- Python 3.9+
- Node.js 18+

### 1. Setup Backend
```bash
cd backend
pip install fastapi socketio uvicorn
python server.py
```
*The server will start at `http://localhost:8000`*

### 2. Setup Frontend
```bash
cd frontend
npm install
npm run dev
```
*The app will be available at `http://localhost:5173`*

## 📁 Project Structure

```text
CtrlAltDefeat/
├── backend/            # FastAPI + Socket.io Server
│   ├── server.py       # Core game logic & socket events
│   ├── questions.json  # Trivia database
│   └── ...
├── frontend/           # React + Vite Client
│   ├── src/            # Components & Game views
│   ├── public/         # Static assets
│   └── ...
└── LICENSE             # MIT License
```

## 📝 License

Distributed under the MIT License. See `LICENSE` for more information.

---
<div align="center">
Built with 💙 by <a href="https://github.com/cmpdchtr">@cmpdchtr</a>
</div>
