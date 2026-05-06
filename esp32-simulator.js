// ============================================================
//  ESP32 SIMULATOR
//  Mimics your real ESP32 hardware sending sensor data
//  every 5 seconds to http://localhost:5000/data
//
//  Run this when you DON'T have the physical hardware.
//  When you DO have hardware, just turn this off.
// ============================================================

const SERVER_URL = 'http://localhost:5000/data';
let counter = 0;

function randomBetween(min, max) {
  return Math.random() * (max - min) + min;
}

function generateSensorData() {
  counter++;

  // Simulate realistic sensor fluctuations
  const baseTemp    = 34 + Math.sin(counter * 0.1) * 3;          // 31–37°C
  const baseHum     = 60 + Math.sin(counter * 0.07) * 10;        // 50–70%
  const soil        = Math.floor(randomBetween(1500, 3000));      // analog 0–4095
  const rain        = Math.floor(randomBetween(800, 2500));       // analog 0–4095
  const sound       = Math.floor(randomBetween(2000, 3800));      // analog 0–4095

  // MPU6050 accelerometer raw values (simulated tilt)
  const mpu_ax = Math.floor(randomBetween(-5000, 5000));
  const mpu_ay = Math.floor(randomBetween(-3000, 3000));
  const mpu_az = Math.floor(randomBetween(14000, 18000));         // gravity axis

  // ADXL345 accelerometer (m/s²)
  const adxl_x = parseFloat(randomBetween(-2.0, 2.0).toFixed(2));
  const adxl_y = parseFloat(randomBetween(-1.5, 1.5).toFixed(2));
  const adxl_z = parseFloat(randomBetween(8.5, 10.5).toFixed(2)); // ~9.8 m/s²

  // Every 10th reading → simulate a danger spike
  const isDanger = counter % 10 === 0;
  const dangerMultiplier = isDanger ? 3 : 1;

  return {
    temperature: parseFloat((baseTemp + randomBetween(-0.5, 0.5)).toFixed(1)),
    humidity:    parseFloat((baseHum  + randomBetween(-1, 1)).toFixed(1)),
    soil:        isDanger ? Math.floor(soil * 1.5) : soil,
    rain:        isDanger ? Math.floor(rain * 1.4) : rain,
    sound:       Math.floor(sound * dangerMultiplier),
    mpu_ax:      isDanger ? mpu_ax * 4 : mpu_ax,
    mpu_ay:      isDanger ? mpu_ay * 4 : mpu_ay,
    mpu_az,
    adxl_x:      isDanger ? adxl_x * 3 : adxl_x,
    adxl_y:      isDanger ? adxl_y * 3 : adxl_y,
    adxl_z
  };
}

async function sendData() {
  const data = generateSensorData();

  console.log(`\n[${new Date().toLocaleTimeString()}] 📤 Sending reading #${counter}...`);
  console.log(`   Temp: ${data.temperature}°C  Humidity: ${data.humidity}%`);
  console.log(`   Soil: ${data.soil}  Rain: ${data.rain}  Sound: ${data.sound}`);
  console.log(`   MPU6050: ax=${data.mpu_ax} ay=${data.mpu_ay} az=${data.mpu_az}`);
  console.log(`   ADXL345: x=${data.adxl_x} y=${data.adxl_y} z=${data.adxl_z}`);
  if (counter % 10 === 0) console.log('   ⚠️  DANGER SPIKE SIMULATED!');

  try {
    const res = await fetch(SERVER_URL, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(data)
    });

    if (res.ok) {
      const json = await res.json();
      console.log(`   ✅ Server responded: riskIndex=${json.riskIndex}  Firebase=${json.savedToFirebase}  MongoDB=${json.savedToMongoDB}`);
    } else {
      console.log(`   ❌ Server error: ${res.status}`);
    }
  } catch (err) {
    console.log(`   ❌ Could not reach server: ${err.message}`);
    console.log('   Make sure bridge-server.js is running first!');
  }
}

// ─── Start ───────────────────────────────────
console.log('╔══════════════════════════════════════╗');
console.log('║     ESP32 HARDWARE SIMULATOR         ║');
console.log('║  Sending fake data → localhost:5000  ║');
console.log('║  Press Ctrl+C to stop                ║');
console.log('╚══════════════════════════════════════╝\n');
console.log(`Target: ${SERVER_URL}`);
console.log('Sending every 5 seconds...\n');

sendData(); // first send immediately
setInterval(sendData, 5000);