const express = require('express');
const router = express.Router();
const supabase = require('../config/database');
const { authenticateToken } = require('../middleware/auth');

//get events in area
router.get('/', async (req, res) => {

  try {


    const { data: events, error } = await supabase
      .from('events')
      .select(`*,
        profiles!events_host_id_fkey(name, profile_image_url)`)
      .eq('status', 'active')
      .gte('start_time', new Date().toISOString())
      .order('start_time', { ascending: true });

    if (error) throw error;


    const eventIds = events.map(e => e.id);
    const { data: playerCounts }= await supabase
      .from('event_players')
      .select('event_id, status')
      .in('event_id', eventIds);

    const approvedCounts ={};
    const waitlistCounts= {};
    
    playerCounts?.forEach(p => {
      if (p.status === 'approved') {
        approvedCounts[p.event_id] =(approvedCounts[p.event_id] || 0) + 1;
      } else if (p.status === 'waitlist') {
        waitlistCounts[p.event_id]= (waitlistCounts[p.event_id] || 0) + 1;
      }
    });

    const enrichedEvents = events.map(event => ({
      ...event,
      current_players:approvedCounts[event.id] || 0,
      waitlist_count: waitlistCounts[event.id] || 0,
      location:{
        latitude: event.location_lat,
        longitude:event.location_lng
      },
      dateTime: {
        startTime:new Date(event.start_time),
        endTime: new Date(event.end_time),
        date: new Date(event.start_time),
        startTimeString:new Date(event.start_time).toLocaleTimeString([], { 
          hour:'2-digit', minute: '2-digit' 
        }),
        endTimeString: new Date(event.end_time).toLocaleTimeString([], { 
          hour: '2-digit', minute:'2-digit' 
        }),
        dateString: new Date(event.start_time).toLocaleDateString('en-US',{ 
          weekday:'long', year: 'numeric', month: 'long', day:'numeric' 
        })
      },
      locationDetails:{
        address: event.location_address,
        name: event.location_name
      },
      host:event.profiles
    }));

    res.json({ success: true, data: enrichedEvents });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});



//create event

router.post('/', authenticateToken, async (req, res) => {
  try {
    const eventData = req.body;

    if (!eventData.title || eventData.title.trim().length < 3) {
      return res.status(400).json({ 
        success: false, 
        error:'Title must be at least 3 characters' 
      });
    }

    const supabaseEventData = {
      title: eventData.title.trim(),
      description:eventData.description?.trim() || '',
      host_id: eventData.hostId,
      host_name: eventData.hostName,
      court_type:eventData.courtType,
      max_players: parseInt(eventData.maxPlayers),
      location_lat:eventData.location.latitude,
      location_lng: eventData.location.longitude,
      location_address: eventData.locationDetails?.address || '',
      location_name:eventData.locationDetails?.name || '',
      start_time: eventData.dateTime.startTime,
      end_time: eventData.dateTime.endTime,
      status:'active',
      is_private: eventData.isPrivate,
    };

    const { data, error } = await supabase
      .from('events')
      .insert(supabaseEventData)
      .select()
      .single();

    if (error) throw error;

    await supabase
      .from('event_players')
      .insert({
        event_id:data.id,
        user_id: eventData.hostId,
        status: 'approved'
      });

    res.json({
      success: true,
      data:{
        ...data,
        location: {
          latitude:data.location_lat,
          longitude: data.location_lng
        },
        dateTime:{
          startTime: new Date(data.start_time),
          endTime:new Date(data.end_time)
        }
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

//get single event


router.get('/:eventId', async (req, res) => {
  try {
    const { eventId } = req.params;

    const { data, error } = await supabase
      .from('events')
      .select(`
        *,profiles!events_host_id_fkey(name, profile_image_url)`)
      .eq('id', eventId)
      .single();



    if (error) {
      if (error.code === 'PGRST116') {
        return res.status(404).json({ success: false, error:'Event not found' });
      }
      throw error;
    }

    const { data: players } = await supabase
      .from('event_players')
      .select('user_id, status')
      .eq('event_id', eventId);

    const approved_players = players?.filter(p => p.status === 'approved').map(p => p.user_id) || [];
    const waitlist= players?.filter(p => p.status === 'waitlist').map(p => p.user_id) || [];

    res.json({
      success: true,
      data: {
        ...data,
        approved_players,
        waitlist,
        current_players:approved_players.length,
        location: {
          latitude: data.location_lat,
          longitude:data.location_lng
        },
        dateTime:{
          startTime:new Date(data.start_time),
          endTime: new Date(data.end_time),
        },
        locationDetails: {
          address:data.location_address,
          name: data.location_name
        },
        host: data.profiles
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});



//event waitlist
router.post('/:eventId/join', authenticateToken, async (req, res) => {
  try {
    const { eventId } = req.params;
    const { userId }= req.body;

    const { data: event, error: eventError } = await supabase
      .from('events')
      .select('is_private, max_players, host_id')
      .eq('id', eventId)
      .single();

    if (eventError) throw eventError;

    const { data: existingPlayer } = await supabase
      .from('event_players')
      .select('status')
      .eq('event_id', eventId)
      .eq('user_id', userId)
      .single();

    if (existingPlayer) {
      return res.status(400).json({ 
        success: false, 
        error: 'You are already in this event' 
      });
    }




    const { count: approvedCount } = await supabase
      .from('event_players')
      .select('*', { count: 'exact', head: true })
      .eq('event_id', eventId)
      .eq('status', 'approved');

    let initialStatus;
    if (event.is_private) {
      initialStatus = 'waitlist';
    } else {
      initialStatus = approvedCount < event.max_players ? 'approved' : 'waitlist';
    }

    const { data, error } = await supabase

      .from('event_players')
      .insert({
        event_id: eventId,
        user_id:userId,
        status:initialStatus
      })
      .select()
      .single();

    if (error) throw error;

    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

    //Leave event
router.delete('/:eventId/leave', authenticateToken, async (req, res) => {
  try {
    const { eventId } = req.params;
    const { userId } = req.body;

    const { data: event, error: fetchError } = await supabase
      .from('events')
      .select('host_id')
      .eq('id', eventId)
      .single();

    if (fetchError) throw fetchError;


    if (event.host_id === userId) {
      return res.status(400).json({ 
        success: false, 
        error:'Hosts cannot leave their own event. Cancel it instead.' 
      });
    }



    const { error } = await supabase
      .from('event_players')
      .delete()
      .eq('event_id', eventId)
      .eq('user_id', userId);

    if (error) throw error;

    res.json({ success: true, data:{ message: 'Successfully left event' } });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});


// Get users events (hosted and joined)
router.get('/user/:userId', authenticateToken, async (req, res) => {
  try {
    const { userId } = req.params;

    const { data: hostedEvents, error: hostedError } = await supabase
      .from('events')

      .select(`*,profiles!events_host_id_fkey(name, profile_image_url)`)
      .eq('host_id', userId)
      .order('start_time', { ascending: true });

    if (hostedError) throw hostedError;




    const { data: playerRecords, error: playerError } = await supabase
      .from('event_players')
      .select('event_id')
      .eq('user_id', userId)
      .eq('status', 'approved');

    if (playerError) throw playerError;

    const joinedEventIds = playerRecords?.map(p => p.event_id) || [];

    let joinedEvents = [];
    if (joinedEventIds.length > 0) {
      const { data: joinedData, error: joinedError } = await supabase
        .from('events')
        .select(`*,profiles!events_host_id_fkey(name, profile_image_url)`)
        .in('id', joinedEventIds)
        .neq('host_id', userId)
        .order('start_time', { ascending: true });

      if (joinedError) throw joinedError;
      joinedEvents = joinedData || [];
    }

    const allEventIds = [
      ...hostedEvents.map(e => e.id),
      ...joinedEvents.map(e => e.id)
    ];

    const { data: playerCounts } = await supabase
      .from('event_players')
      .select('event_id, status')
      .in('event_id', allEventIds);

    const approvedCounts ={};
    const waitlistCounts= {};
    
    playerCounts?.forEach(p => {
      if (p.status === 'approved') {
        approvedCounts[p.event_id]= (approvedCounts[p.event_id] || 0) + 1;
      } else if (p.status === 'waitlist') {
        waitlistCounts[p.event_id] = (waitlistCounts[p.event_id] || 0) + 1;
      }
    });

    const formatEvent = (event) => ({
      ...event,
      current_players: approvedCounts[event.id] || 0,
      waitlist_count:waitlistCounts[event.id] || 0,
      location:{
        latitude: event.location_lat,
        longitude:event.location_lng
      },
      dateTime: {
        startTime:new Date(event.start_time),
        endTime: new Date(event.end_time),
      },
      locationDetails:{
        address: event.location_address,
        name:event.location_name
      },
      host: event.profiles
    });


    res.json({
      success: true,
      data:{
        hosted:hostedEvents.map(formatEvent),
        joined: joinedEvents.map(formatEvent)
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});




//get event players
router.get('/:eventId/players', authenticateToken, async (req, res) => {

  try {

    const { eventId } = req.params;

    const { data, error } = await supabase
      .from('event_players')
      .select(`*,profiles (
          id,
          name,
          profile_image_url,
          primary_position,
          secondary_position,
          experience_level)`)
      .eq('event_id', eventId)
      .in('status', ['approved', 'waitlist'])
      .order('joined_at', { ascending: true });

    if (error) throw error;



    const approved = data
      ?.filter(p => p.status === 'approved')
      .map(p => ({
        id:p.user_id,
        ...p.profiles,
        joinedAt: new Date(p.joined_at),
        position:p.position || p.profiles.primary_position,
        team: p.team_id
      })) || [];

    const waitlist = data
      ?.filter(p => p.status === 'waitlist')
      .map(p => ({
        id: p.user_id,
        ...p.profiles,
        joinedAt:new Date(p.joined_at),
        position: p.position || p.profiles.primary_position,
        team:p.team_id
      })) || [];

    res.json({ success: true, data:{ approved, waitlist } });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});
//get players by position
router.get('/:eventId/players/positions', authenticateToken, async (req, res) => {
  try {
    const { eventId } = req.params;

    const { data, error } = await supabase
      .from('event_players')
      .select(`
        user_id,
        position,
        profiles (
          id,
          name,
          profile_image_url,
          primary_position,
          secondary_position,
          experience_level
        )
      `)
      .eq('event_id', eventId)
      .eq('status', 'approved')
      .order('joined_at', { ascending: true });

    if (error) throw error;


    const positionGroups = {
      'Setter':[],
      'Outside Hitter': [],
      'Middle Blocker':[],
      'Opposite': [],
      'Libero': [],
      'Defensive Specialist':[],
    };

    data?.forEach(p => {
      const position = p.position || p.profiles.primary_position;
      const player ={
        id: p.user_id,
        ...p.profiles,
        position,
      };

      if (positionGroups[position]) {
        positionGroups[position].push(player);
      }
    });

    res.json({ success: true, data:positionGroups });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

//update player position
router.put('/:eventId/players/:playerId/position', authenticateToken, async (req, res) => {
  try {
    const { eventId, playerId } = req.params;
    const { newPosition, requesterId }= req.body;

    const { data: event } = await supabase
      .from('events')
      .select('host_id')
      .eq('id', eventId)
      .single();

    const isHost = event?.host_id === requesterId;
    const isOwnPosition= playerId === requesterId;

    if (!isHost && !isOwnPosition) {
      return res.status(403).json({ 
        success: false, 
        error:'You do not have permission to change this position' 
      });
    }



    const { error } = await supabase
      .from('event_players')
      .update({ position:newPosition })
      .eq('event_id', eventId)
      .eq('user_id', playerId);

    if (error) throw error;



    res.json({ success: true, data:{ message: 'Position updated successfully' } });
  } 
  catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});
router.get('/:eventId/waitlist', authenticateToken, async (req, res) => {
  try {
    const { eventId } = req.params;

    const { data, error } = await supabase
      .from('event_players')
      .select(`
        *,
        profiles (
          id,
          name,
          profile_image_url,
          primary_position,
          experience_level
        )
      `)
      .eq('event_id', eventId)
      .eq('status', 'waitlist')
      .order('joined_at', { ascending: true });

    if (error) throw error;

    const waitlist = data?.map(p => ({
      id:p.user_id,
      ...p.profiles,
      joinedAt: new Date(p.joined_at)
    })) || [];


    res.json({ success: true, data: waitlist });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});
//Approve player
router.post('/:eventId/approve', authenticateToken, async (req, res) => {
  try {
    const { eventId } = req.params;
    const { userId, hostId } = req.body;

    const { data: event, error: eventError } = await supabase
      .from('events')
      .select('host_id, max_players')
      .eq('id', eventId)
      .single();

    if (eventError) throw eventError;

    if (event.host_id !== hostId) {
      return res.status(403).json({ 
        success: false, 
        error: 'Only the host can approve players' 
      });
    }

    const { count: approvedCount } = await supabase
      .from('event_players')
      .select('*', { count: 'exact', head: true })
      .eq('event_id', eventId)
      .eq('status', 'approved');


    if (approvedCount >= event.max_players) {
      return res.status(400).json({ 
        success: false, 
        error:'Event is already at maximum capacity' 
      });
    }

    const { error } = await supabase
      .from('event_players')
      .update({ status:'approved' })
      .eq('event_id', eventId)
      .eq('user_id', userId)
      .eq('status', 'waitlist');

    if (error) throw error;

    res.json({ success: true, data: { message:'Player approved successfully' } });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});





// Reject player
router.post('/:eventId/reject', authenticateToken, async (req, res) => {
  try {
    const { eventId } = req.params;
    const { userId, hostId }= req.body;


    const { data: event, error: eventError } = await supabase
      .from('events')
      .select('host_id')
      .eq('id', eventId)
      .single();

    if (eventError) throw eventError;




    if (event.host_id !== hostId) {
      return res.status(403).json({ 
        success: false, 
        error: 'Only the host can reject players' 
      });
    }
    
    const { error } = await supabase
      .from('event_players')
      .delete()
      .eq('event_id', eventId)
      .eq('user_id', userId)
      .eq('status', 'waitlist');

    if (error) throw error;

    res.json({ success: true, data:{ message:'Player rejected successfully' } });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});


// Remove player (by host or self)
router.delete('/:eventId/players/:userId', authenticateToken, async (req, res) => {


  try {
    const { eventId, userId } = req.params;

    const { error } = await supabase
      .from('event_players')
      .delete()
      .eq('event_id', eventId)
      .eq('user_id', userId);

    if (error) throw error;


    res.json({ success: true, data: { message: 'Player removed successfully' } });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});



// Cancel event
router.put('/:eventId/cancel', authenticateToken, async (req, res) => {
  try {
    const { eventId } = req.params;
    const { reason } = req.body;

    const { error } = await supabase
      .from('events')
      .update({
        status:'cancelled',
        cancellation_reason: reason || ''
      })
      .eq('id', eventId);

    if (error) throw error;

    res.json({ success: true, data:{ message: 'Event cancelled successfully' } });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;