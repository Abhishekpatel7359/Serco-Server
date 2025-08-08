process.env['NODE_TLS_REJECT_UNAUTHORIZED'] = '0';

const express = require("express");
const bodyParser = require("body-parser");
const crudRoutes = require("./Routes/CrudRoutes");
const authRoutes = require("./Routes/AuthRoute");
const PingRoutes = require("./Routes/PingRoute");
const { sendOtp } = require('./Services/NodeMailer');
const DeviceRoutes = require("./Routes/DevicesRoutes");
const fs = require('fs');
const https = require('https');
const SchedulerRoutes = require("./Routes/SchedulerRoute");
const { startTaskScheduler } = require("./Services/SchedulerService");
const cors = require('cors');
const { sendCustomMail } = require("./Services/SendCustomMail");
const authenticate = require("./Middleware/Auth");
// Add Scheduler Routes
const app = express();
const PORT = 3500;


// Enable CORS
// app.use(cors());


app.use(cors({
  origin: '*'
}));

app.use(express.static("public"));

// Middleware
app.use(express.json());




//SSL Certificate

const options = {
  key: fs.readFileSync('./aether_zu-elv_local_new.key'),
  cert: fs.readFileSync('./fullchain.pem')
}

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/crud", crudRoutes);
app.use("/api/ping", PingRoutes);
app.use("/api/Devices", DeviceRoutes);
app.use("/api/scheduler", SchedulerRoutes);
app.post('/api/send-otp', authenticate, async (req, res) => {
  const { email } = req.body;
  if (!email) {
    return res.status(400).send('Email is required');
  }

  try {
    const otp = await sendOtp(email);
    res.status(200).send(`OTP sent to ${email}: ${otp}`);
  } catch (error) {
    res.status(500).send('Failed to send OTP');
  }
});




app.post('/api/send-Html', authenticate, async (req, res) => {
  const { email, subject, htmlContent } = req.body;
  if (!email) {
    return res.status(400).send('Email is required');
  }

  try {
    const Mail = await sendCustomMail(email, subject, htmlContent);
    res.status(200).send(`Mail sent to ${email} `);
  } catch (error) {
    res.status(500).send('Failed to send OTP');
  }
});


// Start the scheduler
startTaskScheduler();

// Start Server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
// https.createServer(options, app).listen(PORT, '0.0.0.0', () => {
//   console.log(`Server running on https://0.0.0.0:${PORT}`);
// });

