const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

// Routes
const authRoutes = require('./routes/auth');
const projectRoutes = require('./routes/projects');
const voteRoutes = require('./routes/votes');
const adminRoutes = require('./routes/admin');
const userRoutes = require('./routes/users');


const app = express();

const apiLimiter = rateLimit({
  windowMs: process.env.RATE_LIMIT_WINDOW || 15 * 60 * 1000, // 15 minutes
  max: process.env.RATE_LIMIT_MAX || 100, // Limit each IP to 100 requests
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: "Too many requests, please try again later"
  }
});

app.use('/api/', apiLimiter);

// Middleware
app.use(cors());
app.use(express.json({ limit: '10kb' })); // Security: Limit JSON body size

// Database Connection (Updated for Mongoose 6+)
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('✅ MongoDB Connected'))
  .catch(err => console.error('❌ MongoDB Connection Error:', err));



// Route Handling
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/votes', voteRoutes);
app.use('/api/admin', adminRoutes);


// Health Check
app.get('/', (req, res) => res.send('Fund Allocation System API'));

// 404 Handler
app.use('*', (req, res) => res.status(404).json({ 
  success: false,
  error: 'Resource not found' 
}));

// Error Handling Middleware
app.use((err, req, res, next) => {
  console.error('🚨 Server Error:', err.stack);
  res.status(500).json({
    success: false,
    error: process.env.NODE_ENV === 'development' 
      ? err.message 
      : 'Internal server error'
  });
});

// Server Initialization
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running in ${process.env.NODE_ENV || 'development'} mode`);
  console.log(`🔗 http://localhost:${PORT}`);
});

// Add to server.js
console.log('JWT Secret:', process.env.JWT_SECRET);