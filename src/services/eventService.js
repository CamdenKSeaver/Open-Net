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


