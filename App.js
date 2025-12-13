import React, { useEffect, useState } from 'react';
import AuthScreen from './src/screens/AuthScreen';
import MainScreen from './src/screens/MainScreen';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import ProfileSetupScreen from './src/screens/ProfileSetupScreen';
import { ActivityIndicator, View } from 'react-native';
import { getUserProfile } from './src/services/profileService';
import CreateEventScreen from './src/screens/CreateEventScreen';
import EventDetailScreen from './src/screens/EventDetailScreen';
import WaitlistManagementScreen from './src/screens/WaitlistManagementScreen';
import { AuthProvider } from './src/context/AuthContext';
import { useAuth } from './src/context/AuthContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from './supabaseConfig';
const Stack = createStackNavigator();
 

const AppNavigator = () => {

    const { user, loading: authLoading, refreshSession } = useAuth();
    const [hasProfile, setHasProfile] = useState(false);
    const [profileLoading, setProfileLoading] = useState(false);
    const [checkingProfile, setCheckingProfile] = useState(false);

    useEffect(() => {
       
        const checkProfile = async () => {
            if (user && !authLoading) {
                setCheckingProfile(true);
                setProfileLoading(true);
                try {
                    const userId = user.id || user.uid;
                    const profile = await getUserProfile(userId);
                    const isComplete = profile?.is_profile_complete || false;
                    setHasProfile(isComplete);
                } catch (error) {
                    setHasProfile(false);
                } finally {
                    setProfileLoading(false);
                    setCheckingProfile(false);
                }
            }else if (!user && !authLoading) {
                setHasProfile(false);
                setProfileLoading(false);
                setCheckingProfile(false);
            }
        };

        checkProfile();
    },[user,authLoading]);

    const handleProfileComplete = async () => {
        setProfileLoading(true);
        
        try {
            const userId = user.id || user.uid;
            
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            const profile = await getUserProfile(userId);
            const isComplete = profile?.is_profile_complete || false;
            
            setHasProfile(isComplete);
            
            
        } catch (error) {
            console.error('Profile check error:', error.message);
        } finally {
            setProfileLoading(false);
        }
    };
    if (authLoading || profileLoading) {
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
            <ActivityIndicator size="large" color="#FB923C" />
            </View>
        );
    }
    //TODO ADD THE TABS
    //Grogan work on the map and aaron work on the profile screen
    return(

        <NavigationContainer>
            <Stack.Navigator screenOptions={{headerShown: false}}>
                {
                    !user ? (<Stack.Screen name = "Auth" component= {AuthScreen}/>) : !hasProfile ? 
                    (<Stack.Screen name ="ProfileSetup">
                        {(props)  => (
                        <ProfileSetupScreen {...props}  onProfileComplete= {handleProfileComplete}/>
                        )}
                    </Stack.Screen>  
                    ) :(
                    <>
                        <Stack.Screen name="Main" component={MainScreen} />
                        <Stack.Screen 
                            name="CreateEvent" 
                            component={CreateEventScreen}
                            options={{
                                headerShown: false,
                                presentation: 'modal',
                            }}
                        />
                        <Stack.Screen 
                            name="EventDetail" 
                            component={EventDetailScreen}
                            options={{
                                headerShown: false,
                            }}
                        />
                        <Stack.Screen 
                            name="WaitlistManagement" 
                            component={WaitlistManagementScreen}
                            options={{ headerShown: false }}
                        />
                    </>
                    )}
            </Stack.Navigator>
        </NavigationContainer>
    );
}

export default function App() {
  return <AuthProvider><AppNavigator /></AuthProvider>;
}