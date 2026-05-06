const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');

const app = express();
app.use(cors());
app.use(express.json());

// 1. CONNECT TO LOCAL MONGODB COMPASS
const MONGO_URI = 'mongodb://127.0.0.1:27017/mineguard';

mongoose.connect(MONGO_URI)
  .then(() => console.log('✅ Connected to LOCAL MongoDB Compass'))
  .catch((err) => {
    console.error('❌ MongoDB Connection Error:');
    console.error(err.message);
  });

// 2. SCHEMA
const sensorSchema = new mongoose.Schema({
  riskIndex: Number,
  dangerLevel: Number,
  fingerprintMatch: Number,
  sensorsOnline: Number,
  tilt: Number,
  vibration: Number,
  soilMoisture: Number,
  rainfall: Number,
  acoustic: Number,
  temperature: Number,
  gpsLat: Number,
  gpsLng: Number,
  ledRed: Boolean,
  ledGreen: Boolean,
  timestamp: { type: String, default: () => new Date().toISOString() }
});

const SensorData = mongoose.model('SensorData', sensorSchema, 'sensordata');

// 3. GET LATEST SENSOR DATA
app.get('/api/sensors', async (req, res) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      return res.status(500).json({ mongoStatus: 'Offline', error: 'Database not connected' });
    }

    const latestData = await SensorData.findOne().sort({ _id: -1 });

    if (latestData) {
      res.json({ ...latestData._doc, mongoStatus: 'Online' });
    } else {
      res.json({ mongoStatus: 'Online', message: 'Database connected but empty' });
    }
  } catch (error) {
    res.status(500).json({ mongoStatus: 'Offline', error: error.message });
  }
});

// 4. ✅ GET HISTORY + STATS (This was MISSING — fixes MongoDB Offline badge)
app.get('/api/sensors/history', async (req, res) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      return res.status(500).json({ error: 'Database not connected' });
    }

    const records = await SensorData.find().sort({ _id: -1 }).limit(20);
    const totalRecords = await SensorData.countDocuments();

    const avgResult = await SensorData.aggregate([
      { $group: { _id: null, avg: { $avg: '$riskIndex' } } }
    ]);

    res.json({
      records,
      totalRecords,
      averageRisk: avgResult[0]?.avg || 0,
      mongoStatus: 'Online'
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 5. MONGO CONNECTION STATUS CHECK
app.get('/api/status', (req, res) => {
  const state = mongoose.connection.readyState;
  const statusMap = { 0: 'Disconnected', 1: 'Online', 2: 'Connecting', 3: 'Disconnecting' };
  res.json({ mongoStatus: statusMap[state] || 'Unknown' });
});

// 6. SAVE NEW SENSOR DATA (For ESP32 or Testing)
app.post('/api/update-sensors', async (req, res) => {
  try {
    const newData = new SensorData(req.body);
    await newData.save();
    res.status(201).json({ message: 'Data saved to MongoDB!' });
  } catch (error) {
    res.status(400).json({ error: 'Failed to save data' });
  }
});

app.get('/', (req, res) => {
  res.json({ message: '🚀 MINEGUARD Backend LIVE!' });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`🚀 Backend LIVE: http://localhost:${PORT}`);
  console.log(`📡 Sensor API:   http://localhost:${PORT}/api/sensors`);
  console.log(`📊 History API:  http://localhost:${PORT}/api/sensors/history`);
  console.log(`🔌 Status API:   http://localhost:${PORT}/api/status`);
});