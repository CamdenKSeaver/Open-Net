import DoneTextInput from '../components/DoneTextInput';
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Keyboard,
  Alert,
} from 'react-native';

import { MaterialIcons } from '@expo/vector-icons';
import { createUserProfile } from '../services/profileService';

const VOLLEYBALL_POSITIONS = [
    'Outside Hitter',
    'Middle Blocker',
    'Opposite Hitter',
    'Setter',
    'Libero',
    'Defensive Specialist'
];
//TODO
//Prolly get some icons, draw them in or art class or something
const COURT_TYPES = [
    { id: 'beach', label: 'Beach', icon: '' },
    { id: 'indoor', label: 'Indoor', icon: '' },
    { id: 'grass', label: 'Grass', icon: '' }
];
const ProfileSetupScreen = ({onProfileComplete}) => {
    const [currentStep, setCurrentStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [name, setName] = useState('');
    const [age, setAge] = useState('');
    const [phoneNumber, setPhoneNumber] = useState('');

    const [profileImage, setProfileImage] = useState(null);
    const [bio, setBio] = useState('');
    const [primaryPosition, setPrimaryPosition] = useState('');
    const [secondaryPosition, setSecondaryPosition] = useState('');
    const [showPositionModal, setShowPositionModal] = useState(false);
    const [positionType, setPositionType] = useState(''); 
    const [favoriteCourtTypes, setFavoriteCourtTypes] = useState([]);
    const [location, setLocation] = useState('');



    //aaron make this connect with the modal this should be good to go
    const handlePositionSelect = (position) => {
        if (positionType === 'primary') {
            setPrimaryPosition(position);
        } 
        else if (positionType === 'secondary') {
            setSecondaryPosition(position);
        }
            setShowPositionModal(false);
            setPositionType('');
    };
    const validateStep1 = () => {
        if (!name.trim()) {
            Alert.alert('Error', 'Please enter your name');
            return false;
        }
        if (!age.trim() || isNaN(age) || parseInt(age) < 13 || parseInt(age) > 100) {
            Alert.alert('Error', 'Please enter a valid age (13-100)');
            return false;
        }
        if (!phoneNumber.trim() || phoneNumber.replace(/\D/g, '').length < 10) {
            Alert.alert('Error', 'Please enter a valid phone number');
            return false;
        }
        return true;
    };

    const validateStep2 = () => {
        if (!primaryPosition) {
            Alert.alert('Error', 'Please select your primary position');
            return false;
        }
        return true;
    };

    const handleNext = () => {
        Keyboard.dismiss();
        
        if (currentStep === 1 &&validateStep1()) {
                setCurrentStep(2);
        } else if (currentStep ===2 && validateStep2()) {
            setCurrentStep(3);
        }
    };
    const handleBack = () => {
        if (currentStep > 1) {
          setCurrentStep(currentStep - 1);
        }
    };



    const handleComplete = async () => {
        Keyboard.dismiss();
        
        if (!validateStep3()) return;

        if (!user?.id && !user?.uid) {
            Alert.alert('Error', 'No user found. Please sign out and back in.');
            return;
        }

        setLoading(true);
        try {

            const userProfile = {
                uid: user.id || user.uid,
                id: user.id || user.uid,
                email: user.email,
                name: name.trim(),
                age: parseInt(age),
                phoneNumber: phoneNumber.trim(),
                bio: bio.trim() || '',
                profileImage: profileImage || null,
                primaryPosition,
                secondaryPosition: secondaryPosition || null,
                experienceLevel: 'beginner',
                location: location.trim(),
                preferredCourts: favoriteCourtTypes,
                isProfileComplete: true,
                createdAt: new Date(),
                updatedAt: new Date()
            };
            const createdProfile = await createUserProfile(userProfile);
            console.log('Created', createdProfile.id);
            Alert.alert("Created account");
    
        } catch (error) {
                throw error;
        } finally {
            setLoading(false);
        }
    };

    const renderStep1 = () => (
        <View style = {styles.stepContainer}>
            <Text style = {styles.stepTitle}>
                Basic Info
            </Text>

            <View style = {styles.form}>
                <Text style =  {styles.label}> Full Name</Text>
                <DoneTextInput
                    style = {styles.input}
                    value = { name}
                    onChangeText= {setName}
                    placeholder="Enter full name"
                    autoCapitalize= "words"
                    editable = { !loading}
                    maxLength= {50}
                />
                <Text style={styles.label}>Age</Text>
                <DoneTextInput
                    style={styles.input}
                    value={age}
                    onChangeText= {setAge}
                    placeholder="Enter your age"
                    keyboardType="number-pad"
                    maxLength={3}
                    editable={!loading}
                />

                <Text style={styles.label}>Phone Number</Text>
                <DoneTextInput
                    style = { styles.input}
                    value = {phoneNumber}
                    onChangeText= {setPhoneNumber}
                    placeholder ="(123) 456-7890"
                    keyboardType = "phone-pad"
                    maxLength = {14}
                    editable= {!loading}
                />
            </View>

        </View>
    );

    const renderStep2 = () => (
        <View style={styles.stepContainer}>
        <Text style={styles.stepTitle}>Profile Details</Text>
        <Text style={styles.stepSubtitle}>Tell us about yourself</Text>
        
        <View style={styles.form}>
            <Text style={styles.label}>Profile Picture</Text>
            <TouchableOpacity 
                style= { styles.imageContainer} 
                //onPress= { handleImagePicker} aaron try to make this function to
                disabled ={loading}
            >
            {profileImage ? (<Image source= {{uri: profileImage}} style = {styles.profileImage}/>): (
                <View style = {styles.imagePlaceholder}>
                <MaterialIcons name = "add-a-photo" size={40} color="#9CA3AF" />
                <Text style = {styles.imagePlaceholderText}>Add Photo</Text>
                </View>
            )}
            </TouchableOpacity>
            
            <Text style = {styles.label}>Bio</Text>
            <DoneTextInput
                style={[styles.input, styles.textArea]}
                value={bio}
                onChangeText={setBio}
                placeholder="Bio"
                multiline
                numberOfLines={4}
                maxLength={200}
                editable={!loading}
            />
            <Text style={styles.charCount}>{bio.length}/200</Text>
            
            <Text style={styles.label}>Primary Position</Text>
            <TouchableOpacity 
            style={styles.selectButton}
            onPress={() => {
                setPositionType('primary');
                setShowPositionModal(true);
            }}
            disabled={loading}
            >
            <Text style = {[styles.selectButtonText, primaryPosition && styles.selectButtonTextSelected]}>
                {primaryPosition ||'Select Primary Position'}
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
            disabled={loading}
            >
            <Text style = {[styles.selectButtonText, secondaryPosition && styles.selectButtonTextSelected]}>
                {secondaryPosition || 'Select Secondary Position (Optional)'}
            </Text>
            <MaterialIcons name="arrow-drop-down" size={24} color="#6B7280" />
            </TouchableOpacity>
        </View>
        </View>
    );
    //aaron try to get this done 
    //also add the postional modal
    const renderStep3 = () => (
        <View></View>
    );

    return (
        <ScrollView contentContainerStyle = {styles.content} keyboardShouldPersistTaps="handled" keyboardDismissMode="on-drag">
            {currentStep === 1 && renderStep1()}
            {currentStep === 2 && renderStep2()}

            <View style={styles.buttonContainer}>
                {currentStep > 1 && (
                <TouchableOpacity
                    style={[styles.button, styles.backButton]}
                    onPress={handleBack}
                    disabled={loading}
                >
                    <Text style={styles.backButtonText}>Back</Text>
                </TouchableOpacity>
                )}
                
                <TouchableOpacity
                style={[
                    styles.button, 
                    styles.nextButton,
                    loading && styles.buttonDisabled,
                    currentStep === 1 && styles.fullWidthButton
                ]}
                onPress={currentStep=== 3 ? handleComplete : handleNext}
                disabled={loading}
                >
                {loading ? (<ActivityIndicator color = "#FFFFFF" />) :(<Text style= {styles.nextButtonText}>{currentStep === 3 ? 'Complete Setup' : 'Next'}</Text>)}
                </TouchableOpacity>
            </View>
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    stepContainer: {
        marginBottom: 32,
    },
    stepTitle: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#111827',
        textAlign: 'center',
        marginBottom: 8,
    },
    form: {
        backgroundColor: '#FFFFFF',
        padding: 24,
        borderRadius: 16,
        shadowColor: '#000',
        shadowOffset: {width: 0, height: 2},
        shadowOpacity: 0.1,
        shadowRadius: 3.84,
        elevation: 5,
    },
    label: {
        fontSize: 16,
        fontWeight: '600',
        color: '#374151',
        marginBottom: 8,
        marginTop: 16,
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
    content: {
        padding: 24,
        minHeight: '100%',
    },
    stepSubtitle: {
        fontSize: 16,
        color:'#6B7280',
        textAlign:'center',
        marginBottom:32,
    },
    imageContainer:{
        alignItems:'center',
        marginBottom: 16,
    },
    imagePlaceholder: {
        width:120,
        height:120,
        borderRadius:60,
        backgroundColor: '#F3F4F6',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 2,
        borderColor:'#E5E7EB',
        borderStyle: 'dashed',
    },
    imagePlaceholderText:{
        fontSize: 14,
        color:'#9CA3AF',
        marginTop: 8,
    },
    textArea:{
        height: 100,
        textAlignVertical:'top',
    },
    charCount:{
        fontSize: 12,
        color:'#9CA3AF',
        textAlign:'right',
        marginTop: 4,
    },
    selectButton: {
        flexDirection:'row',
        justifyContent:'space-between',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: '#E5E7EB',
        borderRadius: 12,
        paddingVertical: 16,
        paddingHorizontal:16,
        backgroundColor: '#FFFFFF',
    },
    selectButtonText: {
        fontSize: 16,
        color: '#9CA3AF',
    },
    selectButtonTextSelected:{
        color: '#111827',
    },
    buttonContainer:{
        flexDirection: 'row',
        gap: 12,
        marginTop: 24,
    },
    button:{
        paddingVertical:16,
        borderRadius:12,
        alignItems:'center',
        justifyContent: 'center',
        minHeight: 52,
    },
    backButton:{
        flex: 1,
        backgroundColor: '#FFFFFF',
        borderWidth: 2,
        borderColor: '#E5E7EB',
    },
    nextButton: {
        flex: 2,
        backgroundColor:'#FB923C',
    },
    fullWidthButton: {
        flex:1,
    },
    backButtonText:{
        color: '#6B7280',
        fontSize: 16,
        fontWeight: '600',
    },
    nextButtonText: {
        color:'#FFFFFF',
        fontSize:16,
        fontWeight: '600',
    },
    buttonDisabled:{
        opacity:0.7,
    },
})

export default ProfileSetupScreen;