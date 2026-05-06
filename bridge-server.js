// ============================================================
//  MINEGUARD BRIDGE SERVER
//  - Receives data from ESP32 (or simulator) on port 5000
//  - Pushes processed data to Firebase Realtime DB
//  - Saves history to MongoDB
//  - Serves dashboard API on same port
// ============================================================

const express = require('express');
const mongoose = require('mongoose');
const admin = require('firebase-admin');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

// ─────────────────────────────────────────────
// 1. MONGODB CONNECTION
// ─────────────────────────────────────────────
mongoose.connect('mongodb://127.0.0.1:27017/mineguard')
  .then(() => console.log('✅ MongoDB Connected!'))
  .catch(err => console.error('❌ MongoDB Error:', err.message));

const SensorSchema = new mongoose.Schema({
  riskIndex:        Number,
  dangerLevel:      Number,
  fingerprintMatch: Number,
  sensorsOnline:    Number,
  tilt:             Number,
  vibration:        Number,
  soilMoisture:     Number,
  rainfall:         Number,
  acoustic:         Number,
  temperature:      Number,
  humidity:         Number,
  gpsLat:           Number,
  gpsLng:           Number,
  ledRed:           Boolean,
  ledGreen:         Boolean,
  // raw ESP32 values
  rawSoil:  Number,
  rawRain:  Number,
  rawSound: Number,
  mpu_ax: Number, mpu_ay: Number, mpu_az: Number,
  adxl_x: Number, adxl_y: Number, adxl_z: Number,
  timestamp: { type: Date, default: Date.now }
}, { collection: 'sensordata' });

const SensorData = mongoose.model('SensorData', SensorSchema);

// ─────────────────────────────────────────────
// 2. FIREBASE ADMIN
//    Place your serviceAccountKey.json in the
//    same folder as this file.
// ─────────────────────────────────────────────
let firebaseReady = false;
let fbDB = null;

try {
  const serviceAccount = require('./serviceAccountKey.json.json');

  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: 'https://mineguard-ai-cb181-default-rtdb.firebaseio.com'
  });

  fbDB = admin.database();
  firebaseReady = true;
  console.log('✅ Firebase Admin ready!');

} catch (e) {
  console.error('❌ Firebase Error:', e.message);
  firebaseReady = false;
  fbDB = null;
}

// ─────────────────────────────────────────────
// 3. HELPER: process raw ESP32 values
// ─────────────────────────────────────────────
function processESP32(esp) {
  const tilt      = Math.sqrt(esp.mpu_ax ** 2 + esp.mpu_ay ** 2) / 1000;
  const vibration = parseFloat(
    Math.sqrt(esp.adxl_x ** 2 + esp.adxl_y ** 2 + esp.adxl_z ** 2).toFixed(2)
  );
  const soilMoisture = parseFloat((((4095 - esp.soil) / 4095) * 100).toFixed(1));
  const rainfall     = parseFloat((((4095 - esp.rain) / 4095) * 30).toFixed(1));
  const acoustic     = parseInt(40 + (esp.sound / 4095) * 60);

  // Weighted risk index (0 – 1)
  let risk = (tilt * 0.15) + (vibration * 0.20) +
             (soilMoisture * 0.0025) + (rainfall * 0.015) + (acoustic * 0.005);
  risk = parseFloat(Math.min(Math.max(risk / 10, 0), 1).toFixed(2));

  return {
    riskIndex:        risk,
    dangerLevel:      parseFloat((risk * 0.5).toFixed(2)),
    fingerprintMatch: Math.floor(85 + Math.random() * 13),
    sensorsOnline:    7,
    tilt:             parseFloat(tilt.toFixed(2)),
    vibration,
    soilMoisture,
    rainfall,
    acoustic,
    temperature: parseFloat(esp.temperature),
    humidity:    parseFloat(esp.humidity),
    gpsLat:  11.0168,
    gpsLng:  76.9558,
    ledRed:   risk > 0.6,
    ledGreen: risk <= 0.6
  };
}

