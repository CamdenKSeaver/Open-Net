const express = require('express');
const router = express.Router();
const supabase = require('../config/database');
const jwt = require('jsonwebtoken');
router.post('/signup', async (req, res) => {
  try {
    const { email, password, name } = req.body;

    if (!email || !password || !name) {
      return res.status(400).json({ 
        success: false, 
        error: 'Email, password, and name are required' 
      });
    }

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { name }
      }
    });

    if (error) throw error;

    const token = jwt.sign(
      { id: data.user.id, email: data.user.email },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      success: true,
      data: {
        user: {
          id: data.user.id,
          uid: data.user.id,
          email: data.user.email,
          displayName: name
        },
        token
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});




//Sign In
router.post('/signin', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ 
        success: false, 
        error: 'Email and password are required' 
        
      });
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (error) throw error;

    const token = jwt.sign(
      { id: data.user.id, email: data.user.email },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      success: true,
      data: {
        user: {
          id: data.user.id,
          uid: data.user.id,
          email: data.user.email,
          displayName: data.user.user_metadata?.name
        },
        token
      }
    });
  } catch (error) {
    res.status(401).json({ success: false, error: error.message });
  }
});

module.exports = router;