import React, { useEffect, useState } from 'react';
import AuthScreen from './src/screens/AuthScreen';
import MainScreen from './src/screens/MainScreen';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import ProfileSetupScreen from './src/screens/ProfileSetupScreen';
const Stack = createStackNavigator();
 

const AppNavigator = () => {

    const [user, setUser] = useState(null);
    const [hasProfile, setHasProfile] = useState(false);
    const handleProfileComplete = () => {
        setHasProfile(true);
    };
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