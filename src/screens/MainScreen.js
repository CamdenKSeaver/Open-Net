import MapScreen from './MapScreen';
import ProfileScreen from './ProfileScreen';
import MyEventsScreen from './MyEventsScreen';
import SearchScreen from './SearchScreen';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { MaterialIcons } from '@expo/vector-icons';
import {useSafeAreaInsets } from 'react-native-safe-area-context';
const Tab = createBottomTabNavigator();

const MainScreen = () => {
    const insets = useSafeAreaInsets();
        return (
            <Tab.Navigator
                  screenOptions={({ route }) => ({tabBarIcon: ({ focused, color, size }) => {let iconName;

                  switch (route.name) {
                        case 'Map':
                          iconName = 'map';
                          break;
                        case 'MyEvents':
                            iconName = 'event';
                            break;
                        case 'Search':
                            iconName = 'search';
                            break;
                        case 'Profile':
                            iconName = 'person';
                            break;
                        default:
                            iconName = 'circle';
                      }

          return <MaterialIcons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#FB923C',
        tabBarInactiveTintColor: '#9CA3AF',
        tabBarStyle: {
          backgroundColor: '#FFFFFF',
          borderTopWidth: 1,
          borderTopColor: '#E5E7EB',
          paddingBottom: 5,
          paddingTop: 5,
          height: 60 + insets.bottom,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '500',
        },
        headerShown: false,
      })}
    >
      <Tab.Screen 
          name="Map" 
          component={MapScreen}
          options={{
              tabBarLabel: 'Map',
          }}
      />
      <Tab.Screen 
          name="MyEvents" 
          component={MyEventsScreen}
          options={{
              tabBarLabel: 'My Events',
          }}
      />
      <Tab.Screen 
          name="Search" 
          component={SearchScreen}
          options={{
              tabBarLabel: 'Search',
          }}
      />
      <Tab.Screen 
          name="Profile" 
          component={ProfileScreen}
          options={{
              tabBarLabel: 'Profile',
          }}
      />
    </Tab.Navigator>
  );
};




export default MainScreen;
