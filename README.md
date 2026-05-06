# ⛏️ MineGuard AI — Real-Time Rockfall Prediction System

![MineGuard Banner](https://img.shields.io/badge/MineGuard-AI-orange?style=for-the-badge&logo=data:image/svg+xml;base64,)
![React](https://img.shields.io/badge/React-18-blue?style=for-the-badge&logo=react)
![Node.js](https://img.shields.io/badge/Node.js-Express-green?style=for-the-badge&logo=node.js)
![Firebase](https://img.shields.io/badge/Firebase-Realtime-yellow?style=for-the-badge&logo=firebase)
![MongoDB](https://img.shields.io/badge/MongoDB-Database-green?style=for-the-badge&logo=mongodb)
![ESP32](https://img.shields.io/badge/ESP32-IoT-red?style=for-the-badge)

---

## 📌 Project Overview

**MineGuard AI** is a real-time rockfall prediction and monitoring system designed for open-pit mines. It uses IoT sensors connected to an ESP32 microcontroller to continuously monitor environmental conditions and predict the risk of rockfall events.

The system provides:
- 🔴 **Real-time risk alerts** with LED indicators
- 📊 **Live dashboard** with sensor data visualization
- 🗄️ **Historical data storage** in MongoDB
- 🔥 **Firebase real-time sync** to the dashboard
- 🛰️ **Satellite map** showing mine locations

---

## 🏗️ System Architecture

```
Physical Sensors (6 sensors)
        ↓
    ESP32 (WiFi)
        ↓  HTTP POST every 1s
  Bridge Server (Node.js)
        ↓              ↓
   Firebase RT DB    MongoDB
        ↓
  React Dashboard
```

---

## 🔧 Hardware Components

| Component | Purpose | Pin |
|-----------|---------|-----|
| ESP32 Dev Module | Main microcontroller | - |
| DHT11 | Temperature & Humidity | GPIO 4 |
| Soil Moisture Sensor | Soil wetness detection | GPIO 34 |
| Rain Sensor | Rainfall detection | GPIO 35 |
| Sound Sensor | Acoustic monitoring | GPIO 32 |
| MPU6050 | Tilt angle detection | I2C |
| ADXL345 | Vibration detection | I2C |
| RGB LED | Visual risk indicator | GPIO 25,26,27 |

---

## 💻 Tech Stack

### Frontend
- **React.js** — UI framework
- **Tailwind CSS** — Styling
- **React Leaflet** — Satellite map
- **Firebase SDK** — Real-time data listener
- **Vite** — Build tool

### Backend
- **Node.js** — Runtime
- **Express.js** — Web framework
- **Firebase Admin SDK** — Push data to Firebase
- **Mongoose** — MongoDB ODM

### Database
- **Firebase Realtime Database** — Live sensor data
- **MongoDB** — Historical data storage

### Hardware
- **Arduino IDE** — ESP32 programming
- **C++** — Arduino code

---

## 📁 Project Structure

```
mineguard-frontend/
├── backend/
│   ├── bridge-server.js      # Main backend server
│   ├── esp32-simulator.js    # Hardware simulator
│   ├── server.js             # API server
│   ├── serviceAccountKey.json # Firebase key (not in git)
│   └── package.json
├── src/
│   ├── components/
│   │   ├── AlertsPanel.jsx
│   │   ├── ControlBar.jsx
│   │   ├── EvacuationBar.jsx
│   │   ├── FingerprintPanel.jsx
│   │   ├── MapPanel.jsx
│   │   ├── RiskKpiRow.jsx
│   │   └── SensorTabs.jsx
│   ├── pages/
│   │   ├── DashboardPage.jsx  # Main dashboard
│   │   ├── AdminPage.jsx
│   │   ├── LandingPage.jsx
│   │   └── LoginPage.jsx
│   ├── firebase.js            # Firebase config
│   └── App.jsx
└── package.json
```

---

## 🚀 Getting Started

### Prerequisites
- Node.js v18+
- MongoDB (local)
- Firebase account
- Arduino IDE
- ESP32 board

---

### 1️⃣ Clone the Repository

```bash
git clone https://github.com/ArchanaSenthilkumar06/mineguard-frontend.git
cd mineguard-frontend
```

---

### 2️⃣ Setup Firebase

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Create a new project
3. Enable **Realtime Database**
4. Go to **Project Settings → Service Accounts**
5. Click **Generate new private key**
6. Save as `backend/serviceAccountKey.json`

---

### 3️⃣ Setup Frontend

```bash
npm install
```

Create `src/firebase.js`:
```javascript
import { initializeApp } from 'firebase/app';
import { getDatabase } from 'firebase/database';

const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT.firebaseapp.com",
  databaseURL: "https://YOUR_PROJECT-default-rtdb.firebaseio.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT.appspot.com",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID"
};

const app = initializeApp(firebaseConfig);
export const database = getDatabase(app);
```

---

### 4️⃣ Setup Backend

```bash
cd backend
npm install
```

---

### 5️⃣ Setup MongoDB

Make sure MongoDB is running:
```bash
# Windows
net start MongoDB
```

---

### 6️⃣ Run the Project

**Terminal 1 — Backend:**
```bash
cd backend
node bridge-server.js
```

**Terminal 2 — Frontend:**
```bash
npm run dev
```

**Terminal 3 — Simulator (without hardware):**
```bash
cd backend
node esp32-simulator.js
```

Open browser: `http://localhost:5173`

---

### 7️⃣ Setup ESP32 Hardware

1. Open `arduino/mineguard.ino` in Arduino IDE
2. Update WiFi credentials:
```cpp
const char* ssid = "YOUR_WIFI";
const char* password = "YOUR_PASSWORD";
```
3. Update server IP:
```cpp
const char* serverName = "http://YOUR_IP:5000/data";
```
4. Upload to ESP32
5. Open Serial Monitor at **115200 baud**

---

## 📊 Dashboard Features

| Feature | Description |
|---------|-------------|
| 🔥 Firebase Connected | Live Firebase connection status |
| 📊 MongoDB Connected | Database connection status |
| ⚠️ Risk Index | Overall rockfall risk (0.0 - 1.0) |
| 🌡️ Temperature | Real-time temperature |
| 💧 Soil Moisture | Soil wetness percentage |
| 🌧️ Rainfall | Rainfall detection |
| 🔊 Acoustic | Sound level in dB |
| 📐 Tilt Angle | Ground tilt in degrees |
| 📳 Vibration | Ground vibration in Hz |
| 🗺️ Mine Map | Satellite view of mine locations |
| 📡 Radar | Threat detection visualization |
| 🔴 LED Status | Red/Green alert indicators |
| 📋 History Table | Last 20 sensor readings |

---

## 🎯 Risk Classification

| Risk Index | Status | LED Color |
|-----------|--------|-----------|
| 0.0 - 0.3 | 🟢 SAFE | Green |
| 0.3 - 0.6 | 🟡 WARNING | Yellow |
| 0.6 - 1.0 | 🔴 DANGER | Red |

---

## ⚡ Data Flow Timing

| Step | Latency |
|------|---------|
| Sensor → ESP32 | ~10ms |
| ESP32 → Server | ~100-300ms |
| Server → Firebase | ~200-500ms |
| Firebase → Dashboard | ~50-100ms |
| **Total** | **~1-2 seconds** |

---

## 🔌 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/data` | Receive ESP32 sensor data |
| GET | `/health` | Server health check |
| GET | `/api/sensors/latest` | Latest sensor reading |
| GET | `/api/sensors/history` | Last 20 records |
| GET | `/api/sensors/stats` | Average/Max/Min stats |

---

## 📄 License

This project is licensed under the MIT License.

---

## 🙏 Acknowledgements

- [Firebase](https://firebase.google.com) — Real-time database
- [MongoDB](https://mongodb.com) — Historical storage
- [React Leaflet](https://react-leaflet.js.org) — Map visualization
- [Adafruit](https://adafruit.com) — Sensor libraries
- [ESP32](https://espressif.com) — IoT microcontroller

---

⭐ **Star this repo if you found it helpful!**