// ─────────────────────────────────────────────
// 4. ESP32 DATA RECEIVER  →  POST /data
// ─────────────────────────────────────────────
app.post('/data', async (req, res) => {
  try {
    console.log('\n📡 ESP32 Data Received:', JSON.stringify(req.body));

    const processed = processESP32(req.body);

    // → Firebase
    if (fbDB) {
      await fbDB.ref('sensors/main').set(processed);
      console.log('🔥 Sent to Firebase!');
    }

    // → MongoDB
    const doc = new SensorData({
      ...processed,
      rawSoil: req.body.soil,   rawRain: req.body.rain,  rawSound: req.body.sound,
      mpu_ax:  req.body.mpu_ax, mpu_ay:  req.body.mpu_ay, mpu_az:  req.body.mpu_az,
      adxl_x:  req.body.adxl_x, adxl_y:  req.body.adxl_y, adxl_z:  req.body.adxl_z,
      timestamp: new Date()
    });
    await doc.save();
    console.log('📊 Saved to MongoDB!');
    console.log(`   Risk: ${processed.riskIndex}  Temp: ${processed.temperature}°C  LED: ${processed.ledRed ? '🔴' : '🟢'}`);

    res.json({ success: true, riskIndex: processed.riskIndex, savedToFirebase: firebaseReady, savedToMongoDB: true });
  } catch (err) {
    console.error('❌ /data error:', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ─────────────────────────────────────────────
// 5. DASHBOARD API ENDPOINTS
// ─────────────────────────────────────────────

// Health
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    mongodb:  mongoose.connection.readyState === 1 ? '✅ Connected' : '❌ Disconnected',
    firebase: firebaseReady ? '✅ Connected' : '⚠️ Key missing'
  });
});

// Latest record
app.get('/api/sensors/latest', async (req, res) => {
  try {
    const latest = await SensorData.findOne().sort({ timestamp: -1 });
    res.json(latest || { message: 'No data yet' });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// Also support /api/sensors (used by old dashboard code)
app.get('/api/sensors', async (req, res) => {
  try {
    const latest = await SensorData.findOne().sort({ timestamp: -1 });
    if (latest) {
      res.json({ ...latest._doc, mongoStatus: 'Online' });
    } else {
      res.json({ mongoStatus: 'Online', message: 'Empty' });
    }
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// History (last 20)
app.get('/api/sensors/history', async (req, res) => {
  try {
    const records      = await SensorData.find().sort({ timestamp: -1 }).limit(20);
    const totalRecords = await SensorData.countDocuments();
    const agg = await SensorData.aggregate([{ $group: { _id: null, avg: { $avg: '$riskIndex' } } }]);
    res.json({
      records,
      totalRecords,
      averageRisk: parseFloat((agg[0]?.avg || 0).toFixed(2))
    });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// Stats
app.get('/api/sensors/stats', async (req, res) => {
  try {
    const count = await SensorData.countDocuments();
    const agg   = await SensorData.aggregate([{
      $group: { _id: null,
        avgRisk: { $avg: '$riskIndex' }, avgTemp: { $avg: '$temperature' },
        maxRisk: { $max: '$riskIndex' }, minRisk: { $min: '$riskIndex' }
      }
    }]);
    const s = agg[0] || {};
    res.json({ totalRecords: count, averageRisk: s.avgRisk||0, averageTemp: s.avgTemp||0, maxRisk: s.maxRisk||0, minRisk: s.minRisk||0 });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.get('/', (req, res) => res.json({ message: '🚀 MineGuard Bridge Server LIVE!' }));

// ─────────────────────────────────────────────
// 6. START
// ─────────────────────────────────────────────
const PORT = 5000;
app.listen(PORT, '0.0.0.0', () => {
  console.log('\n========================================');
  console.log('🚀 MineGuard Bridge Server Started!');
  console.log('========================================');
  console.log(`📡 ESP32 endpoint  → POST http://0.0.0.0:${PORT}/data`);
  console.log(`🏥 Health          → http://localhost:${PORT}/health`);
  console.log(`📊 Latest          → http://localhost:${PORT}/api/sensors/latest`);
  console.log(`📈 History         → http://localhost:${PORT}/api/sensors/history`);
  console.log(`📉 Stats           → http://localhost:${PORT}/api/sensors/stats`);
  console.log('========================================\n');
});