import { supabase } from '../../supabaseConfig';

export const createEvent = async (eventData) => {
  try {
    const supabaseEventData = {
      title: eventData.title.trim(),
      description: eventData.description?.trim() || '',
      host_id: eventData.hostId,

      host_name: eventData.hostName,
      court_type: eventData.courtType,
      max_players: parseInt(eventData.maxPlayers),
      location_lat: eventData.location.latitude,
      location_lng: eventData.location.longitude,
      location_address: eventData.locationDetails?.address || '',
      location_name: eventData.locationDetails?.name || '',
      start_time: eventData.dateTime.startTime.toISOString(),
      end_time: eventData.dateTime.endTime.toISOString(),
      status: 'active',
      is_private: eventData.isPrivate,
    };
    

    
    const { data, error } = await supabase
      .from('events')
      .insert(supabaseEventData)
      .select()
      .single();


    if (error) throw error;

    // Add host as first approved player
    await supabase
      .from('event_players')

      .insert({
        event_id: data.id,
        user_id: eventData.hostId,
        status: 'approved'
      });
    
    return {
      ...data,
      location: {
        latitude: data.location_lat,
        longitude: data.location_lng
      },

      dateTime: {
        startTime: new Date(data.start_time),
        endTime: new Date(data.end_time)
      }
    };
  } catch (error) {

    throw new Error(`Failed to create event: ${error.message}`);
  }
};


