import { supabase } from '../../supabaseConfig';

export const getUserProfile = async (userId) => {
    try{
        const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
        return data;
    }
    catch(error){
        return null;
    }
    
};
//need to add profile image upload here too
export const createUserProfile = async (profileData) => {
    try{
        const userId = profileData.uid || profileData.id;
        const {data: {user}} = await supabase.auth.getUser();
        const userEmail = profileData.email || user?.email;

        const supabaseProfileData = {
            id: userId,
            email: userEmail,
            name: profileData.name.trim(),
            age: parseInt(profileData.age),
            phone_number: profileData.phoneNumber?.trim() || null,
            profile_image_url: '',
            bio: profileData.bio?.trim() || '',
            primary_position: profileData.primaryPosition,
            secondary_position: profileData.secondaryPosition || null,
            experience_level: profileData.experienceLevel || 'beginner',
            location: profileData.location.trim(),
            location_lat: profileData.locationLat || null,
            location_lng: profileData.locationLng || null,
            preferred_courts: profileData.preferredCourts || [],
            is_profile_complete: true,
        };

        const { data, error } = await supabase.from('profiles').upsert(supabaseProfileData, {onConflict: 'id'}).select().single();
        if (error) {
            throw error;
        }
        return data;
    }
    catch (error){
        throw error;
    }
}

export const isProfileComplete = async (userId) => {
  try {
    if (!userId) {
      return false;
    }
    const profile = await getUserProfile(userId);
    const isComplete = profile?.is_profile_complete || false;
    return isComplete;
  } catch (error) {
    return false;
  }
};