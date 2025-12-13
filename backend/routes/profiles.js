const express = require('express');
const router = express.Router();
const supabase = require('../config/database');
const { authenticateToken } = require('../middleware/auth');

// Get user profile
router.get('/:userId', authenticateToken, async (req, res) => {
  try {
    const { userId } = req.params;

    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error && error.code !== 'PGRST116') throw error;

    res.json({ success: true, data: data || null });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});
router.get('/:userId/complete', authenticateToken, async (req, res) => {
  try {
    const { userId } = req.params;

    const { data } = await supabase
      .from('profiles')
      .select('is_profile_complete')
      .eq('id', userId)
      .single();

    res.json({ 
      success: true, 
      data: { isComplete: data?.is_profile_complete || false } 
    });
  } catch (error) {
    res.json({ success: true, data: { isComplete: false } });
  }
});
// Create/Update user profile
router.post('/', authenticateToken, async (req, res) => {
  try {
    const profileData = req.body;
    const userId = profileData.uid || profileData.id;

    if (!userId || !profileData.name || !profileData.primaryPosition) {
      return res.status(400).json({ 
        success: false, 
        error: 'User ID, name, and primary position are required' 
      });
    }

    const supabaseProfileData = {
      id: userId,
      email: profileData.email,
      name: profileData.name.trim(),
      age: parseInt(profileData.age),
      phone_number: profileData.phoneNumber?.trim() || null,
      profile_image_url: profileData.profileImage || '',
      bio: profileData.bio?.trim() || '',
      primary_position: profileData.primaryPosition,
      secondary_position: profileData.secondaryPosition || null,
      experience_level: profileData.experienceLevel || 'beginner',
      location: profileData.location.trim(),
      location_lat: profileData.locationLat || null,
      location_lng: profileData.locationLng || null,
      preferred_courts: profileData.preferredCourts || [],
      is_profile_complete: true,
      updated_at: new Date().toISOString()
    };

    const { data, error } = await supabase
      .from('profiles')
      .upsert(supabaseProfileData, { onConflict: 'id' })
      .select()
      .single();

    if (error) throw error;

    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});


router.put('/:userId', authenticateToken, async (req,res) => {

  try {
    const { userId } = req.params;
    const updates = req.body;

    if (req.user.id !== userId) {
      return res.status(403).json({ 
        success: false, 
      });
    }

    const updateData = {
      updated_at: new Date().toISOString()
    };
    if (updates.name !== undefined) updateData.name = updates.name.trim();
    if (updates.age !== undefined) updateData.age = parseInt(updates.age);
    if (updates.phoneNumber !== undefined) updateData.phone_number = updates.phoneNumber.trim();
    if (updates.bio !== undefined) updateData.bio = updates.bio.trim();
    if (updates.primaryPosition !== undefined) updateData.primary_position = updates.primaryPosition;
    if (updates.secondaryPosition !== undefined) updateData.secondary_position = updates.secondaryPosition || null;
    if (updates.experienceLevel !== undefined) updateData.experience_level = updates.experienceLevel;
    if (updates.location !== undefined) updateData.location = updates.location.trim();
    if (updates.preferredCourts !== undefined) updateData.preferred_courts = updates.preferredCourts;

    const { data, error } = await supabase
      .from('profiles')
      .update(updateData)
      .eq('id', userId)
      .select()
      .single();



    if (error) throw error;

    res.json({ success: true, data });
  } catch (error) {res.status(500).json({success: false, error: error.message});
  }
});



module.exports = router;