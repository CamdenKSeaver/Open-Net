import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
  Modal,
  KeyboardAvoidingView,
  Platform,
  Dimensions,
  TextInput,
} from 'react-native';
import DoneTextInput from '../components/DoneTextInput';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import DateTimePicker from '@react-native-community/datetimepicker';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import { useAuth } from '../context/AuthContext';
import { createEvent } from '../services/eventService';

const { width, height } = Dimensions.get('window');

const COURT_TYPES = [
  { id:'beach', name: 'Beach', icon:'beach-access', color: '#FFB800' },
  { id:'indoor', name: 'Indoor', icon:'home', color: '#FB923C' },
  { id: 'grass', name:'Grass', icon: 'grass', color: '#10B981' }
];

const CreateEventScreen = ({ navigation }) => {
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = useState(false);
  const [showMapModal,setShowMapModal] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  
  const [formData, setFormData] = useState({
    title: '',
    description:'',
    maxPlayers: '8',
    courtType: '',
    location: null,
    address:'',
    locationName:'',
    date: new Date(),
    startTime: new Date(),
    endTime:new Date(Date.now() + 2 * 60 * 60 * 1000),
    isPrivate:false,
  });

  const [mapRegion, setMapRegion] = useState({
    latitude:37.78825,
    longitude: -122.4324,
    latitudeDelta:0.0922,
    longitudeDelta: 0.0421,
  });
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showStartTimePicker, setShowStartTimePicker] = useState(false);
  const [showEndTimePicker, setShowEndTimePicker] = useState(false);

  const [showCourtTypeModal, setShowCourtTypeModal] = useState(false);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});

  useEffect(() => {
    getCurrentLocation();
    
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const defaultStart = new Date(today);

    defaultStart.setHours(18, 0, 0, 0);

    const defaultEnd = new Date(today);
    defaultEnd.setHours(20, 0, 0, 0);
    
    setFormData(prev => ({
      ...prev,
      date: today,
      startTime: defaultStart,
      endTime: defaultEnd
    }));
  }, []);

  const getCurrentLocation = async () => {


    try {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Location Permission Required', 'Please allow location access to set event location.');
        return;
      }


      let currentLoc = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      
      const newRegion = {
        latitude: currentLoc.coords.latitude,
        longitude: currentLoc.coords.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      };
      
      setMapRegion(newRegion);



      setSelectedLocation({
        latitude: currentLoc.coords.latitude,
        longitude: currentLoc.coords.longitude,
      });
      
      try {
        let reverseGeocode = await Location.reverseGeocodeAsync({
          latitude: currentLoc.coords.latitude,
          longitude: currentLoc.coords.longitude,
        });
        
        if (reverseGeocode.length > 0) {

          const addr = reverseGeocode[0];
          const formattedAddress = [addr.street, addr.city, addr.region, addr.country]
            .filter(Boolean)
            .join(', ');
          const locationName = addr.name || addr.street || 'Current Location';
          
          setFormData(prev => ({
            ...prev,
            address: formattedAddress,
            locationName: locationName,
            location: {
              latitude: currentLoc.coords.latitude,
              longitude: currentLoc.coords.longitude
            }
          }));
        } else {
          setFormData(prev => ({
            ...prev,
            address:`${currentLoc.coords.latitude.toFixed(6)}, ${currentLoc.coords.longitude.toFixed(6)}`,
            locationName:'Current Location',

            location: {
              latitude: currentLoc.coords.latitude,
              longitude: currentLoc.coords.longitude
            }
          }));
        }
      } catch (geocodeError) {
        setFormData(prev => ({
          ...prev,
          address: `${currentLoc.coords.latitude.toFixed(6)}, ${currentLoc.coords.longitude.toFixed(6)}`,
          locationName: 'Current Location',
          location: {
            latitude: currentLoc.coords.latitude,
            longitude: currentLoc.coords.longitude
          }
        }));
      }

    } catch (error) {
      Alert.alert('Location Error', 'Could not get your current location. Please select manually on the map.');
    }
  };


  const handleMapPress = async (event) => {
    const coordinate = event.nativeEvent.coordinate;
    setSelectedLocation(coordinate);
    
    
    try {
      let reverseGeocode = await Location.reverseGeocodeAsync({
        latitude:coordinate.latitude,
        longitude: coordinate.longitude,
        
      });
      
      if (reverseGeocode.length > 0) {
        const addr = reverseGeocode[0];
        const formattedAddress = [addr.street, addr.city, addr.region, addr.country]
          .filter(Boolean)
          .join(', ');
        const locationName = addr.name || addr.street || 'Selected Location';
        
        setFormData(prev => ({
          ...prev,
          address:formattedAddress,
          locationName:locationName,
          location: coordinate
        }));
      } else {
        setFormData(prev => ({
          ...prev,

          address: `${coordinate.latitude.toFixed(6)}, ${coordinate.longitude.toFixed(6)}`,
          locationName: 'Selected Location',
          location: coordinate
        }));
      }
    } catch (error) {
      setFormData(prev => ({

        ...prev,
        address: `${coordinate.latitude.toFixed(6)}, ${coordinate.longitude.toFixed(6)}`,
        locationName: 'Selected Location',
        location: coordinate
      }));
    }
  };
  const validateField = (field, value) => {
    switch (field) {

      case 'title':

        return !value.trim() ? 'Title is required' : 
               value.trim().length < 3 ? 'Title must be at least 3 characters' : '';
      case 'maxPlayers':
        const num = parseInt(value);
        return !value.trim() ? 'Max players is required' : 
               isNaN(num) ? 'Must be a number' :
               num < 2 ? 'Minimum 2 players' :
               num > 50 ? 'Maximum 50 players' : '';
      case 'courtType':

        return !value ? 'Court type is required' : '';

      case 'location':
        return !value ? 'Location is required' : '';
      default:
        return '';
    }
  };





  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (touched[field]) {
      const error = validateField(field, value);

      setErrors(prev => ({ ...prev, [field]: error }));
    }
  };

  
  const handleBlur = (field) => {
    setTouched(prev => ({ ...prev, [field]: true }));
    const error = validateField(field, formData[field]);
    setErrors(prev => ({ ...prev, [field]: error }));
  };
  const validateAllFields = () => {
    const newErrors = {};


    
    ['title', 'maxPlayers', 'courtType'].forEach(field => {
      const error = validateField(field, formData[field]);
      if (error) newErrors[field] = error;


    });

    if (!formData.location) {
      newErrors.location = 'Location is required';
    }

    const now = new Date();
    const startDateTime = new Date(formData.date);
    startDateTime.setHours(formData.startTime.getHours(), formData.startTime.getMinutes(), 0, 0);
    
    if (startDateTime <= now) {
      newErrors.date = 'Event date and time cannot be in the past';


    }

    const endDateTime = new Date(formData.date);
    endDateTime.setHours(formData.endTime.getHours(), formData.endTime.getMinutes(), 0, 0);

    if (endDateTime <= startDateTime) {
      newErrors.endTime = 'End time must be after start time';
    }

    setErrors(newErrors);
    setTouched({
      title: true,

      maxPlayers: true,
      courtType: true,
      location: true,
    });

    
    return Object.keys(newErrors).length === 0;
  };

  const handleCreateEvent = async () => {


    if (!validateAllFields()) {
      Alert.alert('Validation Error', 'Please fix the errors before creating the event.');
      return;
    }

    setLoading(true);
    try {
      const startDateTime = new Date(formData.date);
      startDateTime.setHours(formData.startTime.getHours(), formData.startTime.getMinutes(), 0, 0);
      
      const endDateTime = new Date(formData.date);

      endDateTime.setHours(formData.endTime.getHours(), formData.endTime.getMinutes(), 0, 0);


      const eventData = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        maxPlayers: parseInt(formData.maxPlayers),
        isPrivate: formData.isPrivate,
        courtType: formData.courtType,
        location: formData.location,
        locationDetails: {
          address: formData.address,
          name: formData.locationName,
          coordinates: {
            latitude: formData.location.latitude,
            longitude: formData.location.longitude
          }
        },



        dateTime: {
          date: formData.date,
          startTime: startDateTime,
          endTime: endDateTime,
          dateString: formData.date.toLocaleDateString('en-US', { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
          }),
          startTimeString: formData.startTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          endTimeString: formData.endTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        },
        hostId: user.id || user.uid,
        hostName: user.displayName || user.email?.split('@')[0] || 'Unknown'
      };



      await createEvent(eventData);
      setShowSuccess(true);
      setTimeout(() => {
        setShowSuccess(false);
        navigation.goBack();
      }, 2000);
      
    } catch (error) {
      Alert.alert('Error', error.message || 'Failed to create event. Please try again.');
    } finally {
      setLoading(false);
    }
  };





  const onDateChange = (event, selectedDate) => {
    if (Platform.OS === 'android') {
      setShowDatePicker(false);
    }
    if (selectedDate) {
      setFormData(prev => ({ ...prev, date: selectedDate }));
    }
  };

  const onStartTimeChange = (event, selectedTime) => {
    if (Platform.OS === 'android') {
      setShowStartTimePicker(false);
    }
    if (selectedTime) {
      setFormData(prev => ({ ...prev, startTime: selectedTime }));
    }
  };



  const onEndTimeChange = (event, selectedTime) => {

    if (Platform.OS === 'android') {
      setShowEndTimePicker(false);
    }
    if (selectedTime) {
      setFormData(prev => ({ ...prev, endTime: selectedTime }));
    }
  };




  const renderError = (field) => {
    if (errors[field] && touched[field]) {
      return (
        <View style={styles.errorContainer}>
          <MaterialIcons name="error-outline" size={16} color="#EF4444" />
          <Text style={styles.errorText}>{errors[field]}</Text>
        </View>
      );
    }
    return null;
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        style={styles.container} 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <MaterialIcons name="arrow-back" size={24} color="#111827" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Create Event</Text>
          <View style={styles.headerSpacer} />
        </View>

        <ScrollView 
          style={styles.content} 
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.form}>
            <Text style={styles.sectionTitle}>Event Details</Text>
            
            <Text style={styles.label}>Title <Text style={styles.required}>*</Text></Text>
            <DoneTextInput
              style={[styles.input, errors.title && touched.title && styles.inputError]}
              value={formData.title}
              onChangeText={(value) => handleInputChange('title', value)}
              onBlur={() => handleBlur('title')}
              placeholder="e.g., Evening Beach Volleyball"
              maxLength={50}
              editable={!loading}
            />
            {renderError('title')}

            <Text style={styles.label}>Description</Text>
            <DoneTextInput
              style={[styles.input, styles.textArea]}
              value={formData.description}
              onChangeText={(value) => handleInputChange('description', value)}
              placeholder="Tell players what to expect..."
              multiline
              numberOfLines={3}
              maxLength={200}
              editable={!loading}
            />
            <Text style={styles.charCount}>{formData.description.length}/200</Text>

            <Text style={[styles.sectionTitle, styles.sectionSpacing]}>Game Settings</Text>
            
            <Text style={styles.label}>Max Players <Text style={styles.required}>*</Text></Text>
            <DoneTextInput
              style={[styles.input, errors.maxPlayers && touched.maxPlayers && styles.inputError]}
              value={formData.maxPlayers}
              onChangeText={(value) => handleInputChange('maxPlayers', value)}
              onBlur={() => handleBlur('maxPlayers')}
              placeholder="8"
              keyboardType="numeric"
              maxLength={2}
              editable={!loading}
            />
            {renderError('maxPlayers')}

            <Text style={styles.label}>Court Type <Text style={styles.required}>*</Text></Text>
            <TouchableOpacity
              style={[styles.selectButton, errors.courtType && touched.courtType && styles.selectButtonError]}
              onPress={() => setShowCourtTypeModal(true)}
            >
              <View style={styles.selectButtonContent}>
                {formData.courtType && (
                  <MaterialIcons 
                    name={COURT_TYPES.find(c => c.id === formData.courtType)?.icon} 
                    size={20} 
                    color={COURT_TYPES.find(c => c.id === formData.courtType)?.color}
                    style={styles.selectIcon}
                  />
                )}
                <Text style={[styles.selectButtonText, formData.courtType && styles.selectButtonTextSelected]}>
                  {formData.courtType ? COURT_TYPES.find(c => c.id === formData.courtType)?.name : 'Select Court Type'}
                </Text>
              </View>
              <MaterialIcons name="arrow-drop-down" size={24} color="#6B7280" />
            </TouchableOpacity>
            {renderError('courtType')}

            <View style={styles.toggleSection}>
              <View style={styles.toggleHeader}>
                <View style={styles.toggleLabelContainer}>
                  <MaterialIcons 
                    name={formData.isPrivate ? "lock" : "public"} 
                    size={24} 
                    color={formData.isPrivate ? "#FB923C" : "#6B7280"} 
                  />
                  <View style={styles.toggleTextContainer}>
                    <Text style={styles.toggleLabel}>Invite Only</Text>
                    <Text style={styles.toggleDescription}>
                      {formData.isPrivate 
                        ? "Only invited players can join" 
                        : "Anyone can request to join"}
                    </Text>
                  </View>
                </View>
                <TouchableOpacity
                  style={[
                    styles.toggle,
                    formData.isPrivate && styles.toggleActive
                  ]}
                  onPress={() => setFormData(prev => ({ ...prev, isPrivate: !prev.isPrivate }))}
                  activeOpacity={0.7}
                >
                  <View style={[
                    styles.toggleThumb,
                    formData.isPrivate && styles.toggleThumbActive
                  ]} />
                </TouchableOpacity>
              </View>
            </View>

            <Text style={[styles.sectionTitle, styles.sectionSpacing]}>Location</Text>
            
            <Text style={styles.label}>Address <Text style={styles.required}>*</Text></Text>
            <View style={styles.locationInputContainer}>
              <TextInput
                style={[styles.input, styles.locationInput]}
                value={formData.address}
                placeholder="Selected location will appear here"
                multiline
                numberOfLines={2}
                editable={false}
              />
            </View>

            <TouchableOpacity
              style={styles.mapButton}
              onPress={() => setShowMapModal(true)}
            >
              <MaterialIcons name="place" size={20} color="#FFFFFF" />
              <Text style={styles.mapButtonText}>
                {formData.location ? 'Update Location on Map' : 'Select Location on Map'}
              </Text>
            </TouchableOpacity>
            {renderError('location')}

            <Text style={[styles.sectionTitle, styles.sectionSpacing]}>Schedule</Text>
            
            <Text style={styles.label}>Date <Text style={styles.required}>*</Text></Text>
            <TouchableOpacity 
              style={styles.dateTimeButton} 
              onPress={() => {
                setShowStartTimePicker(false);
                setShowEndTimePicker(false);
                setShowDatePicker(true);
              }}
            >
              <MaterialIcons name="event" size={24} color="#FB923C" />
              <Text style={styles.dateTimeText}>
                {formData.date.toLocaleDateString('en-US', { 
                  weekday: 'short', month: 'short', day: 'numeric', year: 'numeric'
                })}
              </Text>
              <MaterialIcons name="chevron-right" size={20} color="#9CA3AF" />
            </TouchableOpacity>

            <View style={styles.timeRow}>
              <View style={styles.halfWidth}>
                <Text style={styles.label}>Start Time <Text style={styles.required}>*</Text></Text>
                <TouchableOpacity 
                  style={styles.timeButton} 
                  onPress={() => {
                    setShowDatePicker(false);
                    setShowEndTimePicker(false);
                    setShowStartTimePicker(true);
                  }}
                >
                  <MaterialIcons name="schedule" size={20} color="#FB923C" />
                  <Text style={styles.timeButtonText}>
                    {formData.startTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </Text>
                  <MaterialIcons name="chevron-right" size={16} color="#9CA3AF" />
                </TouchableOpacity>
              </View>
              
              <View style={styles.halfWidth}>
                <Text style={styles.label}>End Time <Text style={styles.required}>*</Text></Text>
                <TouchableOpacity 
                  style={styles.timeButton} 
                  onPress={() => {
                    setShowDatePicker(false);
                    setShowStartTimePicker(false);
                    setShowEndTimePicker(true);
                  }}
                >
                  <MaterialIcons name="schedule" size={20} color="#FB923C" />
                  <Text style={styles.timeButtonText}>
                    {formData.endTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </Text>
                  <MaterialIcons name="chevron-right" size={16} color="#9CA3AF" />
                </TouchableOpacity>
              </View>
            </View>
            {renderError('endTime')}

            <TouchableOpacity
              style={[styles.createButton, loading && styles.createButtonDisabled]}
              onPress={handleCreateEvent}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <>
                  <MaterialIcons name="add" size={20} color="#FFFFFF" />
                  <Text style={styles.createButtonText}>Create Event</Text>
                </>
              )}
            </TouchableOpacity>

            {showSuccess && (
              <View style={styles.successBanner}>
                <MaterialIcons name="check-circle" size={24} color="#10B981" />
                <Text style={styles.successText}>Event created successfully!</Text>
              </View>
            )}
          </View>
        </ScrollView>

        {showDatePicker && (
          <>
            {Platform.OS === 'ios' && (
              <View style={styles.pickerOverlay}>
                <View style={styles.pickerContainer}>
                  <View style={styles.pickerHeader}>
                    <TouchableOpacity onPress={() => setShowDatePicker(false)}>
                      <Text style={styles.pickerDone}>Done</Text>
                    </TouchableOpacity>
                  </View>
                  <DateTimePicker
                    value={formData.date}
                    mode="date"
                    display="spinner"
                    minimumDate={new Date()}
                    onChange={onDateChange}
                    textColor="#000000"
                    style={styles.picker}
                  />
                </View>
              </View>
            )}
            {Platform.OS === 'android' && (
              <DateTimePicker
                value={formData.date}
                mode="date"
                display="default"
                textColor="#000000"
                minimumDate={new Date()}
                onChange={onDateChange}
              />
            )}
          </>
        )}

                {showStartTimePicker && (
          <>
            {Platform.OS === 'ios' ? (
              <View style={styles.pickerOverlay}>

                <View style={styles.pickerContainer}>
                  <View style={styles.pickerHeader}>

                    <TouchableOpacity onPress={() => setShowStartTimePicker(false)}>

                      <Text style={styles.pickerDone}>Done</Text>
                    </TouchableOpacity>
                  </View>
                  <DateTimePicker
                    value={formData.startTime}
                    mode="time"
                    display="spinner"
                    textColor="#000000"
                    onChange={onStartTimeChange}
                    style={styles.picker}
                  />
                </View>

              </View>
            ) : (
              <DateTimePicker
                value={formData.startTime}
                mode="time"
                display="default"
                onChange={onStartTimeChange}
              />
            )}
          </>
        )}

        {showEndTimePicker && (
          <>
            {Platform.OS === 'ios' ? (

              <View style={styles.pickerOverlay}>
                <View style={styles.pickerContainer}>


                  <View style={styles.pickerHeader}>
                    <TouchableOpacity onPress={() => setShowEndTimePicker(false)}>

                      <Text style={styles.pickerDone}>Done</Text>
                    </TouchableOpacity>
                  </View>
                  <DateTimePicker
                    value={formData.endTime}
                    mode="time"
                    display="spinner"
                    textColor="#000000"
                    onChange={onEndTimeChange}
                    style={styles.picker}
                  />
                </View>
              </View>
            ) : (
              <DateTimePicker
                value={formData.endTime}
                mode="time"
                display="default"
                onChange={onEndTimeChange}
              />
            )}
          </>
        )}

        <Modal visible={showCourtTypeModal} transparent animationType="slide">
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Select Court Type</Text>
                <TouchableOpacity onPress={() => setShowCourtTypeModal(false)}>
                  <MaterialIcons name="close" size={24} color="#6B7280" />
                </TouchableOpacity>
              </View>
              <View style={styles.modalBody}>
                {COURT_TYPES.map((court) => (
                  <TouchableOpacity
                    key={court.id}
                    style={[styles.optionItem, formData.courtType === court.id && styles.optionItemSelected]}
                    onPress={() => {
                      handleInputChange('courtType', court.id);
                      setTouched(prev => ({ ...prev, courtType: true }));
                      setShowCourtTypeModal(false);
                    }}
                  >
                    <View style={styles.optionLeft}>
                      <MaterialIcons name={court.icon} size={24} color={court.color} />
                      <Text style={styles.optionText}>{court.name}</Text>
                    </View>
                    {formData.courtType === court.id && (
                      <MaterialIcons name="check" size={24} color="#10B981" />
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>
        </Modal>
      </KeyboardAvoidingView>

      <Modal visible={showMapModal} animationType="slide">
        <View style={styles.mapModalContainer}>
          <MapView
            style={styles.mapModal}
            provider={PROVIDER_GOOGLE}
            initialRegion={mapRegion}
            onPress={handleMapPress}
            showsUserLocation={true}
            showsMyLocationButton={false}
          >
            {selectedLocation && (
              <Marker
                coordinate={selectedLocation}
                title="Event Location"
                pinColor="#FB923C"
              />
            )}
          </MapView>
          
          <TouchableOpacity 
            onPress={() => setShowMapModal(false)}
            style={[styles.floatingButton, styles.floatingCancelButton, { top: insets.top + 16 }]}
          >
            <MaterialIcons name="close" size={24} color="#111827" />
          </TouchableOpacity>
          
          <TouchableOpacity 
            onPress={() => setShowMapModal(false)}
            style={[styles.floatingConfirmButton, { bottom: insets.bottom + 80 }]}
          >
            <MaterialIcons name="check" size={24} color="#FFFFFF" />
            <Text style={styles.floatingConfirmText}>Confirm Location</Text>
          </TouchableOpacity>
          
          <View style={[styles.mapInstructions, { paddingBottom: Math.max(insets.bottom, 16) }]}>
            <MaterialIcons name="touch-app" size={20} color="#FB923C" />
            <Text style={styles.mapInstructionsText}>
              Tap on the map to place pin
            </Text>
          </View>
        </View>
      </Modal>
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
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    textAlign: 'center',
  },
  headerSpacer: {
    width: 40,
  },
  content: {
    flex: 1,
  },
  form: {
    backgroundColor: '#FFFFFF',
    padding: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 16,
  },
  sectionSpacing: {
    marginTop: 32,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
    marginTop: 16,
  },
  required: {
    color: '#EF4444',
  },
  input: {
    borderWidth: 2,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 16,
    fontSize: 16,
    backgroundColor: '#FFFFFF',
    color: '#111827',
    minHeight: 50,
  },
  inputError: {
    borderColor: '#EF4444',
    backgroundColor: '#FEF2F2',
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
    paddingHorizontal: 4,
  },
  errorText: {
    fontSize: 14,
    color: '#EF4444',
    marginLeft: 6,
    flex: 1,
  },
  charCount: {
    fontSize: 12,
    color: '#9CA3AF',
    textAlign: 'right',
    marginTop: 4,
  },
  selectButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 16,
    backgroundColor: '#FFFFFF',
    minHeight: 50,
  },
  selectButtonError: {
    borderColor: '#EF4444',
    backgroundColor: '#FEF2F2',
  },
  selectButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  selectIcon: {
    marginRight: 8,
  },
  selectButtonText: {
    fontSize: 16,
    color: '#9CA3AF',
    flex: 1,
  },
  selectButtonTextSelected: {
    color: '#111827',
  },
  toggleSection: {
    marginBottom: 24,
    marginTop: 24,
  },
  toggleHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F9FAFB',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  toggleLabelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  toggleTextContainer: {
    marginLeft: 12,
    flex: 1,
  },
  toggleLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 2,
  },
  toggleDescription: {
    fontSize: 13,
    color: '#6B7280',
  },
  toggle: {
    width: 52,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#D1D5DB',
    padding: 2,
    justifyContent: 'center',
  },
  toggleActive: {
    backgroundColor: '#FB923C',
  },
  toggleThumb: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  toggleThumbActive: {
    transform: [{ translateX: 20 }],
  },
  locationInputContainer: {
    marginBottom: 8,
  },
  locationInput: {
    backgroundColor: '#F9FAFB',
    color: '#6B7280',
  },
  mapButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FB923C',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    marginTop: 12,
  },
  mapButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  dateTimeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 16,
    backgroundColor: '#FFFFFF',
    minHeight: 50,
  },
  dateTimeText: {
    fontSize: 16,
    color: '#111827',
    fontWeight: '500',
    marginLeft: 12,
    flex: 1,
  },
  timeRow: {
    flexDirection: 'row',
    gap: 12,
  },
  halfWidth: {
    flex: 1,
  },
  timeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 12,
    backgroundColor: '#FFFFFF',
    minHeight: 50,
  },
  timeButtonText: {
    fontSize: 16,
    color: '#111827',
    fontWeight: '600',
    marginLeft: 8,
    flex: 1,
  },
  createButton: {
    backgroundColor: '#FB923C',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    marginTop: 32,
    shadowColor: '#FB923C',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  createButtonDisabled: {
    opacity: 0.7,
  },
  createButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
    marginLeft: 8,
  },
  successBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F0FDF4',
    padding: 16,
    borderRadius: 12,
    marginTop: 16,
  },
  successText: {
    color: '#10B981',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
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
    maxHeight: '60%',
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
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  modalBody: {
    padding: 8,
  },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 16,
    marginHorizontal: 8,
    borderRadius: 12,
  },
  optionItemSelected: {
    backgroundColor: '#F0FDF4',
  },
  optionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  optionText: {
    fontSize: 16,
    color: '#111827',
    marginLeft: 12,
    fontWeight: '500',
  },
  mapModalContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  mapModal: {
    flex: 1,
  },
  mapInstructions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FFF7ED',
    borderTopWidth: 1,
    borderTopColor: '#FED7AA',
  },
  mapInstructionsText: {
    fontSize: 14,
    color: '#FB923C',
    fontWeight: '500',
    marginLeft: 8,
    textAlign: 'center',
    flex: 1,
  },
  floatingButton: {
    position: 'absolute',
    backgroundColor: '#FFFFFF',
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  floatingCancelButton: {
    left: 16,
  },
  floatingConfirmButton: {
    position: 'absolute',
    left: 16,
    right: 16,
    backgroundColor: '#FB923C',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    shadowColor: '#FB923C',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  floatingConfirmText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    marginLeft: 8,
  },
  pickerOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    height: '100%',
    justifyContent: 'flex-end',
  },
  pickerContainer: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 20,
  },
  pickerHeader: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  pickerDone: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FB923C',
  },
  picker: {
    height: 200,
  },
});

export default CreateEventScreen;