import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supavaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_KEY;

export const supabase = createClient(supabaseUrl,supavaseAnonKey,{
    auth: {
        autoRefreshToken: true,
        storage: require('@react-native-async-storage/async-storage').default,
        debug: __DEV__,
    },

});
export default supabase;