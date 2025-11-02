import React, { useEffect, useState } from 'react';
import AuthScreen from './src/screens/AuthScreen';
import MainScreen from './src/screens/MainScreen';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import ProfileSetupScreen from './src/screens/ProfileSetupScreen';
import { supabase } from './supabaseConfig';
import { ActivityIndicator, View } from 'react-native';
import { getUserProfile } from './src/services/profileService';
const Stack = createStackNavigator();
 

const AppNavigator = () => {

    const [user, setUser] = useState(null);
    const [hasProfile, setHasProfile] = useState(false);
    const [authLoading, setAuthLoading] = useState(true);
    const [profileLoading, setProfileLoading] = useState(false);


    useEffect(() => {
        checkUser();

        const { data: authListener } = supabase.auth.onAuthStateChange(
            async (event, session) => {
                console.log('Auth event:', event);
                
                if (session?.user) {
                    const normalizedUser = {
                        ...session.user,
                        uid: session.user.id,
                        displayName: session.user.user_metadata?.name,
                    };
                    setUser(normalizedUser);
                } else {
                    setUser(null);
                    setHasProfile(false);
                }
                
                setAuthLoading(false);
            }
        );

        return () => {
            authListener?.subscription?.unsubscribe();
        };
    }, []);

    const checkUser = async () => {
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (session?.user) {
                const normalizedUser = {
                    ...session.user,
                    uid: session.user.id,
                    displayName: session.user.user_metadata?.name,
                };
                setUser(normalizedUser);
            }
        } 
        catch (error) {
            throw error;
        } 
        finally {
            setAuthLoading(false);
        }
    };
    useEffect(() => {
        const checkProfile = async () => {
            if (user && !authLoading) {
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
                }
            }
        };

        checkProfile();
    },[user,authLoading]);

    const handleProfileComplete = () => {
        setHasProfile(true);
    };
    if (authLoading || profileLoading) {
        return (
            <View style={{ lex: 1,justifyContent: 'center', alignItems:'center',backgroundColor:'#F9FAFB' }}>
                <ActivityIndicator size="large"color = "#FB923C"/>
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
                        <Stack.Screen name="Main" component={MainScreen} />
                    )
                }
            </Stack.Navigator>
        </NavigationContainer>
    );
}

export default function App() {
  return <AppNavigator />;
}