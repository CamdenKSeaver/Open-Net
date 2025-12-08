import React, { useState, useEffect } from 'react';
import {
  View,
  Text,StyleSheet,ScrollView,TouchableOpacity,
  Image,
  ActivityIndicator,
  Alert,
  Modal,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { signOut } from '../services/authService';
import DoneTextInput from '../components/DoneTextInput';
import { getUserProfile, updateUserProfile } from '../services/profileService';

const VOLLEYBALL_POSITIONS = [
  'Outside Hitter',
  'Middle Blocker',
  'Opposite Hitter',
  'Setter',
  'Libero',
  'Defensive Specialist'
];

const COURT_TYPES = [
  {id: 'beach', label: 'Beach', icon: 'beach-access'},
  {id: 'indoor', label:'Indoor', icon: 'home' },
  {id: 'grass', label:'Grass', icon:'grass'}
]

const EXPERIENCE_LEVELS = [
  {id: 'beginner', label: 'Beginner'},
  {id: 'intermediate', label: 'Intermediate' },
  {id: 'advanced', label: 'Advanced' }
];

const ProfileScreen = () => {
  const { user, refreshUser } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [showPositionModal, setShowPositionModal] = useState(false);
  const [positionType, setPositionType] = useState('');

  const [editedProfile, setEditedProfile] = useState({
    name: '',
    age:'',
    phoneNumber:'',
    bio: '',
    primaryPosition:'',
    secondaryPosition:'',
    experienceLevel: 'beginner',
    location:'',
    preferredCourts:[]
  });

  useEffect(() => {
    loadProfile();
  }, [user]);

  const [saving, setSaving] = useState(false);

  const loadProfile = async () => {
    try {
      if (!user?.id && !user?.uid) {
        setLoading(false);
        return;
      }

      const userId = user.id || user.uid;
      const profileData = await getUserProfile(userId);
      
      if (profileData) {
        setProfile(profileData);
        setEditedProfile({
          name: profileData.name || '',
          age: profileData.age?.toString() || '',
          phoneNumber: profileData.phone_number || '',
          bio: profileData.bio || '',
          primaryPosition: profileData.primary_position || '',
          secondaryPosition: profileData.secondary_position || '',
          experienceLevel: profileData.experience_level || 'beginner',
          location: profileData.location || '',
          preferredCourts: profileData.preferred_courts || []
        });
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to load profile');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    loadProfile();
  };

  const handleSignOut = async () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            try {
              await signOut();
              await refreshUser();
            } catch (error) {
              Alert.alert('Error', error.message);
            }
          }
        }
      ]
    );
  };

  const handleSaveProfile = async () => {
    if (!editedProfile.name?.trim()) {
      Alert.alert('Validation Error', 'Name is required');
      return;
    }

    if (editedProfile.name.trim().length < 2) {
      Alert.alert('Validation Error', 'Name must be at least 2 characters');
      return;
    }

    if (editedProfile.age) {
      const age = parseInt(editedProfile.age);
      if (isNaN(age) || age < 13 || age > 100) {
        Alert.alert('Validation Error', 'Age must be between 13 and 100');
        return;
      }
    }

    if (!editedProfile.primaryPosition) {
      Alert.alert('Validation Error', 'Primary position is required');
      return;
    }

    if (!editedProfile.location?.trim()) {
      Alert.alert('Validation Error', 'Location is required');
      return;
    }

    if (editedProfile.preferredCourts.length === 0) {
      Alert.alert('Validation Error', 'Please select at least one preferred court type');
      return;
    }

    try {
      setSaving(true);

      const userId = user.id || user.uid;
      const updates = {
        name: editedProfile.name.trim(),
        age: editedProfile.age ? parseInt(editedProfile.age) : null,
        phoneNumber: editedProfile.phoneNumber.trim(),
        bio: editedProfile.bio.trim(),
        primaryPosition: editedProfile.primaryPosition,
        secondaryPosition: editedProfile.secondaryPosition || null,
        experienceLevel: editedProfile.experienceLevel,
        location: editedProfile.location.trim(),
        preferredCourts: editedProfile.preferredCourts
      };

      const updatedProfile = await updateUserProfile(userId, updates);

      setProfile(updatedProfile);
      setEditMode(false);

      Alert.alert('Success', 'Profile updated successfully!');
    } catch (error) {
      Alert.alert('Error', error.message || 'Failed to update profile. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleCancelEdit = () => {
    if (profile) {
      setEditedProfile({
        name: profile.name || '',
        age: profile.age?.toString() || '',
        phoneNumber: profile.phone_number || '',
        bio: profile.bio || '',
        primaryPosition: profile.primary_position || '',
        secondaryPosition: profile.secondary_position || '',
        experienceLevel: profile.experience_level || 'beginner',
        location: profile.location || '',
        preferredCourts: profile.preferred_courts || []
      });
    }
    setEditMode(false);
  };

  const handlePositionSelect = (position) => {
    if (positionType === 'primary') {
      setEditedProfile(prev => ({ ...prev, primaryPosition: position }));
    } else if (positionType === 'secondary') {
      setEditedProfile(prev =>({ ...prev, secondaryPosition: position }));
    }
    setShowPositionModal(false);
    setPositionType('');
  };

  const handleCourtTypeToggle = (courtId) => {
    setEditedProfile(prev => ({
      ...prev,
      preferredCourts: prev.preferredCourts.includes(courtId)
        ? prev.preferredCourts.filter(id => id !== courtId)
        : [...prev.preferredCourts, courtId]
    }));
  };

  
  
  
  
  
  const getExperienceColor = (level) => {
    const colors = {
      'beginner': '#10B981',
      'intermediate': '#F59E0B',
      'advanced': '#EF4444',
    };
    return colors[level?.toLowerCase()] || '#6B7280';
  };





  const getCourtIcon = (courtId) => {

    const court = COURT_TYPES.find(c => c.id === courtId);
    return court?.icon || 'sports-volleyball';
  };

  const getCourtColor = (courtId) => {
    const colors = {
      'beach': '#FFB800',
      'indoor': '#FB923C',
      'grass': '#10B981',
    };


    return colors[courtId] || '#6366F1';
  };

  if (loading) {

    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FB923C" />
        </View>
      </SafeAreaView>
    );
  }

  if (!profile) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <MaterialIcons name="person-off" size={64} color="#D1D5DB" />
          <Text style={styles.errorTitle}>No Profile Found</Text>
          <Text style={styles.errorText}>
            Unable to load your profile. Please try again.
          </Text>
          <TouchableOpacity style={styles.retryButton} onPress={loadProfile}>
            <MaterialIcons name="refresh" size={20} color="#FFFFFF" />
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Profile</Text>
        <View style={styles.headerActions}>
          {editMode ? (
            <>
              <TouchableOpacity onPress={handleCancelEdit} style={styles.headerButton}>
                <MaterialIcons name="close" size={24} color="#EF4444" />
              </TouchableOpacity>
              <TouchableOpacity onPress={handleSaveProfile} style={styles.headerButton}>
                <MaterialIcons name="check" size={24} color="#10B981" />
              </TouchableOpacity>
            </>
          ) : (
            <TouchableOpacity onPress={() => setEditMode(true)} style={styles.headerButton}>
              <MaterialIcons name="edit" size={24} color="#FB923C" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
        <View style={styles.profileHeader}>
          <View style={styles.avatarContainer}>
            {profile.profile_image_url ? (
              <Image
                source={{ uri: profile.profile_image_url }}
                style={styles.avatar}
              />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <MaterialIcons name="person" size={60} color="#FB923C" />
              </View>
            )}
          </View>






          {editMode ? (
            <View style={styles.section}>
              <Text style={styles.label}>Name</Text>
              <DoneTextInput
                style={styles.input}
                value={editedProfile.name}
                onChangeText={(text) => setEditedProfile(prev => ({ ...prev, name: text }))}
                placeholder="Enter your name"
                maxLength={50}
              />
            </View>
          ) : (
            <>


              <Text style={styles.profileName}>{profile.name}</Text>
              <Text style={styles.profileEmail}>{profile.email}</Text>
            </>
          )}

          <View style={[styles.experienceBadge, { backgroundColor: getExperienceColor(profile.experience_level) }]}>
            <Text style={styles.experienceText}>
              {profile.experience_level?.charAt(0).toUpperCase() + profile.experience_level?.slice(1)}
            </Text>


          </View>
        </View>

        <View style={styles.statsContainer}>
          <View style={styles.statItem}>


            <MaterialIcons name="event" size={24} color="#FB923C" />
            <Text style={styles.statValue}>0</Text>

            <Text style={styles.statLabel}>Events Hosted</Text>

          </View>

          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <MaterialIcons name="sports-volleyball" size={24} color="#FB923C" />
            <Text style={styles.statValue}>0</Text>


            <Text style={styles.statLabel}>Events Joined</Text>

          </View>
        </View>

        {editMode ? (

          <View style={styles.editContainer}>
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Basic Information</Text>

              <Text style={styles.label}>Age</Text>
              <DoneTextInput
                style={styles.input}
                value={editedProfile.age}
                onChangeText={(text) => setEditedProfile(prev => ({ ...prev, age: text }))}
                placeholder="Enter your age"
                keyboardType="numeric"
                maxLength={3}
              />

              <Text style={styles.label}>Phone Number</Text>
              <DoneTextInput

                style={styles.input}
                value={editedProfile.phoneNumber}
                onChangeText={(text) => setEditedProfile(prev => ({ ...prev, phoneNumber: text }))}
                placeholder="(123) 456-7890"
                keyboardType="phone-pad"
                maxLength={14}


              />

              <Text style={styles.label}>Bio</Text>
              <DoneTextInput
                style={[styles.input, styles.textArea]}
                value={editedProfile.bio}
                onChangeText={(text) => setEditedProfile(prev => ({ ...prev, bio: text }))}
                placeholder="Tell us about yourself..."
                multiline


                numberOfLines={4}
                maxLength={200}
              />
              <Text style={styles.charCount}>{editedProfile.bio.length}/200</Text>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Volleyball Info</Text>

              <Text style={styles.label}>Primary Position</Text>
              <TouchableOpacity

                style={styles.selectButton}

                onPress={() => {
                  setPositionType('primary');
                  setShowPositionModal(true);
                }}
              >
                <Text style={[styles.selectButtonText, editedProfile.primaryPosition && styles.selectButtonTextSelected]}>
                  {editedProfile.primaryPosition || 'Select Primary Position'}
                </Text>
                <MaterialIcons name="arrow-drop-down" size={24} color="#6B7280" />
              </TouchableOpacity>




              <Text style={styles.label}>Secondary Position</Text>
              <TouchableOpacity
                style={styles.selectButton}

                onPress={() => {
                  setPositionType('secondary');
                  setShowPositionModal(true);
                }}

              >

                <Text style={[styles.selectButtonText, editedProfile.secondaryPosition && styles.selectButtonTextSelected]}>
                  {editedProfile.secondaryPosition || 'Select Secondary Position (Optional)'}
                </Text>
                <MaterialIcons name="arrow-drop-down" size={24} color="#6B7280" />
              </TouchableOpacity>

              <Text style={styles.label}>Preferred Court Types</Text>
              <View style={styles.courtTypesContainer}>
                {COURT_TYPES.map((court) => (

                  <TouchableOpacity

                    key={court.id}

                    style={[
                      styles.courtTypeButton,
                      editedProfile.preferredCourts.includes(court.id) && styles.courtTypeButtonSelected
                    ]}

                    onPress={() => handleCourtTypeToggle(court.id)}
                  >
                    <MaterialIcons 
                      name={court.icon} 
                      size={24} 
                      color={editedProfile.preferredCourts.includes(court.id) ? getCourtColor(court.id) : '#9CA3AF'} 
                    />
                    <Text style={[
                      styles.courtTypeText,
                      editedProfile.preferredCourts.includes(court.id) && styles.courtTypeTextSelected
                    ]}>
                      {court.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>





            <View style={styles.section}>


              <Text style={styles.sectionTitle}>Location</Text>
              <Text style={styles.label}>Location</Text>
              <DoneTextInput

                style={styles.input}
                value={editedProfile.location}
                onChangeText={(text) => setEditedProfile(prev => ({ ...prev, location: text }))}
                placeholder="City, State"
                maxLength={100}
              />
            </View>
          </View>
        ) : (
          <View style={styles.viewContainer}>
            {profile.bio && (


              <View style={styles.section}>
                <View style={styles.infoRow}>
                  <MaterialIcons name="info" size={20} color="#FB923C" />
                  <Text style={styles.sectionTitle}>About</Text>
                </View>
                <Text style={styles.bioText}>{profile.bio}</Text>
              </View>
            )}




            <View style={styles.section}>
              <View style={styles.infoRow}>

                <MaterialIcons name="sports-volleyball" size={20} color="#FB923C" />
                <Text style={styles.sectionTitle}>Volleyball Info</Text>
              </View>
              
              <View style={styles.infoItem}>
                <Text style={styles.infoLabel}>Primary Position</Text>
                <Text style={styles.infoValue}>{profile.primary_position}</Text>
              </View>



              {profile.secondary_position && (
                <View style={styles.infoItem}>


                  <Text style={styles.infoLabel}>Secondary Position</Text>
                  <Text style={styles.infoValue}>{profile.secondary_position}</Text>
                </View>
              )}

              {profile.preferred_courts && profile.preferred_courts.length > 0 && (
                <View style={styles.infoItem}>
                  <Text style={styles.infoLabel}>Preferred Courts</Text>

                  <View style={styles.courtBadgesContainer}>

                    {profile.preferred_courts.map((courtId) => (
                      <View key={courtId} style={[styles.courtBadge, { backgroundColor: getCourtColor(courtId) + '20' }]}>
                        <MaterialIcons 
                          name={getCourtIcon(courtId)} 
                          size={16} 
                          color={getCourtColor(courtId)} 
                        />



                        <Text style={[styles.courtBadgeText, { color: getCourtColor(courtId) }]}>
                          {COURT_TYPES.find(c => c.id === courtId)?.label}
                        </Text>


                      </View>
                    ))}
                  </View>



                </View>
              )}
            </View>

            <View style={styles.section}>
              <View style={styles.infoRow}>
                <MaterialIcons name="location-on" size={20} color="#FB923C" />
                <Text style={styles.sectionTitle}>Location</Text>

              </View>
              <Text style={styles.infoValue}>{profile.location}</Text>
            </View>

            <View style={styles.section}>
              <View style={styles.infoRow}>

                <MaterialIcons name="person" size={20} color="#FB923C" />
                <Text style={styles.sectionTitle}>Personal Info</Text>
              </View>
              
              {profile.age && (
                <View style={styles.infoItem}>
                  <Text style={styles.infoLabel}>Age</Text>
                  <Text style={styles.infoValue}>{profile.age}</Text>



                </View>
              )}

              {profile.phone_number && (
                <View style={styles.infoItem}>


                  <Text style={styles.infoLabel}>Phone</Text>
                  <Text style={styles.infoValue}>{profile.phone_number}</Text>

                </View>
              )}
            </View>
          </View>
        )}







        <View style={styles.section}>

          <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut}>
            <MaterialIcons name="logout" size={20} color="#FFFFFF" />
            <Text style={styles.signOutButtonText}>Sign Out</Text>


          </TouchableOpacity>
        </View>
      </ScrollView>

      <Modal visible={showPositionModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>


          <View style={styles.modalContent}>

            <View style={styles.modalHeader}>

              <Text style={styles.modalTitle}>
                Select {positionType === 'primary' ? 'Primary' : 'Secondary'} Position
              </Text>
              <TouchableOpacity onPress={() => setShowPositionModal(false)}>
                <MaterialIcons name="close" size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              {VOLLEYBALL_POSITIONS.map((position) => (
                <TouchableOpacity
                  key={position}
                  style={styles.positionOption}
                  onPress={() => handlePositionSelect(position)}
                >
                  <Text style={styles.positionOptionText}>{position}</Text>
                </TouchableOpacity>
              ))}


              {positionType === 'secondary' && (
                <TouchableOpacity
                  style={styles.positionOption}
                  onPress={() => handlePositionSelect('')}
                >
                  <Text style={[styles.positionOptionText, styles.positionOptionNone]}>
                    None (Optional)
                  </Text>
                </TouchableOpacity>
              )}

            </ScrollView>
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#111827',
    marginTop: 16,
    marginBottom: 8,
  },
  errorText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 24,
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FB923C',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
  },
  headerActions: {
    flexDirection: 'row',
    gap: 12,
  },
  headerButton: {
    padding: 8,
  },
  content: {
    flex: 1,
  },
  profileHeader: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingVertical: 32,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  avatarContainer: {
    marginBottom: 16,
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 4,
    borderColor: '#FB923C',
  },
  avatarPlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#FFF7ED',
    borderWidth: 4,
    borderColor: '#FB923C',
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileName: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
  },
  profileEmail: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 12,
  },
  experienceBadge: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 16,
    marginTop: 8,
  },
  experienceText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  statsContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    paddingVertical: 20,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
    gap: 8,
  },
  statDivider: {
    width: 1,
    backgroundColor: '#E5E7EB',
    marginHorizontal: 16,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
  },
  statLabel: {
    fontSize: 12,
    color: '#6B7280',
  },
  viewContainer: {
    padding: 16,
  },
  editContainer: {
    padding: 16,
  },
  section: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  infoItem: {
    marginBottom: 16,
  },
  infoLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 15,
    color: '#111827',
    fontWeight: '500',
  },
  bioText: {
    fontSize: 15,
    color: '#374151',
    lineHeight: 22,
  },
  courtBadgesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 4,
  },
  courtBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    gap: 6,
  },
  courtBadgeText: {
    fontSize: 13,
    fontWeight: '600',
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
    marginTop: 16,
  },
  input: {
    borderWidth: 2,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    fontSize: 16,
    backgroundColor: '#FFFFFF',
    color: '#111827',
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
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
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#FFFFFF',
  },
  selectButtonText: {
    fontSize: 16,
    color: '#9CA3AF',
  },
  selectButtonTextSelected: {
    color: '#111827',
  },
  courtTypesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginTop: 8,
  },
  courtTypeButton: {
    flex: 1,
    minWidth: '30%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    gap: 6,
  },
  courtTypeButtonSelected: {
    borderColor: '#FB923C',
    backgroundColor: '#FFF7ED',
  },
  courtTypeText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
  },
  courtTypeTextSelected: {
    color: '#FB923C',
  },
  signOutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EF4444',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  signOutButtonText: {
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
    maxHeight: '70%',
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
  positionOption: {
    paddingVertical: 16,
    paddingHorizontal: 16,
    marginHorizontal: 8,
    borderRadius: 12,
  },
  positionOptionText: {
    fontSize: 16,
    color: '#111827',
  },
  positionOptionNone: {
    color: '#9CA3AF',
    fontStyle: 'italic',
  },
});

export default ProfileScreen;