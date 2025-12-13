import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import { getEventsInArea } from '../services/eventService';
import * as Location from 'expo-location';
import DateTimePicker from '@react-native-community/datetimepicker';

const COURT_TYPES = [
  { id: 'all', label: 'All Courts', icon: 'sports-volleyball', color: '#6366F1' },
  { id: 'beach', label: 'Beach', icon: 'beach-access', color: '#FFB800' },
  { id: 'indoor', label: 'Indoor', icon: 'home', color: '#FB923C' },
  { id: 'grass', label: 'Grass', icon: 'grass', color: '#10B981' },
];

const DISTANCE_OPTIONS = [
  { value: 5, label: '5 miles' },
  { value: 10, label: '10 miles' },
  { value: 25, label: '25 miles' },
  { value: 50, label: '50 miles' },
  { value: 100, label: '100 miles' },
];

const SearchScreen = () => {
  const navigation = useNavigation();
  const { user } = useAuth();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [events, setEvents] = useState([]);
  const [userLocation, setUserLocation] = useState(null);

  // Filter states
  const [selectedCourtType, setSelectedCourtType] = useState('all');
  const [selectedDistance, setSelectedDistance] = useState(25);
  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)); // 7 days from now
  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);
  const [showFilterModal, setShowFilterModal] = useState(false);

  useFocusEffect(
    React.useCallback(() => {
      loadEvents();
    }, [])
  );

  useEffect(() => {
    getUserLocation();
  }, []);

  const getUserLocation = async () => {
    try {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        return;
      }

      let currentLocation = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      setUserLocation({
        latitude: currentLocation.coords.latitude,
        longitude: currentLocation.coords.longitude,
      });
    } catch (error) {
      console.log('Location error:', error);
    }
  };

  const loadEvents = async () => {
    try {
      const eventsData = await getEventsInArea();
      setEvents(eventsData);
    } catch (error) {
      Alert.alert('Error', 'Failed to load events');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    loadEvents();
  };

  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    // Haversine formula to calculate distance in miles
    const R = 3959; // Earth's radius in miles
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  const filterEvents = () => {
    let filtered = events.filter(event => {
      // Filter by court type
      if (selectedCourtType !== 'all' && event.court_type !== selectedCourtType) {
        return false;
      }

      // Filter by date range
      const eventDate = new Date(event.start_time);
      if (eventDate < startDate || eventDate > endDate) {
        return false;
      }

      // Filter by distance (if user location available)
      if (userLocation && event.location) {
        const distance = calculateDistance(
          userLocation.latitude,
          userLocation.longitude,
          event.location.latitude,
          event.location.longitude
        );
        if (distance > selectedDistance) {
          return false;
        }
      }

      // Only show active upcoming events
      return event.status === 'active' && eventDate >= new Date();
    });

    // Sort by date (nearest first)
    return filtered.sort((a, b) => {
      return new Date(a.start_time) - new Date(b.start_time);
    });
  };

  const getCourtIcon = (courtType) => {
    const court = COURT_TYPES.find(c => c.id === courtType);
    return court?.icon || 'sports-volleyball';
  };

  const getCourtColor = (courtType) => {
    const court = COURT_TYPES.find(c => c.id === courtType);
    return court?.color || '#6366F1';
  };

  const renderEventCard = (event) => {
    const eventDate = new Date(event.start_time);
    const distance = userLocation && event.location
      ? calculateDistance(
          userLocation.latitude,
          userLocation.longitude,
          event.location.latitude,
          event.location.longitude
        )
      : null;

    return (
      <TouchableOpacity
        key={event.id}
        style={styles.eventCard}
        onPress={() => navigation.navigate('EventDetail', { eventId: event.id })}
        activeOpacity={0.7}
      >
        <View style={styles.eventCardHeader}>
          <View style={styles.eventCardLeft}>
            <View style={[
              styles.courtIcon,
              { backgroundColor: getCourtColor(event.court_type) }
            ]}>
              <MaterialIcons
                name={getCourtIcon(event.court_type)}
                size={24}
                color="#FFFFFF"
              />
            </View>

            <View style={styles.eventTitleContainer}>
              <Text style={styles.eventTitle} numberOfLines={1}>
                {event.title}
              </Text>
              <View style={styles.eventMetaRow}>
                <View style={styles.metaBadge}>
                  <MaterialIcons name="people" size={12} color="#6B7280" />
                  <Text style={styles.metaBadgeText}>
                    {event.current_players}/{event.max_players}
                  </Text>
                </View>
                {event.is_private && (
                  <View style={styles.privateBadge}>
                    <MaterialIcons name="lock" size={12} color="#6B7280" />
                    <Text style={styles.privateBadgeText}>Private</Text>
                  </View>
                )}
              </View>
            </View>
          </View>

          {distance !== null && (
            <View style={styles.distanceBadge}>
              <MaterialIcons name="near-me" size={14} color="#FB923C" />
              <Text style={styles.distanceText}>{distance.toFixed(1)} mi</Text>
            </View>
          )}
        </View>

        <View style={styles.eventCardBody}>
          <View style={styles.eventInfoRow}>
            <MaterialIcons name="event" size={16} color="#6B7280" />
            <Text style={styles.eventInfoText}>
              {eventDate.toLocaleDateString('en-US', {
                weekday: 'short',
                month: 'short',
                day: 'numeric'
              })}
            </Text>
          </View>

          <View style={styles.eventInfoRow}>
            <MaterialIcons name="schedule" size={16} color="#6B7280" />
            <Text style={styles.eventInfoText}>
              {eventDate.toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit'
              })}
            </Text>
          </View>
        </View>

        {event.location_address && (
          <View style={styles.eventCardFooter}>
            <MaterialIcons name="place" size={14} color="#9CA3AF" />
            <Text style={styles.locationText} numberOfLines={1}>
              {event.location_address}
            </Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  const renderFilterModal = () => (
    <Modal
      visible={showFilterModal}
      transparent
      animationType="slide"
      onRequestClose={() => setShowFilterModal(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Filters</Text>
            <TouchableOpacity onPress={() => setShowFilterModal(false)}>
              <MaterialIcons name="close" size={24} color="#6B7280" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
            {/* Court Type Filter */}
            <Text style={styles.filterSectionTitle}>Court Type</Text>
            <View style={styles.courtTypeGrid}>
              {COURT_TYPES.map((court) => (
                <TouchableOpacity
                  key={court.id}
                  style={[
                    styles.courtTypeButton,
                    selectedCourtType === court.id && styles.courtTypeButtonActive
                  ]}
                  onPress={() => setSelectedCourtType(court.id)}
                >
                  <MaterialIcons
                    name={court.icon}
                    size={24}
                    color={selectedCourtType === court.id ? court.color : '#9CA3AF'}
                  />
                  <Text
                    style={[
                      styles.courtTypeButtonText,
                      selectedCourtType === court.id && { color: court.color }
                    ]}
                  >
                    {court.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Distance Filter */}
            <Text style={styles.filterSectionTitle}>Distance</Text>
            <View style={styles.distanceGrid}>
              {DISTANCE_OPTIONS.map((option) => (
                <TouchableOpacity
                  key={option.value}
                  style={[
                    styles.distanceButton,
                    selectedDistance === option.value && styles.distanceButtonActive
                  ]}
                  onPress={() => setSelectedDistance(option.value)}
                >
                  <Text
                    style={[
                      styles.distanceButtonText,
                      selectedDistance === option.value && styles.distanceButtonTextActive
                    ]}
                  >
                    {option.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Date Range Filter */}
            <Text style={styles.filterSectionTitle}>Date Range</Text>
            
            <TouchableOpacity
              style={styles.dateButton}
              onPress={() => setShowStartDatePicker(true)}
            >
              <View style={styles.dateButtonLeft}>
                <MaterialIcons name="event" size={20} color="#FB923C" />
                <Text style={styles.dateButtonLabel}>Start Date</Text>
              </View>
              <Text style={styles.dateButtonValue}>
                {startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.dateButton}
              onPress={() => setShowEndDatePicker(true)}
            >
              <View style={styles.dateButtonLeft}>
                <MaterialIcons name="event" size={20} color="#FB923C" />
                <Text style={styles.dateButtonLabel}>End Date</Text>
              </View>
              <Text style={styles.dateButtonValue}>
                {endDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
              </Text>
            </TouchableOpacity>

            {/* Reset Button */}
            <TouchableOpacity
              style={styles.resetButton}
              onPress={() => {
                setSelectedCourtType('all');
                setSelectedDistance(25);
                setStartDate(new Date());
                setEndDate(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000));
              }}
            >
              <MaterialIcons name="refresh" size={20} color="#EF4444" />
              <Text style={styles.resetButtonText}>Reset Filters</Text>
            </TouchableOpacity>
          </ScrollView>

          <View style={styles.modalFooter}>
            <TouchableOpacity
              style={styles.applyButton}
              onPress={() => setShowFilterModal(false)}
            >
              <Text style={styles.applyButtonText}>Apply Filters</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

  const filteredEvents = filterEvents();
  const activeFilterCount = 
    (selectedCourtType !== 'all' ? 1 : 0) +
    (selectedDistance !== 25 ? 1 : 0);

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Search Events</Text>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FB923C" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Search Events</Text>
        <TouchableOpacity
          style={styles.filterButton}
          onPress={() => setShowFilterModal(true)}
        >
          <MaterialIcons name="filter-list" size={24} color="#FB923C" />
          {activeFilterCount > 0 && (
            <View style={styles.filterBadge}>
              <Text style={styles.filterBadgeText}>{activeFilterCount}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* Active Filters Display */}
      {activeFilterCount > 0 && (
        <View style={styles.activeFiltersContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {selectedCourtType !== 'all' && (
              <View style={styles.activeFilterChip}>
                <MaterialIcons
                  name={getCourtIcon(selectedCourtType)}
                  size={16}
                  color={getCourtColor(selectedCourtType)}
                />
                <Text style={styles.activeFilterText}>
                  {COURT_TYPES.find(c => c.id === selectedCourtType)?.label}
                </Text>
              </View>
            )}
            {selectedDistance !== 25 && (
              <View style={styles.activeFilterChip}>
                <MaterialIcons name="near-me" size={16} color="#FB923C" />
                <Text style={styles.activeFilterText}>
                  {selectedDistance} miles
                </Text>
              </View>
            )}
          </ScrollView>
        </View>
      )}

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={['#FB923C']}
          />
        }
      >
        <View style={styles.resultsHeader}>
          <Text style={styles.resultsCount}>
            {filteredEvents.length} event{filteredEvents.length !== 1 ? 's' : ''} found
          </Text>
        </View>

        {filteredEvents.length === 0 ? (
          <View style={styles.emptyState}>
            <MaterialIcons name="search-off" size={64} color="#D1D5DB" />
            <Text style={styles.emptyStateTitle}>No Events Found</Text>
            <Text style={styles.emptyStateText}>
              Try adjusting your filters to see more results
            </Text>
            <TouchableOpacity
              style={styles.adjustFiltersButton}
              onPress={() => setShowFilterModal(true)}
            >
              <MaterialIcons name="tune" size={20} color="#FFFFFF" />
              <Text style={styles.adjustFiltersButtonText}>Adjust Filters</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.eventsList}>
            {filteredEvents.map(event => renderEventCard(event))}
          </View>
        )}
      </ScrollView>

      {renderFilterModal()}

      {/* Date Pickers */}
      {showStartDatePicker && (
        <DateTimePicker
          value={startDate}
          mode="date"
          display="default"
          minimumDate={new Date()}
          onChange={(event, selectedDate) => {
            setShowStartDatePicker(false);
            if (selectedDate) {
              setStartDate(selectedDate);
            }
          }}
        />
      )}

      {showEndDatePicker && (
        <DateTimePicker
          value={endDate}
          mode="date"
          display="default"
          minimumDate={startDate}
          onChange={(event, selectedDate) => {
            setShowEndDatePicker(false);
            if (selectedDate) {
              setEndDate(selectedDate);
            }
          }}
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#111827',
  },
  filterButton: {
    position: 'relative',
    padding: 8,
  },
  filterBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: '#EF4444',
    borderRadius: 10,
    width: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterBadgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  activeFiltersContainer: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  activeFilterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
    gap: 6,
  },
  activeFilterText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  resultsHeader: {
    marginBottom: 16,
  },
  resultsCount: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6B7280',
  },
  eventsList: {
    gap: 12,
  },
  eventCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  eventCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  eventCardLeft: {
    flexDirection: 'row',
    flex: 1,
    gap: 12,
  },
  courtIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  eventTitleContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  eventTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
  },
  eventMetaRow: {
    flexDirection: 'row',
    gap: 6,
  },
  metaBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    gap: 4,
  },
  metaBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
  },
  privateBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    gap: 4,
  },
  privateBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
  },
  distanceBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF7ED',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 4,
  },
  distanceText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#FB923C',
  },
  eventCardBody: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 12,
  },
  eventInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  eventInfoText: {
    fontSize: 14,
    color: '#374151',
    fontWeight: '500',
  },
  eventCardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  locationText: {
    fontSize: 13,
    color: '#6B7280',
    flex: 1,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
    paddingHorizontal: 32,
  },
  emptyStateTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#111827',
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyStateText: {
    fontSize: 15,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  adjustFiltersButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FB923C',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    gap: 8,
  },
  adjustFiltersButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '85%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
  },
  modalBody: {
    padding: 24,
  },
  filterSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 12,
    marginTop: 16,
  },
  courtTypeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 8,
  },
  courtTypeButton: {
    flex: 1,
    minWidth: '45%',
    alignItems: 'center',
    padding: 16,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
  },
  courtTypeButtonActive: {
    borderColor: '#FB923C',
    backgroundColor: '#FFF7ED',
  },
  courtTypeButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
    marginTop: 8,
  },
  distanceGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 8,
  },
  distanceButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
  },
  distanceButtonActive: {
    borderColor: '#FB923C',
    backgroundColor: '#FFF7ED',
  },
  distanceButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
  },
  distanceButtonTextActive: {
    color: '#FB923C',
  },
  dateButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    marginBottom: 12,
    backgroundColor: '#FFFFFF',
  },
  dateButtonLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  dateButtonLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#374151',
  },
  dateButtonValue: {
    fontSize: 15,
    fontWeight: '600',
    color: '#111827',
  },
  resetButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 14,
    borderWidth: 1,
    borderColor: '#FEE2E2',
    borderRadius: 12,
    backgroundColor: '#FEF2F2',
    marginTop: 16,
    gap: 8,
  },
  resetButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#EF4444',
  },
  modalFooter: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  applyButton: {
    backgroundColor: '#FB923C',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  applyButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
});

export default SearchScreen;