import { supabase } from '../../supabaseConfig';

export const getUserProfile = async (userId) => {
    try{
        const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', userId)
        .single();
        return data;
    }
    catch(error){
        return null;
    }
    
};