export const getEventsInArea = async (center, radiusKm = 50) => {
  try {
    const { data, error } = await supabase
      .from('events')
      .select(`
        *,
        profiles!events_host_id_fkey(name, profile_image_url)
      `)
      .eq('status', 'active')
      .gte('start_time', new Date().toISOString())
      .order('start_time', { ascending: true });

    if (error) throw error;

    // Get player counts for each event
    const eventIds = data.map(e => e.id);
    const { data: playerCounts } = await supabase
      .from('event_players')
      .select('event_id, status')
      .in('event_id', eventIds);
    const approvedCounts = {};

    const waitlistCounts = {};
    playerCounts?.forEach(p => {
      if (p.status === 'approved') {
        approvedCounts[p.event_id] = (approvedCounts[p.event_id] || 0) + 1;
      } else if (p.status === 'waitlist') {
        waitlistCounts[p.event_id] = (waitlistCounts[p.event_id] || 0) + 1;
      }
    });
    return data.map(event => ({
      ...event,
      current_players: approvedCounts[event.id] || 0,
      waitlist_count: waitlistCounts[event.id] || 0,
      location: {
        latitude: event.location_lat,
        longitude: event.location_lng
      },
      dateTime: {
        startTime: new Date(event.start_time),
        endTime: new Date(event.end_time),
        date: new Date(event.start_time),
        startTimeString: new Date(event.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        endTimeString: new Date(event.end_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        dateString: new Date(event.start_time).toLocaleDateString('en-US', { 
          weekday: 'long', 
          year: 'numeric', 
          month: 'long', 
          day: 'numeric' 
        })
      },
      locationDetails: {
        address: event.location_address,
        name: event.location_name
      },
      host: event.profiles,
      createdAt: new Date(event.created_at),
      updatedAt: new Date(event.updated_at)
    }));
  } catch (error) {
    throw new Error(`Failed to fetch events: ${error.message}`);
  }
};






export const joinEventWaitlist = async (eventId, userId) => {
  try {
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
      throw new Error('You are already in this event');
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
        user_id: userId,
        status: initialStatus
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    throw new Error(`Failed to join event: ${error.message}`);
  }
};






export const leaveEvent = async (eventId, userId) => {
  try {
    const { data: event, error: fetchError } = await supabase
      .from('events')
      .select('host_id')
      .eq('id', eventId)
      .single();

    if (fetchError) throw fetchError;

    if (event.host_id === userId) {
      throw new Error('Hosts cannot leave their own event. Cancel it instead.');
    }

    const { error } = await supabase
      .from('event_players')
      .delete()
      .eq('event_id', eventId)
      .eq('user_id', userId);

    if (error) throw error;
    return true;
  } catch (error) {
    throw error;
  }


};





export const getPlayersByPosition = async (eventId) => {
  try {
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
        )`)
      .eq('event_id', eventId)
      .eq('status', 'approved')
      .order('joined_at', { ascending: true });

    if (error) throw error;

    const positionGroups = {
      'Setter': [],
      'Outside Hitter': [],
      'Middle Blocker': [],
      'Opposite': [],
      'Libero': [],

      'Defensive Specialist': [],
    };

    data?.forEach(p => {

      const position = p.position || p.profiles.primary_position;
      const player = {
        id: p.user_id,
        ...p.profiles,
        position,
      };

      if (positionGroups[position]) {
        positionGroups[position].push(player);


      }
    });

    return positionGroups;

  } catch (error) {
    throw new Error(`Failed to fetch players by position: ${error.message}`);
  }
};
export const updatePlayerPosition = async (eventId, playerId, newPosition, requesterId) => {
  try {
    const { data: event } = await supabase
      .from('events')
      .select('host_id')
      .eq('id', eventId)
      .single();

    const isHost = event?.host_id === requesterId;
    const isOwnPosition = playerId === requesterId;

    if (!isHost && !isOwnPosition) {
      throw new Error('You do not have permission to change this position');
    }

    const { error } = await supabase
      .from('event_players')
      .update({ position: newPosition })
      .eq('event_id', eventId)
      .eq('user_id', playerId);

    if (error) throw error;
    return true;
  } catch (error) {
    throw error;
  }
};





export const getEvent = async (eventId) => {
  try {
    const { data, error } = await supabase
      .from('events')
      .select(`
        *,
        profiles!events_host_id_fkey(name, profile_image_url)
      `)
      .eq('id', eventId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        throw new Error('Event not found');
      }
      throw error;
    }



    const { data: players } = await supabase
      .from('event_players')
      .select('user_id, status')
      .eq('event_id', eventId);

    const approved_players = players?.filter(p => p.status === 'approved').map(p => p.user_id) || [];
    const waitlist = players?.filter(p => p.status === 'waitlist').map(p => p.user_id) || [];


    return {
      ...data,

      approved_players,
      waitlist,
      current_players: approved_players.length,
      location: {
        latitude: data.location_lat,
        longitude: data.location_lng
      },
      dateTime: {

        startTime: new Date(data.start_time),
        endTime: new Date(data.end_time),
      },
      locationDetails: {
        address: data.location_address,
        name: data.location_name
      },


      host: data.profiles,
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at)
    };
  } catch (error) {
    throw new Error(`Failed to fetch event: ${error.message}`);
  }
};




export const getUserEvents = async (userId) => {


  try {
    const { data: hostedEvents, error: hostedError } = await supabase
      .from('events')
      .select(`*,profiles!events_host_id_fkey(name, profile_image_url)`)
      .eq('host_id', userId).order('start_time', { ascending: true });

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
        .select(`
          *,
          profiles!events_host_id_fkey(name, profile_image_url)
        `)
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
      .from('event_players').select('event_id, status')
      .in('event_id', allEventIds);

    const approvedCounts = {};
    const waitlistCounts = {};
    
    playerCounts?.forEach(p => {
      if (p.status === 'approved') {
        approvedCounts[p.event_id] = (approvedCounts[p.event_id] || 0) + 1;
      } else if (p.status === 'waitlist') {
        waitlistCounts[p.event_id] = (waitlistCounts[p.event_id] || 0) + 1;
      }
    });

    const formatEvent = (event) => ({
      ...event,
      current_players: approvedCounts[event.id] || 0,
      waitlist_count: waitlistCounts[event.id] || 0,
      location: {
        latitude: event.location_lat,
        longitude: event.location_lng
      },
      dateTime: {
        startTime: new Date(event.start_time),
        endTime: new Date(event.end_time),
      },
      locationDetails: {
        address: event.location_address,
        name: event.location_name
      },
      host: event.profiles,
      createdAt: new Date(event.created_at),
      updatedAt: new Date(event.updated_at)
    });

    return {
      hosted: hostedEvents.map(formatEvent),
      joined: joinedEvents.map(formatEvent)
    };
  } catch (error) {
    throw new Error(`Failed to fetch user events: ${error.message}`);
  }
};





export const cancelEvent = async (eventId, reason = '') => {
  try {
    const { error } = await supabase
      .from('events')
      .update({
        status: 'cancelled',
        cancellation_reason: reason,
      })
      .eq('id', eventId);

    if (error) throw error;
    return true;
  } catch (error) {
    throw new Error(`Failed to cancel event: ${error.message}`);
  }
};



export const removePlayer = async (eventId, userId) => {
 
    try {
    const { error } = await supabase
      .from('event_players')
      .delete()
      .eq('event_id', eventId)
      .eq('user_id', userId);

    if (error) throw error;
    return true;
  } catch (error) {
    throw new Error(`Failed to remove player: ${error.message}`);
  }
  
};



// @camden  add the screens for me to test this
export const getEventPlayers = async (eventId) => {
  
    try {
    const { data, error } = await supabase
      .from('event_players')
      .select(`
        *,
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
      .in('status', ['approved', 'waitlist'])
      .order('joined_at', { ascending: true });

    if (error) throw error;

    const approved = data
      ?.filter(p => p.status === 'approved')
      .map(p => ({
        id: p.user_id,
        ...p.profiles,
        joinedAt: new Date(p.joined_at),
        position: p.position || p.profiles.primary_position,
        team: p.team_id
      })) || [];

    const waitlist = data
      ?.filter(p => p.status === 'waitlist')
      .map(p => ({
        id: p.user_id,
        ...p.profiles,
        joinedAt: new Date(p.joined_at),
        position: p.position || p.profiles.primary_position,
        team: p.team_id
      })) || [];

    return { approved, waitlist };
  } catch (error) {
    throw new Error(`Failed to fetch players: ${error.message}`);
  }
};




export const approvePlayer = async (eventId, userId, hostId) => {


  try {
    const { data: event, error: eventError } = await supabase
      .from('events')
      .select('host_id, max_players')
      .eq('id', eventId)
      .single();

    if (eventError) throw eventError;
    if (event.host_id !== hostId) {
      throw new Error('Only the host can approve players');
    }

    const { count: approvedCount } = await supabase
      .from('event_players')
      .select('*', { count: 'exact', head: true })
      .eq('event_id', eventId)
      .eq('status', 'approved');

    if (approvedCount >= event.max_players) {
      throw new Error('Event is already at maximum capacity');
    }


    const { error } = await supabase
      .from('event_players')
      .update({ status: 'approved' })
      .eq('event_id', eventId)
      .eq('user_id', userId)
      .eq('status', 'waitlist');

    if (error) throw error;
    return true;
  } catch (error) {
    throw new Error(`Failed to approve player: ${error.message}`);
  }
};

export const rejectPlayer = async (eventId, userId, hostId) => {

  try {
    const { data: event, error: eventError } = await supabase
      .from('events')
      .select('host_id')
      .eq('id', eventId)
      .single();

    if (eventError) throw eventError;

    if (event.host_id !== hostId) {
      throw new Error('Only the host can reject players');
    }

    const { error } = await supabase
      .from('event_players')
      .delete()
      .eq('event_id', eventId)
      .eq('user_id', userId)
      .eq('status', 'waitlist');

    if (error) throw error;
    return true;
  } catch (error) {
    throw new Error(`Failed to reject player: ${error.message}`);
  }
};



export const getEventWaitlist = async (eventId) => {
try {


    const { data, error } = await supabase
      .from('event_players')
      .select(`*,profiles (
          id,
          name,
          profile_image_url,
          primary_position,
          experience_level)`).eq('event_id', eventId)
      .eq('status', 'waitlist')
      .order('joined_at', { ascending: true });

    if (error) throw error;

    return data?.map(p => ({
        
      id: p.user_id,
      ...p.profiles,
      joinedAt: new Date(p.joined_at)
    })) || [];
  } catch (error) {

    throw new Error(`Failed to fetch waitlist: ${error.message}`);
  }
};

