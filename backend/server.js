const express = require('express');
const cors = require('cors');
require('dotenv').config();

const authRoutes = require('./routes/auth');

const profileRoutes = require('./routes/profiles');
const eventRoutes = require('./routes/events');

const app = express();

//middleware
app.use(cors());
app.use(express.json());


app.use('/api/auth', authRoutes);
app.use('/api/profiles', profileRoutes);
app.use('/api/events', eventRoutes);
app.get('/api/health', (req, res) => {
  res.json({ success: true, message: 'OpenNet Custom API is running' });
});


app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ success: false, error: 'Something went wrong!' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {});