import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  Text,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Dimensions,
  ScrollView,
  Animated,
} from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import * as Location from 'expo-location';
import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import { getEventsInArea, joinEventWaitlist, leaveEvent } from '../services/eventService';

const { width, height } = Dimensions.get('window');

const MapScreen = () => {
  const navigation = useNavigation();
  const { user } = useAuth();
  const [location, setLocation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);
  const [events, setEvents] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const mapRef = useRef(null);
  const slideAnim = useRef(new Animated.Value(400)).current;

  useFocusEffect(
    React.useCallback(() => {
      fetchEvents();
    }, [location])
  );

  useEffect(() => {
    getCurrentLocation();
  }, []);





const getCurrentLocation = async () => {
    try {

      let { status } = await Location.requestForegroundPermissionsAsync();
      
      if (status !== 'granted') {
        setLoading(false);
        return;
      }

      let currentLocation = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });
    


      setLocation(currentLocation);
      
      await fetchEvents(currentLocation.coords);
      
    } catch (error) {
    } finally {
      setLoading(false);
    }
  };






  const fetchEvents = async (coords = location?.coords) => {
    if (!coords) return;

    try {
      setRefreshing(true);
      setErrorMsg(null);
      
      const center = {
        latitude: coords.latitude,
        longitude: coords.longitude

      };
      
      const nearbyEvents = await getEventsInArea(center, 50);
      setEvents(nearbyEvents);
    } catch (error) {
      console.log('Failed to load events:', error);
    } finally {
      setRefreshing(false);

    }
  };
  const handleRefresh = () => {
    fetchEvents();
  };




  const handleMyLocationPress = () => {
    if (location && mapRef.current) {
      mapRef.current.animateToRegion({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        latitudeDelta: 0.01,


        longitudeDelta: 0.01,
      }, 1000);
    }
  };

  const getMarkerColor = (courtType) => {
    const colors = {
      'beach': '#FFB800',
      'indoor':'#FB923C',
      'grass': '#10B981',
    };
    return colors[courtType] || '#6366F1';
  };

  const getCourtIcon = (courtType) => {
    const icons = {
      'beach': 'beach-access',
      'indoor':'home',

      'grass': 'grass',
    };
    return icons[courtType] || 'sports-volleyball';
  };

  const handleMarkerPress = (event) => {
    setSelectedEvent(event);
    
    Animated.spring(slideAnim, {
      toValue: 0,
      useNativeDriver: true,
      tension: 50,
      friction: 8,


    }).start();

    if (mapRef.current) {
      mapRef.current.animateToRegion({

        latitude: event.location.latitude,
        longitude: event.location.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      }, 500);
    }
  };




  const handleCloseCard = () => {
    Animated.timing(slideAnim, {
      toValue: 400,
      duration: 250,
      useNativeDriver: true,
    }).start(() => {
      setSelectedEvent(null);
    });
  };
  const handleCreateEvent = () => {
    navigation.navigate('CreateEvent');
  };
  const handleJoinEvent = async (event) => {
    try {
      setRefreshing(true);
      
      if (event.is_private) {
        Alert.alert(
          'Join Waitlist',
          'This is an invite-only event. You will be added to the waitlist and the host will review your request.',
          [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'Join Waitlist',
              onPress: async () => {
                try {
                  await joinEventWaitlist(event.id, user.id);
                  Alert.alert('Success', 'You have been added to the waitlist. The host will review your request.');
                  await fetchEvents();
                  handleCloseCard();
                } catch (error) {
                  Alert.alert('Error', error.message);
                }
              }
            }
          ]
        );


      } else {
        await joinEventWaitlist(event.id, user.id);
        
        const isFull = event.current_players >= event.max_players;
        if (isFull) {

          Alert.alert('Joined Waitlist', 'Event is full. You have been added to the waitlist.');
        } else {

          Alert.alert('Success', 'You have joined the event!');
        }
        
        await fetchEvents();
        handleCloseCard();
      }
    } catch (error) {

      Alert.alert('Error', error.message || 'Failed to join event');
    } finally {
      setRefreshing(false);
    }
  };





  const handleLeaveEvent = async (event) => {
    Alert.alert(
      'Leave Event',
      `Are you sure you want to leave "${event.title}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text:'Leave', 

          style: 'destructive',
          onPress: async () => {
            try {
              setRefreshing(true);
              await leaveEvent(event.id, user.id);
              Alert.alert(
                'Left Event',
                `You've successfully left "${event.title}".`,
                [{ text:'OK', onPress: () => {
                  handleCloseCard();
                  fetchEvents();
                }}]
              );
            } catch (error) {
              Alert.alert('Error',error.message ||'Failed to leave event. Please try again.');
            } finally {
              setRefreshing(false);
            }


          }
        }
      ]
    );
  };

  const handleManageEvent = (event) => {
    Alert.alert(
      'Manage Event',

      'What would you like to do?',
      [
        { text: 'Cancel', style: 'cancel' },


        { 
          text: 'View Details', 
          onPress: () => {
            navigation.navigate('EventDetail', { eventId: event.id });
          }
        },
        { 
          text: 'Cancel Event', 
          style: 'destructive',
          onPress: () => {
            navigation.navigate('EventDetail', { eventId: event.id });
          }
        }
      ]

    );
  };





  const formatEventStatus = (event) => {
    const isHost = event.host_id === user?.id;
    const isJoined = event.approved_players?.includes(user?.id);
    const isWaitlisted =event.waitlist?.includes(user?.id);
    const isFull =event.current_players >= event.max_players;
    
    if (isHost) return { text: 'You are hosting', icon: 'star', color: '#FB923C' };
    if (isJoined) return { text: 'You joined', icon: 'check-circle', color: '#10B981' };
    if (isWaitlisted) return { text: 'On waitlist', icon: 'schedule', color: '#F59E0B' };
    if (isFull) return { text: 'Full', icon: 'block', color: '#EF4444' };
    
    return { text: 'Available', icon: 'sports-volleyball', color: '#6366F1' };
  };

  if (loading) {
    return (
      <View style = {styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FB923C" />
        <Text style = {styles.loadingText}>Getting your location...</Text>
      </View>
    );
  }

  if (errorMsg) {
    return (
      <View style ={styles.errorContainer}>
        <MaterialIcons name="location-off" size={64} color="#EF4444" />
        <Text style={styles.errorTitle}>Location Required</Text>
        <Text style={styles.errorText}>{errorMsg}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={getCurrentLocation}>
          <MaterialIcons name="refresh" size={20} color="#FFFFFF" />
          <Text style={styles.retryButtonText}>Try Again</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        style={styles.map}
        provider={PROVIDER_GOOGLE}
        initialRegion={{
          latitude: location?.coords.latitude || 37.78825,
          longitude: location?.coords.longitude || -122.4324,
          latitudeDelta: 0.0922,
          longitudeDelta: 0.0421,
        }}
        showsUserLocation={true}
        showsMyLocationButton={false}
        loadingEnabled={true}
      >
        {events.map((event) => (
          <Marker
            key={event.id}
            coordinate={{
              latitude: event.location.latitude,
              longitude: event.location.longitude,
            }}
            onPress={() => handleMarkerPress(event)}
          >
            <View style ={styles.markerContainer}>
              <View style ={[
                styles.customMarker,
                { backgroundColor: getMarkerColor(event.court_type) }
              ]}>
                <MaterialIcons 
                  name="sports-volleyball" 
                  size={20} 
                  color="#FFFFFF" 
                />
                {event.is_private && (
                  <View style ={styles.privateBadge}>
                    <MaterialIcons name="lock" size={10} color="#FFFFFF" />
                  </View>
                )}
              </View>
            </View>
          </Marker>
        ))}
      </MapView>

      <View style={styles.controlsContainer}>
        <TouchableOpacity 
          style={styles.myLocationButton}
          onPress={handleMyLocationPress}
          disabled={!location}
        >
          <MaterialIcons 
            name="my-location" 
            size={24} 
            color={location ? "#FFFFFF" : "#9CA3AF"} 
          />
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.myLocationButton, { marginTop: 12 }]}
          onPress={handleRefresh}
          disabled={refreshing || !location}
        >
          {refreshing ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <MaterialIcons 
              name="refresh" 
              size={24} 
              color={location ? "#FFFFFF" : "#9CA3AF"} 
            />
          )}
        </TouchableOpacity>
      </View>

      <View style ={styles.counterContainer}>
        <Text style={styles.counterText}>
          {events.length} event{events.length !== 1 ? 's' : ''} nearby
        </Text>
        <MaterialIcons name="sports-volleyball" size={16} color="#FB923C" />
      </View>

      <TouchableOpacity 
        style={styles.createButton}
        onPress={handleCreateEvent}
      >
        <MaterialIcons name="add" size={24} color="#FFFFFF" />
        <Text style ={styles.createButtonText}>Create Event</Text>
      </TouchableOpacity>

      {selectedEvent && (
        <Animated.View 
          style={[
            styles.eventCard,
            {
              transform: [{ translateY: slideAnim }]
            }
          ]}
        >
          <ScrollView 
            showsVerticalScrollIndicator={false}
            style={styles.cardScrollView}
          >
            <View style ={styles.cardHeader}>
              <View style={styles.cardHeaderTop}>
                <Text style={styles.cardTitle}>{selectedEvent.title}</Text>
                <TouchableOpacity onPress={handleCloseCard} style ={styles.closeButton}>
                  <MaterialIcons name="close" size={24} color="#6B7280" />
                </TouchableOpacity>
              </View>
              
              {(() => {
                const status = formatEventStatus(selectedEvent);
                return (
                  <View style ={[styles.statusBadge, { backgroundColor: status.color }]}>
                    <MaterialIcons name={status.icon} size={14} color="#FFFFFF" />
                    <Text style ={styles.statusText}>{status.text}</Text>
                  </View>
                );
              })()}
            </View>

            <View style={styles.cardInfoRow}>
              {selectedEvent.is_private && (
                <View style ={[styles.infoChip, styles.privateChip]}>
                  <MaterialIcons name="lock" size={16} color="#FB923C" />
                  <Text style ={[styles.infoChipText, styles.privateChipText]}>Invite Only</Text>
                </View>
              )}
              <View style={styles.infoChip}>
                <MaterialIcons 
                  name={getCourtIcon(selectedEvent.court_type)} 
                  size={18} 
                  color={getMarkerColor(selectedEvent.court_type)} 
                />
                <Text style={styles.infoChipText}>
                  {selectedEvent.court_type?.charAt(0).toUpperCase() + selectedEvent.court_type?.slice(1)}
                </Text>
              </View>

              <View style ={styles.infoChip}>
                <MaterialIcons name="people" size={18} color="#6B7280" />
                <Text style ={styles.infoChipText}>
                  {selectedEvent.current_players}/{selectedEvent.max_players} Players
                </Text>
              </View>
            </View>

            <View style = {styles.cardSection}>
              <View style = {styles.cardSectionRow}>
                <MaterialIcons name="event" size={20} color="#FB923C" />
                <Text style={styles.cardSectionText}>
                  {selectedEvent.dateTime?.dateString || 'Date TBD'}
                </Text>
              </View>
              <View style = {styles.cardSectionRow}>
                <MaterialIcons name="schedule" size={20} color="#FB923C" />
                <Text style = {styles.cardSectionText}>
                  {selectedEvent.dateTime?.startTimeString} - {selectedEvent.dateTime?.endTimeString}
                </Text>
              </View>
            </View>

            {selectedEvent.location_address && (
              <View style = {styles.cardSection}>
                <View style = {styles.cardSectionRow}>
                  <MaterialIcons name="location-on" size={20} color="#FB923C" />
                  <Text style={styles.cardSectionText}>
                    {selectedEvent.location_address}
                  </Text>
                </View>
              </View>
            )}

            {selectedEvent.description && (
              <View style={styles.cardSection}>
                <Text style={styles.cardSectionLabel}>About</Text>
                <Text style = {styles.cardDescription}>{selectedEvent.description}</Text>
              </View>
            )}

            <View style= {styles.cardSection}>
              <Text style = {styles.cardSectionLabel}>Host</Text>
              <View style = {styles.hostInfo}>
                <View style = {styles.hostAvatar}>
                  <MaterialIcons name="person" size={20} color="#FB923C" />
                </View>
                <Text style = {styles.hostName}>{selectedEvent.host_name}</Text>
              </View>
            </View>

            <View style = {styles.cardActions}>
              {selectedEvent.host_id === user?.id ? (
                <TouchableOpacity 
                  style = {[styles.actionButton, styles.primaryButton]}
                  onPress={() => handleManageEvent(selectedEvent)}
                >
                  <MaterialIcons name="settings" size={20} color="#FFFFFF" />
                  <Text style = {styles.primaryButtonText}>Manage Event</Text>
                </TouchableOpacity>
              ) : selectedEvent.approved_players?.includes(user?.id) ? (
                <TouchableOpacity 
                  style= {[styles.actionButton, styles.secondaryButton]}
                  onPress={() => handleLeaveEvent(selectedEvent)}
                  disabled={refreshing}
                >
                  {refreshing ? (
                    <ActivityIndicator size="small" color="#EF4444" />
                  ) : (
                    <>
                      <MaterialIcons name="exit-to-app" size={20} color="#EF4444" />
                      <Text style= {styles.secondaryButtonText}>Leave Event</Text>
                    </>
                  )}
                </TouchableOpacity>
              ) : selectedEvent.waitlist?.includes(user?.id) ? (
                <TouchableOpacity 
                  style={[styles.actionButton, styles.secondaryButton]}
                  onPress={() => handleLeaveEvent(selectedEvent)}
                  disabled={refreshing}
                >
                  {refreshing ? (
                    <ActivityIndicator size="small" color="#EF4444" />
                  ) : (
                    <>
                      <MaterialIcons name="remove-circle-outline" size={20} color="#EF4444" />
                      <Text style = {styles.secondaryButtonText}>Leave Waitlist</Text>
                    </>
                  )}
                </TouchableOpacity>
              ) : selectedEvent.current_players >= selectedEvent.max_players ? (
                <TouchableOpacity 
                  style = {[styles.actionButton, styles.disabledButton]}
                  disabled
                >
                  <MaterialIcons name="block" size={20} color="#9CA3AF" />
                  <Text style = {styles.disabledButtonText}>Event Full</Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity 
                  style = {[styles.actionButton, styles.primaryButton]}
                  onPress={() => handleJoinEvent(selectedEvent)}
                  disabled={refreshing}
                >
                  {refreshing ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <>
                      <MaterialIcons name="add" size={20} color="#FFFFFF" />
                      <Text style = {styles.primaryButtonText}>
                        {selectedEvent.is_private ? 'Request to Join' : 'Join'}
                      </Text>
                    </>
                  )}
                </TouchableOpacity>
              )}
            </View>
          </ScrollView>
        </Animated.View>
      )}

      {!loading && !refreshing && !errorMsg && events.length === 0 && (
        <View style = {styles.emptyState}>
          <MaterialIcons name="sports-volleyball" size={48} color="#9CA3AF" />
          <Text style={styles.emptyStateTitle}>No Events Nearby</Text>
          <Text style= {styles.emptyStateText}>
            Be the first to create a volleyball event in your area!
          </Text>
          <TouchableOpacity 
            style= {styles.emptyStateButton}
            onPress={handleCreateEvent}
          >
            <Text style={styles.emptyStateButtonText}>Create First Event</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  map: {
    width: width,
    height: height,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    padding: 24,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 18,
    fontWeight: '600',
    color: '#374151',
    textAlign: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    padding: 24,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  errorText: {
    fontSize: 16,
    color: '#EF4444',
    textAlign: 'center',
    marginBottom: 24,
  },
  retryButton: {
    backgroundColor: '#FB923C',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  controlsContainer: {
    position: 'absolute',
    top: 60,
    right: 16,
  },
  myLocationButton: {
    backgroundColor: '#FB923C',
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  counterContainer: {
    position: 'absolute',
    top: 60,
    left: 16,
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 3,
  },
  counterText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginRight: 6,
  },
  createButton: {
    position: 'absolute',
    bottom: 10,
    left: 16,
    right: 16,
    backgroundColor: '#FB923C',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  createButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
    marginLeft: 8,
  },
  eventCard: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: height * 0.7,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 10,
  },
  cardScrollView: {
    padding: 20,
  },
  cardHeader: {
    marginBottom: 16,
  },
  cardHeaderTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
    flex: 1,
    marginRight: 12,
  },
  closeButton: {
    padding: 4,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    gap: 4,
  },
  statusText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  cardInfoRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  infoChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 6,
  },
  infoChipText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
  },
  cardSection: {
    marginBottom: 16,
  },
  cardSectionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  cardSectionText: {
    fontSize: 15,
    color: '#374151',
    flex: 1,
  },
  cardSectionLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
    marginBottom: 8,
  },
  cardDescription: {
    fontSize: 15,
    color: '#374151',
    lineHeight: 22,
  },
  hostInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  hostAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FFF7ED',
    justifyContent: 'center',
    alignItems: 'center',
  },
  hostName: {
    fontSize: 15,
    fontWeight: '500',
    color: '#111827',
  },
  cardActions: {
    marginTop: 8,
    marginBottom: 20,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  primaryButton: {
    backgroundColor: '#FB923C',
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  secondaryButton: {
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#EF4444',
  },
  secondaryButtonText: {
    color: '#EF4444',
    fontSize: 16,
    fontWeight: '600',
  },
  disabledButton: {
    backgroundColor: '#F3F4F6',
  },
  disabledButtonText: {
    color: '#9CA3AF',
    fontSize: 16,
    fontWeight: '600',
  },
  emptyState: {
    position: 'absolute',
    top: '40%',
    left: 0,
    right: 0,
    alignItems: 'center',
    backgroundColor: 'rgba(249, 250, 251, 0.95)',
    marginHorizontal: 32,
    padding: 24,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginTop: 12,
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 20,
  },
  emptyStateButton: {
    backgroundColor: '#FB923C',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  emptyStateButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  markerContainer: {
    alignItems: 'center',
  },
  customMarker: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  privateBadge: {
    position: 'absolute',
    top: -2,
    right: -2,
    backgroundColor: '#FB923C',
    borderRadius: 8,
    width: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
});

export default MapScreen;